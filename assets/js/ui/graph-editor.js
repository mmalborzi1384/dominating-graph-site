import { normalizeGraph } from '../domain/graph.js';

const SVG_NS = 'http://www.w3.org/2000/svg';
const RADIUS = 23;
let boardCount = 0;
function svgElement(tag, attributes = {}, text = '') {
  const element = document.createElementNS(SVG_NS, tag);
  for (const [name, value] of Object.entries(attributes)) element.setAttribute(name, value);
  if (text) element.textContent = text;
  return element;
}

/** Stable zero-based source vertex order, independent of selection, layout and theme. */
export function colorIndex(vertexIndex) {
  if (!Number.isInteger(vertexIndex) || vertexIndex < 0) throw new TypeError('اندیس رأس نامعتبر است.');
  return vertexIndex % 10;
}

/** Counter-clockwise equal sector in local coordinates; >=2 owners only. */
function wedgePath(index, count) {
  const start = -Math.PI / 2 + index * 2 * Math.PI / count;
  const end = start + 2 * Math.PI / count;
  const point = angle => `${RADIUS * Math.cos(angle)},${RADIUS * Math.sin(angle)}`;
  return `M0,0 L${point(start)} A${RADIUS},${RADIUS} 0 0,1 ${point(end)} Z`;
}

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
  const vertexIndex = new Map(graph.vertices.map((id, index) => [id, index]));
  const neighbors = new Map(graph.vertices.map(id => [id, new Set([id])]));
  for (const [a, b] of graph.edges) { neighbors.get(a).add(b); neighbors.get(b).add(a); }
  const prefix = `board-${++boardCount}`;
  const svg = svgElement('svg', { viewBox: '0 0 600 330', role: 'group',
    'aria-label': 'نقشهٔ محله؛ با انتخاب مکان، کتابخانهٔ سیار قرار دهید.', class: 'graph-canvas' });
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
  const edgeViews = [];
  for (const [a, b] of graph.edges) {
    const line = svgElement('line', { class: 'board-edge' });
    svg.append(line); edgeViews.push({ line, a, b });
  }
  const buttons = document.createElement('div');
  buttons.className = 'vertex-buttons';
  buttons.setAttribute('role', 'group');
  buttons.setAttribute('aria-label', 'انتخاب مکان‌ها؛ جایگزین لمس رأس روی نقشه');
  const views = new Map();
  for (const place of model.places) {
    const index = vertexIndex.get(place.id), color = colorIndex(index);
    const group = svgElement('g', { class: 'board-vertex', role: 'button', tabindex: 0,
      'aria-pressed': 'false', 'data-vertex-id': place.id, 'data-color-index': color });
    group.style.setProperty('--vertex-color', `var(--bead-${color})`);
    // Large transparent hit area preserves touch selection around the 23px visible bead.
    group.append(svgElement('circle', { r: 29, fill: 'transparent', 'aria-hidden': 'true' }));
    group.append(svgElement('circle', { r: RADIUS, class: 'vertex-base' }));
    const coverage = svgElement('g', { class: 'vertex-coverage', 'aria-hidden': 'true' });
    group.append(coverage);
    group.append(svgElement('circle', { r: RADIUS, class: 'vertex-outline' }));
    group.append(svgElement('text', { y: 8, class: 'vertex-number', 'aria-hidden': 'true' },
      (index + 1).toLocaleString('fa-IR')));
    const label = svgElement('text', { x: 0, y: place.y < 150 ? -42 : 46,
      class: 'vertex-label', direction: 'rtl', 'aria-hidden': 'true' }, place.label);
    group.append(label);
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
    svg.append(group); buttons.append(button);
    views.set(place.id, { group, coverage, button, label: place.label });
  }
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
    update(selected, { missed = [], hinted = [] } = {}) {
      const selectedIds = new Set(selected), missedIds = new Set(missed), hintIds = new Set(hinted);
      // Owner order is canonical vertex order, not click order.
      for (const [id, view] of views) {
        const owners = graph.vertices.filter(owner => selectedIds.has(owner) && neighbors.get(id).has(owner));
        const chosen = selectedIds.has(id), covered = owners.length > 0;
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
        view.group.setAttribute('aria-label', `${view.label}؛ ${chosen ? 'ایستگاه انتخاب‌شده' : covered ? `تحت پوشش ${ownerText}` : missedIds.has(id) ? 'جاافتاده؛ بی‌پوشش' : 'بی‌پوشش'}`);
        view.button.setAttribute('aria-pressed', String(chosen));
        view.button.setAttribute('aria-label', view.group.getAttribute('aria-label'));
      }
    },
  };
}
