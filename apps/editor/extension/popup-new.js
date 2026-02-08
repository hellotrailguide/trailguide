// Popup script - launches the sidebar editor on the current page

// Import config - will be overwritten when loading for production
const startBtn = document.getElementById('startBtn')
const openDashboard = document.getElementById('openDashboard')
const statusEl = document.getElementById('status')

// Get the editor URL from config or fallback
function getEditorUrl() {
  return (typeof TRAILGUIDE_CONFIG !== 'undefined')
    ? TRAILGUIDE_CONFIG.EDITOR_URL
    : 'http://localhost:3000'
}

// Check if we can run on this page
async function checkPage() {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true })

  if (!tab.url ||
      tab.url.startsWith('chrome://') ||
      tab.url.startsWith('chrome-extension://') ||
      tab.url.startsWith('about:')) {
    statusEl.style.display = 'block'
    statusEl.textContent = 'Cannot edit on browser pages'
    startBtn.disabled = true
    startBtn.style.opacity = '0.5'
    startBtn.style.cursor = 'not-allowed'
    return false
  }

  return true
}

// Start editing - inject sidebar into page
async function startEditing() {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true })

  try {
    // Inject config first, then sidebar
    await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      files: ['config.js']
    })

    await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      files: ['sidebar.js']
    })

    // Close the popup
    window.close()
  } catch (e) {
    console.error('Failed to inject sidebar:', e)
    statusEl.style.display = 'block'
    statusEl.textContent = 'Failed to start editor: ' + e.message
  }
}

// Open the dashboard
function openDashboardPage() {
  chrome.tabs.create({ url: getEditorUrl() })
  window.close()
}

// Event listeners
startBtn.addEventListener('click', startEditing)
openDashboard.addEventListener('click', openDashboardPage)

// Initialize
checkPage()
