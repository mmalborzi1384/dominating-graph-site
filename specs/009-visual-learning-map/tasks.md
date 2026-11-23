# Tasks: phase 3 APOS map and records ledger

Input: spec.md, plan.md, research.md, data-model.md, contracts/ui.md.
Scope is the third visual phase only; sections below are execution groups, not later phases.

## Setup
- [x] T001 Read project contracts and Graphify; create `specs/009-visual-learning-map/{spec,plan,research,data-model}.md` on independent branch.
- [x] T002 Run existing baseline commands and record actual results in `specs/009-visual-learning-map/quickstart.md`.

## Foundation
- [x] T003 Create meaningful data-driven CDP route checks in `scripts/validate-learning-map-browser.mjs`; demonstrate missing map contract before UI implementation.

## US1: learning path (P1)
Independent test: curriculum order/prerequisites, fresh/partial/complete states, activity gates and locked hash.
- [x] T004 [US1] Build stable native lesson/unit path and activity step states in `assets/js/tabs/teach-v3.js`; keep assessment callbacks and fresh exits.
- [x] T005 [US1] Add scoped connected path, vertical mobile layout and motion preference handling in `assets/css/teaching.css`.
- [x] T006 [US1] Validate route keyboard/touch/deep-link/state and existing learning browser in `scripts/validate-learning-map-browser.mjs`.

## US2: records ledger (P1)
Independent test: valid attempts sort by real time, detail answers, progress map and six domains.
- [x] T007 [US2] Compose derived overview/learning map/timeline in `assets/js/tabs/records.js`; no new persistent fields or dates.
- [x] T008 [US2] Style ledger and completion map responsively in `assets/css/records.css` using existing tokens.
- [x] T009 [US2] Extend `scripts/validate-learning-map-browser.mjs` with real-attempt fixture, filters, details, empty and archive states.

## US3: data management (P1)
Independent test: selective delete, import cancel/confirm/error, reset, quota/conflict, no unintended writes.
- [x] T010 [US3] Name and group visible management/filter/deletion controls in `assets/js/tabs/records.js` and `assets/css/records.css`, preserving transactions and IDs.
- [x] T011 [US3] Exercise administrative actions and warnings in `scripts/validate-learning-map-browser.mjs`.

## Review and delivery
- [x] T012 Run all phase-table commands, responsive/theme/keyboard/contrast/reflow checks; document baseline distinction in `specs/009-visual-learning-map/quickstart.md`.
- [x] T013 Update Graphify, `README.md`, `plans/003-learning-map-records.md`, `plans/README.md` and `anti-slop/audit-010-learning-map-records.md`; record full delivery gate and limitations.
- [x] T014 Start verified teach/records preview, push branch and create/attach focused PR; record review boundary in `specs/009-visual-learning-map/quickstart.md`. Stop without merging.

## Dependencies and execution
T001-003 -> US1 -> US2 -> US3 -> T012-014. US1 and records fixture assertions can be
reviewed independently; records.js updates remain sequential. No subagents requested.
Deliver all three stories in one focused phase3 PR; MVP alone is not the requested scope.
