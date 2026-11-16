# Shared graph touch and pointer controls

Keep zoom through vertex edits, topology redraws, resize and 2D/3D switches. Add a
per-board mobile/desktop interaction switch beside zoom, initially selected by coarse
pointer capability. Mobile uses larger pick targets and lower renderer pixel density;
features and answers remain identical. The preference is transient, no storage migration.
A single pointer drags vertices when editing is enabled, or rotates empty 3D space.
Touch inside 3D must not scroll the page; outside the board scrolling stays native.
Preserve screen-plane displacement including local depth after rotation. Never turn
selection/edge mode into movement. Cancellation must not select, secondary pointers
must not steal a drag. No scoring, curriculum, graph topology or background changes.
Keep existing palette, compact controls, visible keyboard focus and 44px touch targets.

User follow-up: soften the theme sun's straight rays into tapered curved primary and
secondary rays. Give the moon its own slow continuous libration using an SVG crescent;
keep knob translation independent. Existing motion off/low and reduced-motion take
priority. Existing palette, hit target and accessible theme switch stay intact.

Final theme direction correction: sun stays left, light streams right; moon stays right,
light streams left. SVG mask fades the moving curves toward the opposite end. No extra
black silhouette or duplicate visible icon. Animation still obeys motion preferences.
