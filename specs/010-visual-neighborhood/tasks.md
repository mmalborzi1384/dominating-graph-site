# Tasks: interactive neighborhood

## Setup and foundation

- [x] T001 Read AGENTS/constitution/active contracts, Graphify and baseline; record in specs/010-visual-neighborhood/research.md and quickstart.md.
- [x] T002 Define specs/010-visual-neighborhood/spec.md, plan.md, data-model.md and contracts/ui.md before product edits.

## US1: direct relationships, independently test all five neighbor lists

- [x] T003 [US1] Write behavioral CDP acceptance in scripts/validate-neighborhood-browser.mjs; verify RED on unchanged main (initial pre-product attempt exposed a harness MIME error, corrected before meaningful acceptance).
- [x] T004 [US1] Implement fixed local adapter with empty/exclusive/reset selection, shared rendering and cleanup in assets/js/ui/neighborhood.js.
- [x] T005 [US1] Replace decorative map with native disclosure/status/board in index.html and connect lifecycle only in assets/js/app.js.

## US2: durable return, independently test fresh/partial/complete/blocked states

- [x] T006 [US2] Derive short copy and safe unlocked return destination read-only in assets/js/ui/neighborhood.js.

## US3: compact entrance, independently test all five hashes/layouts

- [x] T007 [US3] Scope responsive matte map/disclosure and reserved copy in assets/css/editorial.css, preserve focus/44px/8px/contrast.
- [x] T008 [US3] Verify slow/error/denied/migration/conflict, touch/keyboard, WebGL fallback and destroy in scripts/validate-neighborhood-browser.mjs.

## Delivery

- [x] T009 Run relevant existing/new regressions; update specs/010-visual-neighborhood/quickstart.md with actual results/limitations.
- [x] T010 Record all antislop R01..R40/C1..C5 gates in anti-slop/audit-011-neighborhood.md and inspect day/night phone/desktop images.
- [x] T011 Update README.md, plans/README.md and plans/004-interactive-neighborhood.md; graphify update, diff/syntax/character checks.
- [x] T012 Start verified preview on8775, push focused branch, create/attach PR25, report and stop without merge.

Dependencies: T001/T002 -> T003 -> T004/T005 -> T006 -> T007/T008 -> T009..T012.
Serial implementation; independent validator runs may overlap. No agent delegation required.
MVP is US1; delivery includes all three approved stories together.
