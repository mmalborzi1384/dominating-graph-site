# Implementation Plan: اطلس تعاملی ریاضی

**Branch**: actual `codex/atlas-01-typography`; subsequent phase branches `codex/atlas-01-typography` through `codex/atlas-06-hero`.
**Date**: 2026-11-20 | **Planned at**: `0310d1c` | **Spec**: [spec.md](spec.md)
**Status**: US1 implemented for review. See validation/phase-01.md; later stories remain unchecked.

## Summary
Deliver all six selected visual changes in six reviewable increments. Order: US1 typography -> US2 night theme -> US3 lab -> US4 coverage -> US5 route -> US6 hero. Setup/foundations belong to first PR, final integrated review to last PR. User authorized US1 execution on 2026-11-20; all subsequent phases still require authorization.

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
