> Execution update 2026-11-20: US1 authorized and implemented for review. Canonical tasks and measured evidence: specs/005-interactive-math-atlas/tasks.md and validation/phase-01.md. Historical planning-only statements below describe the original planning request; later stories remain unauthorized.

# Advisor handoff: Interactive mathematics atlas

Category: direction. Priority P1. Effort L overall. Risk medium. Planned at 0310d1c, 2026-11-20. Status TODO, planning only.

# Implementation Plan: اطلس تعاملی ریاضی

**Branch**: actual `main`, unchanged; future phase branches `codex/atlas-01-typography` through `codex/atlas-06-hero`.
**Date**: 2026-11-20 | **Planned at**: `0310d1c` | **Spec**: [spec.md](spec.md)
**Status**: planning complete, all implementation tasks remain unchecked.

## Summary
Deliver all six selected visual changes in six reviewable increments. Order: US1 typography -> US2 night theme -> US3 lab -> US4 coverage -> US5 route -> US6 hero. Setup/foundations belong to first PR, final integrated review to last PR. Planning all phases is authorized; implementing any phase is not authorized by this request.

## Technical Context
- Language: native HTML, CSS, ES modules; no build or package manager required for product.
- Dependencies: existing local Vazirmatn, KaTeX and lazy Three.js. No new dependencies.
- Storage: existing localStorage schemas only; lab scratch remains nonpersistent.
- Testing: dependency-free Node validators and existing Chrome/CDP scripts; read-only source inspection during planning. Node/Python/Chrome required only for development checks.
- Platform: static browser site on GitHub Pages and static servers, including repository subpath.
- Performance goals: no new network service or continuous animation; finite interaction effects 160-280ms where appropriate, canceled on interruption; reserve diagram size. Lighthouse and field Web Vitals not measured.
- Constraints: Persian RTL; KaTeX LTR; two themes; four motion levels plus OS reduced motion; five destinations; preserved scoring/progress and shared 2D/3D graph semantics.
- Scope: five existing sections, six visual stories; no curriculum or storage rewrite.

## Constitution Check
Design-time PASS before and after research:
1. Static/no-build: existing architecture and local assets only.
2. Five sections/no activity modals: all work remains in current panels; navigation exception unchanged.
3. Modeling: hero reuses real neighborhood semantics; boards retain scenario/vertex/edge/goal meaning.
4. Persian/theme/tokens: Vazirmatn and KaTeX stay, central paint/motion tokens, blur only on navigation, opaque graph.
5. Separation: CSS presentation and UI controllers change; question content/domain/storage do not.
6. APOS: existing gates, fresh exits and pre-prediction privacy remain authoritative; completion is not mastery.
7. Review: one PR per story, explicit merge and next-phase permission; no automatic continuation.
No constitution amendment required. Runtime proof is pending implementation, not implied by design-time PASS.

## Project Structure
Documentation: spec.md, plan.md, research.md, data-model.md, contracts/ui.md, quickstart.md, tasks.md, checklists/requirements.md, checklists/delivery.md in `specs/005-interactive-math-atlas/`.
Source: `index.html`, `assets/css/`, `assets/js/ui/`, `assets/js/tabs/`, existing `scripts/` validators. Keep separation; add no build directory.

## Current state and conventions
- `assets/css/tokens.css:9`: `--font-body: Vazirmatn, Tahoma, sans-serif;`; line 11: `--paper: #fff6e5;`; line 67 begins night overrides. Match custom-property pattern instead of component hex literals.
- `assets/css/lab.css:3`: `.lab-tools { display: grid; grid-template-columns: repeat(3,minmax(0,1fr)); ... }`; move tool composition, not graph state.
- `assets/js/tabs/teach.js:15`: `if(curriculum.curriculumVersion===3)return initTeachingV3({curriculum},repository);`. Target teach-v3.js, not legacy renderer.
- `assets/js/tabs/teach-v3.js:36` derives `.apos3-step-route` from `unit.requiredActivityIds`; retain derived IDs/order and existing click handlers.
- `assets/js/ui/graph-surface.js:12`: `const selection=createVertexSelection(svg,graph,places,onToggle,options);`; selection ownership is shared, not lab-specific.
- `assets/js/ui/motion.js:11`: `export function animateFinite(node, frames, token = '--motion-enter', options = {})`; existing finite/cancelable motion is the exemplar.
- `index.html:60` contains `.hero-map` with existing place labels and connections; make that diagram reversible, not a new unrelated illustration.

## Scope and phase handoff
| PR | Story / effort / risk | Files allowed, besides feature evidence and graphify output | Verify after work |
|---|---|---|---|
| 1 | US1, M, low | assets/css/{tokens,base,layout,editorial,teaching,practice,records}.css; scripts/validate-atlas-browser.mjs (new) | typography matrix, polish and foundation validators |
| 2 | US2, M, medium | assets/css/{tokens,graph,controls}.css; scripts/validate-atlas-browser.mjs | contrast matrix, theme/selection parity |
| 3 | US3, L, medium | assets/js/tabs/lab.js; assets/css/{lab,workbench}.css; scripts/validate-atlas-browser.mjs | lab and navigation browser validators, scratch-state preservation |
| 4 | US4, M, medium | assets/js/ui/{graph-surface,vertex-selection,motion,graph-three}.js; assets/js/tabs/teach-v3.js only for explicit reveal gate; assets/css/{graph,motion}.css; scripts/validate-atlas-browser.mjs | graph/teaching/browser validators, interrupted feedback and 2D/3D parity |
| 5 | US5, M, medium | assets/js/tabs/teach-v3.js; assets/css/teaching.css; scripts/validate-atlas-browser.mjs | fresh/partial/complete route, APOS validators |
| 6 | US6, M, medium | index.html; assets/css/{editorial,motion}.css; assets/js/ui/motion.js or new hero-map.js; assets/js/app.js only to initialize hero helper; scripts/validate-atlas-browser.mjs | hero equivalence and all-five-panel final matrix |

Out of scope: `content/`, domain calculations, question bank, storage schemas, vendored code, old teaching snapshots, existing navigation destinations. Existing validators may change only if assertions encode superseded layout rather than protected behavior; document that justification. Never weaken semantics checks to obtain green output.

## Commands and step verification
Before implementation: `git diff --stat 0310d1c..HEAD -- index.html assets/css assets/js scripts` and compare current-state excerpts. Expected: known/reviewed differences only. Run `graphify query` before exploring new owning sources; this plan locates vertex-selection.js and graph-three.js through graph-surface.js imports. No standalone refactor.

1. Setup and baseline: use commands in quickstart.md; expected exit 0, otherwise record baseline failures and stop affected implementation.
2. US1: central type/space tokens then component hierarchy, run `node scripts/validate-polish.mjs`, `node scripts/validate-foundation.mjs`, and future `node scripts/validate-atlas-browser.mjs --story US1`; expected exit 0 plus screenshots.
3. US2: central night overrides, check all semantic graph/control colors; future atlas check `--story US2`; expected measured contrast table passing thresholds.
4. US3: preserve controller closures and IDs, move tool containers and add disclosure semantics; run lab/navigation checks and atlas `--story US3`; expected model/selection unchanged through resize/collapse and no stored attempts.
5. US4: inspect reveal callers before modifying shared renderer, animate only authorized presentation, preserve 3D observer semantics; run graph/teaching checks and atlas `--story US4`; expected identical authorized states under rapid toggles/off/reduced motion and no early coverage.
6. US5: retain existing navigation/progress functions; replace route presentation only; run APOS checks and atlas `--story US5`; expected same unlock/percentage for fresh/partial/complete fixtures.
7. US6: reversible SVG/text presentation of fixed graph, real CTA, no autoplay; atlas `--story US6` and full regression; expected topology equality and correct keyboard/click behavior.
At every story: run `graphify update .` after code changes, review all changed paths, attach recorded evidence to a focused PR, give URL to user and STOP. Never merge automatically or start the next story without permission. Every story ships with both themes/mobile working; final review is additional, not deferred accessibility.

## Test plan and done criteria
Use existing `scripts/validate-graph-workspace-browser.mjs` CDP/server/screenshot conventions for new `scripts/validate-atlas-browser.mjs`. Proposed CLI supports `--story US1` ... `US6`, absent flag means all; reject unknown flags. Add tests for actual preservation and failure cases, not class-name snapshots. Each applicable story runs widths/themes/motion states in quickstart and records controls individually. All Node checks exit 0; required browser checks exit 0 with no new console error. Verify expected baseline and result assertions; screenshots require human visual review. Inspect `git diff --name-only` against phase scope, graph output and documentation. Mark task checkboxes only when corresponding evidence exists. No UI PASS based only on source inspection.

## STOP conditions
Stop if drift invalidates excerpts/contracts; if a step requires content/domain/storage edits; if coverage permission cannot be determined; if a validator fails twice; if baseline browser runtime is unavailable; or if semantic color/3D parity needs unrelated renderer work. Report exact block and completed evidence, preserve existing code/data, and do not improvise migrations or claim passes. Expected earlier phase changes are reviewed through their PRs before later work, not treated as unexplained drift.

## Maintenance notes
Shared graph changes affect all five sections and 3D textures; inspect selection hatching and disposal on every rebuild. CSS is loaded in an override chain (editorial and controls after core styles); avoid specificity escalation and duplicated tokens. Existing custom-select popovers must remain above cards and within viewport. Route changes must continue deriving progress from curriculum data. Keep landing diagram disconnected from learner answers.

## Complexity Tracking
No new architecture or dependency. No justified constitution violation. One focused browser validator and existing rendering/motion primitives suffice.

# UI contract

## Shared shell and tokens (US1, US2)
Keep five hash destinations and navigation popover behavior. Reuse central tokens in `assets/css/tokens.css`; use logical properties. Preserve theme/motion preferences. No global overflow hiding to mask defects. Main text minimum 1rem; normal text contrast >=4.5, large text >=3; controls >=44px both axes. Focus, active and disabled states must not rely solely on color. Test native and enhanced selects, opening direction and stacking after layout changes. Blur remains confined to the navigation window.

## Lab (US3)
At >=1000px: right tool column and flexible board column using minmax(0,1fr); below 1000px stack tool groups above board, using native details/summary or equivalent named buttons with expanded state. Summary below board reports actual graph only. DOM focus order follows visible RTL reading order. Preserve `#lab-drawing-board`, existing lab action IDs and data semantics. Moving/collapsing tools must not recreate controller state. If focus would be hidden, keep group open until focus leaves or move focus to its summary. No fixed bottom overlay.

## Graph (US4)
Shared renderer/selection implementation remains source of truth. Selected vertices remain solid; covered single-owner nodes retain hatching; multi-owner equal sectors retain canonical order. Uncovered feedback gets a textual/shape cue only when feedback is allowed. Respect directed edges, parallel edges and loops already supported. Rapid toggles, theme or view change and destroy cancel old visual work. Off/reduced motion instantly shows current authorized state. 3D shows the same semantic state and has a no-WebGL fallback. Do not inject coverage into a pre-prediction teaching board.

## Route (US5)
Retain lesson, unit and activity layers; draw connectors as decorative only. Current station has aria-current at the appropriate layer; completion has a tick and text; locked station has reason text. Use native buttons with existing handlers, not a second router. Do not invent shortcuts past fresh exit tasks. Only current station details expand by default; completed steps remain reviewable. Keep actual activity IDs and `#teaching-stage`.

## Hero (US6)
Retain existing five neighborhood place identities and edge list. Add a native mode control with clear current state, reversible label and textual explanation. Remove aria-hidden from any container enclosing controls; decorative SVG parts may remain hidden with a separate text equivalent. Map/graph transformation changes representation only. CTA text «شروع یادگیری گراف» links to `#teach`. SVG reserves dimensions/aspect ratio. No new persistent mode or automatic looping movement. At <=640px, title/copy precedes diagram; the diagram fits container including labels.

## Recovery and states
Loading retains reserved layout and readable status; empty explains the missing model or record with a real next action; errors retain existing retry/fallback paths. Never replace corrupt storage with a visual reset. Practice/competition scores, records import/export and lab scratch-only behavior are immutable feature boundaries.

# Validation guide

These are implementation acceptance commands, not results from this planning session.

## Prerequisites and baseline
Use Node, Python3 and Chrome; existing browser scripts choose Chrome, CHROME_BIN may override. No npm install/build/lint/typecheck command exists for this static product. Run from repository root. Existing CDP script starts its own static server; inspect its port before parallel runs. For manual preview use `python3 -m http.server 8768 --bind 127.0.0.1` then open http://127.0.0.1:8768/ .

Run each applicable command; expected exit 0 and its success summary:
```sh
node scripts/validate-polish.mjs
node scripts/validate-foundation.mjs
node scripts/validate-graph.mjs
node scripts/validate-graph-workspace.mjs
node scripts/validate-apos-v3.mjs
node scripts/validate-teaching.mjs
node scripts/validate-practice.mjs
node scripts/validate-competition.mjs
node scripts/validate-lab.mjs
node scripts/validate-records.mjs
node scripts/validate-navigation-lab-browser.mjs
node scripts/validate-graph-workspace-browser.mjs
node scripts/validate-apos-v3-browser.mjs
node scripts/validate-antislop-browser.mjs
```
Do not run content validation with --write during planning. Baseline failures are not caused by this plan and must be recorded before changes. In implementation run relevant checks per plan and all commands for final acceptance. The planned `node scripts/validate-atlas-browser.mjs --story US1` does not exist yet; create it in US1, then extend it for US2-US6. Without a story flag it must run all implemented scenarios.

## Test matrix and expected outcomes
Widths 320,390,768,1280,1440; day/night; off/low/medium/full plus OS reduced motion; 200% zoom representative desktop/mobile layouts. All five hash routes, direct load and refresh. No document horizontal overflow (scrollWidth <= clientWidth+1), no clipped Persian text/formula, no hidden focus; board-local overflow only where existing dense-graph behavior requires it. Actual controls >=44x44px. Capture initial and final states, measure text contrast in both themes.

| Story | Reproducible scenario | Expected |
|---|---|---|
| US1 | Long scenario and mixed Persian/KaTeX in teach/practice; inspect each remaining section | readable hierarchy, body >=16 CSS px, no cut math or text |
| US2 | select nodes with one/multiple owners then change day/night and 2D/3D | same selections/owners, readable text/edges/focus, contrast table |
| US3 | build graph, connect/disconnect, move via drag/keyboard/direction buttons, collapse group, resize | graph topology, coordinates and selections retained; no attempts/sessions added; disabled storage still works |
| US4 | rapid select/remove, uncovered result, change theme/view during effect, then leave tab | last authorized state wins; no stale animation/resource leak; pre-prediction coverage absent; off gives same result |
| US5 | fresh, partial and complete progress fixtures; activate current/completed/locked step | same percentage/unlocks as baseline, locked reason readable, fresh exit cannot be bypassed |
| US6 | toggle map/graph/back, activate CTA, repeat with keyboard and reduced motion | same five places/edges, text equivalent and correct #teach link, no repeating animation |

## Interaction evidence required per changed control
Record action -> observed result -> theme/viewport -> console outcome. Include hero toggle and CTA; theme/motion controls; route lesson/unit/step and locked reason; lab station, family, model build, prepared selection, n/gamma drawing, select/connect mode, vertex/edge controls, movement buttons, group disclosures, check/hint/solutions/clear; 2D/3D and no-WebGL fallback. Also smoke-test practice submission, competition rounds, records import/export/delete and navigation open/Escape/outside close after shared style changes. Expected no dead controls and no new console errors.

## Evidence artifact
Write `validation/phase-01.md` ... `phase-06.md` under this feature with command results, measured contrast, screenshots, interaction ledger, known limitations and PR URL. Screenshots and records contain synthetic test data only. Add stable assertions to scripts; do not call screenshots automated proof of aesthetics. No public Pages deploy, commit, push or merge is part of the current planning request.

# Tasks: Interactive mathematics atlas

**Input**: specs/005-interactive-math-atlas/{spec,plan,research,data-model,quickstart}.md and contracts/ui.md.
**Status**: planned only. No implementation authorized. Tests explicitly required by spec for behavioral regressions.
**Format**: unchecked Tnnn tasks; story labels map to spec. No [P] markers because shared styles/renderers and serial human review boundaries make concurrent implementation inappropriate.

## Phase 1: Setup

- [ ] T001 Read drift and scope against 0310d1c; record baseline commands, current screenshots and pending failures in `specs/005-interactive-math-atlas/validation/phase-01.md`.

## Phase 2: Foundational

- [ ] T002 Inventory paint/type/space and existing overrides, record token mapping without semantic color changes in `specs/005-interactive-math-atlas/validation/phase-01.md`.
- [ ] T003 Create CDP browser harness following validate-graph-workspace-browser.mjs, support --story US1..US6 and per-control evidence; implement baseline preservation assertions in `scripts/validate-atlas-browser.mjs`.

## Phase 3: US1: Typography and spacing

Goal and independent test: spec US1; acceptance scenarios and quickstart matrix apply. Complete before opening its PR.

- [ ] T004 [US1] Define shared body/heading/space tokens, retain Vazirmatn and KaTeX in `assets/css/tokens.css`.
- [ ] T005 [US1] Apply content hierarchy and responsive wrapping across base/layout/editorial/teaching/practice/records styles under `assets/css/`.
- [ ] T006 [US1] Add US1 long-text, RTL math, viewport and zoom assertions in `scripts/validate-atlas-browser.mjs`.
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

Read plan and scope first. Establish baseline, complete one story, validate exact assertions and record screenshots/click-through, update graph, present focused PR and stop. No automatic merge. Failed or unavailable checks remain pending, never checked complete. A later instruction must authorize implementation and each subsequent review boundary. The current session ends after planning.
