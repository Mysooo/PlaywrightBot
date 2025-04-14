document.addEventListener('DOMContentLoaded', async () => {
    const toggle = document.getElementById('toggleRecording');
  
    chrome.storage.sync.get(['enabled'], ({ enabled }) => {
      toggle.checked = !!enabled;
    });
  
    toggle.addEventListener('change', () => {
      chrome.storage.sync.set({ enabled: toggle.checked });
    });
  });
  