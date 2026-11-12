/** Finite, presentation-only motion. Logical state is always committed before movement. */
const active = new Set(), finishers = new Set(), counters = new WeakMap();
const levels = ['off', 'low', 'medium', 'full'];
const fa = n => n.toLocaleString('fa-IR');
let preference = 'medium';
export const motionLevel = () => globalThis.document?.documentElement.dataset.motion ?? 'off';
export function motionDuration(token = '--motion-enter') {
  if (motionLevel() === 'off') return 0;
  return Math.max(0, parseFloat(getComputedStyle(document.documentElement).getPropertyValue(token)) || 0);
}
export function animateFinite(node, frames, token = '--motion-enter', options = {}) {
  const duration = motionDuration(token);
  if (!duration || !node?.animate || !node.isConnected) return null;
  const animation = node.animate(frames, { duration, easing: 'cubic-bezier(.2,.7,.2,1)', ...options });
  active.add(animation);
  animation.finished.catch(() => {}).finally(() => { active.delete(animation); animation.cancel(); });
  return animation;
}
export function animateNumber(node, value, from = 0) {
  counters.get(node)?.();
  node.setAttribute('aria-label', fa(value));
  node.setAttribute('aria-live', 'off');
  node.dataset.value = value;
  const duration = motionDuration('--motion-count');
  if (!duration || value <= from) { node.textContent = fa(value); return; }
  let start, frame;
  const finish = () => { cancelAnimationFrame(frame); node.textContent = fa(value); finishers.delete(finish); counters.delete(node); };
  finishers.add(finish); counters.set(node,finish);
  function tick(now) {
    if (!node.isConnected) { finish(); return; }
    start ??= now;
    const progress = Math.min(1, (now - start) / duration);
    node.textContent = fa(Math.round(from + (value - from) * (1 - (1 - progress) ** 3)));
    if (progress < 1) frame = requestAnimationFrame(tick); else finish();
  }
  node.textContent = fa(from); frame = requestAnimationFrame(tick);
}
export function createProgressRing(labelNode) {
  const ring = document.createElement('div'); ring.className = 'progress-ring';
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svg.setAttribute('viewBox', '0 0 100 100'); svg.setAttribute('aria-hidden', 'true');
  const track = document.createElementNS(svg.namespaceURI, 'circle');
  for (const [key, value] of Object.entries({cx:50,cy:50,r:42,pathLength:100,class:'ring-track'})) track.setAttribute(key,value);
  const fill = track.cloneNode(); fill.setAttribute('class','ring-fill'); fill.style.strokeDashoffset = '100';
  svg.append(track,fill); ring.append(svg,labelNode);
  let previous = 0;
  return { element:ring, update(value) {
    if (previous === value && ring.dataset.percent !== undefined) return;
    const old = previous; previous = value; ring.dataset.percent = value;
    fill.style.strokeDashoffset = String(100-value); labelNode.textContent = `${fa(value)}٪`;
    animateFinite(fill,[{strokeDashoffset:String(100-old)},{strokeDashoffset:String(100-value)}],'--motion-count');
  }};
}
export function initMotion(repository) {
  const inputs = [...document.querySelectorAll('input[name="motion-level"]')];
  const system = window.matchMedia('(prefers-reduced-motion: reduce)');
  const note = document.getElementById('motion-note');
  function apply() {
    for (const animation of active) animation.cancel(); active.clear();
    for (const finish of [...finishers]) finish();
    document.documentElement.dataset.motion = system.matches ? 'off' : preference;
    for (const input of inputs) input.checked = input.value === preference;
    note.textContent = system.matches ? 'کاهش حرکت سیستم فعال است؛ حرکت‌ها خاموش‌اند.' : '';
    note.hidden = !system.matches;
    document.dispatchEvent(new CustomEvent('motionchange'));
  }
  system.addEventListener('change', apply);
  for (const input of inputs) input.addEventListener('change', () => {
    if (!input.checked) return;
    preference = input.value; apply(); repository.setMotion(preference);
  });
  repository.subscribe(({state}) => {
    const next = levels.includes(state.settings.motion) ? state.settings.motion : 'medium';
    if (next !== preference || !document.documentElement.dataset.motion) { preference = next; apply(); }
  });
  apply();
}
export async function initLandings() {
  const response = await fetch(new URL('../../../content/motion.json', import.meta.url));
  if (!response.ok) return;
  const copy = await response.json();
  const ns = 'http://www.w3.org/2000/svg';
  const make = (tag, attrs) => { const n=document.createElementNS(ns,tag); for(const [k,v] of Object.entries(attrs))n.setAttribute(k,v); return n; };
  for (const [id, text] of Object.entries(copy)) {
    const panel = document.getElementById(`panel-${id}`), heading = panel?.querySelector('h1');
    if (!heading) continue;
    const landing = document.createElement('header'); landing.className = `tab-landing landing-${id}`;
    const words=document.createElement('div'), hint=document.createElement('p'); hint.className='landing-caption'; hint.textContent=text;
    heading.before(landing); words.append(heading,hint);
    const svg=make('svg',{viewBox:'0 0 150 68','aria-hidden':'true',class:'landing-art'});
    if(id==='teach'||id==='lab') {
      const graph=make('g',{class:'landing-network'});
      graph.append(make('path',{d:id==='teach'?'M16 48 Q42 6 75 34 T134 18':'M40 16 112 18 110 52 38 50 40 16 110 52 M38 50 112 18',class:'landing-path',pathLength:'1'}));
      for(const [cx,cy]of id==='teach'?[[16,48],[75,34],[134,18]]:[[40,16],[112,18],[110,52],[38,50]])graph.append(make('circle',{cx,cy,r:6,class:'landing-dot'}));
      svg.append(graph);
    } else if(id==='practice') {
      const card=make('g',{class:'landing-question'});card.append(make('rect',{x:46,y:8,width:60,height:52,rx:8}),make('path',{d:'M58 23h32M58 32h24M58 42h17'}));
      const q=make('text',{x:91,y:51});q.textContent='؟';card.append(q);svg.append(card);
    } else if(id==='records') {
      svg.append(make('path',{d:'M25 10v48h105',class:'chart-axis'}));
      [24,36,48].forEach((h,i)=>svg.append(make('rect',{x:42+i*27,y:57-h,width:14,height:h,rx:3,class:'landing-bar'})));
    } else {
      for(let i=0;i<3;i++)svg.append(make('circle',{cx:44+i*32,cy:22,r:9,class:'landing-dot'}));
      svg.append(make('path',{d:'M29 48q15-22 30 0M61 48q15-22 30 0M93 48q15-22 30 0',class:'landing-path'}));
      const count=make('text',{x:75,y:66,class:'landing-group-count'});count.textContent='۲–۱۰';svg.append(count);
    }
    const eyebrow=document.createElement('span');eyebrow.className='landing-eyebrow';eyebrow.textContent={teach:'تجربه ← تحلیل ← مفهوم ← مدل',practice:'بانک تمرین · ۱۲۶ سؤال',competition:'حل گروهی · فرصت برابر',lab:'کارگاه مدل · پنج ایستگاه و ۲۴ کاوش',records:'مسیر یادگیری · شش ساحت'}[id];words.prepend(eyebrow);
    const scene=document.createElement('div');scene.className='landing-scene';scene.append(svg);
    for(let i=0;i<3;i++){const orbit=document.createElement('span');orbit.className='scene-orbit';orbit.style.setProperty('--orbit-index',i);scene.append(orbit);}
    const caption=document.createElement('span');caption.className='scene-caption-label';caption.textContent={teach:'کشف رابطه‌ها',practice:'فکر کن؛ امتحان کن',competition:'با هم بهتر حل می‌کنیم',lab:'یک تغییر، یک کشف',records:'هر تجربه یک قدم'}[id];scene.append(caption);landing.append(words,scene);
  }
  function enter(id) {
    const landing=document.querySelector(`#panel-${id} .tab-landing`);
    if(!landing)return;
    landing.classList.remove('is-entering'); void landing.offsetWidth; landing.classList.add('is-entering');
    const count=landing.querySelector('.landing-group-count');if(count){animateNumber(count,10,2);count.setAttribute('aria-hidden','true');}
  }
  document.addEventListener('tabchange',e=>enter(e.detail.id));
  enter(location.hash.slice(1).split('/')[0]||'teach');
}
