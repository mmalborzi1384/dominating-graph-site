# Validation guide

Product: static HTTP server, no build/install. Checks: Node26 and local Chrome temporary
profiles. Run commands in plans/004-interactive-neighborhood.md, then the new
scripts/validate-neighborhood-browser.mjs. Baseline logs /tmp/phase4-baseline-*.
Baseline: foundation104, migration39, graph-mobile143, world66 passed. Legacy
navigation-lab failed before changes due to obsolete lab contract, reported separately.

Open disclosure, select all five by SVG/native buttons, reset, try views/zoom/focus;
all tabs, both themes, phone/desktop. Test validated returning progress, blocked storage,
migration and conflict. No learning award for exploring. Final evidence follows tests.

## Observed results, 2026-11-23

| Command | Observed result |
| --- | --- |
| node scripts/validate-foundation.mjs | exit0,104 checks |
| node scripts/validate-apos-v3-browser.mjs | exit0,39 checks, errors[] |
| node scripts/validate-graph-mobile-browser.mjs | exit0,143 checks, errors[] |
| node scripts/validate-graph-world-browser.mjs | exit0,66 checks, errors[] |
| node scripts/validate-lab-stage-browser.mjs | exit0,192 checks, errors[] |
| node scripts/validate-learning-map-browser.mjs | exit0,160 checks, errors[] |
| node scripts/validate-neighborhood-browser.mjs | exit0,135 checks, errors[] |
| node scripts/validate-navigation-lab-browser.mjs | same baseline failure at line80, absent lab-draw-start; obsolete scored/manual lab contract |

Seven valid suites:839 assertions. The legacy failure is not included as a successful
suite; its source/assertions remain untouched. New acceptance also runs against clean
main via NEIGHBORHOOD_TEST_ROOT and fails at the missing native disclosure, as expected.
Initial harness root-MIME and Persian substring matching mistakes were corrected in the
new validator; no existing assertion was weakened to mask a product regression.

New coverage: exact neighbors/incident edges for all5places, exclusive/toggle/reset,
native mouse/touch/keyboard and disclosure Tab, persisted unit CTA, all-complete review,
other activity draft retention, snapshot unchanged by exploring/views, both themes and
all5hashes at320/390/768/1280, 44px/8px, measured matte text minimum day7.335/night6.244,
actual hovered CTA contrast>=4.5, 200% root-text reflow at320/1280, reduced-motion,
delayed and failed curriculum, denied storage, isolated invalid/dirty/migration/conflict
snapshots, reconnect/destroy, shared3D and no-WebGL fallback. No public test API added.

Screenshots inspected: /tmp/neighborhood-{day,night}-{390,1280}.png. Hover contrast and
mobile label readability were corrected during implementation, before delivery.

Limits: actual Chrome on Linux, emulated CDP touch and software WebGL; no physical
phone, Safari/Firefox, assistive-technology speech or hardware-GPU testing. 200% text
simulation is not native browser UI zoom. No measured field CLS/Lighthouse numbers.
Fixture completion flags prove navigation behavior, not learner mastery. No Pages
publication or merge performed. Previously documented shared animation-cancellation
race remains out of scope. Antislop gate: anti-slop/audit-011-neighborhood.md.
