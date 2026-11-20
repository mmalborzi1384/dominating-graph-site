# Validation guide

These are implementation acceptance commands, not results from this planning session.

## Prerequisites and baseline
Use Node, Python3 and Chrome; existing browser scripts choose Chrome, CHROME_BIN may override. No npm install/build/lint/typecheck command exists for this static product. Run from repository root. Existing CDP script starts its own static server; inspect its port before parallel runs. For manual preview use `python3 -m http.server 8768 --bind 127.0.0.1` then open http://127.0.0.1:8768/ .

Run each applicable command; expected exit 0 and its success summary:
```sh
node scripts/validate-polish.mjs
node scripts/validate-foundation.mjs
node scripts/validate-graph.mjs
node scripts/validate-graph-workspace.mjs
node scripts/validate-apos-v3.mjs
node scripts/validate-teaching.mjs
node scripts/validate-practice.mjs
node scripts/validate-competition.mjs
node scripts/validate-lab.mjs
node scripts/validate-records.mjs
node scripts/validate-navigation-lab-browser.mjs
node scripts/validate-graph-workspace-browser.mjs
node scripts/validate-apos-v3-browser.mjs
node scripts/validate-antislop-browser.mjs
```
Do not run content validation with --write during planning. Baseline failures are not caused by this plan and must be recorded before changes. In implementation run relevant checks per plan and all commands for final acceptance. The planned `node scripts/validate-atlas-browser.mjs --story US1` does not exist yet; create it in US1, then extend it for US2-US6. Without a story flag it must run all implemented scenarios.

## Test matrix and expected outcomes
Widths 320,390,768,1280,1440; day/night; off/low/medium/full plus OS reduced motion; 200% zoom representative desktop/mobile layouts. All five hash routes, direct load and refresh. No document horizontal overflow (scrollWidth <= clientWidth+1), no clipped Persian text/formula, no hidden focus; board-local overflow only where existing dense-graph behavior requires it. Actual controls >=44x44px. Capture initial and final states, measure text contrast in both themes.

| Story | Reproducible scenario | Expected |
|---|---|---|
| US1 | Long scenario and mixed Persian/KaTeX in teach/practice; inspect each remaining section | readable hierarchy, body >=16 CSS px, no cut math or text |
| US2 | select nodes with one/multiple owners then change day/night and 2D/3D | same selections/owners, readable text/edges/focus, contrast table |
| US3 | build graph, connect/disconnect, move via drag/keyboard/direction buttons, collapse group, resize | graph topology, coordinates and selections retained; no attempts/sessions added; disabled storage still works |
| US4 | rapid select/remove, uncovered result, change theme/view during effect, then leave tab | last authorized state wins; no stale animation/resource leak; pre-prediction coverage absent; off gives same result |
| US5 | fresh, partial and complete progress fixtures; activate current/completed/locked step | same percentage/unlocks as baseline, locked reason readable, fresh exit cannot be bypassed |
| US6 | toggle map/graph/back, activate CTA, repeat with keyboard and reduced motion | same five places/edges, text equivalent and correct #teach link, no repeating animation |

## Interaction evidence required per changed control
Record action -> observed result -> theme/viewport -> console outcome. Include hero toggle and CTA; theme/motion controls; route lesson/unit/step and locked reason; lab station, family, model build, prepared selection, n/gamma drawing, select/connect mode, vertex/edge controls, movement buttons, group disclosures, check/hint/solutions/clear; 2D/3D and no-WebGL fallback. Also smoke-test practice submission, competition rounds, records import/export/delete and navigation open/Escape/outside close after shared style changes. Expected no dead controls and no new console errors.

## Evidence artifact
Write `validation/phase-01.md` ... `phase-06.md` under this feature with command results, measured contrast, screenshots, interaction ledger, known limitations and PR URL. Screenshots and records contain synthetic test data only. Add stable assertions to scripts; do not call screenshots automated proof of aesthetics. No public Pages deploy, commit, push or merge is part of the current planning request.
