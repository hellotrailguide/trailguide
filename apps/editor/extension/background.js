// Background service worker for Trailguide extension

const EDITOR_URL = 'http://localhost:3000'

// Listen for messages from content scripts and popup
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  console.log('Background received message:', message)

  if (message.action === 'selectorPicked') {
    // Forward to editor tab
    forwardToEditor(message, sender.tab)
      .then(() => sendResponse({ success: true }))
      .catch(e => sendResponse({ success: false, error: e.message }))
    return true
  }

  if (message.action === 'startRecorderSession') {
    // Open a new window for recording
    startRecorderSession(message.url, message.editorTabId)
      .then(() => sendResponse({ success: true }))
      .catch(e => sendResponse({ success: false, error: e.message }))
    return true
  }

  if (message.action === 'recorderSessionEnded') {
    // Notify editor that recording ended
    chrome.tabs.sendMessage(message.editorTabId, {
      type: 'TRAILGUIDE_RECORDER_ENDED'
    }).catch(() => {})
    return false
  }

  return false
})

// Start a recorder session in a new window
async function startRecorderSession(url, editorTabId) {
  // Store session info
  await chrome.storage.local.set({
    recorderSession: {
      editorTabId,
      timestamp: Date.now()
    }
  })

  // Open new window with the URL
  await chrome.windows.create({
    url: url,
    type: 'normal',
    focused: true,
    width: 1200,
    height: 800
  })

  console.log('Recorder session started for:', url)
}

// Forward selector to editor tab
async function forwardToEditor(message, sourceTab) {
  console.log('Forwarding selector to editor:', message.selector)

  const tabs = await chrome.tabs.query({})
  const editorTab = tabs.find(tab => tab.url && tab.url.startsWith(EDITOR_URL))

  console.log('Found editor tab:', editorTab?.id, editorTab?.url)

  if (editorTab) {
    try {
      // Method 1: Use executeScript to post message
      const results = await chrome.scripting.executeScript({
        target: { tabId: editorTab.id },
        func: (selector, url) => {
          console.log('Trailguide: Posting selector to editor page:', selector)
          window.postMessage({
            type: 'TRAILGUIDE_SELECTOR',
            selector: selector,
            sourceUrl: url
          }, '*')
          return 'Message posted'
        },
        args: [message.selector, sourceTab.url]
      })
      console.log('executeScript result:', results)
    } catch (e) {
      console.error('executeScript failed:', e)

      // Method 2: Try using a notification or badge as fallback
      // Store for later retrieval
      await chrome.storage.local.set({
        pendingSelector: message.selector,
        pendingUrl: sourceTab.url,
        timestamp: Date.now()
      })

      // Set badge to indicate pending selector
      chrome.action.setBadgeText({ text: '1' })
      chrome.action.setBadgeBackgroundColor({ color: '#3b82f6' })
    }
  } else {
    console.log('No editor tab found, storing selector')
    // Store for when editor opens
    await chrome.storage.local.set({
      pendingSelector: message.selector,
      pendingUrl: sourceTab.url,
      timestamp: Date.now()
    })

    // Set badge to indicate pending selector
    chrome.action.setBadgeText({ text: '1' })
    chrome.action.setBadgeBackgroundColor({ color: '#3b82f6' })
  }
}

// When editor tab loads, check for pending selector
chrome.tabs.onUpdated.addListener(async (tabId, changeInfo, tab) => {
  if (changeInfo.status === 'complete' && tab.url && tab.url.startsWith(EDITOR_URL)) {
    const data = await chrome.storage.local.get(['pendingSelector', 'pendingUrl', 'timestamp'])

    // Only use if less than 5 minutes old
    if (data.pendingSelector && data.timestamp && (Date.now() - data.timestamp) < 300000) {
      try {
        await chrome.scripting.executeScript({
          target: { tabId: tabId },
          func: (selector, url) => {
            window.postMessage({
              type: 'TRAILGUIDE_SELECTOR',
              selector: selector,
              sourceUrl: url
            }, '*')
          },
          args: [data.pendingSelector, data.pendingUrl]
        })

        // Clear pending
        chrome.storage.local.remove(['pendingSelector', 'pendingUrl', 'timestamp'])
      } catch (e) {
        console.error('Failed to send pending selector:', e)
      }
    }
  }
})
