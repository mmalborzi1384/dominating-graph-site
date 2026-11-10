// Dependency-free mathematical cross-check; run with: node scripts/validate-graph.mjs
import { readFile } from 'node:fs/promises';
import { analyzeGraph, evaluateSelection } from '../assets/js/domain/evaluate.js';
import { normalizeGraph } from '../assets/js/domain/graph.js';
import { scoreSelection } from '../assets/js/domain/scoring.js';

function expect(condition, message) { if (!condition) throw new Error(message); }
function subsets(vertices) {
  return vertices.reduce((sets, vertex) => [...sets, ...sets.map(set => [...set, vertex])], [[]]);
}
// Independent reference: sets and adjacency scanning, not production's bit-mask recurrence.
function covers(graph, chosen) {
  return graph.vertices.every(vertex => chosen.includes(vertex)
    || graph.edges.some(([a, b]) => a === vertex && chosen.includes(b)
      || b === vertex && chosen.includes(a)));
}
let graphs = 0, selections = 0;
function checkGraph(graph) {
  const all = subsets(graph.vertices);
  const dominating = all.filter(set => covers(graph, set));
  const gamma = Math.min(...dominating.map(set => set.length));
  const analysis = analyzeGraph(graph);
  expect(analysis.gamma === gamma, 'Incorrect exact gamma');
  expect(analysis.subsetCount === all.length, 'Not every subset examined');
  const optimums = dominating.filter(set => set.length === gamma);
  expect(analysis.minimumSets.length === optimums.length, 'Optimal solutions missing');
  for (const chosen of all) {
    const dominates = covers(graph, chosen);
    const minimal = dominates && chosen.every(vertex => !covers(graph, chosen.filter(id => id !== vertex)));
    const minimum = dominates && chosen.length === gamma;
    for (const [target, satisfied] of Object.entries({ dominating: dominates, minimal, minimum })) {
      const actual = evaluateSelection(graph, chosen, target);
      expect(actual.dominates === dominates && actual.minimal === minimal && actual.minimum === minimum
        && actual.satisfiesTarget === satisfied, `Incorrect ${target} assessment`);
      expect(actual.uncoveredVertexIds.length === graph.vertices.filter(vertex =>
        !chosen.includes(vertex) && !graph.edges.some(([a, b]) => a === vertex && chosen.includes(b)
          || b === vertex && chosen.includes(a))).length, 'Wrong coverage diagnostic');
    }
    selections++;
  }
  graphs++;
}
for (let n = 2; n <= 5; n++) {
  const vertices = Array.from({ length: n }, (_, i) => String(i));
  const possible = vertices.flatMap((a, i) => vertices.slice(i + 1).map(b => [a, b]));
  for (let bits = 0; bits < 2 ** possible.length; bits++) {
    checkGraph({ vertices, edges: possible.filter((_, i) => bits & (1 << i)) });
  }
}
const bank = JSON.parse(await readFile(new URL('../docs/question-bank.json', import.meta.url), 'utf8'));
for (const question of bank.questions.filter(q => q.graph)) {
  const graph = question.graph;
  checkGraph(graph);
  expect(analyzeGraph(graph).gamma === graph.gamma, `Bank gamma mismatch: ${question.id}`);
}
const preview = JSON.parse(await readFile(new URL('../content/board-preview.json', import.meta.url), 'utf8'));
for (const [ids, base] of [[['a'], 0], [['a', 'b', 'c', 'd', 'e'], 5], [['a', 'c', 'e'], 10], [['b', 'd'], 15]]) {
  const evaluation = evaluateSelection(preview.graph, ids);
  for (let hints = 0; hints <= 3; hints++) {
    expect(scoreSelection(evaluation, 'practice', hints).final === base, 'Practice hint cost');
    expect(scoreSelection(evaluation, 'competition', hints).final === Math.min(base, [15, 10, 5, 0][hints]), 'Wrong cap');
  }
}
const reordered = { vertices: [...preview.graph.vertices].reverse(), edges: [...preview.graph.edges].reverse() };
expect(analyzeGraph(reordered) === analyzeGraph(preview.graph), 'Topology cache depends on layout/order');
for (const bad of [
  { vertices: ['a', 'a'], edges: [] },
  { vertices: ['a', 'b'], edges: [['a', 'a']] },
  { vertices: ['a', 'b'], edges: [['a', 'z']] },
  { vertices: ['a', 'b'], edges: [['a', 'b'], ['b', 'a']] },
  { vertices: ['a', 'b'], edges: [], directed: true },
  { vertices: Array.from({ length: 13 }, (_, i) => String(i)), edges: [] },
]) {
  let rejected = false;
  try { normalizeGraph(bad); } catch { rejected = true; }
  expect(rejected, 'Invalid graph accepted');
}
for (const ids of [['unknown'], ['a', 'a']]) {
  let rejected = false;
  try { evaluateSelection(preview.graph, ids); } catch { rejected = true; }
  expect(rejected, 'Invalid selection accepted');
}
console.log(`PASS: ${graphs} graphs / ${selections} selections cross-checked against independent reference.`);
console.log('PASS: all source graph gammas, every optimum, 0/5/10/15 scores, free practice hints, match caps, invalid inputs and topology cache.');
