# Phase 4 / US2 Practice — 2026-11-11

Scope: only T026–T030, against source bank v1.2 and the existing T008/T011/T012 foundation.
Read constitution, spec, plan, tasks and content/persistence contracts. The requirements
checklist has 16 checked items and zero unchecked items; no extension hooks are registered.
This slice stops for human review before any subsequent phase.

## Delivered behavior

- Independent practice with lesson/category/easy=1/hard=2-or-3 filters, empty and unready
  states. 14 activities use existing permitted IDs; source text and metadata are preserved.
- Selection uses exact target assessment and quality scores 0/5/10/15. Integer gamma,
  explicitly self-assessed text (10/0) and graph construction (15/0) are separate modes.
  All three hints are free. Construction includes Q074's unique optimum and Q075's multiple
  optimum requirement; count constraints are also checked by shared storage validation.
- Preview does not persist. Finalization creates one immutable Attempt, locks its controls
  and shows feedback; retry gets a fresh ID. Existing teaching flags remain unchanged.
  Failed writes retain clearly labeled temporary work; the shared repository handles retry,
  revisions and quota, and rejects a 201st live record without losing teaching progress.
- Q007 and Q037 retain their source modeling meaning with explicit coverage mappings.
  Q074 adds a service-center context without changing its graph-construction requirement.
  These adaptations await human educational review. No approval is claimed.

## Verification

- `node scripts/validate-practice.mjs`: 37 checks passed (filters, modes, hints, scoring,
  independent progress, finalization/retry identity, text/capacity bounds, uniqueness).
- `node scripts/validate-foundation.mjs`: 104 checks passed.
- `node scripts/validate-teaching.mjs`: 46 checks passed.
- `node scripts/validate-graph.mjs`: 1173 graphs / 57672 selections independently checked.
  Updated this pre-v1.2 checker to assert rejection of Q014/Q055/Q114 instead of feeding
  unsupported graphs to the production evaluator. Their gamma is not verified by this check.
- Local headless Chrome through its debugging protocol, without Playwright or installed
  browser-driver dependencies: 15 scenario observations passed. These include all four modes,
  all three free hints on a minimum response, finalization lock, retry ID, reload persistence,
  unchanged teaching progress and no page overflow at 360/1280 in day/night. No application
  runtime exceptions were observed. Scripts and screenshots remain temporary in /tmp.
  Desktop/day screenshot was visually inspected after theme transitions completed.
- Static serving used Python http.server, no product build or backend. Browser evaluation
  used an isolated temporary Chrome profile; no existing student storage was modified.

## Limits and review boundary

Only 14 of 126 practice-permitted source IDs have explicit usable activity contracts here;
others are marked unavailable rather than incorrectly assessed. The report's 47/126 source
field count is not UI readiness. Full-bank adaptation, book-figure and human educational
review remain T006/T015–T017/T053. Q014 directed and Q055/Q114 large models remain gated.
No competition, lab, analytical Records, import or deletion flow was added. Real mobile,
Firefox/WebKit and external hosting were not checked in this slice. No PR merge is authorized.
