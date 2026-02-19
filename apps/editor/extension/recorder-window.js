// Content script for recorder window mode
// This runs in the popup window opened by the editor for recording

(function() {
  // Check if we're in a recorder session
  chrome.storage.local.get(['recorderSession'], (data) => {
    if (!data.recorderSession) return;
    if (Date.now() - data.recorderSession.timestamp > 3600000) return; // Expired after 1 hour

    const { editorTabId } = data.recorderSession;

    let isPickingMode = true; // Auto-start in pick mode
    let highlightOverlay = null;
    let hoveredElement = null;
    let isPaused = false;

    // Create highlight overlay
    function createOverlay() {
      if (highlightOverlay) return highlightOverlay;

      const overlay = document.createElement('div');
      overlay.id = '__trailguide-recorder-highlight';
      overlay.style.cssText = `
        position: fixed;
        pointer-events: none;
        border: 3px solid #1a91a2;
        background: rgba(26, 145, 162, 0.1);
        z-index: 2147483647;
        border-radius: 4px;
        transition: all 0.05s ease;
        display: none;
      `;
      document.body.appendChild(overlay);
      return overlay;
    }

    // Create recorder toolbar
    function createToolbar() {
      const toolbar = document.createElement('div');
      toolbar.id = '__trailguide-recorder-toolbar';
      toolbar.style.cssText = `
        position: fixed;
        bottom: 20px;
        left: 50%;
        transform: translateX(-50%);
        background: #1e293b;
        color: white;
        padding: 12px 20px;
        border-radius: 12px;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        font-size: 14px;
        z-index: 2147483647;
        display: flex;
        align-items: center;
        gap: 16px;
        box-shadow: 0 4px 20px rgba(0,0,0,0.3);
      `;
      toolbar.innerHTML = `
        <div style="display: flex; align-items: center; gap: 8px;">
          <div style="width: 8px; height: 8px; background: #ef4444; border-radius: 50%; animation: pulse 1.5s infinite;"></div>
          <span style="font-weight: 500;">Trailguide Recording</span>
        </div>
        <div style="width: 1px; height: 20px; background: #475569;"></div>
        <span style="color: #94a3b8;" id="__trailguide-status">Click elements to capture</span>
        <button id="__trailguide-pause" style="
          background: #475569;
          border: none;
          color: white;
          padding: 6px 12px;
          border-radius: 6px;
          cursor: pointer;
          font-size: 13px;
        ">Pause</button>
        <button id="__trailguide-done" style="
          background: #1a91a2;
          border: none;
          color: white;
          padding: 6px 12px;
          border-radius: 6px;
          cursor: pointer;
          font-size: 13px;
        ">Done</button>
      `;

      // Add pulse animation
      const style = document.createElement('style');
      style.textContent = `
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
      `;
      document.head.appendChild(style);

      document.body.appendChild(toolbar);

      // Event listeners
      document.getElementById('__trailguide-pause').addEventListener('click', togglePause);
      document.getElementById('__trailguide-done').addEventListener('click', endSession);

      return toolbar;
    }

    function togglePause() {
      isPaused = !isPaused;
      const btn = document.getElementById('__trailguide-pause');
      const status = document.getElementById('__trailguide-status');
      if (isPaused) {
        btn.textContent = 'Resume';
        status.textContent = 'Paused - navigate freely';
        hideOverlay();
      } else {
        btn.textContent = 'Pause';
        status.textContent = 'Click elements to capture';
      }
    }

    function endSession() {
      chrome.storage.local.remove(['recorderSession']);
      // Notify editor
      chrome.runtime.sendMessage({
        action: 'recorderSessionEnded',
        editorTabId
      });
      // Remove UI
      const toolbar = document.getElementById('__trailguide-recorder-toolbar');
      const overlay = document.getElementById('__trailguide-recorder-highlight');
      if (toolbar) toolbar.remove();
      if (overlay) overlay.remove();
      // Remove listeners
      document.removeEventListener('mousemove', handleMouseMove, true);
      document.removeEventListener('click', handleClick, true);
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

    function hideOverlay() {
      if (highlightOverlay) {
        highlightOverlay.style.display = 'none';
      }
    }

    // Generate stable selector
    function generateSelector(element) {
      // Priority 1: ID
      if (element.id && !element.id.match(/^[\d]|^__trailguide/)) {
        const selector = `#${CSS.escape(element.id)}`;
        if (document.querySelectorAll(selector).length === 1) {
          return selector;
        }
      }

      // Priority 2: Data attributes
      const dataAttrs = ['data-testid', 'data-cy', 'data-test', 'data-trail-id'];
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
      }

      // Priority 5: Path-based
      const path = [];
      let current = element;

      while (current && current !== document.body && path.length < 5) {
        let selector = current.tagName.toLowerCase();

        if (current.id && !current.id.match(/^\d|^__trailguide/)) {
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
      if (isPaused) return;
      if (e.target.id && e.target.id.startsWith('__trailguide')) return;

      hoveredElement = e.target;
      positionOverlay(hoveredElement);
    }

    // Click handler
    function handleClick(e) {
      if (isPaused) return;
      if (e.target.id && e.target.id.startsWith('__trailguide')) return;

      e.preventDefault();
      e.stopPropagation();
      e.stopImmediatePropagation();

      const selector = generateSelector(e.target);

      // Send to editor via background script
      chrome.runtime.sendMessage({
        action: 'selectorPicked',
        selector: selector,
        sourceUrl: window.location.href,
        tagName: e.target.tagName.toLowerCase(),
        text: e.target.textContent?.slice(0, 50).trim() || ''
      });

      // Update status
      const status = document.getElementById('__trailguide-status');
      if (status) {
        status.textContent = `Captured: ${selector.slice(0, 30)}...`;
        setTimeout(() => {
          if (!isPaused) status.textContent = 'Click elements to capture';
        }, 2000);
      }

      return false;
    }

    // Initialize
    highlightOverlay = createOverlay();
    createToolbar();

    document.addEventListener('mousemove', handleMouseMove, true);
    document.addEventListener('click', handleClick, true);

    console.log('[Trailguide] Recorder mode active');
  });
})();
