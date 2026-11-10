# Phase 4 / US2 Practice — 2026-11-11

Scope: T026–T030 only. No Competition, Records or Lab workflow was started. Requirements
checklist: 16 checked / 0 unchecked; no extensions.yml hooks. Prior source/content release
work T006/T015–T017 remains deferred. No build, server processing, database, package or browser
framework dependency was added.

## Delivered behavior

- Independent #practice access with lesson/category and easy (1)/hard (2 or 3) filtering.
- Eleven existing source IDs have explicit modeled response contracts in content/practice.json:
  Q001/Q004 text rubric; Q088 numeric gamma; Q075 graph construction; Q087/Q067/Q070/Q048/
  Q079/Q081/Q082 vertex selection. Source metadata and original bank file are unchanged.
  Original wording is visible within the activity. Other allowed IDs remain explicitly
  unavailable until their content is prepared; an empty ready pool gives an inline message.
- Three free sequential hints; preview does not persist. Selection uses quality 0/5/10/15;
  numeric gamma uses the source maximum (Q088=10), text rubric uses 10/0 with selfAssessed=true.
- Graph construction provides six modeled centers with accessible edge toggle buttons and
  an SVG preview. Q075 checks n=6, gamma=2 AND at least two minimum sets, without a sample-set
  comparison. Full Lab construction/dragging tools remain deferred to their own phase.
- Final submit appends one stable-ID record through the strict repository; controls lock
  even if the valid result is only in unsaved memory. Retry creates a fresh ID. Preview,
  answer inputs and hints flag the form dirty for cross-page conflict protection. Saved
  practice records contain source IDs, response mode/response/evaluation/hints/base/final
  scores and UTC time. No practice action changes Teaching progress.
- Shared append validation enforces text/label/capacity rules, immutable record identity,
  valid question/session references and exclusion of Teaching attempts. Existing repository
  failure recovery/retry remains available; capacity refuses the new result without eviction.

## Validation

`node scripts/validate-practice.mjs`: PASS, 32 checks. These cover source-tab eligibility,
lesson/difficulty filters, unready pool, all four response modes, free hints 0–3, quality
0/5/10/15, repeat-ID rejection, retry identity, unchanged Teaching progress, fraction/text
boundaries, 201st-result refusal, modeled construction and multiple minimum sets.

Existing scripts also PASS: validate-foundation.mjs (103), validate-teaching.mjs (46).
Syntax checks and git diff --check passed. Graphify updated after each code slice.

Actual browser observations: Chrome 157.0.8103.50 on Linux, isolated temporary browser context,
1280px desktop and emulated 360px mobile, both themes. Fifteen observations passed:
independent Practice entry, three free hints retaining selection quality, double finalization
blocked, distinct retry record, numeric gamma persisted with source score, rubric outcome
persisted as self-assessment, constructed C6 accepted for Q075, Teaching unchanged, unready
pool explained, no horizontal overflow at four width/theme combinations, five recorded
attempts surviving reload and no application Runtime.exceptionThrown events. Two initial
inspection assertions used the wrong source difficulty/maximum and were corrected to the
bank's preserved values (Q087/Q088 hard, Q088 maximum 10); product metadata was not changed.

Screenshots generated at /tmp/practice-{1280,360}-{day,night}.png. Mobile/night was visually
inspected for readable controls, glass containers, opaque radius-23 vertices and modeled text.
Inspection scripts are temporary development tools outside the repository; no Playwright or
browser-driver dependency was installed.

Human educational review of the selected adaptations remains pending, as do the full-bank
readiness audit, physical mobile/Firefox/WebKit and actual-host verification of this new tab.
GitHub Pages stays on the merged main version until the user reviews and merges this PR.
No merge or external publication of phase 4 was performed. Stop here for human review.
