# Navigation preferences review

2026-11-21, antislop during (explicit session choice). Scope explicitly expanded by the
user during phase 1 review: move existing theme/motion controls into the selected graph
navigation window and refine that window. No graph engine or learning policy changes.

Design Read: a Persian learning map with reachable display preferences, existing garden/
coral and charcoal/turquoise palettes, Vazirmatn; ENERGY3/RHYTHM2/MOTION2.

## Decisions and evidence

The original control nodes are moved, preserving IDs, attached handlers and saved settings.
One existing glass window groups routes above preferences; no extra blur surface.
Visible motion legend and theme label make settings identifiable. Eight-pixel radio gaps
separate four44px targets; the map stays a five-node navigation diagram, not a sidebar.
Close control has a44px square target. Existing short animation describes opening and
obeys motion settings. Header now leaves navigation and brand as its two anchors.

New navigation browser acceptance:132 checks passed, no runtime exceptions.
Existing mobile/pointer regression:143 checks passed, no runtime exceptions.
Existing graph-stage regression:238 checks passed, no runtime exceptions.
Existing graph-world regression:66 checks passed, no runtime exceptions.
Both themes tested at320/390/768/1280; short600px viewport and200% text tested.
New preference text contrast on the opaque fallback surface: minimum7.335:1 day,
6.244:1 night. Glass uses the existing92% panel tint; rendered views were inspected
but no per-pixel contrast measurement of the composited translucent background is claimed.

Recorded click-through: trigger opens; close button closes; Escape from settings returns
focus; outside pointer dismisses; Tab reaches theme and radio group, then leaves without
trapping; arrows change radio choice; route arrows and Enter work; all five route clicks
reveal the correct panel; theme mouse/touch clicks change actual theme and keep map open;
all four motion options update repository and live motion state; reload restores settings;
reduced motion stops window animation; no-Popover fallback opens, switches theme and dismisses.
Screenshots inspected: /tmp/navigation-preferences-{day,night}-{390,1280}.png.

## Delivery Gate

R-01 PASS: existing palette, no new gradient.
R-02 PASS: added copy contains no em dash.
R-03 PASS: new controls measured44px minimum after opening; window fits tested widths.
R-04 PASS: existing relevant graph icon retained, no new generic icon set.
R-05 PASS: navigation map and settings follow two actual tasks, no template section.
R-06 PASS: existing Vazirmatn and inherited tokens support Persian readability.
R-07 PASS: no new background pattern.
R-08 PASS: no decorative arrows added.
R-09 PASS: no badges introduced.
R-10 PASS: same single navigation glass container, settings rail has no blur/shadow.
R-11 PASS: window20px, settings8px, route circles retain their different roles.
R-12 PASS: existing window shadow distinguishes overlay, settings do not float.
R-13 PASS: no added glow.
R-14 PASS: no feature-card grid.
R-15 PASS: labels identify real destinations and display settings.
R-16 PASS: no marketing buzzwords.
R-17 PASS: no statistics introduced.
R-18 PASS: no testimonials introduced.
R-19 PASS: existing finite opening animation, reduced-motion tested.
R-20 PASS: connected five-route map preserves graph-learning identity.
R-21 PASS: real day/night choice retained and exercised.
R-22 PASS: actual route diagram, no generic illustration.
R-23 PASS: requested layout implemented, no new visual asset generated.
R-24 PASS: five existing routes tested.
R-25 PASS: fallback text ratios above; tinted glass visually checked with stated measurement limit.
R-26 PASS: actions and changes actually exercised, listed above.
R-27 PASS: no new remote data; saved/default settings and reduced-motion notice remain.
R-28 PASS: no FAQ introduced.
R-29 PASS: theme tokens unchanged; no additional core palette.
R-30 PASS: no product cloning.
R-31 PASS: major reasons recorded in decisions above.
R-32 PASS: native controls, visible focus, Escape and nonmodal Tab exit tested.
R-33 PASS: product changes written directly with apply_patch and CSS, no replacement script.
R-34 PASS: day/night verified independently at every tested width.
R-35 PASS: running app, actual interactions and limits recorded above.
R-36 PASS: no invented performance/compliance claim.
R-37 PASS: approved palette and direction declared before building.
R-38 PASS: existing settings and destinations, no invented content.
R-39 PASS: native named controls, pointer/hover/active/focus states; no new infinite animation;
existing motion pause/reduction controls remain usable inside the window.
R-40 PASS: no new media, remote blocking script or performance number.

Liveliness PASS: dials stated and respected; route map is focal, divider/space separates
settings; active destination carries accent; connected nodes are the identity motif;
Design Read stated before changes.
C-1 PASS: composition justified by navigation and preferences.
C-2 PASS: all affected controls functional.
C-3 PASS: no filler section.
C-4 PASS: themes, keyboard, mobile and fallback verified, limits disclosed.
C-5 PASS: all numbers above come from actual tool results.

## Limits and remaining recommendation

Physical phone and native browser200% zoom not tested; Chrome touch emulation and200%
text checked. The historical combined validate-navigation-lab-browser.mjs is NOT passing:
its lab section expects an empty draw/start flow and recorded lab attempts, superseded
by the existing free lab policy. It also had an arrow-focus timing assertion fail in one
run. The new dedicated test verifies arrow focus with a settled hash route and all five
routes. The old test was not weakened or its lab assertions removed to hide the failure.
Only its Tab expectation was adapted to reach newly introduced preferences before exit.

No further visual correction recommended within this scope. Separate maintenance work
is recommended to reconcile the historical combined lab test with the current lab spec.
