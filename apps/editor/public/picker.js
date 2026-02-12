(function() {
  'use strict';

  // Prevent double initialization
  if (window.__TRAILGUIDE_PICKER_INITIALIZED) return;
  window.__TRAILGUIDE_PICKER_INITIALIZED = true;

  // Capture the parent origin for secure postMessage communication.
  // The picker runs inside a proxied iframe served from the editor's origin.
  var editorOrigin = window.location.origin;
  // Communicate with opener (popup window) or parent (iframe)
  var messageTarget = window.opener || window.parent;

  let isPickingMode = false;
  let isRecordingMode = false;
  let overlay = null;
  let currentTarget = null;
  let recordingBanner = null;

  // Playback state
  let playbackTrail = null;
  let playbackIndex = -1;
  let playbackTooltip = null;
  let playbackOverlay = null;

  // Create highlight overlay element
  function createOverlay() {
    var el = document.createElement('div');
    el.id = '__trailguide-highlight';
    el.style.cssText = [
      'position: fixed',
      'pointer-events: none',
      'border: 2px solid #1a91a2',
      'background: rgba(26, 145, 162, 0.1)',
      'z-index: 2147483646',
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

  // Classify selector quality
  function classifySelectorQuality(selector) {
    // Stable: ID, data-trail-id, data-testid, data-tour-target
    if (/^#/.test(selector) || /\[data-trail-id=/.test(selector) ||
        /\[data-testid=/.test(selector) || /\[data-tour-target=/.test(selector)) {
      return { quality: 'stable', qualityHint: '' };
    }
    // Moderate: aria-label, name, unique class, text-based
    if (/\[aria-label=/.test(selector) || /\[name=/.test(selector) || /^\./.test(selector) || /\.\w/.test(selector) || /\[data-tg-text=/.test(selector)) {
      return { quality: 'moderate', qualityHint: 'Add a `data-trail-id` attribute for a more stable selector.' };
    }
    // Fragile: path-based fallback
    return {
      quality: 'fragile',
      qualityHint: 'This selector may break when the page changes. Add a `data-trail-id` attribute to the target element for stability.'
    };
  }

  // Generate CSS selector - improved algorithm
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

    // Priority 5: Button/link with unique text content
    var textSelector = getTextBasedSelector(element);
    if (textSelector) {
      return textSelector;
    }

    // Priority 6: Unique class combination
    var uniqueClassSelector = getUniqueClassSelector(element);
    if (uniqueClassSelector) {
      return uniqueClassSelector;
    }

    // Priority 7: Build path-based selector (least stable)
    return buildPathSelector(element);
  }

  function getTextBasedSelector(element) {
    var tag = element.tagName.toLowerCase();

    // Only for interactive elements where text is meaningful
    if (!['button', 'a', 'label'].includes(tag)) {
      return null;
    }

    var text = element.textContent?.trim();
    if (!text || text.length > 50) return null; // Skip long/empty text

    // Try tag + text content approach using a parent context
    // Find a stable parent (with id or data attribute) and use relative selector
    var parent = element.parentElement;
    var depth = 0;

    while (parent && depth < 5) {
      var parentSelector = '';

      if (parent.id) {
        parentSelector = '#' + cssEscape(parent.id);
      } else if (parent.getAttribute('data-trail-id')) {
        parentSelector = '[data-trail-id="' + cssEscape(parent.getAttribute('data-trail-id')) + '"]';
      }

      if (parentSelector) {
        // Find all matching tags under this parent
        var candidates = Array.from(parent.querySelectorAll(tag));
        var matchingIndex = candidates.findIndex(
          function(el) { return el.textContent?.trim() === text; }
        );

        if (matchingIndex !== -1) {
          // If there's only one button with this text under the stable parent
          var sameTextCount = candidates.filter(
            function(el) { return el.textContent?.trim() === text; }
          ).length;

          if (sameTextCount === 1) {
            // Use a data attribute to capture text for stability, in case text changes
            return parentSelector + ' ' + tag + '[data-tg-text="' + cssEscape(text) + '"]';
          }
        }
      }

      parent = parent.parentElement;
      depth++;
    }

    return null;
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
      // If tag and class is not unique, try tag + text content
      var textSelector = getTextBasedSelector(element);
      if (textSelector) {
        return textSelector;
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

  // Event handlers for pick/record modes
  function handleMouseMove(e) {
    if (!isPickingMode && !isRecordingMode) return;

    var target = e.target;

    // Skip our own overlay and recording banner
    if (target.id === '__trailguide-highlight' ||
        target.id === '__trailguide-recording-banner' ||
        (target.closest && target.closest('#__trailguide-recording-banner'))) return;

    // Skip if same element
    if (target === currentTarget) return;

    currentTarget = target;
    positionOverlay(target);
  }

  function handleClick(e) {
    if (!isPickingMode && !isRecordingMode) return;

    // Skip our own UI elements
    var target = e.target;
    if (target.id === '__trailguide-highlight' ||
        target.id === '__trailguide-recording-banner' ||
        (target.closest && target.closest('#__trailguide-recording-banner'))) return;

    e.preventDefault();
    e.stopPropagation();
    e.stopImmediatePropagation();

    var selector = generateSelector(target);
    var qualityInfo = classifySelectorQuality(selector);

    // Send selector to parent (editor)
    messageTarget.postMessage({
      type: 'TRAILGUIDE_SELECTOR',
      selector: selector,
      quality: qualityInfo.quality,
      qualityHint: qualityInfo.qualityHint
    }, editorOrigin);

    // In pick mode, stop after one click. In record mode, keep going.
    if (isPickingMode) {
      stopPicking();
    }

    return false;
  }

  function handleKeyDown(e) {
    if (!isPickingMode && !isRecordingMode) return;

    // Escape to cancel
    if (e.key === 'Escape') {
      e.preventDefault();
      if (isRecordingMode) {
        stopRecording();
        messageTarget.postMessage({ type: 'TRAILGUIDE_RECORDER_STOPPED' }, editorOrigin);
      } else {
        stopPicking();
        messageTarget.postMessage({ type: 'TRAILGUIDE_PICKER_STOPPED' }, editorOrigin);
      }
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

  // Recording mode (continuous picking)
  function showRecordingBanner() {
    if (recordingBanner) return;
    recordingBanner = document.createElement('div');
    recordingBanner.id = '__trailguide-recording-banner';
    recordingBanner.style.cssText = [
      'position: fixed',
      'top: 0',
      'left: 0',
      'right: 0',
      'height: 32px',
      'background: #dc2626',
      'color: white',
      'display: flex',
      'align-items: center',
      'justify-content: center',
      'font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
      'font-size: 13px',
      'z-index: 2147483647',
      'gap: 8px',
    ].join(';');
    recordingBanner.innerHTML =
      '<span style="width:8px;height:8px;background:white;border-radius:50%;animation:__tg_pulse 1s infinite"></span>' +
      '<span>Recording — click elements to capture steps</span>';

    // Add pulse animation
    var style = document.createElement('style');
    style.id = '__trailguide-recording-style';
    style.textContent = '@keyframes __tg_pulse{0%,100%{opacity:1}50%{opacity:0.4}}';
    document.head.appendChild(style);

    document.body.appendChild(recordingBanner);
  }

  function hideRecordingBanner() {
    if (recordingBanner) {
      recordingBanner.remove();
      recordingBanner = null;
    }
    var style = document.getElementById('__trailguide-recording-style');
    if (style) style.remove();
  }

  function startRecording() {
    if (isRecordingMode) return;
    stopPicking(); // Ensure pick mode is off

    isRecordingMode = true;
    if (!overlay) {
      overlay = createOverlay();
    }

    document.addEventListener('mousemove', handleMouseMove, true);
    document.addEventListener('click', handleClick, true);
    document.addEventListener('keydown', handleKeyDown, true);

    document.body.style.cursor = 'crosshair';
    showRecordingBanner();
  }

  function stopRecording() {
    isRecordingMode = false;
    hideOverlay();
    hideRecordingBanner();

    document.removeEventListener('mousemove', handleMouseMove, true);
    document.removeEventListener('click', handleClick, true);
    document.removeEventListener('keydown', handleKeyDown, true);

    document.body.style.cursor = '';
  }

  // ─── Trail Playback ──────────────────────────────────────────────

  function createPlaybackOverlay() {
    var el = document.createElement('div');
    el.id = '__trailguide-playback-overlay';
    el.style.cssText = [
      'position: fixed',
      'pointer-events: none',
      'border: 2px solid #8b5cf6',
      'background: rgba(139, 92, 246, 0.12)',
      'z-index: 2147483644',
      'border-radius: 4px',
      'transition: all 0.2s ease-out',
      'display: none',
    ].join(';');
    document.body.appendChild(el);
    return el;
  }

  function createPlaybackTooltip() {
    var el = document.createElement('div');
    el.id = '__trailguide-playback-tooltip';
    el.style.cssText = [
      'position: fixed',
      'z-index: 2147483645',
      'background: white',
      'border: 1px solid #e5e7eb',
      'border-radius: 8px',
      'box-shadow: 0 4px 24px rgba(0,0,0,0.12)',
      'padding: 16px',
      'max-width: 320px',
      'min-width: 240px',
      'font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
      'display: none',
    ].join(';');
    document.body.appendChild(el);
    return el;
  }

  function positionTooltip(targetEl, placement) {
    if (!playbackTooltip) return;

    var rect = targetEl.getBoundingClientRect();
    var tw = playbackTooltip.offsetWidth;
    var th = playbackTooltip.offsetHeight;
    var gap = 12;
    var top, left;

    switch (placement) {
      case 'top':
        top = rect.top - th - gap;
        left = rect.left + (rect.width - tw) / 2;
        break;
      case 'left':
        top = rect.top + (rect.height - th) / 2;
        left = rect.left - tw - gap;
        break;
      case 'right':
        top = rect.top + (rect.height - th) / 2;
        left = rect.right + gap;
        break;
      default: // bottom
        top = rect.bottom + gap;
        left = rect.left + (rect.width - tw) / 2;
        break;
    }

    // Clamp to viewport
    top = Math.max(8, Math.min(top, window.innerHeight - th - 8));
    left = Math.max(8, Math.min(left, window.innerWidth - tw - 8));

    playbackTooltip.style.top = top + 'px';
    playbackTooltip.style.left = left + 'px';
    playbackTooltip.style.display = 'block';
  }

  function renderPlaybackStep() {
    if (!playbackTrail || playbackIndex < 0 || playbackIndex >= playbackTrail.steps.length) return;

    var step = playbackTrail.steps[playbackIndex];
    var total = playbackTrail.steps.length;
    var isFirst = playbackIndex === 0;
    var isLast = playbackIndex === total - 1;

    if (!playbackOverlay) playbackOverlay = createPlaybackOverlay();
    if (!playbackTooltip) playbackTooltip = createPlaybackTooltip();

    // Try to find target element
    var targetEl = null;
    try { targetEl = step.target ? document.querySelector(step.target) : null; } catch(e) {}

    if (targetEl) {
      var rect = targetEl.getBoundingClientRect();
      playbackOverlay.style.display = 'block';
      playbackOverlay.style.top = rect.top + 'px';
      playbackOverlay.style.left = rect.left + 'px';
      playbackOverlay.style.width = rect.width + 'px';
      playbackOverlay.style.height = rect.height + 'px';
    } else {
      playbackOverlay.style.display = 'none';
    }

    // Build tooltip HTML
    var btnStyle = 'padding:6px 14px;border-radius:4px;border:none;cursor:pointer;font-size:13px;';
    var primaryBtn = btnStyle + 'background:#1a91a2;color:white;';
    var ghostBtn = btnStyle + 'background:transparent;color:#6b7280;';

    var html = '';
    html += '<div style="font-size:14px;font-weight:600;margin-bottom:4px;color:#111827">' + escapeHtml(step.title || 'Step ' + (playbackIndex + 1)) + '</div>';
    html += '<div style="font-size:13px;color:#6b7280;margin-bottom:12px">' + escapeHtml(step.content || '') + '</div>';

    if (!targetEl && step.target) {
      html += '<div style="font-size:12px;color:#dc2626;margin-bottom:8px;padding:4px 8px;background:#fef2f2;border-radius:4px">Element not found: ' + escapeHtml(step.target.slice(0, 50)) + '</div>';
    }

    html += '<div style="display:flex;align-items:center;justify-content:space-between">';
    html += '<span style="font-size:12px;color:#9ca3af">' + (playbackIndex + 1) + ' of ' + total + '</span>';
    html += '<div style="display:flex;gap:6px">';
    if (!isFirst) {
      html += '<button data-tg-action="prev" style="' + ghostBtn + '">Back</button>';
    }
    if (isLast) {
      html += '<button data-tg-action="close" style="' + primaryBtn + '">Close</button>';
    } else {
      html += '<button data-tg-action="next" style="' + primaryBtn + '">Next</button>';
    }
    html += '</div></div>';

    playbackTooltip.innerHTML = html;

    // Position tooltip
    if (targetEl) {
      positionTooltip(targetEl, step.placement || 'bottom');
    } else {
      // Center on screen
      playbackTooltip.style.display = 'block';
      playbackTooltip.style.top = '50%';
      playbackTooltip.style.left = '50%';
      playbackTooltip.style.transform = 'translate(-50%, -50%)';
    }

    // Attach button listeners
    playbackTooltip.querySelectorAll('[data-tg-action]').forEach(function(btn) {
      btn.addEventListener('click', function(e) {
        e.stopPropagation();
        var action = btn.getAttribute('data-tg-action');
        if (action === 'next') playNext();
        else if (action === 'prev') playPrev();
        else if (action === 'close') stopPlayback();
      });
    });
  }

  function playNext() {
    if (!playbackTrail || playbackIndex >= playbackTrail.steps.length - 1) return;
    playbackIndex++;
    // Reset transform if previously centered
    if (playbackTooltip) playbackTooltip.style.transform = '';
    renderPlaybackStep();
    messageTarget.postMessage({ type: 'TRAILGUIDE_PLAY_STEP_CHANGED', stepIndex: playbackIndex }, editorOrigin);
  }

  function playPrev() {
    if (!playbackTrail || playbackIndex <= 0) return;
    playbackIndex--;
    if (playbackTooltip) playbackTooltip.style.transform = '';
    renderPlaybackStep();
    messageTarget.postMessage({ type: 'TRAILGUIDE_PLAY_STEP_CHANGED', stepIndex: playbackIndex }, editorOrigin);
  }

  function startPlayback(trail) {
    stopPicking();
    stopRecording();
    playbackTrail = trail;
    playbackIndex = 0;
    renderPlaybackStep();
  }

  function stopPlayback() {
    playbackTrail = null;
    playbackIndex = -1;
    if (playbackOverlay) {
      playbackOverlay.style.display = 'none';
    }
    if (playbackTooltip) {
      playbackTooltip.style.display = 'none';
      playbackTooltip.style.transform = '';
    }
    messageTarget.postMessage({ type: 'TRAILGUIDE_PLAY_ENDED' }, editorOrigin);
  }

  function escapeHtml(str) {
    var div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }

  // ─── Highlight selector (for edit mode) ───────────────────────────

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

  // Listen for commands from editor — validate origin
  window.addEventListener('message', function(e) {
    if (!e.data || !e.data.type) return;

    // Only accept messages from the editor (same origin, since we're proxied)
    if (e.origin !== editorOrigin) return;

    switch (e.data.type) {
      case 'TRAILGUIDE_START_PICKER':
        startPicking();
        break;

      case 'TRAILGUIDE_STOP_PICKER':
        stopPicking();
        break;

      case 'TRAILGUIDE_START_RECORDING':
        startRecording();
        break;

      case 'TRAILGUIDE_STOP_RECORDING':
        stopRecording();
        break;

      case 'TRAILGUIDE_PLAY_TRAIL':
        if (e.data.trail) startPlayback(e.data.trail);
        break;

      case 'TRAILGUIDE_PLAY_NEXT':
        playNext();
        break;

      case 'TRAILGUIDE_PLAY_PREV':
        playPrev();
        break;

      case 'TRAILGUIDE_STOP_TRAIL':
        stopPlayback();
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
    messageTarget.postMessage({ type: 'TRAILGUIDE_IFRAME_READY' }, editorOrigin);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', signalReady);
  } else {
    signalReady();
  }

  console.log('[Trailguide Picker] Initialized');
})();