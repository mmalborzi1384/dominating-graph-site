# Phase 2 scoped board review

Date: 2026-11-10. Scope: shared SVG selection/evaluation/scoring/hints, plus the user's
liquid-glass amendment. Full foundation and user-story workflows are not claimed complete.

## Governance and scope

Constitution 1.0.0 -> 1.1.0 materially expands presentation principle IV; spec FR-025/SC-010
and plan were updated before code resumed. Existing ratification date retained. Temporary
Sync Impact Report remains for human review and must be removed before a future commit.
No commit, PR merge or deployment occurred.

T007, T009, T010 completed. T014 is partial (selection/keyboard/responsive SVG); no graph
editing/dragging. No bank-wide content readiness work, repository schema, recorded attempts,
APOS progression, real matches, reports, import/export or lab stations were started.
The review board is hosted under the existing Teaching panel but is explicitly a standalone
preview, not a teaching stage. Other tabs remain placeholders.

## Mathematical validation

`node scripts/validate-graph.mjs` passes with no package install or test framework:
1149 graphs / 53776 selections. Exhaustive simple graphs with n=2..5 plus every prepared
bank graph are compared against an independent reference using array subsets/adjacency
checks (production uses cached neighborhood masks). All targets and optimum counts match.
Bank gamma values, disconnected/edgeless/isolated cases, invalid graphs/selections and cache
invariance under vertex/edge order are checked. Every minimum set is accepted; the bank's
sample answer list is not used to reject alternatives. Maximum accepted prepared n=12 keeps
exact enumeration bounded to 4096 subsets; custom editing is not exposed here.

P5 fixtures: {a} -> 0; {a,b,c,d,e} -> 5; {a,c,e} -> 10; {b,d} -> 15. The first is not
dominating; the third is minimal but not minimum. All 4 qualities by 4 hint levels in both
modes match min(base,cap); practice never loses points. Third competition cap zero follows
the existing explicit spec assumption. A full solution also consumes that revealing tier.

## Browser review

Chrome DevTools on a temporary profile, at 1280px desktop and 360px mobile-emulated width;
not a physical mobile-device or Firefox/WebKit certification. No browser automation library
or permanent UI test suite was added. Screenshots were visually inspected.

- Exactly one visible tab panel; SVG board/model data load successfully. No runtime exceptions
  or failed asset requests observed. Other tabs remain their phase-1 placeholders.
- Click/keyboard selection updates coverage and pressed states. HTML selection buttons are
  at least 44px high; mobile graph geometry compresses horizontally to keep labels readable.
- Correctness is target-specific: all five P5 vertices are accepted for dominating (score 5),
  rejected for minimal with delete-one feedback; {a,c,e} accepted for minimal (score 10).
- Minimum {b,d} scores 15, then competition hints cap it at 10 / 5 / 0; switching the preview
  rule to practice yields 15. Consumed hint count is not reset by clearing or switching rules.
- Glass panel computed fill rgba(255,251,243,0.88) / rgba(26,43,36,0.88), blur 18px.
  SVG surface/node fills are opaque; graph backdrop-filter is none.
- Reduced motion: panel animation-name none and body transition-duration 0s.
- Script-computed worst text/glass contrast over theme paper/surface/grid is 5.74:1 day and
  6.04:1 night (all checked ink/muted/heading/error pairs >4.5:1).
- CSS fallback is an opaque theme surface outside @supports; actual unsupported-browser
  certification remains pending. Future records cards share the style but are not built.
- localStorage keys unchanged by board actions: only the prior shell theme key remains.

Screenshots: `/tmp/graph-board-desktop-day.png`, `/tmp/graph-board-mobile-night.png`.
`node --check` for all new modules and `git diff --check` pass. Graphify rebuilt after each
code slice; latest code rebuild reports 505 nodes / 755 edges, with expected unsupported
font/binary extractor warnings. Work stops here for human review.


## Repo-pattern corrections — 2026-11-11

This section supersedes earlier generic 0.88/18px glass and monochrome coverage observations.
Scope remained limited to the two requested visual corrections; no new tab workflows.

Source: `docs/repo-patterns.md`. Copied exact day/night `--panel` RGBA (alpha 0.84), all
10 fixed bead colors, all 10 day plus 10 night hatch colors, sheet/ink-soft/grid/hint values.
Glass uses 12px backdrop blur for the tab bar, question/board vessels and shared future
records-card styles. Removed nested glass on the structural workspace so actual background
is behind the panes. Fallback remains an opaque sheet, graph canvas/pieces are opaque.

Vertex color uses zero-based index in source graph.vertices modulo 10, independent of click
order, model.places order, layout and theme. Patterns are 7x7 SVG tiles with sheet background,
45-degree lines at width 2.2. Selected vertices have solid bead fill and radius 18; a larger
transparent hit area and HTML buttons preserve accessibility. Nonselected owners are N[v]
intersect S in stable source order. One owner fills the circle; multiple owners each fill
an equal circular wedge with that owner's hatch. An empty owner set leaves the sheet empty.
Numbers are Persian with a sheet-colored halo. Red missed outlines (3.2px) appear only after
checking and clear on selection/target changes, using exact day/night source error colors.

Chrome review at 1280px/360px verified:

- Selecting a fills it with bead-0 #D9A441; b receives hatch-0; c/d/e remain empty.
- After check, c/d/e have missed outlines; a selection change removes stale outlines.
- Selecting a and c makes b two equal sectors hatch-0/hatch-2; d gets hatch-2; e empty.
- Selected vertices are never divided/hatched even if covered by other selected vertices.
- A separate hidden star fixture verifies 3 equal wedges, one each for x/y/z. Modulo indices
  0/9/10/11 give 0/9/0/1. The fixture is review-only and not a new product activity.
- Bead colors are identical in both themes; hatch-0 changes exactly to #E6C484 at night.
- Computed tab/question/board blur is 12px, panel fill rgba(26,43,36,0.84) at night; canvas
  is opaque rgb(26,43,36) and has no backdrop filter. Day pane fill follows the exact source.
- Mobile width/scrollWidth both 360; reduced-motion still disables panel animation.
- No browser runtime exceptions; screenshot review confirms model and shared-coverage legibility.
- Exact token comparison against source and mathematical validator pass. Worst measured token
  contrast on composited paper/surface/grid: 6.02:1 day, 5.83:1 night for ordinary pane text.

Screenshots: `/tmp/graph-patterns-desktop-day.png`, `/tmp/graph-patterns-mobile-night.png`.
Final preview served at http://127.0.0.1:8765/#teach (local HTTP server). Actual remote hosting
and physical devices remain unverified. Browser inspection used temporary DevTools tooling;
no test framework dependency or persistent user activity was added.

## Larger vertices — 2026-11-11

User-requested radius override: visible circles, coverage circles, wedges and outline now
share radius 23 (supersedes reference radius 18). Persian vertex number grows from 18px to
23px, vertically centered with y=8; place labels move to -42/+46 local y. Edge endpoints
are inset 24 units from node centers to meet the circle boundary cleanly. Existing geometry
has sufficient space: minimum center distance 195.58 desktop / 105 mobile SVG units, leaving
149.58 / 59 units between visible disks. Both 1280px and 360px reviews show no horizontal
overflow. Two-owner wedges use A23,23 and remain aligned with the disk. Syntax/diff checks
pass and Graphify update completed (522 nodes / 772 edges). Mobile screenshot visually reviewed.
Screenshots: `/tmp/graph-radius-23-desktop.png`, `/tmp/graph-radius-23-mobile.png`.
No further workflows implemented; paused for appearance review.
