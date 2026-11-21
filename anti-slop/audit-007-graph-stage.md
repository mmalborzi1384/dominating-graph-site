# Shared graph stage delivery gate

Scope: phase 1 shared frame and tools only, 2026-11-21. Antislop during, session override.
Design Read: Persian mathematics workbench for grade twelve; ENERGY3/RHYTHM2/MOTION2.
This is a scoped component review, not a claim that every legacy page was audited.

## Evidence

- Pure graph workspace: 317 checks passed.
- Chrome mobile/pointer: 143 checks, no runtime exceptions.
- Workspace browser: 31 checks, no failures or runtime exceptions.
- Coverage hatching browser: 34 checks, no failures or runtime exceptions.
- Graph world browser: 66 checks, no runtime exceptions.
- New stage browser: 238 checks, no runtime exceptions.
- New controls tested across 320/390/768/1280 in day/night. Measured minimum text contrast
  7.335:1 day, 6.244:1 night on the actual computed opaque surfaces.
- Native Enter expands; Escape restores and returns focus, two cycles per mode and size.
- 2D/3D switches retain zoom and selection; expansion retains SVG and canvas identity.
- Zoom in/out/reset, mobile/desktop switch, vertex mouse/touch selection and dragging,
  source mode/lock and cancellation exercised in mobile regression.
- Teaching/source adapters create independent shared frames and destroy cleanly.
- Outside Escape leaves the board expanded. Loading status appears before lazy import.
  Denied WebGL shows error status and leaves 2D usable.
- All new controls have at least 44px targets, normal tool spacing at least 8px.
- 200% text size and reduced-motion layout checked. Native browser zoom at 200% and
  physical phone hardware were not tested; touch uses Chrome emulation.
- Screenshots: /tmp/stage-day-390.png, /tmp/stage-night-390.png,
  /tmp/stage-day-1280.png, /tmp/stage-night-1280.png visually inspected.

## Hard Gate

R-02 PASS: no em dash in newly authored UI copy.
R-03 PASS: tested widths fit the viewport; tools wrap and targets measured at least44px.
R-17 PASS: no new statistics; zoom percentage is actual view state.
R-18 PASS: no testimonials introduced.
R-23 PASS: no visual asset generated; frame and controls implement approved plan.
R-24 PASS: no navigation change or ghost link.
R-25 PASS: new title/tool text minimum ratios measured above.
R-26 PASS: all new actions and existing view/zoom/device actions exercised, recorded above.
R-27 PASS: empty status hides; existing loading/error state retained and tested.
R-28 PASS: no FAQ introduced.
R-32 PASS: native buttons, real Enter and scoped Escape; explicit focus-visible outline.
R-33 PASS: product changes written directly using apply_patch and CSS declarations.
R-34 PASS: both themes tested in every required layout width.
R-35 PASS: static app run, six validators and recorded control interactions above.
R-36 PASS: no new security/performance/customer claims.
R-37 PASS: approved palette and workbench direction declared before implementation.
R-38 PASS: title from actual SVG accessible name or caller; no invented content.
R-39 PASS: new controls native/named/pointer/active/disabled/focus states; no perpetual
motion introduced, existing global reduced-motion rules apply. Whole document unchanged.
R-40 PASS: no new media, external script or late asset; 3D remains loaded on interaction.

## Purpose Gate

R-01 PASS: existing theme tokens retained; no new gradient.
R-04 PASS: text controls, no decorative icon set or asset.
R-06 PASS: existing Vazirmatn for legible Persian, inherited typography.
R-07 PASS: no new background pattern; graph-world remains unchanged.
R-08 PASS: no decorative arrows.
R-09 PASS: no badge introduced.
R-10 PASS: matte component; no new blur or nested glass.
R-12 PASS: frame border establishes work area, no floating shadow added.
R-13 PASS: no new glow, focus outline only signals keyboard position.
R-14 PASS: no feature-card template introduced.
R-19 PASS: only existing token-driven state transitions, no entry choreography added.
R-22 PASS: real editable graph is the visual subject, no generic illustration.

## Liveliness

PASS explicit dials: ENERGY3/RHYTHM2/MOTION2, inherited identity and short interaction cues.
PASS consistent dials: a bounded work area with subdued tools, no animation spectacle.
PASS focal point: the actual graph precedes its tools.
PASS structural whitespace: caption, canvas and tools are separated by purpose.
PASS deliberate accent: existing heading tone marks active view and focus boundary.
PASS identity motif: vertices, coverage and relationships remain the product's visual motif.
PASS Design Read recorded before generation and above.

## Craftsmanship and quality locks

C-1 PASS: palette/font retained for identity; named groups reduce tool ambiguity.
C-2 PASS: each control has tested behavior, no placeholders.
C-3 PASS: no unrelated section introduced.
C-4 PASS: tested states/themes/breakpoints and native keyboard; limits stated above.
C-5 PASS: only measured verification and actual graph state reported.
R-05 PASS: composition follows a mathematics board, no marketing template.
R-11 PASS: frame14px, tool8px, existing circular vertices retain different roles.
R-15 PASS: action labels specify focus/restore/view/zoom.
R-16 PASS: no marketing buzzwords introduced.
R-20 PASS: coverage ownership and connected models retain graph-learning identity.
R-21 PASS: existing functional day/night choice preserved.
R-29 PASS: central palette unchanged; coverage owner colors are existing semantic data.
R-30 PASS: no product cloning.
R-31 PASS: decisions and one-line reasons recorded in spec plan and this report.

No additional change recommended within phase 1 scope. Remaining phases await authorization.
