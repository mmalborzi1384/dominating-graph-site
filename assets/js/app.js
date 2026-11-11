import { loadTeaching } from './data/load.js';
import { createRepository } from './storage/repository.js';
import { initPractice } from './tabs/practice.js';
import { initCompetition } from './tabs/competition.js';
import { initRecords } from './tabs/records.js';
import { initLab } from './tabs/lab.js';
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
  const repository = createRepository(teaching.curriculum, undefined,
    { questions: teaching.questions, bankVersion: teaching.bankVersion });
  window.graphRepository = repository;
  repository.subscribe(({ state }) => {
    document.documentElement.dataset.theme = state.settings.theme;
    updateThemeControl();
  });
  initTeaching(teaching, repository);
  try { await initRecords(teaching, repository); }
  catch { setFeedback(document.getElementById('panel-records'), 'سوابق آماده نشد؛ فایل‌های محتوا را بررسی کنید.', {tone:'error'}); }
  try { await initPractice(teaching.questions, teaching.curriculum, repository); }
  catch { setFeedback(document.querySelector('#panel-practice .empty-note') ?? document.getElementById('panel-practice'), 'تمرین بارگیری نشد؛ فایل محتوای تمرین را بررسی کنید.', { tone: 'error' }); }
  try { await initCompetition(teaching.questions, teaching.curriculum, repository); }
  catch { setFeedback(document.getElementById('panel-competition'), 'مسابقه آماده نشد؛ محتوای مسابقه را بررسی کنید.', { tone: 'error' }); }
  try { await initLab(teaching.questions, teaching.curriculum, repository); }
  catch { setFeedback(document.getElementById('panel-lab'), 'آزمایشگاه آماده نشد؛ فایل محتوای آن را بررسی کنید.', {tone:'error'}); }
} catch {
  const notice = document.getElementById('content-notice');
  notice.textContent = 'آموزش آماده نشد؛ فایل‌های بانک و محتوای آموزش را بررسی کنید. پیشرفت ذخیره‌شده تغییر نمی‌کند.';
  notice.hidden = false;
}
