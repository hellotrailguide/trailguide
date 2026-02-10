// Content script that runs on the Trailguide editor page.
// Bridges window.postMessage (editor React app) ↔ chrome.runtime (extension).

(function () {
  // Signal to the editor that the extension is available.
  // Repeat a few times to survive React hydration timing.
  function signal() {
    window.postMessage({ type: 'TRAILGUIDE_EXT_INSTALLED' }, '*');
  }
  signal();
  setTimeout(signal, 500);
  setTimeout(signal, 1500);

  // Also respond to explicit pings from the editor
  window.addEventListener('message', (event) => {
    if (event.source !== window) return;
    const { type } = event.data || {};

    if (type === 'TRAILGUIDE_EXT_PING') {
      signal();
      return;
    }

    // Forward recording commands to the extension background
    if (
      type === 'TRAILGUIDE_EXT_START_RECORDING' ||
      type === 'TRAILGUIDE_EXT_STOP_RECORDING'
    ) {
      chrome.runtime.sendMessage(event.data);
    }
  });

  // Forward selectors and status from the extension background to the editor page
  chrome.runtime.onMessage.addListener((message) => {
    if (
      message.type === 'TRAILGUIDE_SELECTOR' ||
      message.type === 'TRAILGUIDE_RECORDER_STOPPED'
    ) {
      window.postMessage(message, '*');
    }
  });
})();
