# Implementation plan

## Technical context and constitution check

Static HTML/CSS ES modules, native details, local Three.js, CDP Chrome tests.
Constitution 1.4.0: no persistence/schema/scoring/curriculum changes; no backend or
build. Existing math/fonts/themes and shared renderer retained. No extension hooks
file exists. No unresolved design questions after user's scope clarification.

## Design read

Persian mathematics workbench. ENERGY 3 / RHYTHM 2 / MOTION 2.
Board first, narrow tool column, numbered task groups, single result area. Matte
surfaces and thin rules; no new illustration, badges, glow or blur. Broad UI/UX search
match was irrelevant and rejected. Narrow inline error clarity guidance supports
nearby errors with field recovery. Native details provide progressive disclosure.

## Architecture

Build lab controls once; refresh only graph on topology change. Retain tool nodes,
values and details. Shared surface exposes transient view getState/restoreState to
SVG adapters; cleanup removes it. Optional update(selected,{diagnostics}) paints
rings and text without changing owner colors/hatches. No diagnostic state by default.
Three.js reads the same SVG diagnostic class/text, adds camera-facing rings and
label text, and uses existing disposal. Existing evaluator remains sole judge.
One setFeedback live region; no duplicate announcements.

## Execution

T001 contract/baseline; T002 persistent layout; T003 shared diagnostics/state;
T004 browser coverage/regressions; T005 graphify/audit/preview/PR. Stop for review.
