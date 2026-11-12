# Shared selection and action spacing — four browser comments

2026-11-12. Follow-up to the same PR9; no merge or deployment.

- Extracted vertex-selection.js from graph-editor.js and reused it in model-workbench.js.
  All graph surfaces share stable vertex colors, opaque beads, equal-sector owner hatching,
  changed-coverage fade, selection tap, entrance order, circular focus and accessible labels.
  Workbench selection updates the existing vertex nodes; it no longer rebuilds the SVG or
  loses focus on each click. Source directed/multigraph selection keeps its own graph model
  and disables undirected neighborhood coverage; no evaluation-bound expansion occurred.
- Shared step-review and stage controls have explicit separating margins/gaps; inline action
  groups keep spacing. Compact touch targets remain ≥44px. Four earlier lab actions and
  transfer layouts retain their existing gaps.
- Theme text is visually hidden; the standalone glass switch keeps its accessible name,
  checked state and persisted behavior. No visible day/night caption.
- Action/navigation links use glass button styling without underlines. Navigation remains
  semantic anchors with href; actual actions remain buttons. Secondary text-buttons receive
  the same treatment (including reset and reveal).

Actual validation: Chrome157 on Linux, emulated360/1280 CSS widths, both day/night themes,
all five tabs:20 views and30 checks, no document overflow or runtime exceptions. The exact
reported step→stage spacing was measured in all four size/theme cases and is at least8px.
Touch selects a path vertex, same node identity remains, computed bead animation is bead-tap,
neighbor owner IDs match and a doubly-covered vertex has two equal hatch sectors. Enter
unselects and retains focus. Short visible theme caption is clipped; action links lack
underlines. System reduced-motion leaves0 running animations. Physical devices/other browser
engines remain outside these observed checks.

Existing script checks passed: graph1180/61688 reference, foundation104, APOS245, Practice37,
Lab211, competition174, Records90, random94, preferences42; content audit150 connected.
Graphify was updated after the code slice. No storage, source-bank permission or scoring
contract changed. Evidence: selection-review-evidence.json.
