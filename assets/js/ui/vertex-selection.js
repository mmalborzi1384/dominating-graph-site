/** Shared vertex paint/selection/coverage for every graph surface; no evaluation limits here. */
const SVG_NS = 'http://www.w3.org/2000/svg';
const RADIUS = 23;
let sequence = 0;
function svgElement(tag, attributes = {}, text = '') {
 const element=document.createElementNS(SVG_NS,tag);
 for(const [name,value]of Object.entries(attributes))element.setAttribute(name,value);
 if(text)element.textContent=text;return element;
}
export function colorIndex(index) { if(!Number.isInteger(index)||index<0)throw new TypeError('اندیس رأس نامعتبر است.');return index%10; }
function wedgePath(index,count){const start=-Math.PI/2+index*2*Math.PI/count,end=start+2*Math.PI/count;const point=a=>`${RADIUS*Math.cos(a)},${RADIUS*Math.sin(a)}`;return `M0,0 L${point(start)} A${RADIUS},${RADIUS} 0 0,1 ${point(end)} Z`;}
export function createVertexSelection(svg,graph,placeList,onToggle,{numberFor=(id,index)=>(index+1).toLocaleString('fa-IR'),coverage=true}={}) {
 const places=new Map(placeList.map(p=>[p.id,p]));
 const vertexIndex=new Map(graph.vertices.map((id,index)=>[id,index]));
 const neighbors=new Map(graph.vertices.map(id=>[id,new Set([id])]));
 if(coverage)for(const [a,b]of graph.edges){neighbors.get(a).add(b);neighbors.get(b).add(a);}
 const prefix=`selection-${++sequence}`;
  const defs = svgElement('defs');
  for (let color = 0; color < 10; color++) {
    const pattern = svgElement('pattern', { id: `${prefix}-hatch-${color}`, width: 7, height: 7,
      patternUnits: 'userSpaceOnUse' });
    pattern.append(svgElement('rect', { width: 7, height: 7, fill: 'var(--sheet)' }));
    pattern.append(svgElement('path', { d: 'M-1,1 L1,-1 M0,7 L7,0 M6,8 L8,6',
      stroke: `var(--hatch-${color})`, 'stroke-width': 2.2, fill: 'none' }));
    defs.append(pattern);
  }
  svg.append(defs);
  const buttons = document.createElement('div');
  buttons.className = 'vertex-buttons';
  buttons.setAttribute('role', 'group');
  buttons.setAttribute('aria-label', 'انتخاب مکان‌ها؛ جایگزین لمس رأس روی نقشه');
  const views = new Map();
  for (const place of places.values()) {
    const index = vertexIndex.get(place.id), color = colorIndex(index);
    const group = svgElement('g', { class: 'board-vertex', role: 'button', tabindex: 0,
      'aria-pressed': 'false', 'data-vertex-id': place.id, 'data-color-index': color });
    group.style.setProperty('--vertex-color', `var(--bead-${color})`);
    const paint = svgElement('g', {class:'vertex-paint'});
    paint.style.setProperty('--vertex-order',index);
    // Large transparent hit area preserves touch selection around the 23px visible bead.
    group.append(svgElement('circle', { r: 29, fill: 'transparent', 'aria-hidden': 'true' }));
    paint.append(svgElement('circle', { r: RADIUS, class: 'vertex-base' }));
    const coverage = svgElement('g', { class: 'vertex-coverage', 'aria-hidden': 'true' });
    paint.append(coverage);
    paint.append(svgElement('circle', { r: RADIUS, class: 'vertex-outline' }));
    paint.append(svgElement('text', { x: 0, y: 0, 'dominant-baseline': 'central', 'text-anchor': 'middle', direction: 'ltr', class: 'vertex-number', 'aria-hidden': 'true' },
      numberFor(place.id, index)));
    const label = svgElement('text', { x: 0, y: place.y < 150 ? -42 : 46,
      class: 'vertex-label', direction: 'rtl', 'aria-hidden': 'true' }, place.label);
    paint.append(label);
    const button = document.createElement('button');
    button.type = 'button'; button.dataset.vertexId = place.id;
    button.className = 'vertex-choice'; button.textContent = place.label;
    button.style.setProperty('--vertex-color', `var(--bead-${color})`);
    const toggle = () => onToggle(place.id);
    group.addEventListener('click', toggle);
    group.addEventListener('keydown', event => {
      if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); toggle(); }
    });
    button.addEventListener('click', toggle);
    group.append(paint); svg.append(group); buttons.append(button);
    views.set(place.id, { group, coverage, button, label: place.label });
  }

  function update(selected, { missed = [], hinted = [] } = {}) {
      const selectedIds = new Set(selected), missedIds = new Set(missed), hintIds = new Set(hinted);
      // Owner order is canonical vertex order, not click order.
      for (const [id, view] of views) {
        const owners = graph.vertices.filter(owner => selectedIds.has(owner) && neighbors.get(id).has(owner));
        const chosen = selectedIds.has(id), covered = owners.length > 0;
        const ownership = (chosen ? 'selected:' : '') + owners.join(',');
        const changed = view.coverage.dataset.ownership !== ownership;
        view.coverage.dataset.ownership = ownership;
        view.coverage.classList.remove('coverage-changed');
        if (changed && owners.length) { void view.coverage.getBoundingClientRect(); view.coverage.classList.add('coverage-changed'); }
        view.coverage.replaceChildren();
        if (!chosen) {
          owners.forEach((owner, index) => {
            const color = colorIndex(vertexIndex.get(owner));
            const shape = owners.length === 1 ? svgElement('circle', { r: RADIUS })
              : svgElement('path', { d: wedgePath(index, owners.length), 'data-sector-index': index });
            shape.setAttribute('fill', `url(#${prefix}-hatch-${color})`);
            shape.dataset.ownerId = owner;
            view.coverage.append(shape);
          });
        }
        view.group.dataset.ownerIds = owners.join(',');
        view.group.classList.toggle('is-selected', chosen);
        view.group.classList.toggle('is-covered', covered);
        view.group.classList.toggle('is-missed', !covered && missedIds.has(id));
        view.group.classList.toggle('is-hinted', !covered && hintIds.has(id));
        view.group.setAttribute('aria-pressed', String(chosen));
        const ownerText = owners.map(owner => places.get(owner).label).join('، ');
        view.group.setAttribute('aria-label', `${view.label}؛ ${chosen ? 'انتخاب‌شده' : covered ? `تحت پوشش ${ownerText}` : missedIds.has(id) ? 'جاافتاده؛ بی‌پوشش' : 'بی‌پوشش'}`);
        view.button.setAttribute('aria-pressed', String(chosen));
        view.button.setAttribute('aria-label', view.group.getAttribute('aria-label'));
      }
    }
 return {views,buttons,update};
}
