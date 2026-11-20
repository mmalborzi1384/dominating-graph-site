# Tasks: Interactive mathematics atlas

**Input**: specs/005-interactive-math-atlas/{spec,plan,research,data-model,quickstart}.md and contracts/ui.md.
**Status**: US1 execution authorized 2026-11-20; later stories await human review. Tests explicitly required by spec for behavioral regressions.
**Format**: unchecked Tnnn tasks; story labels map to spec. No [P] markers because shared styles/renderers and serial human review boundaries make concurrent implementation inappropriate.

## Phase 1: Setup

- [x] T001 Read drift and scope against 0310d1c; record baseline commands, current screenshots and pending failures in `specs/005-interactive-math-atlas/validation/phase-01.md`.

## Phase 2: Foundational

- [x] T002 Inventory paint/type/space and existing overrides, record token mapping without semantic color changes in `specs/005-interactive-math-atlas/validation/phase-01.md`.
- [x] T003 Create CDP browser harness following validate-graph-workspace-browser.mjs, support --story US1..US6 and per-control evidence; implement baseline preservation assertions in `scripts/validate-atlas-browser.mjs`.

## Phase 3: US1: Typography and spacing

Goal and independent test: spec US1; acceptance scenarios and quickstart matrix apply. Complete before opening its PR.

- [x] T004 [US1] Define shared body/heading/space tokens, retain Vazirmatn and KaTeX in `assets/css/tokens.css`.
- [x] T005 [US1] Apply content hierarchy and responsive wrapping across base/layout/editorial/teaching/practice/records styles under `assets/css/`.
- [x] T006 [US1] Add US1 long-text, RTL math, viewport and zoom assertions in `scripts/validate-atlas-browser.mjs`.
- [ ] T007 [US1] Run US1 gates in quickstart, inspect screenshots, update graph, prepare focused PR URL and STOP for human review; record in `specs/005-interactive-math-atlas/validation/phase-01.md`.

## Phase 4: US2: Night atlas

Goal and independent test: spec US2; acceptance scenarios and quickstart matrix apply. Complete before opening its PR.

- [ ] T008 [US2] Tune night semantic tokens and graph/control focus states without changing canonical owner colors in `assets/css/tokens.css`.
- [ ] T009 [US2] Check graph.css and controls.css for hardcoded theme assumptions and fix in `assets/css/`.
- [ ] T010 [US2] Add measured contrast and day/night selection/3D parity scenarios in `scripts/validate-atlas-browser.mjs`.
- [ ] T011 [US2] Run US2 gates, update graph, provide PR URL and STOP for review; record in `specs/005-interactive-math-atlas/validation/phase-02.md`.

## Phase 5: US3: Lab workbench

Goal and independent test: spec US3; acceptance scenarios and quickstart matrix apply. Complete before opening its PR.

- [ ] T012 [US3] Recompose tool/board containers and native tool disclosures while preserving closure state and existing IDs in `assets/js/tabs/lab.js`.
- [ ] T013 [US3] Implement right sidebar >=1000px, stacked tools below 1000px and summary below board with focus-safe wrapping in `assets/css/lab.css`.
- [ ] T014 [US3] Add collapse/resize/drag versus non-drag equivalence and scratch-storage assertions in `scripts/validate-atlas-browser.mjs`.
- [ ] T015 [US3] Run lab/navigation and US3 gates, update graph, provide PR URL and STOP; record in `specs/005-interactive-math-atlas/validation/phase-03.md`.

## Phase 6: US4: Coverage feedback

Goal and independent test: spec US4; acceptance scenarios and quickstart matrix apply. Complete before opening its PR.

- [ ] T016 [US4] Inspect shared selection and teaching reveal callers; document explicit permitted reveal path before editing in `specs/005-interactive-math-atlas/validation/phase-04.md`.
- [ ] T017 [US4] Add finite authorized selection/coverage feedback through vertex-selection.js and existing motion helpers; retain hatching and equal owner sectors in `assets/js/ui/`.
- [ ] T018 [US4] Add non-color uncovered cue in graph.css; preserve current authorized state in 3D observer and teach-v3.js reveal boundary under `assets/`.
- [ ] T019 [US4] Add rapid interruption, early-answer prevention, reduced-motion and 2D/3D equivalence cases in `scripts/validate-atlas-browser.mjs`.
- [ ] T020 [US4] Run graph/teaching and US4 gates, update graph, provide PR URL and STOP; record in `specs/005-interactive-math-atlas/validation/phase-04.md`.

## Phase 7: US5: Learning route

Goal and independent test: spec US5; acceptance scenarios and quickstart matrix apply. Complete before opening its PR.

- [ ] T021 [US5] Render connected lesson/unit/step presentation using existing progress/navigation functions and explain locks in `assets/js/tabs/teach-v3.js`.
- [ ] T022 [US5] Style decorative route edges, current/complete/locked station states and mobile layout in `assets/css/teaching.css`.
- [ ] T023 [US5] Add fresh/partial/complete route and unchanged unlock/exit/percentage assertions in `scripts/validate-atlas-browser.mjs`.
- [ ] T024 [US5] Run APOS and US5 gates, update graph, provide PR URL and STOP; record in `specs/005-interactive-math-atlas/validation/phase-05.md`.

## Phase 8: US6: Neighborhood transformation

Goal and independent test: spec US6; acceptance scenarios and quickstart matrix apply. Complete before opening its PR.

- [ ] T025 [US6] Add named reversible map/graph control, textual equivalent, real #teach CTA and reserved diagram dimensions in `index.html`.
- [ ] T026 [US6] Implement transient hero mode using existing motion helpers or new hero-map.js initialized from app.js; preserve fixed place/edge identity under `assets/js/`.
- [ ] T027 [US6] Style right-copy/left-map desktop and stacked mobile hierarchy without decorative grid/glow stacking in `assets/css/editorial.css`.
- [ ] T028 [US6] Add topology equality, keyboard/reduced-motion transformation and real CTA navigation checks in `scripts/validate-atlas-browser.mjs`.
- [ ] T029 [US6] Run US6 gates and inspect hero states; record in `specs/005-interactive-math-atlas/validation/phase-06.md`.

## Phase 9: Polish and integrated acceptance

- [ ] T030 Run full quickstart matrix and per-control ledger, verify scope, scores/storage/reveal and custom-select stacking; record limitations honestly in `specs/005-interactive-math-atlas/validation/phase-06.md`.
- [ ] T031 Update graph after final code changes, complete Delivery Gate evidence, attach final focused US6 PR URL and STOP; update status in `plans/README.md`.

## Dependencies & Execution Order

Setup -> Foundations -> US1 -> human review -> US2 -> human review -> US3 -> human review -> US4 -> human review -> US5 -> human review -> US6 + integrated acceptance -> human review.

Stories remain independently demonstrable against the last reviewed baseline. US1 is the MVP. US2 establishes theme tokens before later visual stories; US3 establishes board workspace before shared feedback; US4 stabilizes the graph language before route and hero. Setup/foundation are not separate implementation PRs; include them in US1. Final polish belongs in US6. Every intermediate phase must already pass its relevant mobile/theme/accessibility gates.

## Parallel Opportunities

No cross-story implementation parallelism is authorized. Within US1, a read-only screenshot review may run alongside long-text inspection after the same build exists; US2 day/night contrast measurements are independent reads; US3 mouse and keyboard runs may use separate browser contexts; US4 2D and 3D observations may use separate contexts; US5 fresh/partial/complete fixtures use isolated storage; US6 motion-off and reduced-motion checks use isolated contexts. Run existing CDP scripts serially if they share a port. These are validation options, not permission to dispatch agents or start the next story.

## Implementation Strategy

Read plan and scope first. Establish baseline, complete one story, validate exact assertions and record screenshots/click-through, update graph, present focused PR and stop. No automatic merge. Failed or unavailable checks remain pending, never checked complete. A later instruction must authorize implementation and each subsequent review boundary. The current execution stops after the US1 review PR.
