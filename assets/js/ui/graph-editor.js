import { createVertexSelection } from './vertex-selection.js';
import { normalizeGraph } from '../domain/graph.js';

const SVG_NS = 'http://www.w3.org/2000/svg';
const RADIUS = 23;
function svgElement(tag, attributes = {}, text = '') {
  const element = document.createElementNS(SVG_NS, tag);
  for (const [name, value] of Object.entries(attributes)) element.setAttribute(name, value);
  if (text) element.textContent = text;
  return element;
}

export { colorIndex } from './vertex-selection.js';

/** Selection-only reusable board. Editing topology/dragging is a later scope. */
export function createGraphBoard(host, model, onToggle) {
  const graph = normalizeGraph(model.graph);
  if (!Array.isArray(model.places) || model.places.length !== graph.n
      || new Set(model.places.map(place => place.id)).size !== graph.n
      || model.places.some(place => !graph.vertices.includes(place.id)
        || typeof place.label !== 'string' || !Number.isFinite(place.x)
        || !Number.isFinite(place.y) || place.x < 40 || place.x > 560
        || place.y < 45 || place.y > 275)) throw new TypeError('چیدمان برد معتبر نیست.');
  const places = new Map(model.places.map(place => [place.id, place]));
  const svg = svgElement('svg', { viewBox: '0 0 600 330', role: 'group',
    'aria-label': model.boardLabel ?? 'مدل محله؛ مکان‌های موردنظر را انتخاب کنید.', class: 'graph-canvas' });

  const edgeViews = [];
  for (const [a, b] of graph.edges) {
    const line = svgElement('line', { class: 'board-edge' });
    svg.append(line); edgeViews.push({ line, a, b });
  }
  const selection = createVertexSelection(svg, graph, model.places, onToggle);
  const {views,buttons} = selection;
  const media = window.matchMedia('(max-width: 640px)');
  function layout() {
    const compact = media.matches;
    svg.setAttribute('viewBox', compact ? '0 0 340 330' : '0 0 600 330');
    const point = id => {
      const place = places.get(id);
      return compact ? { x: 40 + (place.x - 40) * 260 / 520, y: place.y } : place;
    };
    for (const { line, a, b } of edgeViews) {
      const from = point(a), to = point(b);
      const length = Math.hypot(to.x - from.x, to.y - from.y);
      // End edges at the opaque node boundary, leaving its outline clean.
      const inset = Math.min(RADIUS + 1, length / 2);
      const dx = length ? (to.x - from.x) / length * inset : 0;
      const dy = length ? (to.y - from.y) / length * inset : 0;
      for (const [key, value] of Object.entries({
        x1: from.x + dx, y1: from.y + dy, x2: to.x - dx, y2: to.y - dy,
      })) {
        line.setAttribute(key, value);
      }
    }
    for (const [id, { group }] of views) {
      const { x, y } = point(id);
      group.setAttribute('transform', `translate(${x},${y})`);
    }
  }
  media.addEventListener('change', layout);
  layout(); host.replaceChildren(svg, buttons);
  return {
    relayout: layout,
    destroy() { media.removeEventListener('change', layout); },
    update: selection.update,
  };
}

/** Position editing is opt-in; topology and selected IDs stay independent. */
export function createEditableGraphBoard(host,model,onToggle,onPositionsChange=()=>{}) {
  const board=createGraphBoard(host,model,onToggle),svg=host.querySelector('svg');
  let drag=null,suppressClick=false;
  const compact=()=>window.matchMedia('(max-width: 640px)').matches;
  const screenPoint=p=>({x:compact()?40+(p.x-40)/2:p.x,y:p.y});
  function move(id,x,y){
    x=Math.max(40,Math.min(560,x));y=Math.max(45,Math.min(275,y));
    const p=model.places.find(p=>p.id===id),proposed=screenPoint({x,y});
    if(model.places.some(other=>other.id!==id&&Math.hypot(screenPoint(other).x-proposed.x,other.y-y)<50))return;
    p.x=x;p.y=y;// Refresh geometry without rebuilding the graph.
    board.relayout();onPositionsChange(model.places);
  }
  const down=e=>{const g=e.target.closest('.board-vertex');if(!g)return;drag={id:g.dataset.vertexId,x:e.clientX,y:e.clientY,moved:false};g.setPointerCapture?.(e.pointerId);};
  const moving=e=>{if(!drag)return;if(Math.hypot(e.clientX-drag.x,e.clientY-drag.y)<5&&!drag.moved)return;drag.moved=true;const p=new DOMPoint(e.clientX,e.clientY).matrixTransform(svg.getScreenCTM().inverse());move(drag.id,compact()?40+(p.x-40)*2:p.x,p.y);};
  const up=()=>{if(drag?.moved)suppressClick=true;drag=null;};
  const click=e=>{if(suppressClick){e.preventDefault();e.stopPropagation();suppressClick=false;}};
  const key=e=>{const g=e.target.closest('.board-vertex');if(!g||!['ArrowLeft','ArrowRight','ArrowUp','ArrowDown'].includes(e.key))return;e.preventDefault();const p=model.places.find(p=>p.id===g.dataset.vertexId);move(p.id,p.x+({ArrowLeft:-20,ArrowRight:20}[e.key]??0),p.y+({ArrowUp:-15,ArrowDown:15}[e.key]??0));};
  svg.style.touchAction='none';svg.addEventListener('pointerdown',down);svg.addEventListener('pointermove',moving);svg.addEventListener('pointerup',up);svg.addEventListener('pointercancel',up);svg.addEventListener('click',click,true);svg.addEventListener('keydown',key);
  return {...board,moveVertex:(id,dx,dy)=>{const p=model.places.find(p=>p.id===id);if(p)move(id,p.x+dx,p.y+dy);},destroy(){board.destroy();for(const [event,handler,capture] of [['pointerdown',down],['pointermove',moving],['pointerup',up],['pointercancel',up],['click',click,true],['keydown',key]])svg.removeEventListener(event,handler,capture);}};
}
