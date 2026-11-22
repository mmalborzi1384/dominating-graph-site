# Phase 2 lab feedback review

2026-11-23. antislop during, explicit session override. Scope: plans/002-lab-feedback.md.
User clarified the initial phase-1 wording meant phase 2. No next-phase authorization.
Design Read: Persian mathematics workbench, ENERGY3 / RHYTHM2 / MOTION2.

## Decisions during implementation

Board first in document/mobile order; a narrow desktop tool column groups build,
change and check. Build/change initially collapse so checking remains near the model.
Native details retain nodes, inputs and open state across graph edits and station changes.
Existing colors, local font and matte surfaces retained; no new blur/glow or assets.
The ordinary graph stays immediate. Diagnosis is a requested overlay, never a new judge.
Solid rings/! and dashed rings/minus plus full text explain uncovered/removable vertices.
3D observes the same SVG state, preserving owner textures and selected bead colors.
Numeric gamma mismatch no longer produces success styling even with correct coverage.
One persistent live result avoids duplicate result regions. Geometry-only moves keep
renderer identity; topology reload restores view/zoom/input/focus-area choice.

## Measured validation

| Command in scripts/ | Checks | Result |
| --- | ---: | --- |
| validate-lab.mjs | 211 | passed |
| validate-practice.mjs | 37 | passed |
| validate-competition.mjs | 174 | passed |
| validate-graph-mobile-browser.mjs | 143 | passed, no runtime exceptions |
| validate-graph-hatching-browser.mjs | 34 | passed, no runtime exceptions |
| validate-graph-stage-browser.mjs | 238 | passed, no runtime exceptions |
| validate-lab-stage-browser.mjs | 192 | passed, no runtime exceptions |

Total:1029 checks across these seven commands. Baseline of the six pre-existing
commands passed before product changes. New browser test exercises actual lab controls,
not a screenshot-only fixture: all stations and prepared models, construction/error,
notes, connection mode, movement, keyboard/touch, correct/incorrect/mixed numeric
responses, no progress/attempt/session writes, no disclosure in other tabs, redraw
cleanup and state, 3D and WebGL failure. Native details Enter needed a complete CDP
keypress including text; after correcting the test event sequence both Space/Enter pass.
No product keyboard handler was introduced to mask that test issue.

Both themes at320/390/768/1280. No page overflow. New tool actions at least44px;
new action gaps at least8px. Main tool text against its opaque sheet:11.036:1 day,
10.660:1 night. Shared stage's minimum measured text contrast:7.335:1 day,6.244:1 night.
200% text at390 and1280 in both themes with reduced motion: no page overflow.
Downward custom select hit-test succeeds above neighboring tools. All changed source
remains static ES modules/CSS. git diff --check passed. No bank/domain/storage changes.

Screenshots inspected: /tmp/lab-stage-{day,night}-{390,1280}.png and
/tmp/lab-stage-three-removable.png. The dense horizontal path scrolls within the board
on phones; page itself does not overflow. No claim of physical-phone verification.

## Delivery Gate

R-01 PASS: existing theme palette, no added gradient.
R-02 PASS: new copy contains no em dash.
R-03 PASS: tested responsive widths and44px new actions.
R-04 PASS: diagnostic symbols have mathematical feedback purpose, no generic icon set.
R-05 PASS: real build/edit/check tasks define composition, no marketing template.
R-06 PASS: local Vazirmatn and shared typography tokens retained.
R-07 PASS: no new background pattern.
R-08 PASS: direction-pad arrows are actual movement, no decorative CTA arrows.
R-09 PASS: diagnostic markers identify state, no promotional badges.
R-10 PASS: no new glass layer; existing navigation/background unchanged.
R-11 PASS: role-specific board/tool/button shapes, no all-pill redesign.
R-12 PASS: no new floating-card shadow system.
R-13 PASS: no new glow.
R-14 PASS: no feature-card grid; construction sections match actual tasks.
R-15 PASS: controls name the operation, not generic marketing actions.
R-16 PASS: no marketing buzzwords.
R-17 PASS: all reported counts measured.
R-18 PASS: no testimonials.
R-19 PASS: existing details/motion policy; no new infinite animation.
R-20 PASS: actual graph workbench retains product identity.
R-21 PASS: real day/night both tested.
R-22 PASS: actual graph data, no generic illustration.
R-23 PASS: no new visual asset generated.
R-24 PASS: existing routes unchanged and no-disclosure checks cover other graph tabs.
R-25 PASS: opaque text ratios reported above; no composited-background claim.
R-26 PASS: new/retained lab actions exercised, including errors and all models.
R-27 PASS: empty selection/edges, bad construction and WebGL failure handled.
R-28 PASS: no FAQ.
R-29 PASS: existing central theme tokens, no extra core palette.
R-30 PASS: no product cloning.
R-31 PASS: major decisions justified above.
R-32 PASS: native details, keyboard/touch, valid focus and visible existing focus styles.
R-33 PASS: UI written directly with full source and apply_patch, no string-replacement UI patch.
R-34 PASS: both themes independently checked.
R-35 PASS: running Chrome workflows and visual captures, limitations below.
R-36 PASS: no invented performance/compliance/learning-mastery claims.
R-37 PASS: Design Read and dials declared before implementation.
R-38 PASS: existing educational context and domain results, no invented content/data.
R-39 PASS: named native controls, text equivalents and existing motion controls retained.
R-40 PASS: no new media/dependencies/blocking external scripts or performance figures.

Liveliness PASS: board focal point, task spacing, requested diagnosis carries accent,
shared vertex/edge motif, stated dials. C-1 PASS: decisions intentional. C-2 PASS:
controls functional. C-3 PASS: no filler. C-4 PASS: tested themes/input/fallback and
responsive cases with limits disclosed. C-5 PASS: counts and observations measured.

## Limits and remaining recommendation

Chrome headless with isolated profiles, emulated touch and software WebGL; no physical
phone, hardware-GPU matrix, screen-reader speech or native browser200% zoom tested.
200% text is not native page zoom. Topology changes recreate 3D and reset its rotation;
geometry moves retain the instance. Diagnostic shape/text/labels verified, but no claim
of GPU memory benchmark. Graphify is AST-based; unsupported asset files remain outside it.
The legacy validate-navigation-lab-browser.mjs still encodes an obsolete scored-lab flow;
it is outside this phase's allowed test list and was not weakened or reported passing.

No further visual correction recommended within phase 2. The separate legacy combined
navigation/lab test maintenance recommendation remains. Do not implement phase 3 or merge.
