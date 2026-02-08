// Popup script for Trailguide extension

const EDITOR_URL = 'http://localhost:3000' // Change to production URL when deployed

const statusEl = document.getElementById('status')
const pickBtn = document.getElementById('pickBtn')
const stopBtn = document.getElementById('stopBtn')
const openEditorBtn = document.getElementById('openEditor')
const selectorPreview = document.getElementById('selectorPreview')
const lastSelectorEl = document.getElementById('lastSelector')

let isPicking = false
let editorTabId = null

// Check for pending selector that hasn't been sent yet
async function checkPendingSelector() {
  const data = await chrome.storage.local.get(['pendingSelector', 'pendingUrl', 'timestamp'])

  if (data.pendingSelector && data.timestamp && (Date.now() - data.timestamp) < 300000) {
    // Show the pending selector
    selectorPreview.style.display = 'block'
    lastSelectorEl.textContent = data.pendingSelector

    // Clear the badge
    chrome.action.setBadgeText({ text: '' })

    // Try to send it to the editor
    const tabs = await chrome.tabs.query({})
    const editorTab = tabs.find(tab => tab.url && tab.url.startsWith(EDITOR_URL))

    if (editorTab) {
      try {
        await chrome.scripting.executeScript({
          target: { tabId: editorTab.id },
          func: (selector, url) => {
            console.log('Trailguide popup: Sending pending selector:', selector)
            window.postMessage({
              type: 'TRAILGUIDE_SELECTOR',
              selector: selector,
              sourceUrl: url
            }, '*')
          },
          args: [data.pendingSelector, data.pendingUrl]
        })
        // Clear pending after successful send
        await chrome.storage.local.remove(['pendingSelector', 'pendingUrl', 'timestamp'])
        statusEl.className = 'status connected'
        statusEl.textContent = 'Selector sent to editor!'
      } catch (e) {
        console.error('Failed to send pending selector:', e)
      }
    }
  }
}

// Check if editor is open
async function checkEditorStatus() {
  const tabs = await chrome.tabs.query({})
  const editorTab = tabs.find(tab => tab.url && tab.url.startsWith(EDITOR_URL))

  if (editorTab) {
    editorTabId = editorTab.id
    statusEl.className = 'status connected'
    statusEl.textContent = 'Connected to Trailguide Editor'
    pickBtn.disabled = false
  } else {
    editorTabId = null
    statusEl.className = 'status disconnected'
    statusEl.textContent = 'Open the Trailguide editor to get started'
    // Allow picking even without editor - we'll store it
    pickBtn.disabled = false
  }
}

// Start picking mode
async function startPicking() {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true })

  if (tab.url.startsWith(EDITOR_URL)) {
    statusEl.className = 'status disconnected'
    statusEl.textContent = 'Navigate to your app first, then pick elements'
    return
  }

  if (tab.url.startsWith('chrome://') || tab.url.startsWith('chrome-extension://')) {
    statusEl.className = 'status disconnected'
    statusEl.textContent = 'Cannot pick elements on browser pages'
    return
  }

  isPicking = true
  pickBtn.style.display = 'none'
  stopBtn.style.display = 'block'
  statusEl.className = 'status picking'
  statusEl.textContent = 'Click any element on the page to select it'

  // Inject the content script
  await chrome.scripting.executeScript({
    target: { tabId: tab.id },
    files: ['content.js']
  })

  // Send message to start picking
  chrome.tabs.sendMessage(tab.id, { action: 'startPicking' })
}

// Stop picking mode
async function stopPicking() {
  isPicking = false
  pickBtn.style.display = 'block'
  stopBtn.style.display = 'none'

  await checkEditorStatus()

  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true })
  try {
    chrome.tabs.sendMessage(tab.id, { action: 'stopPicking' })
  } catch (e) {
    // Tab might not have content script
  }
}

// Open editor
function openEditor() {
  chrome.tabs.create({ url: EDITOR_URL })
}

// Listen for messages from content script
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === 'selectorPicked') {
    // Show in popup
    selectorPreview.style.display = 'block'
    lastSelectorEl.textContent = message.selector

    // Send to editor tab
    if (editorTabId) {
      chrome.tabs.sendMessage(editorTabId, {
        action: 'selectorFromExtension',
        selector: message.selector,
        url: sender.tab.url
      }).catch(() => {
        // Editor might not be listening yet
        // Store in background and try again
        chrome.storage.local.set({
          pendingSelector: message.selector,
          pendingUrl: sender.tab.url
        })
      })
    }

    // Stop picking after selection
    stopPicking()
  }
})

// Event listeners
pickBtn.addEventListener('click', startPicking)
stopBtn.addEventListener('click', stopPicking)
openEditorBtn.addEventListener('click', openEditor)

// Initialize
checkEditorStatus()
checkPendingSelector()
