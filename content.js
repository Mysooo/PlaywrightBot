console.log("[Locator Helper] content script loaded");

document.addEventListener('click', async function (e) {
  const { enabled } = await chrome.storage.sync.get(['enabled']);
  if (!enabled) return;

  e.preventDefault();
  e.stopPropagation();

  const el = e.target;
  const locators = [];

  const testId = el.getAttribute('data-testid');
  if (testId) locators.push(`getByTestId('${testId}')`);

  const text = el.textContent.trim();
  if (text) locators.push(`getByText('${text}')`);

  const role = el.getAttribute('role') || getComputedRole(el);
  const name = el.getAttribute('aria-label') || el.getAttribute('alt') || text;
  if (role && name) locators.push(`getByRole('${role}', { name: '${name}' })`);

  const label = el.getAttribute('aria-label') || getLabelText(el);
  if (label) locators.push(`getByLabel('${label}')`);

  const placeholder = el.getAttribute('placeholder');
  if (placeholder) locators.push(`getByPlaceholder('${placeholder}')`);

  locators.push(`locator('${getCssSelector(el)}')`);
  locators.push(`locator('${getXPath(el)}')`);

  showOverlay(locators);
}, true);


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
    overlay.style.overflowY = 'auto';
    overlay.style.maxHeight = '60vh';
    overlay.style.display = 'flex';
    overlay.style.flexDirection = 'column';
    overlay.style.gap = '8px';
    document.body.appendChild(overlay);
  }

  overlay.innerHTML = '';

  lines.forEach(line => {
    const lineWrapper = document.createElement('div');
    lineWrapper.style.display = 'flex';
    lineWrapper.style.alignItems = 'flex-start';
    lineWrapper.style.justifyContent = 'space-between';
    lineWrapper.style.gap = '8px';

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
    copyBtn.style.flexShrink = '0';

    copyBtn.onclick = () => {
      navigator.clipboard.writeText(line);
      copyBtn.textContent = '✅';
      setTimeout(() => (copyBtn.textContent = '📋'), 1000);
    };

    lineWrapper.appendChild(textSpan);
    lineWrapper.appendChild(copyBtn);
    overlay.appendChild(lineWrapper);
  });

  overlay.style.display = 'block';

  setTimeout(() => {
    if (overlay.style.display !== 'none') {
      overlay.style.display = 'none';
    }
  }, 10000);
}

