// Content script — injected into target pages for element picking/recording.
// Runs in an isolated world with access to the DOM and chrome.runtime.

(function () {
  if (window.__trailguideActive) return;
  window.__trailguideActive = true;

  let mode = null; // 'pick' | 'record'
  let paused = false;
  let overlay = null;
  let panel = null;
  let shadow = null; // Shadow DOM root for style isolation
  let currentTarget = null;
  let stepCount = 0;

  // Drag state
  let isDragging = false;
  let dragOffsetX = 0;
  let dragOffsetY = 0;

  // ── Overlay ──────────────────────────────────────────────────────────

  function createOverlay() {
    var el = document.createElement('div');
    el.id = '__trailguide-overlay';
    el.style.cssText =
      'position:fixed;pointer-events:none;border:2px solid #1a91a2;' +
      'background:rgba(26,145,162,0.08);z-index:2147483646;border-radius:4px;' +
      'transition:all 0.05s ease-out;display:none';
    document.body.appendChild(el);
    return el;
  }

  function positionOverlay(element) {
    if (!overlay) overlay = createOverlay();
    var rect = element.getBoundingClientRect();
    overlay.style.display = 'block';
    overlay.style.top = rect.top + 'px';
    overlay.style.left = rect.left + 'px';
    overlay.style.width = rect.width + 'px';
    overlay.style.height = rect.height + 'px';
  }

  function hideOverlay() {
    if (overlay) overlay.style.display = 'none';
    currentTarget = null;
  }

  // ── Panel styles (injected into shadow DOM) ─────────────────────────

  var PANEL_CSS = `
    @keyframes tg-pulse {
      0%, 100% { opacity: 1 }
      50% { opacity: 0.3 }
    }
    @keyframes tg-fade-in {
      from { opacity: 0; transform: translateY(8px) }
      to { opacity: 1; transform: translateY(0) }
    }
    *, *::before, *::after {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
    }
    :host {
      all: initial;
      position: fixed;
      bottom: 24px;
      right: 24px;
      z-index: 2147483647;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    }
    .tg-panel {
      width: 256px;
      background: #0f172a;
      border-radius: 16px;
      box-shadow: 0 20px 60px rgba(0,0,0,0.3), 0 0 0 1px rgba(255,255,255,0.05);
      overflow: hidden;
      animation: tg-fade-in 0.2s ease-out;
      color: #fff;
    }

    /* ── Header ── */
    .tg-header {
      display: flex;
      align-items: center;
      gap: 10px;
      padding: 14px 16px 12px;
      cursor: grab;
    }
    .tg-header:active { cursor: grabbing }
    .tg-logo {
      width: 32px;
      height: 32px;
      background: #1a91a2;
      border-radius: 8px;
      display: flex;
      align-items: center;
      justify-content: center;
      color: #fff;
      font-weight: 700;
      font-size: 15px;
      flex-shrink: 0;
    }
    .tg-brand-title {
      font-size: 14px;
      font-weight: 600;
      color: #f8fafc;
      line-height: 1.2;
    }
    .tg-status {
      display: flex;
      align-items: center;
      gap: 5px;
      font-size: 11px;
      font-weight: 500;
      margin-top: 1px;
    }
    .tg-status--rec { color: #f87171 }
    .tg-status--pause { color: #fbbf24 }
    .tg-status--pick { color: #60a5fa }
    .tg-dot {
      width: 6px;
      height: 6px;
      border-radius: 50%;
      flex-shrink: 0;
    }
    .tg-dot--rec { background: #f87171; animation: tg-pulse 1s infinite }
    .tg-dot--pause { background: #fbbf24 }
    .tg-dot--pick { background: #60a5fa }

    /* ── Body ── */
    .tg-body {
      padding: 0 16px 14px;
    }
    .tg-counter {
      display: flex;
      align-items: baseline;
      gap: 6px;
      margin-bottom: 6px;
    }
    .tg-count {
      font-size: 28px;
      font-weight: 700;
      color: #f8fafc;
      line-height: 1;
      font-variant-numeric: tabular-nums;
    }
    .tg-count-label {
      font-size: 12px;
      color: #94a3b8;
      font-weight: 400;
    }
    .tg-hint {
      font-size: 12px;
      color: #64748b;
      line-height: 1.5;
    }

    /* ── Divider ── */
    .tg-divider {
      height: 1px;
      background: rgba(255,255,255,0.06);
      margin: 0;
    }

    /* ── Actions ── */
    .tg-actions {
      display: flex;
      gap: 8px;
      padding: 12px 16px;
    }
    .tg-btn {
      flex: 1;
      height: 34px;
      border: none;
      border-radius: 8px;
      font-size: 13px;
      font-weight: 600;
      cursor: pointer;
      font-family: inherit;
      text-align: center;
      transition: all 0.15s ease;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 5px;
    }
    .tg-btn--resume {
      background: #1a91a2;
      color: #fff;
    }
    .tg-btn--resume:hover { background: #2563eb }
    .tg-btn--pause {
      background: rgba(255,255,255,0.08);
      color: #e2e8f0;
      border: 1px solid rgba(255,255,255,0.08);
    }
    .tg-btn--pause:hover { background: rgba(255,255,255,0.12) }
    .tg-btn--done {
      background: rgba(255,255,255,0.06);
      color: #94a3b8;
    }
    .tg-btn--done:hover { background: rgba(255,255,255,0.1); color: #f8fafc }
  `;

  // ── Panel rendering ─────────────────────────────────────────────────

  function createHost() {
    if (panel) return;
    panel = document.createElement('div');
    panel.id = '__trailguide-panel-host';
    shadow = panel.attachShadow({ mode: 'closed' });

    var style = document.createElement('style');
    style.textContent = PANEL_CSS;
    shadow.appendChild(style);

    document.body.appendChild(panel);
  }

  function showPanel() {
    createHost();

    // Clear existing content (keep style)
    var existing = shadow.querySelector('.tg-panel');
    if (existing) existing.remove();

    var card = document.createElement('div');
    card.className = 'tg-panel';

    var statusDot, statusText, statusClass, bodyHTML, actionsHTML;

    if (mode === 'pick') {
      statusDot = '<span class="tg-dot tg-dot--pick"></span>';
      statusText = 'Pick Mode';
      statusClass = 'tg-status tg-status--pick';
      bodyHTML =
        '<div class="tg-hint">Click any element to select it.<br>Press <strong style="color:#e2e8f0">Esc</strong> to cancel.</div>';
      actionsHTML = '';
    } else if (paused) {
      statusDot = '<span class="tg-dot tg-dot--pause"></span>';
      statusText = 'Paused';
      statusClass = 'tg-status tg-status--pause';
      bodyHTML =
        '<div class="tg-counter">' +
          '<span class="tg-count" id="tg-count">' + stepCount + '</span>' +
          '<span class="tg-count-label" id="tg-count-label">step' + (stepCount === 1 ? '' : 's') + ' captured</span>' +
        '</div>' +
        '<div class="tg-hint">Interact with the page freely.<br>Resume when ready to pick more.</div>';
      actionsHTML =
        '<div class="tg-divider"></div>' +
        '<div class="tg-actions">' +
          '<button class="tg-btn tg-btn--resume" id="tg-resume">Resume</button>' +
          '<button class="tg-btn tg-btn--done" id="tg-done">Done</button>' +
        '</div>';
    } else {
      statusDot = '<span class="tg-dot tg-dot--rec"></span>';
      statusText = 'Recording';
      statusClass = 'tg-status tg-status--rec';
      bodyHTML =
        '<div class="tg-counter">' +
          '<span class="tg-count" id="tg-count">' + stepCount + '</span>' +
          '<span class="tg-count-label" id="tg-count-label">step' + (stepCount === 1 ? '' : 's') + ' captured</span>' +
        '</div>' +
        '<div class="tg-hint">Click elements to capture steps.</div>';
      actionsHTML =
        '<div class="tg-divider"></div>' +
        '<div class="tg-actions">' +
          '<button class="tg-btn tg-btn--pause" id="tg-pause">Pause</button>' +
          '<button class="tg-btn tg-btn--done" id="tg-done">Done</button>' +
        '</div>';
    }

    card.innerHTML =
      '<div class="tg-header" id="tg-drag">' +
        '<div class="tg-logo"><svg width="18" height="18" viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M6 40 C 16 36, 28 44, 38 40 S 54 38, 58 40" stroke="#fff" stroke-width="5" stroke-linecap="round"/><circle cx="58" cy="40" r="4.5" fill="#fff"/></svg></div>' +
        '<div>' +
          '<div class="tg-brand-title">Trailguide</div>' +
          '<div class="' + statusClass + '">' + statusDot + statusText + '</div>' +
        '</div>' +
      '</div>' +
      '<div class="tg-body">' + bodyHTML + '</div>' +
      actionsHTML;

    shadow.appendChild(card);
    bindPanelEvents(card);
    bindDrag(card);
  }

  function bindPanelEvents(card) {
    var doneBtn = card.querySelector('#tg-done');
    if (doneBtn) {
      doneBtn.addEventListener('click', function (e) {
        e.preventDefault(); e.stopPropagation();
        stop();
        chrome.runtime.sendMessage({ action: 'recordingStopped' });
      });
    }
    var pauseBtn = card.querySelector('#tg-pause');
    if (pauseBtn) {
      pauseBtn.addEventListener('click', function (e) {
        e.preventDefault(); e.stopPropagation();
        pauseRecording();
      });
    }
    var resumeBtn = card.querySelector('#tg-resume');
    if (resumeBtn) {
      resumeBtn.addEventListener('click', function (e) {
        e.preventDefault(); e.stopPropagation();
        resumeRecording();
      });
    }
  }

  function bindDrag(card) {
    var handle = card.querySelector('#tg-drag');
    if (!handle) return;

    handle.addEventListener('mousedown', function (e) {
      if (!panel) return;
      isDragging = true;
      var rect = panel.getBoundingClientRect();
      dragOffsetX = e.clientX - rect.left;
      dragOffsetY = e.clientY - rect.top;
      panel.style.left = rect.left + 'px';
      panel.style.top = rect.top + 'px';
      panel.style.right = 'auto';
      panel.style.bottom = 'auto';
      e.preventDefault();
    });
  }

  function globalDragMove(e) {
    if (!isDragging || !panel) return;
    var x = e.clientX - dragOffsetX;
    var y = e.clientY - dragOffsetY;
    x = Math.max(0, Math.min(x, window.innerWidth - 256));
    y = Math.max(0, Math.min(y, window.innerHeight - panel.offsetHeight));
    panel.style.left = x + 'px';
    panel.style.top = y + 'px';
  }

  function globalDragEnd() {
    isDragging = false;
  }

  // Always listen for drag at document level
  document.addEventListener('mousemove', globalDragMove, true);
  document.addEventListener('mouseup', globalDragEnd, true);

  function updateStepCount() {
    if (!shadow) return;
    var countEl = shadow.querySelector('#tg-count');
    if (countEl) {
      countEl.textContent = stepCount;
    }
    var labelEl = shadow.querySelector('#tg-count-label');
    if (labelEl) {
      labelEl.textContent = 'step' + (stepCount === 1 ? '' : 's') + ' captured';
    }
  }

  function hidePanel() {
    if (panel) { panel.remove(); panel = null; shadow = null; }
    isDragging = false;
  }

  // ── Selector generation ──────────────────────────────────────────────

  function cssEscape(value) {
    if (typeof CSS !== 'undefined' && CSS.escape) return CSS.escape(value);
    return value.replace(/([^\w-])/g, '\\$1');
  }

  function classifySelectorQuality(selector) {
    if (/^#/.test(selector) || /\[data-trail-id=/.test(selector) ||
        /\[data-testid=/.test(selector) || /\[data-tour-target=/.test(selector)) {
      return { quality: 'stable', qualityHint: '' };
    }
    if (/\[aria-label=/.test(selector) || /\[name=/.test(selector) ||
        /^\./.test(selector) || /\.\w/.test(selector)) {
      return { quality: 'moderate', qualityHint: 'Add a `data-trail-id` attribute for a more stable selector.' };
    }
    return {
      quality: 'fragile',
      qualityHint: 'This selector may break when the page changes. Add a `data-trail-id` attribute for stability.',
    };
  }

  function generateSelector(element) {
    if (!element || element === document.body || element === document.documentElement) return 'body';

    if (element.id) return '#' + cssEscape(element.id);

    var dataAttrs = ['data-trail-id', 'data-testid', 'data-cy', 'data-test', 'data-tour-target'];
    for (var i = 0; i < dataAttrs.length; i++) {
      var val = element.getAttribute(dataAttrs[i]);
      if (val) {
        var sel = '[' + dataAttrs[i] + '="' + cssEscape(val) + '"]';
        if (document.querySelectorAll(sel).length === 1) return sel;
      }
    }

    var ariaLabel = element.getAttribute('aria-label');
    if (ariaLabel) {
      var aSel = element.tagName.toLowerCase() + '[aria-label="' + cssEscape(ariaLabel) + '"]';
      if (document.querySelectorAll(aSel).length === 1) return aSel;
    }

    var name = element.getAttribute('name');
    if (name) {
      var nSel = '[name="' + cssEscape(name) + '"]';
      if (document.querySelectorAll(nSel).length === 1) return nSel;
    }

    if (element.className && typeof element.className === 'string') {
      var classes = element.className.split(/\s+/).filter(function (c) {
        return c && !c.match(/^(hover|focus|active|disabled|hidden|visible|flex|grid|block|inline|p-|m-|w-|h-|text-|bg-|border-|ng-|_|css-)/);
      });
      for (var j = 0; j < classes.length; j++) {
        var cSel = '.' + cssEscape(classes[j]);
        if (document.querySelectorAll(cSel).length === 1) return cSel;
      }
      var tag = element.tagName.toLowerCase();
      for (var k = 0; k < classes.length; k++) {
        var tcSel = tag + '.' + cssEscape(classes[k]);
        if (document.querySelectorAll(tcSel).length === 1) return tcSel;
      }
    }

    var path = [];
    var cur = element;
    while (cur && cur !== document.body && cur !== document.documentElement) {
      var s = cur.tagName.toLowerCase();
      if (cur.id) { path.unshift('#' + cssEscape(cur.id)); break; }
      var parent = cur.parentElement;
      if (parent) {
        var siblings = Array.from(parent.children).filter(function (ch) { return ch.tagName === cur.tagName; });
        if (siblings.length > 1) s += ':nth-of-type(' + (siblings.indexOf(cur) + 1) + ')';
      }
      path.unshift(s);
      cur = parent;
      if (path.length > 5) break;
    }
    return path.join(' > ');
  }

  // ── Trailguide element check ──────────────────────────────────────────

  function isTrailguideElement(el) {
    while (el) {
      if (el.id && typeof el.id === 'string' && el.id.startsWith('__trailguide')) return true;
      el = el.parentElement;
    }
    return false;
  }

  // ── Event handlers ───────────────────────────────────────────────────

  function handleMouseMove(e) {
    if (!mode || paused) return;
    if (isDragging) return;
    var t = e.target;
    if (isTrailguideElement(t)) return;
    if (t === currentTarget) return;
    currentTarget = t;
    positionOverlay(t);
  }

  function handleMouseDown(e) {
    if (!mode || paused) return;
    if (isDragging) return;
    if (isTrailguideElement(e.target)) return;
    e.preventDefault();
    e.stopPropagation();
    e.stopImmediatePropagation();
    return false;
  }

  function handleMouseUp(e) {
    if (!mode || paused) return;
    if (isDragging) return;
    if (isTrailguideElement(e.target)) return;
    e.preventDefault();
    e.stopPropagation();
    e.stopImmediatePropagation();
    return false;
  }

  function handleClick(e) {
    if (!mode || paused) return;
    var t = e.target;
    if (isTrailguideElement(t)) return;

    e.preventDefault();
    e.stopPropagation();
    e.stopImmediatePropagation();

    var selector = generateSelector(t);
    var qi = classifySelectorQuality(selector);

    // Capture element rect and viewport size before hiding UI
    var rect = t.getBoundingClientRect();
    var elementRect = { x: rect.x, y: rect.y, width: rect.width, height: rect.height };
    var viewportSize = { width: window.innerWidth, height: window.innerHeight };

    // Hide overlay and panel so screenshot is clean
    if (overlay) overlay.style.display = 'none';
    if (panel) panel.style.display = 'none';

    // Wait for repaint, then send message (background.js will capture screenshot)
    requestAnimationFrame(function () {
      chrome.runtime.sendMessage({
        action: 'selectorPicked',
        selector: selector,
        quality: qi.quality,
        qualityHint: qi.qualityHint,
        elementRect: elementRect,
        viewportSize: viewportSize,
      });

      // Restore overlay and panel after a short delay
      setTimeout(function () {
        if (overlay && mode) overlay.style.display = 'block';
        if (panel) panel.style.display = '';
      }, 200);
    });

    if (mode === 'pick') {
      stop();
    } else {
      stepCount++;
      updateStepCount();
    }

    return false;
  }

  function handleKeyDown(e) {
    if (!mode) return;
    if (e.key === 'Escape') {
      e.preventDefault();
      var wasRecording = mode === 'record';
      stop();
      if (wasRecording) {
        chrome.runtime.sendMessage({ action: 'recordingStopped' });
      }
    }
  }

  // ── Pause / Resume ──────────────────────────────────────────────────

  function pauseRecording() {
    if (mode !== 'record' || paused) return;
    paused = true;
    hideOverlay();
    document.body.style.cursor = '';
    showPanel();
  }

  function resumeRecording() {
    if (mode !== 'record' || !paused) return;
    paused = false;
    document.body.style.cursor = 'crosshair';
    showPanel();
  }

  // ── Start / Stop ─────────────────────────────────────────────────────

  function startPicking() {
    if (mode) stop();
    mode = 'pick';
    paused = false;
    if (!overlay) overlay = createOverlay();
    showPanel();
    attachListeners();
    document.body.style.cursor = 'crosshair';
  }

  function startRecording() {
    if (mode) stop();
    mode = 'record';
    paused = false;
    stepCount = 0;
    if (!overlay) overlay = createOverlay();
    showPanel();
    attachListeners();
    document.body.style.cursor = 'crosshair';
  }

  function stop() {
    mode = null;
    paused = false;
    stepCount = 0;
    hideOverlay();
    hidePanel();
    detachListeners();
    document.body.style.cursor = '';
    window.__trailguideActive = false;
  }

  function attachListeners() {
    document.addEventListener('mousemove', handleMouseMove, true);
    document.addEventListener('mousedown', handleMouseDown, true);
    document.addEventListener('mouseup', handleMouseUp, true);
    document.addEventListener('click', handleClick, true);
    document.addEventListener('keydown', handleKeyDown, true);
  }

  function detachListeners() {
    document.removeEventListener('mousemove', handleMouseMove, true);
    document.removeEventListener('mousedown', handleMouseDown, true);
    document.removeEventListener('mouseup', handleMouseUp, true);
    document.removeEventListener('click', handleClick, true);
    document.removeEventListener('keydown', handleKeyDown, true);
  }

  // ── Listen for commands from the background script ───────────────────

  chrome.runtime.onMessage.addListener((message) => {
    if (message.action === 'startPicking') startPicking();
    if (message.action === 'startRecording') startRecording();
    if (message.action === 'stopRecording') stop();
  });
})();
