import { paintGraph, attachGraphView } from './graph-surface.js';
import { validateProgress, unlockedUnits } from '../domain/progress.js';

// The original landing map's places and roads. This is an introduction, not evidence
// for an APOS activity, a dominating-set exercise or a persistent learning result.
const places = [
  { id:'house', label:'خانه', x:70, y:170 },
  { id:'school', label:'مدرسه', x:160, y:65 },
  { id:'library', label:'کتابخانه', x:300, y:85 },
  { id:'park', label:'پارک', x:430, y:175 },
  { id:'clinic', label:'درمانگاه', x:290, y:260 },
];
const graph = {
  n:places.length, vertices:places.map(p => p.id),
  edges:[['house','school'],['school','library'],['library','park'],
    ['park','clinic'],['clinic','house'],['school','clinic'],
    ['house','library'],['library','clinic']],
};
const invitation = 'یک مکان را انتخاب کن تا همسایه‌های مستقیمش را ببینی.';

export function initNeighborhood() {
  const landing = document.querySelector('.site-landing');
  const host = document.getElementById('neighborhood-board');
  const status = document.getElementById('neighborhood-status');
  const reset = document.getElementById('neighborhood-reset');
  const heading = document.getElementById('hero-heading');
  const description = document.getElementById('hero-description');
  const link = document.getElementById('hero-learning-link');
  const note = document.getElementById('hero-resume-note');
  const svg = document.createElementNS('http://www.w3.org/2000/svg','svg');
  svg.setAttribute('viewBox','0 0 500 325');
  svg.setAttribute('class','graph-canvas neighborhood-graph');
  svg.setAttribute('role','group');
  svg.setAttribute('aria-label','محله؛ یک مکان را انتخاب کن تا ارتباط‌های مستقیمش را ببینی');
  let selected = null, unsubscribe = null, destroyed = false;
  const selection = paintGraph(svg, graph, places, id => {
    if (destroyed) return;
    selected = selected === id ? null : id;
    updateSelection();
  }, {coverage:false});
  const edges = [...svg.querySelectorAll('.board-edge')];
  function updateSelection() {
    selection.update(selected ? [selected] : []);
    // coverage=false still uses the shared paint/selection feedback; only this
    // adapter's names and explanation describe direct adjacency, never coverage.
    for (const [id, view] of selection.views) {
      const label = `${view.label}؛ ${selected === id ? 'انتخاب‌شده' : 'انتخاب‌نشده'}`;
      view.group.setAttribute('aria-label',label);
      view.button.setAttribute('aria-label',label);
    }
    edges.forEach((edge,i) => edge.classList.toggle('is-direct', graph.edges[i].includes(selected)));
    reset.disabled = selected === null;
    const place = places.find(p => p.id === selected);
    const neighbors = places.filter(p => graph.edges.some(e => e.includes(selected) && e.includes(p.id)) && p.id !== selected);
    status.textContent = place
      ? `${place.label} یک رأس است. همسایه‌های مستقیمش: ${neighbors.map(p => p.label).join('، ')}. هر راه پررنگ، یک یال متصل به ${place.label} است؛ مسیرهای چندراهی را اینجا نمی‌شماریم.`
      : invitation;
  }
  function clear() { selected = null; updateSelection(); }
  reset.addEventListener('click',clear);
  host.replaceChildren(svg,selection.buttons);
  const view = attachGraphView(svg,{title:'نقشه محله؛ مکان‌ها و راه‌های مستقیم'});
  updateSelection();

  function show(kind, title, text, label, destination, message) {
    landing.dataset.learning = kind;
    // Retain native link/focus and all graph state through repository notifications.
    heading.textContent = title;
    description.textContent = text;
    link.textContent = label;
    link.setAttribute('href',destination);
    note.textContent = message;
  }
  function unavailable() {
    if (destroyed) return;
    show('unavailable','رابطه‌ها را ببین. راه‌حل را بساز.',
      'از خیابان‌های یک محله تا شبکه‌های پیچیده؛ تجربه کن، الگو پیدا کن و به زبان ریاضی مدل بساز.',
      'رفتن به آموزش','#teach','محل ادامه قابل تایید نیست؛ وضعیت ذخیره را در آموزش یا سوابق بررسی کن.');
  }
  function connect(teaching, repository) {
    if (destroyed) return;
    unsubscribe?.();
    unsubscribe = repository.subscribe(snapshot => {
      if (destroyed) return;
      const {state, persisted, readStatus, dirty, conflict, needsMigration} = snapshot;
      if (!persisted || dirty || conflict || needsMigration || readStatus !== 'ready'
          || state.curriculumVersion !== 3) { unavailable(); return; }
      let progress;
      try { progress = validateProgress(state.teachingProgress, teaching.curriculum); }
      catch { unavailable(); return; }
      const unlocked = unlockedUnits(progress, teaching.curriculum);
      if (!unlocked.includes(progress.lastVisitedUnitId)) { unavailable(); return; }
      const complete = progress.passedUnitIds.length === teaching.curriculum.units.length;
      const returning = progress.completedActivityIds.length > 0
        || progress.lastVisitedUnitId !== teaching.curriculum.units[0].id;
      if (!returning) {
        show('fresh','رابطه‌ها را ببین. راه‌حل را بساز.',
          'از خیابان‌های یک محله تا شبکه‌های پیچیده؛ تجربه کن، الگو پیدا کن و به زبان ریاضی مدل بساز.',
          'شروع آموزش','#teach','نقشه محله یک تجربه آزاد است؛ پیشرفت آموزش را تغییر نمی‌دهد.');
        return;
      }
      const unit = teaching.curriculum.units.find(u => u.id === progress.lastVisitedUnitId);
      show(complete ? 'complete' : 'returning', complete ? 'مسیر را طی کردی؛ دوباره نگاه کن.' : 'از همان واحد ادامه بده.',
        complete ? 'می‌توانی واحدهای مسیر را مرور کنی و رابطه‌ها را با نگاه تازه بررسی کنی.'
          : `واحد ذخیره‌شده: ${unit.title}. برای ادامه مسیر به آموزش برگرد.`,
        complete ? 'مرور آموزش' : 'ادامه آموزش',`#teach/${encodeURIComponent(unit.id)}`,
        'محل واحد ذخیره شده است؛ پاسخ‌های موقت فعالیت با تازه‌سازی برنمی‌گردند.');
    });
  }
  landing.dataset.learning = 'loading';
  return {connect, unavailable, destroy() {
    destroyed = true; unsubscribe?.(); reset.removeEventListener('click',clear);
    view.destroy(); host.replaceChildren();
  }};
}
