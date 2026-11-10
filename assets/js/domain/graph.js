/** Validate the small simple undirected graphs supported by the exact evaluator. */
export function normalizeGraph(input) {
  if (!input || input.directed || input.multigraph || !Array.isArray(input.vertices)
      || !Array.isArray(input.edges)) throw new TypeError('گراف باید ساده و بدون جهت باشد.');
  const vertices = [...input.vertices];
  if (vertices.length < 2 || vertices.length > 12
      || vertices.some(id => typeof id !== 'string' || !id)
      || new Set(vertices).size !== vertices.length
      || (input.n !== undefined && input.n !== vertices.length)) {
    throw new TypeError('گراف باید ۲ تا ۱۲ رأس با شناسه‌های یکتا داشته باشد.');
  }
  const known = new Set(vertices);
  const seen = new Set();
  const edges = input.edges.map(edge => {
    if (!Array.isArray(edge) || edge.length !== 2 || edge[0] === edge[1]
        || !edge.every(id => known.has(id))) throw new TypeError('یال نامعتبر است.');
    const pair = [...edge].sort();
    const key = JSON.stringify(pair);
    if (seen.has(key)) throw new TypeError('یال تکراری مجاز نیست.');
    seen.add(key);
    return pair;
  });
  return { vertices, edges, n: vertices.length };
}

export function topologyKey(graph) {
  return JSON.stringify({ vertices: [...graph.vertices].sort(),
    edges: graph.edges.map(edge => [...edge].sort()).sort((a, b) =>
      JSON.stringify(a).localeCompare(JSON.stringify(b))) });
}

export function selectionMask(graph, selected) {
  if (!Array.isArray(selected) || new Set(selected).size !== selected.length
      || selected.some(id => !graph.vertices.includes(id))) {
    throw new TypeError('انتخاب رأس نامعتبر است.');
  }
  return selected.reduce((mask, id) => mask | (1 << graph.vertices.indexOf(id)), 0);
}
