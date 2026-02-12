// Content script that runs in ALL frames (including iframes)
// Enables element picking from within the Pro Editor's preview iframe

(function() {
  // Only activate in iframes, not the top-level page
  if (window === window.top) return;

  // Check if we're inside the Trailguide editor
  let isInEditor = false;
  try {
    isInEditor = window.top.location.hostname === 'localhost' &&
                 window.top.location.port === '3000';
  } catch (e) {
    // Cross-origin - check via message
    window.top.postMessage({ type: 'TRAILGUIDE_IFRAME_CHECK' }, '*');
  }

  let isPickingMode = false;
  let highlightOverlay = null;
  let hoveredElement = null;

  // Create highlight overlay
  function createOverlay() {
    if (highlightOverlay) return highlightOverlay;

    const overlay = document.createElement('div');
    overlay.id = '__trailguide-iframe-highlight';
    overlay.style.cssText = `
      position: fixed;
      pointer-events: none;
      border: 2px solid #1a91a2;
      background: rgba(26, 145, 162, 0.15);
      z-index: 2147483647;
      border-radius: 4px;
      transition: all 0.05s ease;
      display: none;
    `;
    document.body.appendChild(overlay);
    return overlay;
  }

  // Position overlay over element
  function positionOverlay(element) {
    if (!highlightOverlay) highlightOverlay = createOverlay();
    const rect = element.getBoundingClientRect();
    highlightOverlay.style.display = 'block';
    highlightOverlay.style.top = rect.top + 'px';
    highlightOverlay.style.left = rect.left + 'px';
    highlightOverlay.style.width = rect.width + 'px';
    highlightOverlay.style.height = rect.height + 'px';
  }

  // Hide overlay
  function hideOverlay() {
    if (highlightOverlay) {
      highlightOverlay.style.display = 'none';
    }
  }

  // Generate stable selector for element
  function generateSelector(element) {
    // Priority 1: ID
    if (element.id && !element.id.match(/^[\d]|^[0-9]/)) {
      const selector = `#${CSS.escape(element.id)}`;
      if (document.querySelectorAll(selector).length === 1) {
        return selector;
      }
    }

    // Priority 2: Data attributes
    const dataAttrs = ['data-testid', 'data-cy', 'data-test', 'data-trail-id', 'data-tour-target'];
    for (const attr of dataAttrs) {
      const value = element.getAttribute(attr);
      if (value) {
        const selector = `[${attr}="${CSS.escape(value)}"]`;
        if (document.querySelectorAll(selector).length === 1) {
          return selector;
        }
      }
    }

    // Priority 3: aria-label
    const ariaLabel = element.getAttribute('aria-label');
    if (ariaLabel) {
      const selector = `${element.tagName.toLowerCase()}[aria-label="${CSS.escape(ariaLabel)}"]`;
      if (document.querySelectorAll(selector).length === 1) {
        return selector;
      }
    }

    // Priority 4: Unique class
    if (element.className && typeof element.className === 'string') {
      const classes = element.className.split(/\s+/).filter(c =>
        c && !c.match(/^(hover|active|focus|selected|open|closed|visible|hidden|ng-|_|css-)/i)
      );

      for (const cls of classes) {
        const selector = `.${CSS.escape(cls)}`;
        if (document.querySelectorAll(selector).length === 1) {
          return selector;
        }
      }

      // Try class combinations
      if (classes.length >= 2) {
        const selector = classes.slice(0, 3).map(c => `.${CSS.escape(c)}`).join('');
        if (document.querySelectorAll(selector).length === 1) {
          return selector;
        }
      }
    }

    // Priority 5: Path-based selector
    const path = [];
    let current = element;

    while (current && current !== document.body && path.length < 5) {
      let selector = current.tagName.toLowerCase();

      if (current.id && !current.id.match(/^\d/)) {
        path.unshift(`#${CSS.escape(current.id)}`);
        break;
      }

      const parent = current.parentElement;
      if (parent) {
        const siblings = Array.from(parent.children).filter(el => el.tagName === current.tagName);
        if (siblings.length > 1) {
          const index = siblings.indexOf(current) + 1;
          selector += `:nth-of-type(${index})`;
        }
      }

      path.unshift(selector);
      current = parent;
    }

    return path.join(' > ');
  }

  // Mouse move handler
  function handleMouseMove(e) {
    if (!isPickingMode) return;
    if (e.target.id && e.target.id.startsWith('__trailguide')) return;

    hoveredElement = e.target;
    positionOverlay(hoveredElement);
  }

  // Click handler
  function handleClick(e) {
    if (!isPickingMode) return;
    if (e.target.id && e.target.id.startsWith('__trailguide')) return;

    e.preventDefault();
    e.stopPropagation();
    e.stopImmediatePropagation();

    const selector = generateSelector(e.target);

    // Send to parent (the editor)
    window.top.postMessage({
      type: 'TRAILGUIDE_SELECTOR',
      selector: selector,
      sourceUrl: window.location.href,
      tagName: e.target.tagName.toLowerCase(),
      text: e.target.textContent?.slice(0, 50).trim() || ''
    }, '*');

    stopPicking();
    return false;
  }

  // Start picking mode
  function startPicking() {
    if (isPickingMode) return;

    isPickingMode = true;
    highlightOverlay = createOverlay();

    document.addEventListener('mousemove', handleMouseMove, true);
    document.addEventListener('click', handleClick, true);
    document.body.style.cursor = 'crosshair';

    console.log('[Trailguide] Picker activated in iframe');
  }

  // Stop picking mode
  function stopPicking() {
    isPickingMode = false;

    document.removeEventListener('mousemove', handleMouseMove, true);
    document.removeEventListener('click', handleClick, true);
    document.body.style.cursor = '';

    hideOverlay();

    // Notify parent that picking stopped
    window.top.postMessage({ type: 'TRAILGUIDE_PICKER_STOPPED' }, '*');
  }

  // Listen for messages from parent (the editor)
  window.addEventListener('message', (event) => {
    if (!event.data?.type) return;

    // Only accept messages from the known editor origin
    var allowedOrigins = ['https://app.gettrailguide.com', 'http://localhost:3000'];
    if (allowedOrigins.indexOf(event.origin) === -1) return;

    switch (event.data.type) {
      case 'TRAILGUIDE_START_PICKER':
        startPicking();
        break;
      case 'TRAILGUIDE_STOP_PICKER':
        stopPicking();
        break;
      case 'TRAILGUIDE_HIGHLIGHT':
        // Highlight a specific selector
        if (event.data.selector) {
          try {
            const el = document.querySelector(event.data.selector);
            if (el) {
              highlightOverlay = createOverlay();
              positionOverlay(el);
            }
          } catch (e) {}
        }
        break;
      case 'TRAILGUIDE_CLEAR_HIGHLIGHT':
        hideOverlay();
        break;
      case 'TRAILGUIDE_EDITOR_CONFIRM':
        // Confirmed we're in the editor - we're good to go
        isInEditor = true;
        break;
    }
  });

  // Let the parent know this iframe has the picker ready
  window.top.postMessage({ type: 'TRAILGUIDE_IFRAME_READY' }, '*');
})();
