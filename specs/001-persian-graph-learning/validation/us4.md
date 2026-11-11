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
