# PR#1.1 — APOS redesign / curriculum 2

Status: implemented for human review; no merge or phase-8 work. The approved design was
amended explicitly by the user: **carry over no old teaching progress or stage credit**.

## Delivered

- Twelve authored activities, three ordered activities in each APOS structure. Action uses
  connection building, route traversal and service placement, without formal graph definitions.
  Process requires predictions on fixed diagrams/relation lists, without live coverage tools.
  Object supplies formal definitions, notation, degree/handshake/parity, neighborhoods, regular/
  empty/complete/complement models, paths/connectivity and domination/minimal/minimum with
  modeled examples/counterexamples. Schema builds, solves, justifies and critiques a new
  non-path emergency-service model.
- Every activity declares learning objective, cognitive operation, context, response parts,
  expected values/constraints, rubric, three hints, prerequisites, source basis and review state.
  Structured responses include edge sets, routes, predicted sets, numbers and selected reasons.
  No automatic natural-language grading. Exact domination/minimum evaluation is reused only
  where appropriate; alternate valid solutions and equivalent set/edge orders are accepted.
- Two authored variants per stage use different modeled contexts/place identities while
  preserving each activity's stage, difficulty, response type and cognitive objective. A
  random draw changes the entire dependent chain, clears temporary answers, and leaves new
  completion flags intact. It does not fabricate source-bank IDs or add sahat evidence.
- Individual activities unlock in order; three passes unlock the next stage for 25%. Hints
  are free, wrong answers show one automatically, full answers require a separate action after
  a hint, and reveal alone never grants completion. Only completion/navigation persist.
- Curriculum 2 retains envelope schema 1 and the same storage key. Legacy curriculum is frozen
  at content/teaching-v1.json solely for strict old-state validation. After strict old-state validation, automatic local conversion
  resets only teachingProgress and updates curriculumVersion; no legacy-version controls or
  explanatory success banners are shown. There is no legacy
  credit field. Other Attempts, Sessions, settings and deletion markers are preserved exactly.
- Old bank-1.2 curriculum-1 backup import validates first, then zeros incoming old progress;
  it cannot unlock a new stage or lower existing new completion. New backup round-trip/merge
  preserves new completion. Bank-1.1 import and reverse curriculum downgrade remain rejected.
  Write failure preserves disk and offers valid unsaved recovery/retry; unknown/corrupt state
  is never silently reset. Old/new exported files contain no teaching responses/scores/hints.

## Source/content evidence

The PDF was read through text extraction, locating the chapter by its printed heading rather
than assuming physical PDF page numbers equal textbook pages. Reviewed chapter excerpts cover
V/E, p/q notation, degree/parity, regular/empty/simple graphs, open/closed neighborhoods,
complete/complement graphs and domination/minimum discussion. Object now explains both the
book's p/q and the site's n/m notation. Source ranges remain textbook lesson 1 pp.32–42 and
lesson 2 pp.43–54. These activities are original modeled teaching examples, not claimed
reconstructions of a textbook figure. No source-bank question or sahat metadata was changed.

Content is marked ready-for-user-review, not human-educationally approved. Full source-bank
readiness, independent instructional review and the phase-8 release audit remain pending.

## Dependency-free local checks

`node scripts/validate-apos.mjs`: **203 current checks passed**.

- All 12 activities × both variants; correct witnesses, missing/wrong required parts, unordered
  set/edge equivalence, loop rejection, route order/teleport errors, Persian/Arabic numerals.
- No formal leakage in Action, stage/activity prerequisites, 25% increments and valid prefixes.
- Complete and partial old progress reset to zero; old data validated before reset; all other
  results/settings/sessions/tombstones preserved, no legacy credit or teaching-answer fields.
- Legacy import cannot unlock stages or lower new completion; new round-trip retains it;
  downgrade rejection; automatic one-write conversion without a legacy-version UI,
  injected quota failure, old-disk preservation, unsaved export/retry and exactly-once migration.
- New progress survives repository reload; reset remains isolated to teaching.

Existing checks passed against their original curriculum-1 fixtures (explicitly redirected to
teaching-v1.json): foundation 104, historical teaching 46, practice 37, competition 174,
lab 211, records/transfer 90 and random 136. They test backward compatibility; they are not
presented as current typed-APOS UI checks. The new script supplies current-curriculum evidence.

## Browser and visual checks

Actual isolated Chrome headless profile `/tmp/apos2-chrome`, static HTTP serving and native
DevTools protocol. No Playwright, framework, browser-driver package or build added.

- **55 flow/layout checks passed**, no runtime exceptions: all twelve activities solved
  through actual form/board controls; compound answers and sequential locks; wrong-answer hint;
  reveal without completion; direct-link bypass rejection; Process has no interactive board;
  every stage completes; first-visit Action→Process→Object scenario continuity; Persian-number input; KaTeX without fallback; 100% survives reload;
  restored stage; chain redraw preserves flags; reset cancel/confirm.
- All four structures checked at **360×900 and 1280×900, both day/night**. No horizontal
  overflow. Screenshots of stage headers, lesson cards and populated boards were inspected.
  Follow-up made typed controls at least 44px tall with inherited font/token colors and
  reduced nested padding on mobile; node labels, edge controls and answers remain readable.
- **Initial migration/import/integration evidence (13 checks; confirmation UI later removed)**: old progress preview is 0%, activity inputs
  wait for migration, cancellation preserves old disk, confirmation removes all old completion,
  other results/deletion markers persist and display in Records, old-backup preview warns of
  no progress transfer, confirmed import unlocks nothing, reload does not migrate again, other
  tabs mount and newly finalized Practice/Lab results save under curriculum 2.

Temporary fixtures/screenshots stay outside the repository. Existing user/browser data was
not used as a test fixture. Physical phones, Firefox/WebKit, participant/usability testing,
external hosting of this unmerged change and independent educational review were not performed.
The public GitHub Pages site remains on main until separately authorized merge/deployment.

## Compact interface follow-up — 2026-11-12

The user explicitly removed the legacy-version product flow because the site is not yet
public. Local conversion is now automatic; valid other records/tombstones survive and quota
failure still preserves old disk/recoverable memory. Actual errors, file import confirmation
and teaching reset confirmation are retained. Operational copy moved behind an inline ⓘ
with hover/click/touch/keyboard/Escape; random action has intrinsic width, mission cards start
collapsed and stage labels are shortened. Shared panel/card/header spacing is reduced across
all five tabs, with unchanged font families/palettes and touch targets >=44px.

Current evidence: 203 APOS checks, foundation 104 and records 90 pass. Full typed-activity
browser flow rechecked (55 checks). 40 compact/help/automatic-reset browser checks passed and cover all
five tabs at 360px and 1159px in both palettes, with screenshots inspected and no horizontal
overflow. Secondary explanation stays hidden until disclosure; hover/click and keyboard
open/dismiss work. Old test data converts to zero without a prompt and other results/markers
remain. Source mathematics check also passes: 1173 graphs / 57672 selections; supported
source gammas match, while Q014/Q055/Q114 are explicitly rejected by this engine.

This is a layout/status follow-up in the same PR, not phase 8. Full-bank readiness is
still pending; docs/content-status.md records actual field counts, tab pools and the limited
two-variant teaching randomization without claiming a 150-question random teaching bank.
