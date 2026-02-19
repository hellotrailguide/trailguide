document.getElementById('openDashboard').addEventListener('click', function () {
  chrome.tabs.create({ url: 'http://localhost:3003' });
  window.close();
});
