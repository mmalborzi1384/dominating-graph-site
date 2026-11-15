import { createVertexSelection } from './vertex-selection.js';
import { evidenceGraph } from '../domain/teaching-evidence.js';
const NS = 'http://www.w3.org/2000/svg';
let serial = 0;
function svgEl(tag, attrs = {}) {
  const node = document.createElementNS(NS, tag);
  for (const [key, value] of Object.entries(attrs)) node.setAttribute(key, value);
  return node;
}
/** Lesson-one graphs retain arrows, parallel edges and loops. Paint and keyboard
 * controls use the same vertex engine as the other four tabs. */
export function createTeachingBoard(host, graph, onToggle = () => {}, { coverage = false, alternate = false } = {}) {
  evidenceGraph(graph);
  const media = matchMedia('(max-width:640px)');
  const places = graph.vertices.map(id => ({ id, label: id, x: 0, y: 0 }));
  const layoutPlaces = () => places.forEach((place, index) => {
    const width = media.matches ? 340 : 600, height = media.matches ? 370 : 340;
    const angle = -Math.PI / 2 + (alternate ? -1 : 1) * index * 2 * Math.PI / graph.vertices.length;
    place.x = width / 2 + (width / 2 - 55) * Math.cos(angle);
    place.y = height / 2 + (height / 2 - 60) * Math.sin(angle);
  });
  layoutPlaces();
  const points = new Map(places.map(p => [p.id, p]));
  const svg = svgEl('svg', { role: 'group', 'aria-label': 'مدل فعالیت؛ رأس‌ها با لمس یا دکمه‌های زیر شکل انتخاب می‌شوند.', class: 'graph-canvas teaching-graph' });
  const arrowId = `teaching-arrow-${++serial}`;
  const defs = svgEl('defs'), marker = svgEl('marker', { id: arrowId, viewBox: '0 0 10 10', refX: 9, refY: 5, markerWidth: 7, markerHeight: 7, orient: 'auto-start-reverse' });
  marker.append(svgEl('path', { d: 'M0 0 L10 5 L0 10 Z', fill: 'var(--graph-line)' })); defs.append(marker); svg.append(defs);
  const grouped = new Map();
  for (const edge of graph.edges) {
    const key = JSON.stringify([...edge].sort());
    if (!grouped.has(key)) grouped.set(key, []);
    grouped.get(key).push(edge);
  }
  const edgeViews = [];
  for (const edges of grouped.values()) edges.forEach(([a,b], index) => {
    const line=svgEl('path',{class:'board-edge','fill':'none'});
    if(graph.directed)line.setAttribute('marker-end',`url(#${arrowId})`);
    svg.append(line);edgeViews.push({a,b,index,count:edges.length,line});
  });
  const selection=createVertexSelection(svg,graph,places,onToggle,{numberFor:id=>id,coverage});
  for(const view of selection.views.values())view.group.querySelector('.vertex-label')?.remove();
  function layout() {
    layoutPlaces();
    svg.setAttribute('viewBox',media.matches?'0 0 340 370':'0 0 600 340');
    for(const {a,b,index,count,line} of edgeViews){
    const p = points.get(a), q = points.get(b);
    let d;
    if (a === b) d = `M${p.x-15},${p.y-18} C${p.x-65},${p.y-75} ${p.x+65},${p.y-75} ${p.x+15},${p.y-18}`;
    else {
      const length = Math.hypot(q.x-p.x,q.y-p.y), ux=(q.x-p.x)/length, uy=(q.y-p.y)/length;
      const canonical = a.localeCompare(b) < 0 ? 1 : -1;
      const offset = (index-(count-1)/2)*48*canonical;
      const cx=(p.x+q.x)/2-uy*offset, cy=(p.y+q.y)/2+ux*offset;
      const fromLength=Math.hypot(cx-p.x,cy-p.y), toLength=Math.hypot(q.x-cx,q.y-cy);
      const x1=p.x+(cx-p.x)/fromLength*25,y1=p.y+(cy-p.y)/fromLength*25;
      const x2=q.x-(q.x-cx)/toLength*27,y2=q.y-(q.y-cy)/toLength*27;
      d=`M${x1},${y1} Q${cx},${cy} ${x2},${y2}`;
    }
      line.setAttribute('d',d);
    }
    for(const p of places)selection.views.get(p.id).group.setAttribute('transform',`translate(${p.x},${p.y})`);
  }
  function update(selected,options) {
    selection.update(selected,options);
    // A drawing/prediction selector has no coverage result to announce.
    if(!coverage)for(const[id,view]of selection.views){
      const label=`${id}؛ ${selected.includes(id)?'انتخاب‌شده':'انتخاب‌نشده'}`;
      view.group.setAttribute('aria-label',label);view.button.setAttribute('aria-label',label);
    }
  }
  media.addEventListener('change',layout);layout();
  host.replaceChildren(svg,selection.buttons);
  update([]);
  return {update,destroy(){media.removeEventListener('change',layout);host.replaceChildren();}};
}
