# Plan

Retain SVG as answer authority and Three.js as a transient view. Preserve zoom at the
shared view boundary. Use stable pointer capture, ID-based drag state and a fixed
screen-facing drag plane; retain depth per ID when SVG rebuilds. Ray-plane math follows
the installed threejs-interaction skill. Touch mode is shared view state, not a separate
renderer or fork of graph logic. Extend CDP tests with native touch input and rotated
3D dragging. Run workspace, shared-browser, hatching and world regressions. Update
graphify, antislop after audit and open a focused PR; stop before merge.

Theme follow-up uses inline SVG and CSS only: no generated bitmap, library or storage.
Rotate the ray group, animate the crescent within the knob, and keep theme translation
on the knob. Verify both themes, motion off/low/reduced and actual transform changes.
