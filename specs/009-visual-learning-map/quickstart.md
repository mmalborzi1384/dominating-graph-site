# Validation and preview

Use Node 26 with native WebSocket; Chrome via CHROME_BIN or /usr/bin/google-chrome.
Run phase table in plans/003-learning-map-records.md; new validator after implementation.
Preview with python3 -m http.server 8774 --bind 127.0.0.1 from feature checkout.
Open #teach and #records in both themes, 320/390/768/1280 and keyboard-only interaction.
Use temporary Chrome profile and valid in-memory repository fixture, never personal data.

Baseline (2026-11-23): APOS pure 289+395, records 90, learning browser 310, v3 browser39 passed.
Review browser 741 checks: one failure `Reduced-motion stops decorative movement`, no runtime
errors; other 740 assertions passed. Investigate timing/owning animation before deciding scope.
Mobile browser baseline running at contract creation. Final results will be appended.

## Implementation evidence

2026-11-23, Chrome headless on Linux, Node v26.5.0, isolated profiles and in-memory valid
repository fixtures. Screenshots are test data, never evidence of student achievement.

| Command | Result |
| --- | --- |
| validate-apos-v3.mjs | 289 foundation + 395 authored checks passed |
| validate-records.mjs | 90 passed |
| validate-apos-learning-browser.mjs | 310 passed, no runtime exceptions; all 32 activities and 8 fresh exits through real UI |
| validate-apos-v3-browser.mjs | 39 passed, migration cancel/failure/confirm |
| validate-graph-mobile-browser.mjs | 143 passed, no runtime exceptions |
| validate-learning-map-browser.mjs | 160 passed, no runtime exceptions |
| validate-apos-review-browser.mjs | Final run: 741 passed, zero failures/runtime exceptions; baseline intermittent timing issue below |
| git diff --check | passed |

The new test first failed on missing .apos3-unit-path before UI changes. Final tests compare
all eight units, ordered activity IDs, real prerequisite edge pairs, native disabled/current
state and locked/malformed hashes against shipped curriculum. It also covers keyboard route
focus, native touch route activation, immediate unlock before finite trace, off/low/reduced
motion, 320/390/768/1280 in day/night, 200% text stress, truthful time order, six domains,
long answer details, archive, custom select keyboard, empty filter, selective delete cancel
and confirm, import preview/cancel/confirm/parse error, quota/retry/conflict/reload, reset,
legacy migration with consumed deleted turn and teaching failed-save/retry.

Minimum measured text token contrast over matte sheet: day 6.203:1, night 4.800:1
(ink/muted/heading/error sampled with computed browser RGB). Actual heading contrast:
night 6.244:1. No new color tokens required. Desktop route horizontal, phone vertical;
no page horizontal overflow, action targets >=44px. Test checks route gaps >=8px.

Final command total: 2167 passing assertions across all seven scripts.

### Existing intermittent timing issue, outside phase 3

Baseline review validator failed `Reduced-motion stops decorative movement` before edits.
A separate diagnostic run after UI changes reproduced it: one existing `.vertex-paint`
Web Animation of duration 240ms survives an abrupt switch to prefers-reduced-motion.
The current unit-map trace uses existing animateFinite, cancels immediately when off,
and does not start for low/reduced motion; all three cases pass the new validator.
Changing shared vertex animation cancellation requires an independent authorized change
outside the four product files in this phase. Neither the shared engine nor the failing
assertion was patched or weakened. The final unchanged validator passed all741 checks;
that does not prove this intermittent cancellation behavior was fixed. A separate technical
review of shared animation cancellation/test timing remains recommended.

### Limits and review boundary

No physical phone, hardware GPU, non-Chromium browser, screen-reader speech or native
browser 200% zoom was tested. The explicit 200% check enlarges root text and tests reflow;
it does not claim to be Chrome UI zoom. Existing mobile graph validator checks shared
2D/3D interaction; no graph engine source changed. No curriculum/evidence/storage/score/
schema change and no new assets, dependencies or persisted timestamps. Server is local;
no Pages deployment is claimed before review and merge. Phase 4 remains untouched.

Preview: port 8774 from this feature checkout, #teach and #records. Before handoff verify
HTTP200 and source SHA equality. Opening an app browser tab may be queued; use the URL.
Screenshots: /tmp/learning-map-teach-{day,night}-{390,1280}.png,
/tmp/learning-map-records-{day,night}-{390,1280}.png and
/tmp/learning-map-ledger-details-night-320.png.
