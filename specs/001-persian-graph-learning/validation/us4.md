# Phase 6 / US4 Lab — 2026-11-11

Scope: T037–T045 and the remaining shared position editor from T014. Reread constitution,
spec and tasks; used merged phase-5 main as base. Existing checklist has no unchecked items
and no extension hooks are registered. This slice stops before phase 7 and requires human PR
review; no merge or production deployment is authorized.

## Delivered

Five data-driven station views: direct gamma exploration, family/formula investigation,
bounds/edge effects, delete-one minimality versus exact minimum, and local two-group game.
Every board includes model context and vertex/edge meanings. Custom builder n=2–10 includes
path/cycle/complete/star/edgeless networks and add/remove edges; ready source models load
independently of custom bounds. Positions are independently editable by pointer drag, SVG
arrow keys or explicit movement buttons, with collision avoidance. The shared selection
board remains unchanged unless its editable wrapper is used. Graphs remain opaque and use
existing token colors/hatching. All minimum sets can be inspected; a P6 counterexample
shows {b,d,f} minimal but not minimum. Formula text distinguishes examples from proof.

Draw-by-n/gamma validates input and evaluates the student's actual graph, reporting actual
n/gamma and target mismatch. Only explicit activity submission creates an Attempt. Custom
records use registered activity IDs and modeled snapshots, without source/sahat claims.
Unmodified source records use source IDs; unsupported edited custom models are rejected.

The lab game has exactly two stable groups and one finalized turn each, stored under lab.
Timed challenge saves five chosen permitted models and an absolute deadline before display;
reload/visibility/tick/submit recheck it. Expiration completes the session without fabricating
unanswered Attempts. Retained finalized results determine summaries. Teaching is untouched.
Details of unanswered timeout turns and registered activities are in persistence.md.

## Validation

- `node scripts/validate-lab.mjs`: 107 checks passed, including all family gamma values for
  supported n, bounds, n endpoints/invalid values, alternative optimums, the minimal-versus-
  minimum example, untagged custom result, complete game/challenge, reload-shaped expired
  session, no replay and no fabricated timeout scores.
- Existing checks passed: foundation 104, teaching 46, practice 37, competition 174,
  random-selection 136. Syntax and diff whitespace checks passed.
- Chrome isolated-profile browser checks: 20 observations passed: five station destinations,
  2/10/11 custom bounds, keyboard move, explicit gamma/draw save, counterexample, two-group
  completion, challenge reload schedule preservation, expiration after visibility signal,
  unchanged teaching progress, 360/1280 day/night without overflow and no runtime exceptions.
- Separate actual pointer-input check moved a vertex without selecting it; no runtime errors.
  Mobile/night screenshot visually inspected. Temporary browser scripts/screenshots remain
  outside the repository; no Playwright/build/runtime dependency was introduced.
- Graphify update completed before review.

Physical-device and Firefox/WebKit validation, external host verification and human educational
review are not claimed. New contexts/examples await human review. Full-bank content readiness
and Records analytics/import/deletion remain separately tracked work.

## Browser comments 1–5 follow-up

1. Replaced the uneven five-item two-column movement layout with a labeled vertex picker
   and a four-button directional cross. All buttons have equal dimensions in both widths.
2. Replaced the quadratic all-pairs list with two labeled vertex selectors and one add/remove
   action. Opt-in connection mode supports two clicks on board vertices or their buttons;
   selecting the same first vertex cancels, and same-vertex dropdown pairs reject loops.
   Existing paths appear as touch-sized removal chips inside a collapsed details element.
3. Reproduced the cause of the reported internal error: Q037 has 11 vertices and was sent
   as a custom draw snapshot, whose limit is 10. Preflight now explains the size mismatch
   and creates no Attempt. Edited large-source activity saves receive the same clear guard.
   Normal prepared-source analysis remains supported; internal storage paths are hidden.
4. Split custom construction, prepared source and draw targets into labeled fieldsets with
   a separate target-n input. Display current actual vertex/edge counts; unapplied selector
   changes do not claim to modify the board. Added path/star-aware layouts, exact topology/
   degree checks and mobile nonoverlap checks. Family observations use the built family.
5. Rechecked real station behavior. Added a direct numeric gamma check and transient family
   observations; verified bounds after an edge change and the minimal/nonminimum example.
   The two-group game and challenge workflow were rerun successfully.

Latest validation: 201 local lab checks pass; existing foundation 104, teaching 46, practice
37, competition 174 and randomization 136 pass. Original 20 lab browser observations pass
again. A further 42 Chrome observations pass, checking rendered topology for all five
families across n=2/3/6/10 where valid, pair and board connections, loop rejection, large-
source message/no write, gamma/formula/bounds/minimal station results, movement symmetry
and no overflow at 360px and 1159px in day/night. No runtime exceptions were observed.
Screenshots of desktop tools and mobile movement/connections were visually inspected.
These are emulated mobile browser checks; physical-device/Firefox/WebKit limits still apply.
No new phase or merge was started. Graphify updated before review.

## Second clarification review (five browser questions)

- The observation button now explains its purpose and lifetime: a comparison of family,
  vertex count and exact gamma in page memory. Samples deduplicate; each note and the entire
  list can be removed. Formula math uses isolated KaTeX. Notes are never score records.
- Active station title/goal updates immediately under the selector, with a jump/focus action
  to its dedicated task. Numeric gamma input appears only where it is used. Shared model
  tools remain common; game/task differences are explained in editable lab content.
- Save explains persistent browser storage. Added a lab-only recorded-result list with inline
  confirmed deletion. Ordinary lab Attempts disappear; referenced game/challenge results
  atomically leave finalized-deleted/null spent markers. No replay is granted. Other Attempts,
  progress, sessions and settings remain. This is a narrow precursor to general Records UI.
- The global lesson/page cards are explicitly identified as noninteractive curriculum scope.

Latest local lab script: 211 checks pass (including scoped deletion, unrelated record/progress
preservation, stale revision rejection, quota preservation/retry and spent-marker/no-replay).
Foundation 104, practice 37, competition 174, teaching 46 and randomization 136 pass.
New Chrome isolated-profile flow: 20 observations pass: note add/deduplicate/remove/clear,
all five title/task changes, save/list/delete/cancel/reload, explanatory lesson scope,
360/1159 day/night without horizontal overflow and no runtime exceptions. Desktop station
intro and mobile note/results screenshots visually inspected. No physical-phone, Firefox/
WebKit or external-host claim. Spec/tasks/plan/contracts/README updated; Graphify refreshed.

## Populated saved-row text collapse correction

Reproduced with three saved draw results: global secondary-button width:100% plus flex-shrink:0
consumed the desktop row. At viewport 1159, text width was 0px and row height 1261px. Changed
saved rows to flexible-text/intrinsic-action grid and explicitly overrode action width. Title,
score and isolated semantic time now have separate elements. Observation row buttons received
an equivalent width override; mobile rows remain stacked with full-width actions.

After correction: at 1159 text width 806px, action width 116px, row height 80px; at 360 text
width 250px and row height 141px. Both themes had no page overflow or runtime exceptions.
Populated desktop/night and mobile/day screenshots visually inspected. No records/schema
changed. UI contract/tasks note updated; Graphify refreshed before review.
