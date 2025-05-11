document.addEventListener('DOMContentLoaded', async () => {
  const toggle = document.getElementById('toggleRecording');
  const startBtn = document.getElementById('startRecording');
  const stopBtn = document.getElementById('stopRecording');
  const downloadBtn = document.getElementById('downloadRecording');

  chrome.storage.sync.get(['enabled'], ({ enabled }) => {
    toggle.checked = !!enabled;
  });

  toggle.addEventListener('change', () => {
    chrome.storage.sync.set({ enabled: toggle.checked });
  });

  startBtn.addEventListener('click', () => {
    chrome.storage.sync.set({ recording: true, recordedActions: [] });
    alert('Recording started!');
  });

  stopBtn.addEventListener('click', () => {
    chrome.storage.sync.set({ recording: false });
    alert('Recording stopped!');
  });

  downloadBtn.addEventListener('click', async () => {
    const { recordedActions = [] } = await chrome.storage.sync.get(['recordedActions']);
    if (!recordedActions.length) {
      alert('No actions recorded.');
      return;
    }

    let content = '';
    content += 'actions = [\n';
    content += recordedActions.map(action => {
      const base = `    {"locator": "${action.locator}", "action": "${action.action}"`;
      if (action.value !== undefined) {
        return base + `, "value": "${action.value}"},\n`;
      }
      return base + '},\n';
    }).join('');
    content += ']';

    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'recorded_actions.txt';
    a.click();
    URL.revokeObjectURL(url);
  });
});
