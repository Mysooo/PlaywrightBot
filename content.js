console.log("[Locator Helper] content script loaded");

document.addEventListener('click', async function (e) {
  const { enabled } = await chrome.storage.sync.get(['enabled']);
  if (!enabled) return;

  e.preventDefault();
  e.stopPropagation();

  const el = e.target;
  let locator = null;

  const testId = el.getAttribute('data-testid');
  if (testId) {
    locator = `getByTestId('${testId}')`;
  }

  if (!locator) {
    const role = el.getAttribute('role') || getComputedRole(el);
    const name = el.getAttribute('aria-label') || el.getAttribute('alt') || el.textContent.trim();
    if (role && name) {
      locator = `getByRole('${role}', { name: '${name}' })`;
    }
  }

  if (!locator) {
    const text = el.textContent.trim();
    if (text) {
      locator = `getByText('${text}')`;
    }
  }

  if (!locator) {
    const label = el.getAttribute('aria-label') || getLabelText(el);
    if (label) {
      locator = `getByLabel('${label}')`;
    }
  }

  if (!locator) {
    const placeholder = el.getAttribute('placeholder');
    if (placeholder) {
      locator = `getByPlaceholder('${placeholder}')`;
    }
  }

  if (!locator) {
    locator = `locator('${getCssSelector(el)}')`;
  }

  // Show overlay
  showOverlay([locator]);

  //Record the action if recording is ON
  const { recording } = await chrome.storage.sync.get(['recording']);
  if (recording && locator) {
    const action = {
      locator: locator,
      action: 'click',
      timestamp: Date.now()
    };

    const { recordedActions = [] } = await chrome.storage.sync.get(['recordedActions']);
    recordedActions.push(action);
    await chrome.storage.sync.set({ recordedActions });
  }
}, true);

// Utility functions 
function getCssSelector(el) {
  if (el.id) return `#${el.id}`;
  let path = [];
  while (el && el.nodeType === 1) {
    let selector = el.nodeName.toLowerCase();
    if (el.className) selector += '.' + [...el.classList].join('.');
    const parent = el.parentNode;
    if (parent) {
      const siblings = [...parent.children].filter(e => e.tagName === el.tagName);
      if (siblings.length > 1) {
        selector += `:nth-of-type(${[...siblings].indexOf(el) + 1})`;
      }
    }
    path.unshift(selector);
    el = el.parentNode;
  }
  return path.join(' > ');
}

function getXPath(el) {
  if (el.id) return `//*[@id="${el.id}"]`;
  const parts = [];
  while (el && el.nodeType === 1) {
    let ix = 0;
    const siblings = el.parentNode ? el.parentNode.childNodes : [];
    for (let i = 0; i < siblings.length; i++) {
      if (siblings[i] === el) break;
      if (siblings[i].nodeName === el.nodeName) ix++;
    }
    parts.unshift(`${el.nodeName.toLowerCase()}[${ix + 1}]`);
    el = el.parentNode;
  }
  return '/' + parts.join('/');
}

function getComputedRole(el) {
  try {
    return window.getComputedAccessibleNode(el)?.role || null;
  } catch {
    return null;
  }
}

function getLabelText(el) {
  const id = el.getAttribute('id');
  if (id) {
    const label = document.querySelector(`label[for="${id}"]`);
    if (label) return label.textContent.trim();
  }
  return null;
}

function showOverlay(lines) {
  let overlay = document.getElementById('playwright-locator-overlay');

  if (!overlay) {
    overlay = document.createElement('div');
    overlay.id = 'playwright-locator-overlay';
    overlay.style.position = 'fixed';
    overlay.style.bottom = '20px';
    overlay.style.right = '20px';
    overlay.style.zIndex = 9999;
    overlay.style.background = '#111';
    overlay.style.color = '#fff';
    overlay.style.padding = '12px';
    overlay.style.borderRadius = '8px';
    overlay.style.boxShadow = '0 0 12px rgba(0,0,0,0.6)';
    overlay.style.maxWidth = '400px';
    overlay.style.fontFamily = 'monospace';
    overlay.style.fontSize = '13px';
    overlay.style.display = 'flex';
    overlay.style.alignItems = 'center';
    overlay.style.gap = '8px';
    document.body.appendChild(overlay);
  }

  overlay.innerHTML = '';

  const line = lines[0];
  const textSpan = document.createElement('code');
  textSpan.textContent = line;
  textSpan.style.whiteSpace = 'pre-wrap';
  textSpan.style.wordBreak = 'break-word';
  textSpan.style.flex = '1';

  const copyBtn = document.createElement('button');
  copyBtn.textContent = '📋';
  copyBtn.style.cursor = 'pointer';
  copyBtn.style.background = '#333';
  copyBtn.style.color = '#fff';
  copyBtn.style.border = 'none';
  copyBtn.style.borderRadius = '4px';
  copyBtn.style.padding = '4px 8px';
  copyBtn.style.fontSize = '12px';

  copyBtn.onclick = () => {
    navigator.clipboard.writeText(line);
    copyBtn.textContent = '✅';
    setTimeout(() => (copyBtn.textContent = '📋'), 1000);
  };

  overlay.appendChild(textSpan);
  overlay.appendChild(copyBtn);
  overlay.style.display = 'flex';

  setTimeout(() => {
    overlay.style.display = 'none';
  }, 10000);
}
