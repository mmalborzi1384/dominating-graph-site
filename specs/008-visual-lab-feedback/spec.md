# Phase 2: lab workbench and graph diagnostics

Date: 2026-11-22. Branch: codex/visual-lab-feedback. Status: ready for review, PR23, unmerged.
User clarified that the entire phase 2 plan is authorized, not phase 1.

## User stories and acceptance

1. Build, edit and inspect a graph in one workspace. Three native details groups
remain the same DOM on desktop and mobile; desktop places tools beside the board.
All five stations, prepared graphs and n/gamma construction remain functional.
2. Keep model, scenario and one live result beside the board. Selection, edge edits
and station changes retain tool values, open sections and valid focus. Geometry edits
retain the renderer; topology changes restore view, zoom, input mode and expanded state.
Comparison notes remain in RAM.
3. Check or ask for a free hint to reveal uncovered or removable vertices. Before
that request no diagnostic marker exists. Markers include shape/text, not just color.
Selection, numeric answer or topology changes clear stale diagnostics and results.
Ordinary coverage remains immediate. Both 2D and 3D read the same diagnostic state.
4. Lab never writes responses, attempts, scores, sessions or teaching progress.
Practice and competition receive no automatic diagnostics or answer disclosure.

## Constraints

Use existing static shared graph surface and domain evaluator. No new renderer,
dependency, domain, storage, content or other tab changes. Product files limited to
phase plan's allowed list. Keep IDs, keyboard/touch paths, fallback and theme/motion
tokens. No nested glass. Human review, preview and PR; no merge or phase 3.

## Validation

Run every validator in plans/002-lab-feedback.md and new real-CDP acceptance tests.
320/390/768/1280, day/night, 200% text, reduced motion, keyboard/touch, downward
select hit testing, stations, invalid inputs, correct/incomplete/nonminimal/minimal
nonminimum answers, single/multiple owners and WebGL failure. Compare repository
snapshot across lab actions. Record actual evidence and device limitations.
