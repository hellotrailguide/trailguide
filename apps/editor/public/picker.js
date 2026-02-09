(function() {
  'use strict';

  // Prevent double initialization
  if (window.__TRAILGUIDE_PICKER_INITIALIZED) return;
  window.__TRAILGUIDE_PICKER_INITIALIZED = true;

  let isPickingMode = false;
  let overlay = null;
  let currentTarget = null;

  // Create highlight overlay element
  function createOverlay() {
    const el = document.createElement('div');
    el.id = '__trailguide-highlight';
    el.style.cssText = [
      'position: fixed',
      'pointer-events: none',
      'border: 2px solid #3b82f6',
      'background: rgba(59, 130, 246, 0.1)',
      'z-index: 2147483647',
      'border-radius: 4px',
      'transition: all 0.05s ease-out',
      'display: none',
    ].join(';');
    document.body.appendChild(el);
    return el;
  }

  // CSS.escape polyfill for older browsers
  function cssEscape(value) {
    if (typeof CSS !== 'undefined' && CSS.escape) {
      return CSS.escape(value);
    }
    return value.replace(/([^\w-])/g, '\\$1');
  }

  // Generate CSS selector - same algorithm as recorder selectorGenerator.ts
  function generateSelector(element) {
    if (!element || element === document.body || element === document.documentElement) {
      return 'body';
    }

    // Priority 1: ID
    if (element.id) {
      return '#' + cssEscape(element.id);
    }

    // Priority 2: data-trail-id, data-testid, or data-tour-target
    var trailId = element.getAttribute('data-trail-id');
    if (trailId) {
      return '[data-trail-id="' + cssEscape(trailId) + '"]';
    }

    var testId = element.getAttribute('data-testid');
    if (testId) {
      return '[data-testid="' + cssEscape(testId) + '"]';
    }

    var tourTarget = element.getAttribute('data-tour-target');
    if (tourTarget) {
      return '[data-tour-target="' + cssEscape(tourTarget) + '"]';
    }

    // Priority 3: aria-label (great for buttons/links)
    var ariaLabel = element.getAttribute('aria-label');
    if (ariaLabel) {
      var selector = element.tagName.toLowerCase() + '[aria-label="' + cssEscape(ariaLabel) + '"]';
      if (document.querySelectorAll(selector).length === 1) {
        return selector;
      }
    }

    // Priority 4: name attribute (forms)
    var name = element.getAttribute('name');
    if (name) {
      var nameSelector = '[name="' + cssEscape(name) + '"]';
      if (document.querySelectorAll(nameSelector).length === 1) {
        return nameSelector;
      }
    }

    // Priority 5: Unique class combination
    var uniqueClassSelector = getUniqueClassSelector(element);
    if (uniqueClassSelector) {
      return uniqueClassSelector;
    }

    // Priority 6: Build path-based selector (least stable)
    return buildPathSelector(element);
  }

  function getUniqueClassSelector(element) {
    if (!element.className || typeof element.className !== 'string') {
      return null;
    }

    var classes = element.className.split(/\s+/).filter(function(c) {
      // Skip utility classes that are too generic or auto-generated
      return c && !c.match(/^(hover|focus|active|disabled|hidden|visible|flex|grid|block|inline|p-|m-|w-|h-|text-|bg-|border-)/);
    });

    if (classes.length === 0) return null;

    // Try each class individually first
    for (var i = 0; i < classes.length; i++) {
      var selector = '.' + cssEscape(classes[i]);
      if (document.querySelectorAll(selector).length === 1) {
        return selector;
      }
    }

    // Try tag + class combination
    var tag = element.tagName.toLowerCase();
    for (var j = 0; j < classes.length; j++) {
      var tagSelector = tag + '.' + cssEscape(classes[j]);
      if (document.querySelectorAll(tagSelector).length === 1) {
        return tagSelector;
      }
    }

    return null;
  }

  function buildPathSelector(element) {
    var path = [];
    var current = element;

    while (current && current !== document.body && current !== document.documentElement) {
      var selector = current.tagName.toLowerCase();

      if (current.id) {
        selector = '#' + cssEscape(current.id);
        path.unshift(selector);
        break;
      }

      // Add nth-child if needed for uniqueness among siblings
      var parent = current.parentElement;
      if (parent) {
        var siblings = Array.from(parent.children).filter(function(child) {
          return child.tagName === current.tagName;
        });
        if (siblings.length > 1) {
          var index = siblings.indexOf(current) + 1;
          selector += ':nth-child(' + index + ')';
        }
      }

      path.unshift(selector);
      current = parent;

      // Limit path depth to keep selectors manageable
      if (path.length > 5) break;
    }

    return path.join(' > ');
  }

  // Position overlay on element
  function positionOverlay(element) {
    if (!overlay) return;

    var rect = element.getBoundingClientRect();
    overlay.style.display = 'block';
    overlay.style.top = rect.top + 'px';
    overlay.style.left = rect.left + 'px';
    overlay.style.width = rect.width + 'px';
    overlay.style.height = rect.height + 'px';
  }

  function hideOverlay() {
    if (overlay) {
      overlay.style.display = 'none';
    }
    currentTarget = null;
  }

  // Event handlers
  function handleMouseMove(e) {
    if (!isPickingMode) return;

    var target = e.target;

    // Skip our own overlay
    if (target.id === '__trailguide-highlight') return;

    // Skip if same element
    if (target === currentTarget) return;

    currentTarget = target;
    positionOverlay(target);
  }

  function handleClick(e) {
    if (!isPickingMode) return;

    e.preventDefault();
    e.stopPropagation();
    e.stopImmediatePropagation();

    var target = e.target;
    if (target.id === '__trailguide-highlight') return;

    var selector = generateSelector(target);

    // Send selector to parent (editor)
    window.parent.postMessage({
      type: 'TRAILGUIDE_SELECTOR',
      selector: selector
    }, '*');

    stopPicking();
    return false;
  }

  function handleKeyDown(e) {
    if (!isPickingMode) return;

    // Escape to cancel picking
    if (e.key === 'Escape') {
      e.preventDefault();
      stopPicking();
      window.parent.postMessage({ type: 'TRAILGUIDE_PICKER_STOPPED' }, '*');
    }
  }

  function startPicking() {
    if (isPickingMode) return;

    isPickingMode = true;
    if (!overlay) {
      overlay = createOverlay();
    }

    document.addEventListener('mousemove', handleMouseMove, true);
    document.addEventListener('click', handleClick, true);
    document.addEventListener('keydown', handleKeyDown, true);

    // Change cursor to indicate picking mode
    document.body.style.cursor = 'crosshair';
  }

  function stopPicking() {
    isPickingMode = false;
    hideOverlay();

    document.removeEventListener('mousemove', handleMouseMove, true);
    document.removeEventListener('click', handleClick, true);
    document.removeEventListener('keydown', handleKeyDown, true);

    // Restore cursor
    document.body.style.cursor = '';
  }

  function highlightSelector(selector) {
    try {
      var element = document.querySelector(selector);
      if (element) {
        if (!overlay) {
          overlay = createOverlay();
        }
        positionOverlay(element);
      } else {
        hideOverlay();
      }
    } catch (e) {
      hideOverlay();
    }
  }

  // Listen for commands from editor
  window.addEventListener('message', function(e) {
    if (!e.data || !e.data.type) return;

    switch (e.data.type) {
      case 'TRAILGUIDE_START_PICKER':
        startPicking();
        break;

      case 'TRAILGUIDE_STOP_PICKER':
        stopPicking();
        break;

      case 'TRAILGUIDE_HIGHLIGHT':
        if (e.data.selector) {
          highlightSelector(e.data.selector);
        }
        break;

      case 'TRAILGUIDE_CLEAR_HIGHLIGHT':
        hideOverlay();
        break;

      case 'TRAILGUIDE_EDITOR_CONFIRM':
        // Editor confirmed it received our ready message
        console.log('[Trailguide Picker] Connected to editor');
        break;
    }
  });

  // Signal ready to parent when DOM is loaded
  function signalReady() {
    window.parent.postMessage({ type: 'TRAILGUIDE_IFRAME_READY' }, '*');
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', signalReady);
  } else {
    signalReady();
  }

  console.log('[Trailguide Picker] Initialized');
})();
