# Lab workbench clarity and drag correction

2026-11-12. The user requested these three corrections and explicitly authorized a new PR,
merge and verification of GitHub Pages. This is a focused follow-up to PR9, not a new phase.

- Lab bank heading: «کاوش در سرزمین سوالات».
- Shared model workbenches expose visible wrapping labels: «تعداد رأس»، «انواع گراف»
  and «رفتار انتخاب». Native inputs remain associated with labels; glass selects keep
  their accessible names, value/change behavior and keyboard controls.
- SVG labels cannot become a browser text selection while dragging. Move mode sets
  touch-action before the gesture starts, prevents the default pointer action, captures
  only the primary left pointer, uses inverse screen CTM (including SVG aspect-ratio
  letterboxing), and cleans up on release/cancel/lost capture. Returning to selection
  resets click suppression so the first subsequent choice works.

## Validation actually performed

All ten applicable dependency-free scripts listed in README passed: content, polish,
graph, APOS, foundation, practice, competition, lab, records and random. Graph checks
cover 1,180 graphs and 61,688 selections. Content audit: all150 IDs reachable,
126 practice/24 dedicated bank-lab questions, no structural/metadata/gamma errors.
Independent pedagogical/physical-device/other-browser/VPS gates in release.md remain
explicitly unobserved; the runtime audit is not a claim of universal bug absence.

Chrome/Linux native browser input:49 checks,20 tab/viewport/theme views, widths360
and1280, day/night, no runtime exceptions or horizontal page overflow. Real CDP
touch on mobile emulation and mouse on desktop move the vertex to the intended SVG
position without selecting text; arrow-key movement, first selection after dragging,
visible labels and custom dropdown opening passed. Screenshots were visually inspected
for mobile/day and desktop/night. These are emulated phone checks, not physical phones.

Machine evidence: [lab-clarity-evidence.json](lab-clarity-evidence.json).
Graphify AST index updated after code edits. Public deployment is checked after merge.
