# Phase 5 / US3 Competition — 2026-11-11

Scope: T031–T036 only, following merged phase-4 PR #4. Constitution, specification and tasks
were reread. The existing spec-quality checklist has no unchecked items. No extension hooks
are registered. No lab or analytical Records/import/deletion controller was added.

## Behavior

Data-driven content/competition.json declares seven eligible modeled source questions,
positive round default and caps 15/10/5/0. Source IDs/types/permissions are preserved; gamma
questions accept vertex selection as specified. Added contexts remain ready for human review,
not certified educational content. Missing/unready bank items are not fabricated.

2–10 named groups receive one turn per round with the same question and difficulty for all
groups in that round. The pool cycles with disclosure in the UI. Startup checks normalized
30-character names, session capacity and available record slots for all planned turns.
Question choices and stable IDs are persisted before play. The active match resumes on reload.
Hint level is committed before any new hint is rendered. Failed/dirty/conflicting writes block
new play until saved/reconciled; temporary work remains available through shared recovery.

An answer is finalized once through a shared Attempt and matching turn in one repository write.
Finalized and finalized-deleted turns remain spent. Next-turn navigation is separate, preserving
feedback on reload. Totals derive from retained attempts; tied totals receive shared ranks.
Teaching progress is untouched. Only localStorage persistence and static native modules are used.

## Evidence

- node scripts/validate-competition.mjs: 133 checks passed. All group counts 2–10 completed;
  invalid groups/names/rounds/capacity rejected; all quality bases against every hint cap,
  equal allocation/pool cycling, one-shot answers, spent deleted markers and tied ranks checked.
- Existing checks: foundation 104, practice 37, teaching 46 passed.
- Chrome headless through its debugging protocol, temporary isolated profile: 27 observations
  passed. UI count 1/11/2.5 rejected; 2- and 10-group matches completed, hint state survived
  reload, finalized controls locked, teaching untouched, no horizontal page overflow at
  360/1280 in day/night, no application runtime exceptions. No Playwright/package/driver
  dependency was added. Mobile/night screenshot was visually inspected.
- Syntax and git diff whitespace checks passed. Graphify update completed before review.

Physical mobile, Firefox/WebKit, quota simulation in this particular UI and external hosting
were not checked here. Shared repository quota/conflict boundaries remain covered by the
foundation script. Full-bank readiness and human instructional review remain separate gates.
No PR merge or production deployment is authorized in this slice.

## Reset/delete follow-up — 2026-11-11

The requested buttons were absent. Added both for the currently displayed active/completed
match, each with inline impact description, explicit confirm/cancel and shared focus/Escape
handling. Reset uses fresh identities, retains names/rounds/questions and clears results,
hints and selections. Delete removes the chosen session and all associated Attempts. A narrow
repository action permits just this explicit removal; generic commits still reject it.

`node scripts/validate-competition.mjs`: 148 checks pass, including isolation, fresh identities,
spent-turn safeguards, stale confirmation, quota-preserved disk state, retry and one-write
delete. Foundation 104, practice 37 and teaching 46 also pass. Chrome isolated-profile follow-up:
14 observations pass (both cancellations leave state unchanged, active/completed reset,
cleared selections, full delete, reload persistence, both widths/themes and no runtime errors).
Mobile/night confirmation screenshot visually inspected. Physical-device/other-browser and
external-host limitations above still apply. Graphify updated before the review boundary.
