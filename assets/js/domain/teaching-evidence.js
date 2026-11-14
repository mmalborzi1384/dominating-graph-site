import { normalizeGraph, selectionMask } from './graph.js';
import { evaluateSelection } from './evaluate.js';

const text = value => typeof value === 'string' && value.trim().length > 0;
const unique = list => Array.isArray(list) && new Set(list).size === list.length;
const equalSet = (a, b) => unique(a) && a.length === b.length && a.every(id => b.includes(id));
const object = value => value && typeof value === 'object' && !Array.isArray(value);
const exactKeys = (value, keys) => object(value) && equalSet(Object.keys(value), keys);
const demand = (ok, message) => { if (!ok) throw new TypeError(message); };
export const EVIDENCE_TYPES = Object.freeze(['relation', 'model', 'neighborhood', 'coverageTable', 'deletionTable',
  'prediction', 'classification', 'counterexample', 'minimumArgument', 'dominatingSet', 'minimumFamily', 'route', 'number', 'choice', 'reflection']);
const properties = ['directed', 'parallel', 'loops', 'regular', 'complete', 'dominating', 'minimal', 'minimum'];
const claims = ['minimal-implies-minimum', 'regular-implies-complete', 'reachable-implies-adjacent'];
const lowerMethods = ['capacity', 'packing', 'subset-witnesses'];

/** Preserve direction, loops and multiplicity in lesson-one evidence. Never silently simplify. */
export function evidenceGraph(graph) {
  demand(object(graph) && unique(graph.vertices) && graph.vertices.length >= 2 && graph.vertices.length <= 16
    && graph.vertices.every(text) && Array.isArray(graph.edges)
    && typeof graph.directed === 'boolean' && typeof graph.multigraph === 'boolean'
    && (graph.n === undefined || graph.n === graph.vertices.length), 'مدل شواهد معتبر نیست.');
  const keys = [];
  for (const edge of graph.edges) {
    demand(Array.isArray(edge) && edge.length === 2 && edge.every(id => graph.vertices.includes(id)), 'دو سر رابطه معتبر نیست.');
    keys.push(JSON.stringify(graph.directed ? edge : [...edge].sort()));
  }
  demand(graph.multigraph || new Set(keys).size === keys.length, 'رابطهٔ موازی باید در قرارداد مدل مشخص باشد.');
  return graph;
}
const simple = graph => normalizeGraph(graph);
const closed = (graph, id) => [id, ...graph.vertices.filter(v => v !== id && graph.edges.some(e => e.includes(id) && e.includes(v)))];
const selected = (graph, ids) => { selectionMask(graph, ids); return ids; };
const edgeKeys = graph => graph.edges.map(edge => JSON.stringify(graph.directed ? edge : [...edge].sort())).sort();
const sameGraph = (a, b) => equalSet(a.vertices, b.vertices) && a.directed === b.directed
  && a.multigraph === b.multigraph && JSON.stringify(edgeKeys(a)) === JSON.stringify(edgeKeys(b));
function hasProperty(graph, property, centers) {
  evidenceGraph(graph);
  if (property === 'directed') return graph.directed;
  if (property === 'parallel') return new Set(edgeKeys(graph)).size !== graph.edges.length;
  if (property === 'loops') return graph.edges.some(([a, b]) => a === b);
  const g = simple(graph);
  if (['dominating', 'minimal', 'minimum'].includes(property)) {
    const result = evaluateSelection(g, centers, property);
    return result.satisfiesTarget;
  }
  const degrees = g.vertices.map(v => g.edges.filter(e => e.includes(v)).length);
  return property === 'regular' ? degrees.every(n => n === degrees[0])
    : property === 'complete' && g.edges.length === g.n * (g.n - 1) / 2;
}
export function validateEvidencePart(part, graph) {
  demand(object(part) && text(part.id) && text(part.label) && EVIDENCE_TYPES.includes(part.type), 'جزء شواهد معتبر نیست.');
  const required = ['id', 'label', 'type'];
  const add = (...keys) => required.push(...keys);
  if (['relation', 'model'].includes(part.type)) { add('expected'); evidenceGraph(part.expected); }
  if (['neighborhood', 'coverageTable', 'deletionTable', 'minimumArgument', 'dominatingSet', 'minimumFamily', 'route'].includes(part.type)) demand(graph, 'گراف شواهد لازم است.');
  if (part.type === 'dominatingSet') simple(graph);
  if (part.type === 'minimumFamily') {
    add('count', 'lowerBoundMethods'); simple(graph);
    demand(Number.isSafeInteger(part.count) && part.count >= 2 && part.count <= 6
      && unique(part.lowerBoundMethods) && part.lowerBoundMethods.length > 0
      && part.lowerBoundMethods.every(m => lowerMethods.includes(m)), 'خانوادهٔ کمینه‌ها معتبر نیست.');
  }
  if (part.type === 'neighborhood') {
    add('vertexId', 'closed'); simple(graph);
    demand(graph.vertices.includes(part.vertexId) && typeof part.closed === 'boolean', 'قرارداد همسایگی معتبر نیست.');
  }
  if (['coverageTable', 'deletionTable'].includes(part.type)) { add('selected'); selected(simple(graph), part.selected); }
  if (part.type === 'prediction') {
    add('part'); validateEvidencePart(part.part, graph);
    demand(!['prediction', 'reflection'].includes(part.part.type), 'پیش‌بینی باید شاهد ساخت‌یافته داشته باشد.');
  }
  if (part.type === 'classification') {
    add('property'); demand(properties.includes(part.property), 'ویژگی ناشناخته است.');
    if (['dominating', 'minimal', 'minimum'].includes(part.property)) add('selected');
    hasProperty(graph, part.property, part.selected);
  }
  if (part.type === 'counterexample') { add('claim'); demand(claims.includes(part.claim), 'گزارهٔ شاهد نقض ناشناخته است.'); }
  if (part.type === 'minimumArgument') {
    add('lowerBoundMethods'); simple(graph);
    demand(unique(part.lowerBoundMethods) && part.lowerBoundMethods.length
      && part.lowerBoundMethods.every(m => lowerMethods.includes(m)), 'روش کران پایین معتبر نیست.');
  }
  if (part.type === 'route') {
    add('start', 'end'); evidenceGraph(graph);
    demand(graph.vertices.includes(part.start) && graph.vertices.includes(part.end) && part.start !== part.end, 'دو سر مسیر معتبر نیست.');
  }
  if (part.type === 'number') { add('expected'); demand(Number.isSafeInteger(part.expected), 'عدد مرجع معتبر نیست.'); }
  if (part.type === 'choice') {
    add('options', 'expected'); demand(Array.isArray(part.options) && part.options.length > 1
      && unique(part.options.map(o => o.value)) && part.options.every(o => text(o.value) && text(o.label))
      && part.options.some(o => o.value === part.expected), 'گزینه یا پاسخ مرجع معتبر نیست.');
  }
  if (part.type === 'reflection') {
    add('criteria'); demand(unique(part.criteria?.map(c => c.id)) && part.criteria.length > 0
      && part.criteria.every(c => text(c.id) && text(c.label)), 'معیارهای خودبازبینی لازم‌اند.');
  }
  demand(exactKeys(part, required), 'فیلد ناشناخته یا غایب در قرارداد شواهد.');
  return part;
}
function coverageCorrect(graph, centers, rows) {
  return exactKeys(rows, graph.vertices) && graph.vertices.every(v => {
    const witness = rows[v];
    return witness === null ? !centers.some(id => closed(graph, id).includes(v))
      : centers.includes(witness) && closed(graph, witness).includes(v);
  });
}
function deletionCorrect(graph, centers, rows) {
  return exactKeys(rows, centers) && centers.every(id => equalSet(rows[id],
    evaluateSelection(graph, centers.filter(v => v !== id), 'dominating').uncoveredVertexIds));
}
function subsets(vertices, size) {
  const rows = [];
  const visit = (start, row) => {
    if (row.length === size) { rows.push(row); return; }
    for (let i = start; i < vertices.length; i++) visit(i + 1, [...row, vertices[i]]);
  };
  visit(0, []); return rows;
}
function minimumCorrect(graph, value, methods) {
  if (!exactKeys(value, ['upperWitness', 'lowerBound']) || !evaluateSelection(graph, value.upperWitness, 'dominating').dominates) return false;
  const k = value.upperWitness.length, lower = value.lowerBound;
  if (!object(lower) || !methods.includes(lower.method)) return false;
  if (lower.method === 'capacity') {
    const max = Math.max(...graph.vertices.map(v => closed(graph, v).length));
    return exactKeys(lower, ['method', 'maxClosedSize', 'vertexCount', 'bound'])
      && lower.maxClosedSize === max && lower.vertexCount === graph.n && lower.bound === k && Math.ceil(graph.n / max) === k;
  }
  if (lower.method === 'packing') {
    return exactKeys(lower, ['method', 'vertices']) && unique(lower.vertices) && lower.vertices.length === k
      && lower.vertices.every(v => graph.vertices.includes(v))
      && lower.vertices.every((a, i) => lower.vertices.slice(i + 1).every(b => !graph.vertices.some(v => closed(graph, v).includes(a) && closed(graph, v).includes(b))));
  }
  if (!exactKeys(lower, ['method', 'rows']) || !Array.isArray(lower.rows)) return false;
  const required = subsets(graph.vertices, k - 1);
  if (lower.rows.length !== required.length) return false;
  const keys = new Set();
  return lower.rows.every(row => {
    if (!exactKeys(row, ['selected', 'uncoveredWitness']) || !unique(row.selected)
        || !required.some(set => equalSet(row.selected, set))) return false;
    const key = JSON.stringify([...row.selected].sort());
    if (keys.has(key)) return false;
    keys.add(key);
    return evaluateSelection(graph, row.selected, 'dominating').uncoveredVertexIds.includes(row.uncoveredWitness);
  });
}
function counterexampleCorrect(claim, value) {
  const graph = simple(value.graph);
  if (claim === 'minimal-implies-minimum') {
    if (!exactKeys(value, ['graph', 'selected', 'smallerWitness'])) return false;
    const result = evaluateSelection(graph, value.selected, 'minimal');
    return result.minimal && value.smallerWitness.length < value.selected.length
      && evaluateSelection(graph, value.smallerWitness, 'dominating').dominates;
  }
  if (claim === 'regular-implies-complete') return exactKeys(value, ['graph']) && hasProperty(value.graph, 'regular') && !hasProperty(value.graph, 'complete');
  return exactKeys(value, ['graph', 'route']) && routeCorrect(graph, value.route, value.route?.[0], value.route?.at(-1))
    && value.route.length > 2 && !graph.edges.some(e => e.includes(value.route[0]) && e.includes(value.route.at(-1)));
}
function routeCorrect(graph, route, start, end) {
  return unique(route) && route.length >= 2 && route[0] === start && route.at(-1) === end
    && route.every(v => graph.vertices.includes(v)) && route.slice(1).every((v, i) => graph.edges.some(([a, b]) =>
      graph.directed ? a === route[i] && b === v : a === route[i] && b === v || a === v && b === route[i]));
}
/** Invalid learner evidence is incorrect, never a partial pass or a persistent record. */
export function assessEvidencePart(part, graph, value) {
  validateEvidencePart(part, graph);
  try {
    switch (part.type) {
      case 'relation': case 'model': return sameGraph(evidenceGraph(value), part.expected);
      case 'neighborhood': return equalSet(value, part.closed ? closed(graph, part.vertexId) : closed(graph, part.vertexId).filter(v => v !== part.vertexId));
      case 'coverageTable': return coverageCorrect(graph, part.selected, value);
      case 'deletionTable': return deletionCorrect(graph, part.selected, value);
      case 'prediction': return exactKeys(value, ['beforeReveal', 'revised', 'committedBeforeReveal']) && value.committedBeforeReveal === true
        && validPredictionDraft(part.part, graph, value.beforeReveal) && assessEvidencePart(part.part, graph, value.revised);
      case 'classification': return typeof value === 'boolean' && value === hasProperty(graph, part.property, part.selected);
      case 'counterexample': return counterexampleCorrect(part.claim, value);
      case 'minimumArgument': return minimumCorrect(simple(graph), value, part.lowerBoundMethods);
      case 'dominatingSet': return exactKeys(value, ['selected', 'rows'])
        && evaluateSelection(simple(graph), value.selected, 'dominating').dominates
        && coverageCorrect(graph, value.selected, value.rows);
      case 'minimumFamily': return Array.isArray(value) && value.length === part.count
        && new Set(value.map(proof => JSON.stringify([...proof.upperWitness].sort()))).size === part.count
        && value.every(proof => minimumCorrect(simple(graph), proof, part.lowerBoundMethods));
      case 'route': return routeCorrect(graph, value, part.start, part.end);
      case 'number': return Number.isSafeInteger(value) && value === part.expected;
      case 'choice': return value === part.expected;
      case 'reflection': return exactKeys(value, part.criteria.map(c => c.id)) && part.criteria.every(c => value[c.id] === true);
      default: return false;
    }
  } catch { return false; }
}
export function assessTeachingEvidence(activity, answers) {
  const issues = activity.parts.filter(part => !assessEvidencePart(part, activity.graph, answers?.[part.id]))
    .map(part => ({ partId: part.id, message: `شاهد «${part.label}» را با معیار همین بخش دوباره بررسی کن.` }));
  return { correct: issues.length === 0, issues, assessment: 'structured-check-and-criterion-self-review' };
}

function validPredictionDraft(part, graph, value) {
  switch (part.type) {
    case 'number': return Number.isSafeInteger(value);
    case 'choice': return part.options.some(option => option.value === value);
    case 'classification': return typeof value === 'boolean';
    case 'neighborhood': case 'route': return unique(value) && value.every(v => graph.vertices.includes(v));
    case 'coverageTable': return exactKeys(value, graph.vertices) && Object.values(value).every(v => v === null || part.selected.includes(v));
    case 'deletionTable': return exactKeys(value, part.selected) && Object.values(value).every(row => unique(row) && row.every(v => graph.vertices.includes(v)));
    case 'relation': case 'model': try { evidenceGraph(value); return true; } catch { return false; }
    default: return object(value) && Object.keys(value).length > 0;
  }
}
/** Controller uses this before revealing the tool; revised evidence may change, the initial draft stays in RAM. */
export function commitTeachingPrediction(part, graph, draft) {
  validateEvidencePart(part, graph);
  demand(part.type === 'prediction' && validPredictionDraft(part.part, graph, draft), 'پیش از آزمایش، پیش‌بینی ساخت‌یافته را ثبت کن.');
  return { beforeReveal: structuredClone(draft), revised: structuredClone(draft), committedBeforeReveal: true };
}
