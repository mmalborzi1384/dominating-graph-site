import {paintGraph,attachGraphView} from './graph-surface.js';
import {canonicalPlaces,spaceLayout} from './graph-layout.js';
import { evidenceGraph } from '../domain/teaching-evidence.js';
const NS = 'http://www.w3.org/2000/svg';
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

  const svg = svgEl('svg', { role: 'group', 'aria-label': 'مدل فعالیت؛ رأس‌ها با لمس یا دکمه‌های زیر شکل انتخاب می‌شوند.', class: 'graph-canvas teaching-graph' });
  let selection;
  function layout(){
    layoutPlaces();
    const width=media.matches?340:600,height=media.matches?370:340;
    const canonical=canonicalPlaces(graph,places,{width,height,alternate});
    places.forEach((p,i)=>Object.assign(p,canonical[i]));
    const spaced=spaceLayout(places,width,height);places.forEach((p,i)=>Object.assign(p,spaced.places[i]));
    svg.setAttribute('viewBox',`0 0 ${spaced.width} ${spaced.height}`);svg.style.minWidth=`${Math.ceil(spaced.width*.8)}px`;
    if(!selection){selection=paintGraph(svg,graph,places,onToggle,{numberFor:id=>id,coverage});for(const view of selection.views.values())view.group.querySelector('.vertex-label')?.remove();}
    else selection.layout();
  }
  layout();
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
  const view=attachGraphView(svg);
  update([]);
  return {update,destroy(){media.removeEventListener('change',layout);view.destroy();host.replaceChildren();}};
}
