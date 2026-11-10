import { normalizeGraph, selectionMask, topologyKey } from './graph.js';

const cache = new Map();
const popcount = mask => {
  let count = 0;
  for (; mask; mask &= mask - 1) count++;
  return count;
};

/** Examine every subset. Layout never participates in the canonical topology key. */
export function analyzeGraph(input) {
  const normalized = normalizeGraph(input);
  const graph = { ...normalized, vertices: [...normalized.vertices].sort() };
  const key = topologyKey(graph);
  if (cache.has(key)) return cache.get(key);
  const neighborhoods = graph.vertices.map((_, i) => 1 << i);
  for (const [a, b] of graph.edges) {
    const i = graph.vertices.indexOf(a), j = graph.vertices.indexOf(b);
    neighborhoods[i] |= 1 << j;
    neighborhoods[j] |= 1 << i;
  }
  const subsetCount = 2 ** graph.n, full = subsetCount - 1;
  const coverage = Array(subsetCount).fill(0);
  let gamma = graph.n;
  const dominatingMasks = [];
  for (let subset = 1; subset < subsetCount; subset++) {
    const leastBit = subset & -subset;
    const index = Math.log2(leastBit);
    coverage[subset] = coverage[subset ^ leastBit] | neighborhoods[index];
    if (coverage[subset] === full) {
      dominatingMasks.push(subset);
      gamma = Math.min(gamma, popcount(subset));
    }
  }
  const idsFor = mask => graph.vertices.filter((_, i) => mask & (1 << i));
  const minimumSets = dominatingMasks.filter(mask => popcount(mask) === gamma).map(idsFor);
  const analysis = Object.freeze({
    vertices: Object.freeze(graph.vertices), gamma, subsetCount, full,
    coverage: Object.freeze(coverage),
    minimumSets: Object.freeze(minimumSets.map(set => Object.freeze(set))),
  });
  if (cache.size >= 32) cache.delete(cache.keys().next().value);
  cache.set(key, analysis);
  return analysis;
}

export function evaluateSelection(input, selected, target = 'minimum') {
  if (!['dominating', 'minimal', 'minimum'].includes(target)) {
    throw new TypeError('خواستهٔ سؤال نامعتبر است.');
  }
  const analysis = analyzeGraph(input);
  const mask = selectionMask(analysis, selected);
  const coveredMask = analysis.coverage[mask];
  const dominates = coveredMask === analysis.full;
  const removableVertexIds = dominates ? selected.filter(id =>
    analysis.coverage[mask ^ (1 << analysis.vertices.indexOf(id))] === analysis.full) : [];
  const minimal = dominates && removableVertexIds.length === 0;
  const minimum = dominates && selected.length === analysis.gamma;
  const properties = { dominating: dominates, minimal, minimum };
  return {
    dominates, minimal, minimum, satisfiesTarget: properties[target],
    uncoveredVertexIds: analysis.vertices.filter((_, i) => !(coveredMask & (1 << i))),
    coveredVertexIds: analysis.vertices.filter((_, i) => coveredMask & (1 << i)),
    removableVertexIds, gamma: analysis.gamma,
    diagnostic: properties[target] ? 'accepted' : !dominates ? 'uncovered'
      : target === 'minimal' ? 'removable' : 'smaller-set',
  };
}
