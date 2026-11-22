# Transient state

Lab graph, positions, selected IDs, pending connection, numeric answer and comparison
notes stay in RAM. Existing graph/evaluation structures and localStorage schema do not
change. Topology change clears diagnostics and keeps valid selections/positions; load
resets selections and places. Station change clears selection but retains tools/notes.

Diagnostic state is optional: missed and removable arrays of graph vertex IDs, supplied
only after check/hint. update without diagnostics removes markers. It never changes
selection or owner data. No diagnostic state is serialized.

View snapshot: zoom, three (boolean), mobile (boolean), expanded (boolean). This is
presentation only, exposed on the SVG for existing adapters; destroy removes the API.
Topology redraw recreates the 3D renderer and its camera rotation. Zoom, view choice,
input mode and expanded state are restored; geometry-only moves retain the renderer.
