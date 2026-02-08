// Content script - injected into web pages for element picking

(function() {
  // Prevent multiple injections
  if (window.__trailguidePickerActive) return
  window.__trailguidePickerActive = true

  let isPickingMode = false
  let highlightOverlay = null
  let hoveredElement = null

  // Create highlight overlay
  function createOverlay() {
    const overlay = document.createElement('div')
    overlay.id = '__trailguide-highlight'
    overlay.style.cssText = `
      position: fixed;
      pointer-events: none;
      border: 2px solid #3b82f6;
      background: rgba(59, 130, 246, 0.1);
      z-index: 2147483647;
      border-radius: 4px;
      transition: all 0.1s ease;
    `
    document.body.appendChild(overlay)
    return overlay
  }

  // Create picking mode indicator
  function createIndicator() {
    const indicator = document.createElement('div')
    indicator.id = '__trailguide-indicator'
    indicator.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      background: #3b82f6;
      color: white;
      padding: 12px 16px;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      font-size: 14px;
      z-index: 2147483647;
      display: flex;
      align-items: center;
      justify-content: space-between;
      box-shadow: 0 2px 8px rgba(0,0,0,0.15);
    `
    indicator.innerHTML = `
      <span><strong>Trailguide:</strong> Click any element to select it</span>
      <button id="__trailguide-cancel" style="
        background: rgba(255,255,255,0.2);
        border: none;
        color: white;
        padding: 6px 12px;
        border-radius: 4px;
        cursor: pointer;
        font-size: 13px;
      ">Cancel</button>
    `
    document.body.appendChild(indicator)

    document.getElementById('__trailguide-cancel').addEventListener('click', stopPicking)
    return indicator
  }

  // Position overlay over element
  function positionOverlay(element) {
    if (!highlightOverlay) return
    const rect = element.getBoundingClientRect()
    highlightOverlay.style.display = 'block'
    highlightOverlay.style.top = rect.top + 'px'
    highlightOverlay.style.left = rect.left + 'px'
    highlightOverlay.style.width = rect.width + 'px'
    highlightOverlay.style.height = rect.height + 'px'
  }

  // Hide overlay
  function hideOverlay() {
    if (highlightOverlay) {
      highlightOverlay.style.display = 'none'
    }
  }

  // Generate stable selector for element
  function generateSelector(element) {
    // Priority 1: ID
    if (element.id && !element.id.match(/^\d|^[0-9]/)) {
      const selector = `#${CSS.escape(element.id)}`
      if (document.querySelectorAll(selector).length === 1) {
        return selector
      }
    }

    // Priority 2: Data attributes
    const dataAttrs = ['data-testid', 'data-cy', 'data-test', 'data-trail-id', 'data-tour-target']
    for (const attr of dataAttrs) {
      const value = element.getAttribute(attr)
      if (value) {
        const selector = `[${attr}="${CSS.escape(value)}"]`
        if (document.querySelectorAll(selector).length === 1) {
          return selector
        }
      }
    }

    // Priority 3: aria-label
    const ariaLabel = element.getAttribute('aria-label')
    if (ariaLabel) {
      const selector = `${element.tagName.toLowerCase()}[aria-label="${CSS.escape(ariaLabel)}"]`
      if (document.querySelectorAll(selector).length === 1) {
        return selector
      }
    }

    // Priority 4: Button/link with unique text
    if (['BUTTON', 'A'].includes(element.tagName)) {
      const text = element.textContent.trim()
      if (text && text.length < 50) {
        const tag = element.tagName.toLowerCase()
        const allSame = Array.from(document.querySelectorAll(tag))
          .filter(el => el.textContent.trim() === text)
        if (allSame.length === 1) {
          // Use a more compatible selector
          const selector = `${tag}:contains("${text.slice(0, 30)}")`
          // Fallback to class-based or path-based
        }
      }
    }

    // Priority 5: Unique class
    if (element.className && typeof element.className === 'string') {
      const classes = element.className.split(/\s+/).filter(c =>
        c && !c.match(/^(hover|active|focus|selected|open|closed|visible|hidden|ng-|_|css-)/i)
      )

      for (const cls of classes) {
        const selector = `.${CSS.escape(cls)}`
        if (document.querySelectorAll(selector).length === 1) {
          return selector
        }
      }

      // Try class combinations
      if (classes.length >= 2) {
        const selector = classes.slice(0, 3).map(c => `.${CSS.escape(c)}`).join('')
        if (document.querySelectorAll(selector).length === 1) {
          return selector
        }
      }
    }

    // Priority 6: Path-based selector
    const path = []
    let current = element

    while (current && current !== document.body && path.length < 5) {
      let selector = current.tagName.toLowerCase()

      if (current.id && !current.id.match(/^\d/)) {
        path.unshift(`#${CSS.escape(current.id)}`)
        break
      }

      const parent = current.parentElement
      if (parent) {
        const siblings = Array.from(parent.children).filter(el => el.tagName === current.tagName)
        if (siblings.length > 1) {
          const index = siblings.indexOf(current) + 1
          selector += `:nth-of-type(${index})`
        }
      }

      path.unshift(selector)
      current = parent
    }

    return path.join(' > ')
  }

  // Mouse move handler
  function handleMouseMove(e) {
    if (!isPickingMode) return

    // Ignore our own elements
    if (e.target.id && e.target.id.startsWith('__trailguide')) return

    hoveredElement = e.target
    positionOverlay(hoveredElement)
  }

  // Click handler
  function handleClick(e) {
    if (!isPickingMode) return

    // Ignore our own elements
    if (e.target.id && e.target.id.startsWith('__trailguide')) return

    e.preventDefault()
    e.stopPropagation()
    e.stopImmediatePropagation()

    const selector = generateSelector(e.target)

    // Send to extension
    chrome.runtime.sendMessage({
      action: 'selectorPicked',
      selector: selector,
      tagName: e.target.tagName.toLowerCase(),
      text: e.target.textContent?.slice(0, 50).trim() || ''
    })

    stopPicking()
    return false
  }

  // Start picking mode
  function startPicking() {
    isPickingMode = true
    highlightOverlay = createOverlay()
    createIndicator()

    document.addEventListener('mousemove', handleMouseMove, true)
    document.addEventListener('click', handleClick, true)
    document.body.style.cursor = 'crosshair'
  }

  // Stop picking mode
  function stopPicking() {
    isPickingMode = false
    window.__trailguidePickerActive = false

    document.removeEventListener('mousemove', handleMouseMove, true)
    document.removeEventListener('click', handleClick, true)
    document.body.style.cursor = ''

    // Remove overlay
    const overlay = document.getElementById('__trailguide-highlight')
    if (overlay) overlay.remove()

    // Remove indicator
    const indicator = document.getElementById('__trailguide-indicator')
    if (indicator) indicator.remove()

    highlightOverlay = null
  }

  // Listen for messages from popup
  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.action === 'startPicking') {
      startPicking()
    } else if (message.action === 'stopPicking') {
      stopPicking()
    }
  })
})()
