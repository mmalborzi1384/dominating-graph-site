# Research and decisions

Graphify initLab/graph-editor/vertex-selection/graph-three query located the owning
files; raw source confirmed both missed/hinted already exist. Keep them compatible,
add opt-in diagnostics instead of reinterpreting the old flags. No new evaluator.

Persistent controls were chosen over breakpoint clones or whole-tab redraw because
focus, typed values and open native details must survive graph edits. Board replacement
is limited to topology/load; geometry edits keep the existing graph renderer.

SVG remains the shared source for 3D. Rings and short symbols retain selected beads
and owner hatches; the nearby full-text key and accessible labels explain their meaning.
Camera-facing rings use local Three.js unlit/dashed materials with existing disposal.
No library upgrade, external network runtime, or performance improvement is claimed.

Spec Kit feature_directory still points to completed phase 1. Validation uses explicit
SPECIFY_FEATURE_DIRECTORY=specs/008-visual-lab-feedback and NO_PERSIST=1 so local
workflow state does not leak into this feature diff. No extension hook file exists.
