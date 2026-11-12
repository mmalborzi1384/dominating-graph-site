# Dropdown stacking correction — 2026-11-12

The inner question card was elevated when a select opened, but its enclosing blurred
board panel still formed a lower stacking context. Extend the existing open-select
elevation rule to glass surfaces and board panels. The :has condition releases elevation
automatically when the menu closes; no event, value, positioning or storage logic changed.

Chrome/Linux:16 cases covering practice/lab,360/1280px,day/night,up/down opening.
Hit-testing all four menu corners confirmed the menu paints above neighboring controls.
Selecting an option closes the menu and restores the board's previous stacking. No
page overflow or runtime exceptions. Mobile is browser emulation.
Polish42, practice37 and lab211 checks passed. Graphify updated.

User explicitly requested direct push without PR. /.codex/ is ignored; its tracked
hooks.json is removed from Git's index while the local file is retained. This removes
it from the current GitHub tree, not from historical commits.

See select-layer-evidence.json for browser results.
