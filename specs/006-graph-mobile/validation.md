# Validation, 2026-11-16

- Chrome CDP, local SwiftShader, static Pages subpath: mobile suite 143 checks,
  errors[]. Widths 320/390 with native touch; 1280 with native mouse drags; both themes.
  Native touch activates zoom controls in all cases. Zoom below/above 100%, preservation
  after geometry changes and 2D/3D switching, quarter-turn rotated dragging in four
  screen directions, capture cancellation, select/move permissions and locking covered.
  A tall page verifies scroll stays fixed inside 3D and works outside. Mouse click after
  dragging selects once; touch toggles once. No page overflow at tested widths.
- Existing world suite: 66 checks, errors[]; workspace browser: 31 checks, failures[],
  errors[]; hatching browser: 34 checks, failures[], errors[]. These suites were rerun after the final click-target correction. The theme ornament
  follow-up was verified in the final 143-check input suite.
- Pure validators: workspace 317, lab 211, practice 37, competition 174, records 90.
- JS syntax and git diff --check pass. graphify update . executed after code edits.
- Screenshot /tmp/graph-mobile-controls.png inspected at 390px: controls and stage fit;
  text, selected state and coverage remain readable. Switch uses existing heading/surface
  tokens, contrast 7.48:1 day and 6.24:1 night (see audit for measured token calculation).

Found and fixed during review: capturing mouse on SVG retargeted the final click away
from the vertex. Pointer-up now activates the original ID only for a tap and suppresses
only the following trusted browser click. Cancel and drag never activate a vertex.
An initial test fixture allowed scroll inertia to continue into its next case; touch
cancellation and instant scroll reset now isolate those cases.

Limits: emulated touch is not a physical Android/iPhone test; Safari, hardware GPU
performance, pen/multitouch gestures and full APOS walkthrough were not measured.
3D drag retains local depth through mesh rebuilds; SVG model bounds and collision rules
remain authoritative. The interaction switch is per board and is not persisted.
No assertion that every possible mobile bug is eliminated. Human review before merge.

Theme follow-up: native Chrome checks verify sun and moon transforms continue changing,
both themes fit mobile width, off/low stop moon motion and system reduced-motion stops
both sun and moon. Inline SVG uses central gold/ink/surface tokens. Header screenshots
are in /tmp/theme-day-mobile.png and /tmp/theme-night-mobile.png.

Final theme correction keeps the sun on the left with rightward light trails and moon
on the right with leftward trails. Inline mask removes the light progressively. The
controls stylesheet has an explicit new URL version to avoid stale cached icon styling.
