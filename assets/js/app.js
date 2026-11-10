import { loadTeaching } from './data/load.js';
import { createRepository } from './storage/repository.js';
import { initTeaching } from './tabs/teach.js';
import { initTabs } from './ui/tabs.js';
import { renderFormula } from './ui/math.js';
import { setFeedback } from './ui/feedback.js';

const themeButton = document.getElementById('theme-toggle');
const themeLabel = document.getElementById('theme-label');
const storageNotice = document.getElementById('storage-notice');
function updateThemeControl() {
  const isNight = document.documentElement.dataset.theme === 'night';
  themeLabel.textContent = isNight ? 'حالت روز' : 'حالت شب';
  themeButton.setAttribute('aria-label', isNight ? 'تغییر به حالت روز' : 'تغییر به حالت شب');
  const warning = window.graphRepository?.snapshot().warning ?? window.graphShellTheme?.warning ?? '';
  setFeedback(storageNotice, warning, { tone: 'error' });
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

// Load editable shell copy before mounting the teaching controller.
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
  if (!renderFormula(math, math.dataset.math).ok) document.getElementById('math-notice').hidden = false;
}

try {
  const teaching = await loadTeaching();
  const repository = createRepository(teaching.curriculum, undefined, { questions: teaching.questions });
  window.graphRepository = repository;
  repository.subscribe(({ state }) => {
    document.documentElement.dataset.theme = state.settings.theme;
    updateThemeControl();
  });
  initTeaching(teaching, repository);
} catch {
  const notice = document.getElementById('content-notice');
  notice.textContent = 'آموزش آماده نشد؛ فایل‌های بانک و محتوای آموزش را بررسی کنید. پیشرفت ذخیره‌شده تغییر نمی‌کند.';
  notice.hidden = false;
}
