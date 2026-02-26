document.getElementById('openDashboard').addEventListener('click', function () {
  chrome.tabs.create({ url: 'https://app.gettrailguide.com' });
  window.close();
});
