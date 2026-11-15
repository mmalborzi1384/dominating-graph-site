import {paintGraph,attachGraphView} from './graph-surface.js';
import {canonicalPlaces,spaceLayout} from './graph-layout.js';
import { normalizeGraph } from '../domain/graph.js';

const SVG_NS = 'http://www.w3.org/2000/svg';
function svgElement(tag, attributes = {}, text = '') {
  const element = document.createElementNS(SVG_NS, tag);
  for (const [name, value] of Object.entries(attributes)) element.setAttribute(name, value);
  if (text) element.textContent = text;
  return element;
}

export { colorIndex } from './vertex-selection.js';

/** Domain-specific board adapter over the common graph surface. */
export function createGraphBoard(host, model, onToggle) {
  const graph = normalizeGraph(model.graph);
  if (!Array.isArray(model.places) || model.places.length !== graph.n
      || new Set(model.places.map(place => place.id)).size !== graph.n
      || model.places.some(place => !graph.vertices.includes(place.id)
        || typeof place.label !== 'string' || !Number.isFinite(place.x)
        || !Number.isFinite(place.y) || place.x < 40 || place.x > 560
        || place.y < 45 || place.y > 275)) throw new TypeError('چیدمان برد معتبر نیست.');
  if(!model.editable)model={...model,places:canonicalPlaces(graph,model.places)};
  const places = new Map(model.places.map(place => [place.id, place]));
  const svg = svgElement('svg', {viewBox:'0 0 600 330',role:'group','aria-label':model.boardLabel??'مدل گراف؛ انتخاب رأس‌ها',class:'graph-canvas'});
  const displayed=model.places.map(p=>({...p}));
  const selection=paintGraph(svg,graph,displayed,onToggle);
  const {buttons}=selection;
  const media = window.matchMedia('(max-width: 640px)');
  function layout() {
    const compact = media.matches;
    svg.setAttribute('viewBox', compact ? '0 0 340 330' : '0 0 600 330');
    const point = id => {
      const place = places.get(id);
      return compact ? { x: 40 + (place.x - 40) * 260 / 520, y: place.y } : place;
    };
    for(const p of displayed)Object.assign(p,point(p.id));
    const spaced=spaceLayout(displayed,compact?340:600,330);displayed.forEach((p,i)=>Object.assign(p,spaced.places[i]));
    svg.setAttribute('viewBox',`0 0 ${spaced.width} ${spaced.height}`);svg.style.minWidth=`${Math.ceil(spaced.width*.8)}px`;
    selection.layout();

  }
  media.addEventListener('change', layout);
  layout(); host.replaceChildren(svg, buttons);
  const view=attachGraphView(svg);
  return {
    relayout: layout,
    destroy() { media.removeEventListener('change', layout); view.destroy(); },
    update: selection.update,
  };
}

/** Position editing is opt-in; topology and selected IDs stay independent. */
export function createEditableGraphBoard(host,model,onToggle,onPositionsChange=()=>{}) {
  model.editable=true;
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
  const moving=e=>{if(!drag)return;if(Math.hypot(e.clientX-drag.x,e.clientY-drag.y)<5&&!drag.moved)return;drag.moved=true;const p=new DOMPoint(e.clientX,e.clientY).matrixTransform(svg.getScreenCTM().inverse());move(drag.id,compact()?40+(p.x/(svg.viewBox.baseVal.width/340)-40)*2:p.x/(svg.viewBox.baseVal.width/600),p.y/(svg.viewBox.baseVal.height/330));};
  const up=()=>{if(drag?.moved)suppressClick=true;drag=null;};
  const click=e=>{if(suppressClick){e.preventDefault();e.stopPropagation();suppressClick=false;}};
  const key=e=>{const g=e.target.closest('.board-vertex');if(!g||!['ArrowLeft','ArrowRight','ArrowUp','ArrowDown'].includes(e.key))return;e.preventDefault();const p=model.places.find(p=>p.id===g.dataset.vertexId);move(p.id,p.x+({ArrowLeft:-20,ArrowRight:20}[e.key]??0),p.y+({ArrowUp:-15,ArrowDown:15}[e.key]??0));};
  svg.graphMove=(id,x,y)=>move(id,compact()?40+(x/(svg.viewBox.baseVal.width/340)-40)*2:x/(svg.viewBox.baseVal.width/600),y/(svg.viewBox.baseVal.height/330));
  svg.style.touchAction='none';svg.addEventListener('pointerdown',down);svg.addEventListener('pointermove',moving);svg.addEventListener('pointerup',up);svg.addEventListener('pointercancel',up);svg.addEventListener('click',click,true);svg.addEventListener('keydown',key);
  return {...board,moveVertex:(id,dx,dy)=>{const p=model.places.find(p=>p.id===id);if(p)move(id,p.x+dx,p.y+dy);},destroy(){board.destroy();for(const [event,handler,capture] of [['pointerdown',down],['pointermove',moving],['pointerup',up],['pointercancel',up],['click',click,true],['keydown',key]])svg.removeEventListener(event,handler,capture);}};
}
