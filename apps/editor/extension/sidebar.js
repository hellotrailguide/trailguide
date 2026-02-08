// Trailguide Sidebar - Injected into the page for single-window editing
// Like Testim - record and edit steps without leaving your app

(function() {
  if (window.__trailguideSidebarActive) return;
  window.__trailguideSidebarActive = true;

  // State
  let trail = {
    id: `trail-${Date.now()}`,
    title: 'New Trail',
    steps: []
  };
  let selectedStepIndex = null;
  let isPickingMode = false;
  let isPlaybackMode = false;
  let playbackStepIndex = 0;
  let highlightOverlay = null;
  let tooltipElement = null;

  // Create the sidebar
  function createSidebar() {
    const sidebar = document.createElement('div');
    sidebar.id = '__trailguide-sidebar';
    sidebar.innerHTML = `
      <style>
        #__trailguide-sidebar {
          position: fixed;
          top: 0;
          right: 0;
          width: 320px;
          height: 100vh;
          background: #fff;
          border-left: 1px solid #e2e8f0;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          font-size: 14px;
          color: #1e293b;
          z-index: 2147483647;
          display: flex;
          flex-direction: column;
          box-shadow: -4px 0 20px rgba(0,0,0,0.1);
        }
        #__trailguide-sidebar * {
          box-sizing: border-box;
        }
        .__tg-header {
          padding: 16px;
          border-bottom: 1px solid #e2e8f0;
          background: #f8fafc;
        }
        .__tg-header-top {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 12px;
        }
        .__tg-logo {
          display: flex;
          align-items: center;
          gap: 8px;
          font-weight: 600;
          color: #3b82f6;
        }
        .__tg-logo-icon {
          width: 24px;
          height: 24px;
          background: #3b82f6;
          border-radius: 6px;
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          font-size: 12px;
          font-weight: bold;
        }
        .__tg-close {
          background: none;
          border: none;
          cursor: pointer;
          padding: 4px;
          color: #64748b;
        }
        .__tg-close:hover {
          color: #1e293b;
        }
        .__tg-title-input {
          width: 100%;
          padding: 8px 12px;
          border: 1px solid #e2e8f0;
          border-radius: 6px;
          font-size: 14px;
          font-weight: 500;
        }
        .__tg-title-input:focus {
          outline: none;
          border-color: #3b82f6;
        }
        .__tg-toolbar {
          padding: 12px 16px;
          border-bottom: 1px solid #e2e8f0;
          display: flex;
          gap: 8px;
        }
        .__tg-btn {
          padding: 8px 16px;
          border-radius: 6px;
          font-size: 13px;
          font-weight: 500;
          cursor: pointer;
          display: flex;
          align-items: center;
          gap: 6px;
          border: none;
          transition: all 0.15s;
        }
        .__tg-btn-primary {
          background: #3b82f6;
          color: white;
        }
        .__tg-btn-primary:hover {
          background: #2563eb;
        }
        .__tg-btn-primary.active {
          background: #dc2626;
        }
        .__tg-btn-secondary {
          background: #f1f5f9;
          color: #475569;
          border: 1px solid #e2e8f0;
        }
        .__tg-btn-secondary:hover {
          background: #e2e8f0;
        }
        .__tg-steps {
          flex: 1;
          overflow-y: auto;
          padding: 16px;
        }
        .__tg-steps-empty {
          text-align: center;
          padding: 40px 20px;
          color: #64748b;
        }
        .__tg-steps-empty-icon {
          font-size: 32px;
          margin-bottom: 12px;
        }
        .__tg-step {
          background: #f8fafc;
          border: 1px solid #e2e8f0;
          border-radius: 8px;
          padding: 12px;
          margin-bottom: 8px;
          cursor: pointer;
          transition: all 0.15s;
        }
        .__tg-step:hover {
          border-color: #cbd5e1;
        }
        .__tg-step.selected {
          border-color: #3b82f6;
          background: #eff6ff;
        }
        .__tg-step-header {
          display: flex;
          align-items: center;
          gap: 8px;
          margin-bottom: 8px;
        }
        .__tg-step-num {
          width: 20px;
          height: 20px;
          background: #3b82f6;
          color: white;
          border-radius: 50%;
          font-size: 11px;
          font-weight: 600;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .__tg-step-title {
          flex: 1;
          font-weight: 500;
          font-size: 13px;
        }
        .__tg-step-delete {
          background: none;
          border: none;
          color: #94a3b8;
          cursor: pointer;
          padding: 2px;
        }
        .__tg-step-delete:hover {
          color: #dc2626;
        }
        .__tg-step-selector {
          font-family: monospace;
          font-size: 11px;
          color: #64748b;
          background: #fff;
          padding: 4px 8px;
          border-radius: 4px;
          word-break: break-all;
        }
        .__tg-edit-panel {
          border-top: 1px solid #e2e8f0;
          padding: 16px;
          background: #f8fafc;
        }
        .__tg-edit-title {
          font-weight: 600;
          margin-bottom: 12px;
          font-size: 13px;
        }
        .__tg-field {
          margin-bottom: 12px;
        }
        .__tg-label {
          display: block;
          font-size: 12px;
          font-weight: 500;
          color: #64748b;
          margin-bottom: 4px;
        }
        .__tg-input, .__tg-textarea, .__tg-select {
          width: 100%;
          padding: 8px 10px;
          border: 1px solid #e2e8f0;
          border-radius: 6px;
          font-size: 13px;
        }
        .__tg-input:focus, .__tg-textarea:focus, .__tg-select:focus {
          outline: none;
          border-color: #3b82f6;
        }
        .__tg-textarea {
          min-height: 60px;
          resize: vertical;
        }
        .__tg-footer {
          padding: 12px 16px;
          border-top: 1px solid #e2e8f0;
          display: flex;
          gap: 8px;
        }
        .__tg-footer .__tg-btn {
          flex: 1;
          justify-content: center;
        }
        .__tg-highlight {
          position: fixed;
          pointer-events: none;
          border: 2px solid #3b82f6;
          background: rgba(59, 130, 246, 0.1);
          z-index: 2147483646;
          border-radius: 4px;
          transition: all 0.05s;
        }
        .__tg-picking-indicator {
          position: fixed;
          top: 0;
          left: 0;
          right: 320px;
          background: #3b82f6;
          color: white;
          padding: 10px 16px;
          font-size: 13px;
          z-index: 2147483646;
          display: flex;
          align-items: center;
          gap: 8px;
        }
        .__tg-picking-indicator span {
          animation: pulse 1.5s infinite;
        }
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.6; }
        }
        .__tg-tooltip {
          position: absolute;
          background: white;
          border-radius: 12px;
          box-shadow: 0 4px 20px rgba(0,0,0,0.15), 0 0 0 1px rgba(0,0,0,0.05);
          padding: 16px;
          max-width: 300px;
          z-index: 2147483646;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        }
        .__tg-tooltip-arrow {
          position: absolute;
          width: 12px;
          height: 12px;
          background: white;
          transform: rotate(45deg);
          box-shadow: -2px -2px 4px rgba(0,0,0,0.05);
        }
        .__tg-tooltip-arrow.bottom { top: -6px; left: 50%; margin-left: -6px; }
        .__tg-tooltip-arrow.top { bottom: -6px; left: 50%; margin-left: -6px; box-shadow: 2px 2px 4px rgba(0,0,0,0.05); }
        .__tg-tooltip-arrow.left { right: -6px; top: 50%; margin-top: -6px; box-shadow: 2px -2px 4px rgba(0,0,0,0.05); }
        .__tg-tooltip-arrow.right { left: -6px; top: 50%; margin-top: -6px; }
        .__tg-tooltip-step {
          font-size: 11px;
          color: #64748b;
          margin-bottom: 4px;
        }
        .__tg-tooltip-title {
          font-size: 15px;
          font-weight: 600;
          color: #1e293b;
          margin-bottom: 8px;
        }
        .__tg-tooltip-content {
          font-size: 13px;
          color: #475569;
          line-height: 1.5;
          margin-bottom: 16px;
        }
        .__tg-tooltip-nav {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 8px;
        }
        .__tg-tooltip-btn {
          padding: 8px 16px;
          border-radius: 6px;
          font-size: 13px;
          font-weight: 500;
          cursor: pointer;
          border: none;
          transition: all 0.15s;
        }
        .__tg-tooltip-btn-secondary {
          background: #f1f5f9;
          color: #475569;
        }
        .__tg-tooltip-btn-secondary:hover {
          background: #e2e8f0;
        }
        .__tg-tooltip-btn-primary {
          background: #3b82f6;
          color: white;
        }
        .__tg-tooltip-btn-primary:hover {
          background: #2563eb;
        }
        .__tg-tooltip-progress {
          font-size: 12px;
          color: #94a3b8;
        }
        .__tg-playback-highlight {
          position: fixed;
          pointer-events: none;
          border: 3px solid #3b82f6;
          background: rgba(59, 130, 246, 0.15);
          z-index: 2147483645;
          border-radius: 4px;
          transition: all 0.3s ease;
          box-shadow: 0 0 0 4px rgba(59, 130, 246, 0.2);
        }
      </style>

      <div class="__tg-header">
        <div class="__tg-header-top">
          <div class="__tg-logo">
            <div class="__tg-logo-icon">T</div>
            <span>Trailguide</span>
          </div>
          <div style="display: flex; gap: 4px;">
            <button class="__tg-close" id="__tg-dashboard" title="Open Dashboard" style="color: #3b82f6;">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <rect x="3" y="3" width="7" height="7"></rect>
                <rect x="14" y="3" width="7" height="7"></rect>
                <rect x="14" y="14" width="7" height="7"></rect>
                <rect x="3" y="14" width="7" height="7"></rect>
              </svg>
            </button>
            <button class="__tg-close" id="__tg-close" title="Close">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
              </svg>
            </button>
          </div>
        </div>
        <input type="text" class="__tg-title-input" id="__tg-trail-title" placeholder="Trail name..." value="New Trail">
      </div>

      <div class="__tg-toolbar">
        <button class="__tg-btn __tg-btn-primary" id="__tg-pick-btn">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M3 3l7.07 16.97 2.51-7.39 7.39-2.51L3 3z"></path>
          </svg>
          <span>Pick Element</span>
        </button>
        <button class="__tg-btn __tg-btn-secondary" id="__tg-play-btn" title="Preview trail">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <polygon points="5,3 19,12 5,21 5,3"></polygon>
          </svg>
          <span>Play</span>
        </button>
      </div>

      <div class="__tg-steps" id="__tg-steps">
        <div class="__tg-steps-empty">
          <div class="__tg-steps-empty-icon">👆</div>
          <div>Click "Pick Element" then<br>click any element on the page</div>
        </div>
      </div>

      <div class="__tg-edit-panel" id="__tg-edit-panel" style="display: none;">
        <div class="__tg-edit-title">Edit Step</div>
        <div class="__tg-field">
          <label class="__tg-label">Title</label>
          <input type="text" class="__tg-input" id="__tg-step-title" placeholder="Step title">
        </div>
        <div class="__tg-field">
          <label class="__tg-label">Content</label>
          <textarea class="__tg-textarea" id="__tg-step-content" placeholder="Instructions for the user..."></textarea>
        </div>
        <div class="__tg-field">
          <label class="__tg-label">Position</label>
          <select class="__tg-select" id="__tg-step-placement">
            <option value="top">Top</option>
            <option value="bottom" selected>Bottom</option>
            <option value="left">Left</option>
            <option value="right">Right</option>
          </select>
        </div>
      </div>

      <div class="__tg-footer" style="flex-direction: column; gap: 8px;">
        <div style="display: flex; gap: 8px;">
          <button class="__tg-btn __tg-btn-secondary" id="__tg-export-btn" style="flex: 1;">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
              <polyline points="7,10 12,15 17,10"></polyline>
              <line x1="12" y1="15" x2="12" y2="3"></line>
            </svg>
            Export
          </button>
          <button class="__tg-btn __tg-btn-primary" id="__tg-save-btn" style="flex: 1;">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <polyline points="20,6 9,17 4,12"></polyline>
            </svg>
            Save
          </button>
        </div>
        <button class="__tg-btn __tg-btn-secondary" id="__tg-dashboard-btn" style="width: 100%; background: #1e293b; color: white; border: none;">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <rect x="3" y="3" width="7" height="7"></rect>
            <rect x="14" y="3" width="7" height="7"></rect>
            <rect x="14" y="14" width="7" height="7"></rect>
            <rect x="3" y="14" width="7" height="7"></rect>
          </svg>
          Open Dashboard
        </button>
      </div>
    `;

    document.body.appendChild(sidebar);

    // Adjust page content to make room for sidebar
    document.body.style.marginRight = '320px';

    return sidebar;
  }

  // Create highlight overlay
  function createHighlight() {
    const highlight = document.createElement('div');
    highlight.className = '__tg-highlight';
    highlight.style.display = 'none';
    document.body.appendChild(highlight);
    return highlight;
  }

  // Create picking indicator
  function createPickingIndicator() {
    const indicator = document.createElement('div');
    indicator.className = '__tg-picking-indicator';
    indicator.id = '__tg-picking-indicator';
    indicator.innerHTML = '<span>●</span> Click any element to add it as a step';
    indicator.style.display = 'none';
    document.body.appendChild(indicator);
    return indicator;
  }

  // Generate selector for element
  function generateSelector(element) {
    if (element.id && !element.id.startsWith('__tg')) {
      const sel = `#${CSS.escape(element.id)}`;
      if (document.querySelectorAll(sel).length === 1) return sel;
    }

    const dataAttrs = ['data-testid', 'data-cy', 'data-test'];
    for (const attr of dataAttrs) {
      const val = element.getAttribute(attr);
      if (val) {
        const sel = `[${attr}="${CSS.escape(val)}"]`;
        if (document.querySelectorAll(sel).length === 1) return sel;
      }
    }

    const ariaLabel = element.getAttribute('aria-label');
    if (ariaLabel) {
      const sel = `${element.tagName.toLowerCase()}[aria-label="${CSS.escape(ariaLabel)}"]`;
      if (document.querySelectorAll(sel).length === 1) return sel;
    }

    if (element.className && typeof element.className === 'string') {
      const classes = element.className.split(/\s+/).filter(c =>
        c && !c.startsWith('__tg') && !c.match(/^(hover|active|focus|ng-|css-)/i)
      );
      for (const cls of classes) {
        const sel = `.${CSS.escape(cls)}`;
        if (document.querySelectorAll(sel).length === 1) return sel;
      }
    }

    // Path-based
    const path = [];
    let current = element;
    while (current && current !== document.body && path.length < 4) {
      let sel = current.tagName.toLowerCase();
      if (current.id && !current.id.startsWith('__tg')) {
        path.unshift(`#${CSS.escape(current.id)}`);
        break;
      }
      const parent = current.parentElement;
      if (parent) {
        const siblings = Array.from(parent.children).filter(el => el.tagName === current.tagName);
        if (siblings.length > 1) {
          sel += `:nth-of-type(${siblings.indexOf(current) + 1})`;
        }
      }
      path.unshift(sel);
      current = parent;
    }
    return path.join(' > ');
  }

  // Render steps list
  function renderSteps() {
    const container = document.getElementById('__tg-steps');

    if (trail.steps.length === 0) {
      container.innerHTML = `
        <div class="__tg-steps-empty">
          <div class="__tg-steps-empty-icon">👆</div>
          <div>Click "Pick Element" then<br>click any element on the page</div>
        </div>
      `;
      return;
    }

    container.innerHTML = trail.steps.map((step, i) => `
      <div class="__tg-step ${selectedStepIndex === i ? 'selected' : ''}" data-index="${i}">
        <div class="__tg-step-header">
          <div class="__tg-step-num">${i + 1}</div>
          <div class="__tg-step-title">${step.title || 'Untitled Step'}</div>
          <button class="__tg-step-delete" data-delete="${i}" title="Delete step">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <polyline points="3,6 5,6 21,6"></polyline>
              <path d="M19 6l-2 14H7L5 6"></path>
              <path d="M10 11v6"></path>
              <path d="M14 11v6"></path>
            </svg>
          </button>
        </div>
        <div class="__tg-step-selector">${step.target}</div>
      </div>
    `).join('');

    // Add click handlers
    container.querySelectorAll('.__tg-step').forEach(el => {
      el.addEventListener('click', (e) => {
        if (e.target.closest('.__tg-step-delete')) return;
        selectStep(parseInt(el.dataset.index));
      });
    });

    container.querySelectorAll('.__tg-step-delete').forEach(el => {
      el.addEventListener('click', (e) => {
        e.stopPropagation();
        deleteStep(parseInt(el.dataset.delete));
      });
    });
  }

  // Select a step
  function selectStep(index) {
    selectedStepIndex = index;
    renderSteps();
    showEditPanel();
    highlightElement(trail.steps[index].target);
  }

  // Delete a step
  function deleteStep(index) {
    trail.steps.splice(index, 1);
    if (selectedStepIndex === index) {
      selectedStepIndex = null;
      hideEditPanel();
    } else if (selectedStepIndex > index) {
      selectedStepIndex--;
    }
    renderSteps();
    hideHighlight();
  }

  // Show edit panel
  function showEditPanel() {
    const panel = document.getElementById('__tg-edit-panel');
    const step = trail.steps[selectedStepIndex];
    if (!step) return;

    document.getElementById('__tg-step-title').value = step.title || '';
    document.getElementById('__tg-step-content').value = step.content || '';
    document.getElementById('__tg-step-placement').value = step.placement || 'bottom';

    panel.style.display = 'block';
  }

  // Hide edit panel
  function hideEditPanel() {
    document.getElementById('__tg-edit-panel').style.display = 'none';
  }

  // Highlight element
  function highlightElement(selector) {
    try {
      const el = document.querySelector(selector);
      if (el && highlightOverlay) {
        const rect = el.getBoundingClientRect();
        highlightOverlay.style.display = 'block';
        highlightOverlay.style.top = rect.top + window.scrollY + 'px';
        highlightOverlay.style.left = rect.left + 'px';
        highlightOverlay.style.width = rect.width + 'px';
        highlightOverlay.style.height = rect.height + 'px';
      }
    } catch (e) {}
  }

  // Hide highlight
  function hideHighlight() {
    if (highlightOverlay) {
      highlightOverlay.style.display = 'none';
    }
  }

  // Start picking mode
  function startPicking() {
    isPickingMode = true;
    document.getElementById('__tg-pick-btn').classList.add('active');
    document.getElementById('__tg-pick-btn').querySelector('span').textContent = 'Cancel';
    document.getElementById('__tg-picking-indicator').style.display = 'flex';
    document.body.style.cursor = 'crosshair';
  }

  // Stop picking mode
  function stopPicking() {
    isPickingMode = false;
    document.getElementById('__tg-pick-btn').classList.remove('active');
    document.getElementById('__tg-pick-btn').querySelector('span').textContent = 'Pick Element';
    document.getElementById('__tg-picking-indicator').style.display = 'none';
    document.body.style.cursor = '';
    hideHighlight();
  }

  // Handle mouse move during picking
  function handleMouseMove(e) {
    if (!isPickingMode) return;
    if (e.target.closest('#__trailguide-sidebar')) return;
    if (e.target.id && e.target.id.startsWith('__tg')) return;

    const rect = e.target.getBoundingClientRect();
    highlightOverlay.style.display = 'block';
    highlightOverlay.style.top = rect.top + window.scrollY + 'px';
    highlightOverlay.style.left = rect.left + 'px';
    highlightOverlay.style.width = rect.width + 'px';
    highlightOverlay.style.height = rect.height + 'px';
  }

  // Handle click during picking
  function handleClick(e) {
    if (!isPickingMode) return;
    if (e.target.closest('#__trailguide-sidebar')) return;
    if (e.target.id && e.target.id.startsWith('__tg')) return;

    e.preventDefault();
    e.stopPropagation();

    const selector = generateSelector(e.target);
    const step = {
      id: `step-${Date.now()}`,
      title: `Step ${trail.steps.length + 1}`,
      content: '',
      target: selector,
      placement: 'bottom'
    };

    trail.steps.push(step);
    selectedStepIndex = trail.steps.length - 1;

    renderSteps();
    showEditPanel();
    stopPicking();

    return false;
  }

  // Export trail as JSON
  function exportTrail() {
    const json = JSON.stringify(trail, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${trail.title.replace(/[^a-z0-9]/gi, '-').toLowerCase()}.trail.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  // Save trail (send to editor or storage)
  function saveTrail() {
    // Save to chrome storage
    chrome.storage.local.set({
      [`trail_${trail.id}`]: trail,
      lastTrailId: trail.id
    }, () => {
      alert('Trail saved! You can import it in the Trailguide Editor.');
    });

    // Also try to send to editor if open
    chrome.runtime.sendMessage({
      action: 'trailSaved',
      trail: trail
    }).catch(() => {});
  }

  // ============ PLAYBACK FUNCTIONS ============

  // Create tooltip element
  function createTooltip() {
    if (tooltipElement) tooltipElement.remove();

    const tooltip = document.createElement('div');
    tooltip.className = '__tg-tooltip';
    tooltip.id = '__tg-tooltip';
    document.body.appendChild(tooltip);
    return tooltip;
  }

  // Create playback highlight
  function createPlaybackHighlight() {
    let highlight = document.querySelector('.__tg-playback-highlight');
    if (!highlight) {
      highlight = document.createElement('div');
      highlight.className = '__tg-playback-highlight';
      document.body.appendChild(highlight);
    }
    return highlight;
  }

  // Position tooltip relative to element
  function positionTooltip(tooltip, element, placement) {
    const rect = element.getBoundingClientRect();
    const tooltipRect = tooltip.getBoundingClientRect();
    const gap = 12;

    let top, left;
    let arrowClass = '';

    switch (placement) {
      case 'top':
        top = rect.top + window.scrollY - tooltipRect.height - gap;
        left = rect.left + (rect.width / 2) - (tooltipRect.width / 2);
        arrowClass = 'top';
        break;
      case 'bottom':
        top = rect.bottom + window.scrollY + gap;
        left = rect.left + (rect.width / 2) - (tooltipRect.width / 2);
        arrowClass = 'bottom';
        break;
      case 'left':
        top = rect.top + window.scrollY + (rect.height / 2) - (tooltipRect.height / 2);
        left = rect.left - tooltipRect.width - gap;
        arrowClass = 'left';
        break;
      case 'right':
        top = rect.top + window.scrollY + (rect.height / 2) - (tooltipRect.height / 2);
        left = rect.right + gap;
        arrowClass = 'right';
        break;
      default:
        top = rect.bottom + window.scrollY + gap;
        left = rect.left + (rect.width / 2) - (tooltipRect.width / 2);
        arrowClass = 'bottom';
    }

    // Keep tooltip in viewport
    const maxLeft = window.innerWidth - tooltipRect.width - 340; // Account for sidebar
    const minLeft = 10;
    left = Math.max(minLeft, Math.min(left, maxLeft));

    tooltip.style.top = top + 'px';
    tooltip.style.left = left + 'px';

    // Update arrow
    const arrow = tooltip.querySelector('.__tg-tooltip-arrow');
    if (arrow) {
      arrow.className = '__tg-tooltip-arrow ' + arrowClass;
    }
  }

  // Show step in playback
  function showPlaybackStep(index) {
    if (index < 0 || index >= trail.steps.length) return;

    playbackStepIndex = index;
    const step = trail.steps[index];

    // Hide tooltip while transitioning
    if (tooltipElement) {
      tooltipElement.style.opacity = '0';
      tooltipElement.style.transition = 'opacity 0.15s';
    }

    // Hide highlight while transitioning
    const existingHighlight = document.querySelector('.__tg-playback-highlight');
    if (existingHighlight) existingHighlight.style.display = 'none';

    // Find target element
    let targetEl;
    try {
      targetEl = document.querySelector(step.target);
    } catch (e) {
      console.error('Invalid selector:', step.target);
    }

    if (!targetEl) {
      // Show error tooltip
      tooltipElement.style.opacity = '1';
      tooltipElement.innerHTML = `
        <div class="__tg-tooltip-step">Step ${index + 1} of ${trail.steps.length}</div>
        <div class="__tg-tooltip-title">${step.title || 'Untitled Step'}</div>
        <div class="__tg-tooltip-content" style="color: #dc2626;">
          ⚠️ Element not found: <code style="font-size: 11px;">${step.target}</code>
        </div>
        <div class="__tg-tooltip-nav">
          <button class="__tg-tooltip-btn __tg-tooltip-btn-secondary" id="__tg-prev-btn" ${index === 0 ? 'disabled style="opacity:0.5"' : ''}>Previous</button>
          <span class="__tg-tooltip-progress">${index + 1} / ${trail.steps.length}</span>
          ${index < trail.steps.length - 1
            ? '<button class="__tg-tooltip-btn __tg-tooltip-btn-primary" id="__tg-next-btn">Next</button>'
            : '<button class="__tg-tooltip-btn __tg-tooltip-btn-primary" id="__tg-finish-btn">Finish</button>'}
        </div>
      `;
      tooltipElement.style.top = '100px';
      tooltipElement.style.left = '100px';
      attachPlaybackNavListeners();
      return;
    }

    // Scroll element into view first
    targetEl.scrollIntoView({ behavior: 'smooth', block: 'center' });

    // Wait for scroll to complete, then position everything
    setTimeout(() => {
      // Get fresh position after scroll
      const rect = targetEl.getBoundingClientRect();

      // Highlight element
      const highlight = createPlaybackHighlight();
      highlight.style.display = 'block';
      highlight.style.top = rect.top + window.scrollY + 'px';
      highlight.style.left = rect.left + 'px';
      highlight.style.width = rect.width + 'px';
      highlight.style.height = rect.height + 'px';

      // Build tooltip content
      tooltipElement.innerHTML = `
        <div class="__tg-tooltip-arrow bottom"></div>
        <div class="__tg-tooltip-step">Step ${index + 1} of ${trail.steps.length}</div>
        <div class="__tg-tooltip-title">${step.title || 'Untitled Step'}</div>
        ${step.content ? `<div class="__tg-tooltip-content">${step.content}</div>` : ''}
        <div class="__tg-tooltip-nav">
          <button class="__tg-tooltip-btn __tg-tooltip-btn-secondary" id="__tg-prev-btn" ${index === 0 ? 'disabled style="opacity:0.5;cursor:not-allowed"' : ''}>Previous</button>
          <span class="__tg-tooltip-progress">${index + 1} / ${trail.steps.length}</span>
          ${index < trail.steps.length - 1
            ? '<button class="__tg-tooltip-btn __tg-tooltip-btn-primary" id="__tg-next-btn">Next</button>'
            : '<button class="__tg-tooltip-btn __tg-tooltip-btn-primary" id="__tg-finish-btn">Finish</button>'}
        </div>
      `;

      // Position tooltip after content is set
      setTimeout(() => {
        positionTooltip(tooltipElement, targetEl, step.placement || 'bottom');
        tooltipElement.style.opacity = '1';
        attachPlaybackNavListeners();
      }, 50);

    }, 400); // Wait for scroll animation to complete
  }

  // Attach navigation listeners
  function attachPlaybackNavListeners() {
    const prevBtn = document.getElementById('__tg-prev-btn');
    const nextBtn = document.getElementById('__tg-next-btn');
    const finishBtn = document.getElementById('__tg-finish-btn');

    if (prevBtn && playbackStepIndex > 0) {
      prevBtn.addEventListener('click', () => showPlaybackStep(playbackStepIndex - 1));
    }
    if (nextBtn) {
      nextBtn.addEventListener('click', () => showPlaybackStep(playbackStepIndex + 1));
    }
    if (finishBtn) {
      finishBtn.addEventListener('click', stopPlayback);
    }
  }

  // Start playback
  function startPlayback() {
    if (trail.steps.length === 0) {
      alert('Add some steps first!');
      return;
    }

    isPlaybackMode = true;
    playbackStepIndex = 0;

    // Update button
    const playBtn = document.getElementById('__tg-play-btn');
    playBtn.classList.add('active');
    playBtn.innerHTML = `
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <rect x="6" y="4" width="4" height="16"></rect>
        <rect x="14" y="4" width="4" height="16"></rect>
      </svg>
      <span>Stop</span>
    `;

    // Disable pick button during playback
    document.getElementById('__tg-pick-btn').disabled = true;
    document.getElementById('__tg-pick-btn').style.opacity = '0.5';

    // Create tooltip
    tooltipElement = createTooltip();

    // Show first step
    showPlaybackStep(0);
  }

  // Stop playback
  function stopPlayback() {
    isPlaybackMode = false;

    // Update button
    const playBtn = document.getElementById('__tg-play-btn');
    playBtn.classList.remove('active');
    playBtn.innerHTML = `
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <polygon points="5,3 19,12 5,21 5,3"></polygon>
      </svg>
      <span>Play</span>
    `;

    // Re-enable pick button
    document.getElementById('__tg-pick-btn').disabled = false;
    document.getElementById('__tg-pick-btn').style.opacity = '1';

    // Remove tooltip
    if (tooltipElement) {
      tooltipElement.remove();
      tooltipElement = null;
    }

    // Remove playback highlight
    const highlight = document.querySelector('.__tg-playback-highlight');
    if (highlight) highlight.remove();
  }

  // Toggle playback
  function togglePlayback() {
    if (isPlaybackMode) {
      stopPlayback();
    } else {
      startPlayback();
    }
  }

  // ============ END PLAYBACK FUNCTIONS ============

  // Close sidebar
  function closeSidebar() {
    // Stop playback if running
    if (isPlaybackMode) stopPlayback();

    document.body.style.marginRight = '';
    document.getElementById('__trailguide-sidebar')?.remove();
    document.querySelector('.__tg-highlight')?.remove();
    document.querySelector('.__tg-playback-highlight')?.remove();
    document.getElementById('__tg-picking-indicator')?.remove();
    document.getElementById('__tg-tooltip')?.remove();
    document.removeEventListener('mousemove', handleMouseMove, true);
    document.removeEventListener('click', handleClick, true);
    window.__trailguideSidebarActive = false;
  }

  // Initialize
  createSidebar();
  highlightOverlay = createHighlight();
  createPickingIndicator();

  // Event listeners
  document.getElementById('__tg-close').addEventListener('click', closeSidebar);

  document.getElementById('__tg-dashboard').addEventListener('click', () => {
    // Open dashboard in new tab
    const url = (typeof TRAILGUIDE_CONFIG !== 'undefined') ? TRAILGUIDE_CONFIG.EDITOR_URL : 'http://localhost:3000';
    window.open(url, '_blank');
  });

  document.getElementById('__tg-pick-btn').addEventListener('click', () => {
    if (isPickingMode) {
      stopPicking();
    } else {
      startPicking();
    }
  });

  document.getElementById('__tg-play-btn').addEventListener('click', togglePlayback);

  document.getElementById('__tg-trail-title').addEventListener('input', (e) => {
    trail.title = e.target.value;
  });

  document.getElementById('__tg-step-title').addEventListener('input', (e) => {
    if (selectedStepIndex !== null) {
      trail.steps[selectedStepIndex].title = e.target.value;
      renderSteps();
    }
  });

  document.getElementById('__tg-step-content').addEventListener('input', (e) => {
    if (selectedStepIndex !== null) {
      trail.steps[selectedStepIndex].content = e.target.value;
    }
  });

  document.getElementById('__tg-step-placement').addEventListener('change', (e) => {
    if (selectedStepIndex !== null) {
      trail.steps[selectedStepIndex].placement = e.target.value;
    }
  });

  document.getElementById('__tg-export-btn').addEventListener('click', exportTrail);
  document.getElementById('__tg-save-btn').addEventListener('click', saveTrail);
  document.getElementById('__tg-dashboard-btn').addEventListener('click', () => {
    const url = (typeof TRAILGUIDE_CONFIG !== 'undefined') ? TRAILGUIDE_CONFIG.EDITOR_URL : 'http://localhost:3000';
    window.open(url, '_blank');
  });

  document.addEventListener('mousemove', handleMouseMove, true);
  document.addEventListener('click', handleClick, true);

  console.log('[Trailguide] Sidebar initialized');
})();
