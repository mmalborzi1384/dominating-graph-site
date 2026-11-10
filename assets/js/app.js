import { initTabs } from './ui/tabs.js';

const themeButton = document.getElementById('theme-toggle');
const themeLabel = document.getElementById('theme-label');
const storageNotice = document.getElementById('storage-notice');
function updateThemeControl() {
  const isNight = document.documentElement.dataset.theme === 'night';
  themeLabel.textContent = isNight ? 'حالت روز' : 'حالت شب';
  themeButton.setAttribute('aria-label', isNight ? 'تغییر به حالت روز' : 'تغییر به حالت شب');
  const warning = window.graphShellTheme?.warning ?? '';
  storageNotice.textContent = warning;
  storageNotice.hidden = !warning;
}
themeButton.addEventListener('click', () => {
  const next = document.documentElement.dataset.theme === 'night' ? 'day' : 'night';
  window.graphShellTheme?.set(next);
  updateThemeControl();
});
updateThemeControl();
initTabs();
document.querySelector('.skip-link').addEventListener('click', event => {
  event.preventDefault();
  document.getElementById('main-content').focus();
});

// Load editable shell copy, not question-bank activities or future tab controllers.
try {
  const response = await fetch(new URL('../../content/shell.json', import.meta.url));
  if (!response.ok) throw new Error('Shell copy unavailable');
  const copy = await response.json();
  for (const [id, panel] of Object.entries(copy.panels)) {
    const section = document.getElementById(`panel-${id}`);
    if (!section) continue;
    section.querySelector('[data-panel-heading]').textContent = panel.heading;
    section.querySelector('[data-panel-description]').textContent = panel.description;
  }
} catch {
  const notice = document.getElementById('content-notice');
  notice.hidden = false;
}
for (const math of document.querySelectorAll('[data-math]')) {
  if (window.katex) {
    try {
      window.katex.render(math.dataset.math, math, { throwOnError: true, trust: false,
        output: 'htmlAndMathml' });
    } catch { document.getElementById('math-notice').hidden = false; }
  } else document.getElementById('math-notice').hidden = false;
}
