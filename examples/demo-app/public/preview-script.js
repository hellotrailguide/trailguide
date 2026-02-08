// Trailguide Preview Script
// This script is injected into preview iframes to enable:
// 1. Element highlighting
// 2. Trail playback
// 3. Visual selector picking

(function() {
  'use strict';

  let highlightOverlay = null;
  let pickerEnabled = false;
  let hoveredElement = null;
  let trailguideInstance = null;

  // Create highlight overlay element
  function createHighlightOverlay() {
    const overlay = document.createElement('div');
    overlay.id = 'trailguide-highlight';
    overlay.style.cssText = `
      position: absolute;
      pointer-events: none;
      border: 2px solid #3b82f6;
      background: rgba(59, 130, 246, 0.1);
      z-index: 999999;
      border-radius: 4px;
      transition: all 0.15s ease;
    `;
    document.body.appendChild(overlay);
    return overlay;
  }

  // Position overlay over element
  function positionOverlay(element) {
    if (!highlightOverlay) {
      highlightOverlay = createHighlightOverlay();
    }

    const rect = element.getBoundingClientRect();
    highlightOverlay.style.display = 'block';
    highlightOverlay.style.top = `${rect.top + window.scrollY}px`;
    highlightOverlay.style.left = `${rect.left + window.scrollX}px`;
    highlightOverlay.style.width = `${rect.width}px`;
    highlightOverlay.style.height = `${rect.height}px`;
  }

  // Hide overlay
  function hideOverlay() {
    if (highlightOverlay) {
      highlightOverlay.style.display = 'none';
    }
  }

  // Highlight element by selector
  function highlightSelector(selector) {
    try {
      const element = document.querySelector(selector);
      if (element) {
        positionOverlay(element);
        element.scrollIntoView({ behavior: 'smooth', block: 'center' });
      } else {
        hideOverlay();
      }
    } catch (e) {
      hideOverlay();
    }
  }

  // Generate stable selector for element
  function generateSelector(element) {
    // Priority 1: ID
    if (element.id) {
      return `#${CSS.escape(element.id)}`;
    }

    // Priority 2: Data attributes
    const dataAttrs = ['data-trail-id', 'data-testid', 'data-tour-target', 'data-cy'];
    for (const attr of dataAttrs) {
      if (element.hasAttribute(attr)) {
        return `[${attr}="${CSS.escape(element.getAttribute(attr))}"]`;
      }
    }

    // Priority 3: Aria-label (for buttons/links)
    if (element.getAttribute('aria-label')) {
      const label = element.getAttribute('aria-label');
      const selector = `${element.tagName.toLowerCase()}[aria-label="${CSS.escape(label)}"]`;
      if (document.querySelectorAll(selector).length === 1) {
        return selector;
      }
    }

    // Priority 4: Name attribute for form elements
    if (element.name) {
      const selector = `${element.tagName.toLowerCase()}[name="${CSS.escape(element.name)}"]`;
      if (document.querySelectorAll(selector).length === 1) {
        return selector;
      }
    }

    // Priority 5: Text content for buttons/links
    if (['BUTTON', 'A'].includes(element.tagName)) {
      const text = element.textContent?.trim();
      if (text && text.length < 50) {
        // Try to find unique text match
        const elements = Array.from(document.querySelectorAll(element.tagName.toLowerCase()));
        const matches = elements.filter(el => el.textContent?.trim() === text);
        if (matches.length === 1) {
          return `${element.tagName.toLowerCase()}:has-text("${text.replace(/"/g, '\\"')}")`;
        }
      }
    }

    // Priority 6: Unique class combination
    if (element.className && typeof element.className === 'string') {
      const classes = element.className.split(/\s+/).filter(c =>
        c && !c.match(/^(hover|active|focus|selected|open|closed|visible|hidden|\d)/i)
      );

      for (const cls of classes) {
        const selector = `.${CSS.escape(cls)}`;
        if (document.querySelectorAll(selector).length === 1) {
          return selector;
        }
      }

      // Try combinations
      if (classes.length >= 2) {
        const selector = classes.slice(0, 3).map(c => `.${CSS.escape(c)}`).join('');
        if (document.querySelectorAll(selector).length === 1) {
          return selector;
        }
      }
    }

    // Priority 7: Path-based selector (fallback)
    const path = [];
    let current = element;

    while (current && current !== document.body) {
      let selector = current.tagName.toLowerCase();

      if (current.id) {
        path.unshift(`#${CSS.escape(current.id)}`);
        break;
      }

      const parent = current.parentElement;
      if (parent) {
        const siblings = Array.from(parent.children).filter(el => el.tagName === current.tagName);
        if (siblings.length > 1) {
          const index = siblings.indexOf(current) + 1;
          selector += `:nth-child(${index})`;
        }
      }

      path.unshift(selector);
      current = parent;
    }

    return path.join(' > ');
  }

  // Picker mode handlers
  function handleMouseMove(e) {
    if (!pickerEnabled) return;

    e.stopPropagation();
    hoveredElement = e.target;

    if (hoveredElement && hoveredElement !== document.body && hoveredElement !== highlightOverlay) {
      positionOverlay(hoveredElement);
    }
  }

  function handleClick(e) {
    if (!pickerEnabled) return;

    e.preventDefault();
    e.stopPropagation();

    if (hoveredElement && hoveredElement !== document.body && hoveredElement !== highlightOverlay) {
      const selector = generateSelector(hoveredElement);
      window.parent.postMessage({ type: 'selectorPicked', selector }, '*');
    }
  }

  function enablePicker() {
    pickerEnabled = true;
    document.body.style.cursor = 'crosshair';
    document.addEventListener('mousemove', handleMouseMove, true);
    document.addEventListener('click', handleClick, true);
  }

  function disablePicker() {
    pickerEnabled = false;
    document.body.style.cursor = '';
    document.removeEventListener('mousemove', handleMouseMove, true);
    document.removeEventListener('click', handleClick, true);
    hideOverlay();
  }

  // Play trail (uses injected Trailguide if available)
  function playTrail(trail) {
    if (window.Trailguide) {
      trailguideInstance = window.Trailguide.start(trail);
    } else {
      console.warn('Trailguide core not loaded');
    }
  }

  function stopTrail() {
    if (trailguideInstance) {
      window.Trailguide?.stop();
      trailguideInstance = null;
    }
  }

  // Message handler
  window.addEventListener('message', function(event) {
    const data = event.data;
    if (!data || !data.type) return;

    switch (data.type) {
      case 'init':
        window.parent.postMessage({ type: 'ready' }, '*');
        break;
      case 'highlight':
        highlightSelector(data.selector);
        break;
      case 'clearHighlight':
        hideOverlay();
        break;
      case 'enablePicker':
        enablePicker();
        break;
      case 'disablePicker':
        disablePicker();
        break;
      case 'playTrail':
        playTrail(data.trail);
        break;
      case 'stopTrail':
        stopTrail();
        break;
    }
  });

  // Signal ready
  window.parent.postMessage({ type: 'ready' }, '*');
})();
