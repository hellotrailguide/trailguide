// Background service worker for Trailguide Recorder extension.
// Manages recording sessions: opens target site, injects picker, routes selectors.

let recording = null; // { tabId, editorTabId, editorWindowId, stepCount, navListener }

function stopRecording() {
  if (!recording) return;
  if (recording.navListener) {
    chrome.tabs.onUpdated.removeListener(recording.navListener);
  }
  chrome.tabs.sendMessage(recording.tabId, { action: 'stopRecording' }).catch(() => {});
  chrome.tabs.remove(recording.tabId).catch(() => {});
  recording = null;
}

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  // ── From editor-bridge: start recording ──
  if (message.type === 'TRAILGUIDE_EXT_START_RECORDING') {
    const editorTabId = sender.tab.id;
    const editorWindowId = sender.tab.windowId;

    chrome.tabs.create({ url: message.url, active: true }, (tab) => {
      recording = { tabId: tab.id, editorTabId, editorWindowId, stepCount: 0, navListener: null };

      // Persistent listener — re-injects content script on every navigation within the recording tab
      const navListener = (tabId, info) => {
        if (tabId !== tab.id || info.status !== 'complete') return;

        chrome.scripting.executeScript(
          { target: { tabId: tab.id }, files: ['content.js'] },
          () => {
            if (chrome.runtime.lastError) return;
            chrome.tabs.sendMessage(tab.id, {
              action: 'startRecording',
              stepCount: recording ? recording.stepCount : 0,
            });
          }
        );
      };

      recording.navListener = navListener;
      chrome.tabs.onUpdated.addListener(navListener);
    });

    sendResponse({ success: true });
    return true;
  }

  // ── From editor-bridge: stop recording ──
  if (message.type === 'TRAILGUIDE_EXT_STOP_RECORDING') {
    stopRecording();
    return false;
  }

  // ── From content script: selector picked ──
  if (message.action === 'selectorPicked' && recording) {
    recording.stepCount++;
    chrome.tabs.captureVisibleTab(null, { format: 'jpeg', quality: 50 }, (screenshot) => {
      if (chrome.runtime.lastError) {
        console.warn('[Trailguide] Screenshot capture failed:', chrome.runtime.lastError.message);
      }
      chrome.tabs.sendMessage(recording.editorTabId, {
        type: 'TRAILGUIDE_SELECTOR',
        selector: message.selector,
        quality: message.quality,
        qualityHint: message.qualityHint,
        screenshot: screenshot || null,
        elementRect: message.elementRect || null,
        viewportSize: message.viewportSize || null,
      }).catch(() => {});
    });
    return true; // keep message channel open for async captureVisibleTab
  }

  // ── From content script: recording stopped (Escape or Done button) ──
  if (message.action === 'recordingStopped' && recording) {
    const { editorTabId, editorWindowId, tabId: recordTabId, navListener } = recording;
    if (navListener) chrome.tabs.onUpdated.removeListener(navListener);
    recording = null;

    // Notify editor that recording ended
    chrome.tabs.sendMessage(editorTabId, {
      type: 'TRAILGUIDE_RECORDER_STOPPED',
    }).catch(() => {});

    // Focus the editor window and tab, then close recording tab
    chrome.windows.update(editorWindowId, { focused: true }).then(() => {
      chrome.tabs.update(editorTabId, { active: true }).catch(() => {});
    }).catch(() => {
      // Fallback: just try to activate the tab
      chrome.tabs.update(editorTabId, { active: true }).catch(() => {});
    });
    chrome.tabs.remove(recordTabId).catch(() => {});

    return false;
  }

  return false;
});

// Detect when the recording tab is closed
chrome.tabs.onRemoved.addListener((tabId) => {
  if (recording && tabId === recording.tabId) {
    const { editorTabId, editorWindowId, navListener } = recording;
    if (navListener) chrome.tabs.onUpdated.removeListener(navListener);
    recording = null;

    chrome.tabs.sendMessage(editorTabId, { type: 'TRAILGUIDE_RECORDER_STOPPED' }).catch(() => {});

    // Focus editor when recording tab is closed manually
    chrome.windows.update(editorWindowId, { focused: true }).then(() => {
      chrome.tabs.update(editorTabId, { active: true }).catch(() => {});
    }).catch(() => {
      chrome.tabs.update(editorTabId, { active: true }).catch(() => {});
    });
  }
});
