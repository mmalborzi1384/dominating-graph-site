# Research Decisions

Date: 2026-11-10. Inputs: current spec, constitution and parsed question bank v1.1.
This is design research, not evidence that the application already works.

## 1. Static browser architecture

**Decision**: native modules, HTML, CSS and fetched static JSON; hash-based tab navigation;
relative asset URLs; no build step. Serve the same files on all target hosts.
**Rationale**: matches the explicit deployment and editability constraints.
**Alternatives considered**: compiled SPA frameworks add a forbidden build step; a backend
or database conflicts with local-only operation; `file://` has unreliable module/storage behavior.

## 2. Exact graph semantics

**Decision**: for simple undirected domination exercises, evaluate closed-neighborhood coverage.
Enumerate subsets by increasing size to find gamma and all optimal sets, cached by canonical
adjacency, not vertex positions. Check minimality by deleting each selected vertex.
**Rationale**: 2^10=1024 custom subsets, 2^12=4096 for current largest prepared graph;
accept every correct optimum rather than only the bank's sampled gamma_sets list.
**Alternatives considered**: greedy approximation cannot prove minimum; comparing only with
sample answer sets rejects valid solutions. Directed/multigraph introductory models retain
their semantics but do not enter the simple-undirected domination evaluator.

## 3. Content completeness and educational adaptation

**Decision**: keep the 150 original IDs and metadata; merge reviewed overrides for missing
context, figures, graph structure and response mode. Teaching assessments reference eligible
APOS-matched questions with explicit selection targets; narrative/proof material remains
available in its permitted tabs without inventing automatic free-text grading.
**Rationale**: actual bank inspection finds 99 graph=null and 105 missing modeling fields.
Absence of graph data does not mean every such question needs a graph; figure-dependent
questions do need verified reconstruction. A generic empty editor cannot supply missing facts.
**Alternatives considered**: silently dropping questions fails full-bank coverage; guessing
book figures or replacing source meaning fails educational accuracy. All 150 must pass the
release audit; incomplete content blocks release, not this design phase.

## 4. APOS persistence without answer history

**Decision**: persist required-activity completion IDs, passed stage IDs and last visited stage;
derive percent from four passed stages. Store no teaching answer, selected vertices, hint
count, score or attempt log. Progress is monotonic until a confirmed, isolated reset.
**Rationale**: meets the user's corrected persistence requirement while preserving self-assessment.
**Alternatives considered**: session-only progress was explicitly rejected; saving full attempts
violates the instruction not to record teaching activities/scores.

## 5. Scoring, hints and explanatory feedback

**Decision**: keep target satisfaction separate from quality score. Base scores are 0/5/10/15
for non-dominating/dominating nonminimal/minimal nonminimum/minimum sets. Practice hints
are free; competition caps are 15/10/5/0 for 0/1/2/3 hints (third cap is the spec assumption).
Teaching has correctness feedback without a stored or aggregated numeric score.
**Rationale**: cap means min(base,cap), not subtracting five every time. Feedback identifies
uncovered vertices, removable selected vertices or an opportunity to use a smaller set,
according to the requested target; full solution is a separate action after guidance.
**Alternatives considered**: penalizing all hints conflicts with free practice; requiring a
minimum answer for every question rejects valid answers to simpler targets.

## 6. Data durability and transfer

**Decision**: one validated, versioned JSON envelope in localStorage; prepare all writes and
imports in memory, then one setItem commit. Only acknowledge persistence after successful
write. Transfer uses a versioned JSON file, stable IDs and deterministic merge rules.
**Rationale**: one-key commits avoid partial multi-key imports. Browser storage can fail or
be cleared; report failure inline and offer export of in-memory work.
**Alternatives considered**: IndexedDB/server backups violate storage constraints; clearing
all origin storage during teaching reset deletes unrelated data and is forbidden.

## 7. Presentation and vendor assets

**Decision**: central day/night tokens from the bank palette, semantic SVG classes, locally
vendored KaTeX browser CSS/JS/fonts and Vazirmatn WOFF2 with exact version, license and checksum
recorded at acquisition. Use KaTeX with trust=false, strict handling and explicit LTR spans;
render surrounding text as text nodes, not arbitrary HTML. No MathJax dependency is required.
**Rationale**: stable static operation, isolated math direction and a single editable theme.
**Alternatives considered**: runtime CDN dependency weakens availability; CSS/SVG literal
colors scatter settings; injecting bank/import text as HTML creates executable content.

## 8. Validation boundaries

**Decision**: domain tests for mathematical/storage invariants, browser tests for meaningful
user flows, human educational review and actual host smoke checks before release. Development
tooling can use Node/Playwright but never becomes a deployment/build prerequisite.
**Rationale**: correct mathematics, durable progress and platform behavior need different evidence.
**Alternatives considered**: only visual review misses state corruption; implementation-mirroring
tests add little value. No application tests can run during this documentation-only phase.

## Primary documentation references

- [KaTeX browser setup](https://katex.org/docs/browser.html)
- [localStorage behavior and exceptions](https://developer.mozilla.org/en-US/docs/Web/API/Window/localStorage)
- [GitHub Pages static hosting](https://docs.github.com/en/pages/getting-started-with-github-pages/what-is-github-pages)
- [Vazirmatn upstream](https://github.com/rastikerdar/vazirmatn)

Exact versions are not asserted as latest. Acquisition must use official distributions and
retain license/provenance. Official pages above were retrieved successfully (HTTP 200) on 2026-11-10 after the
initial restricted-network attempt. Browser setup supports static assets; localStorage
documents origin scoping and SecurityError; Pages documents static repository hosting;
Vazirmatn upstream identifies SIL Open Font License 1.1. No dependency was installed.
