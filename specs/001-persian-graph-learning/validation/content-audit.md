> Historical phase-8 snapshot before the full-bank follow-up. **Current status: [bank-integration.md](bank-integration.md)**. Previous counts of40/150 and missing figure mappings are superseded.

# Phase 8 — content audit / T053

2026-11-12. Source: question-bank.json **1.4**, active APOS curriculum **2**.
Command: `node scripts/validate-content.mjs --write` (dependency-free).
**Expected exit 1: release gates remain open.** No source question or answer was rewritten.

| Check | Actual result |
| --- | --- |
| Stable Q001–Q150, answer/default mode/3 hints, category/sahat/stage/tab/difficulty | 150; no structural errors |
| Source graph/modeling fields | 93 / 135 |
| Active authored APOS rubric witnesses | 12, every variant accepted by typed evaluator |
| Configured question IDs: practice / competition / lab | 14 / 26 / 27 |
| Union reachable in an allowed tab | **40 / 150** |
| Not connected to an allowed runtime catalog | **110**; per-ID list in content-reachability.json |
| Supported simple source graph gammas ≤12 | 82 checked, 0 mismatches |
| Book figure references without mapped runtime figures | **10**, including Q001 already exposed as adapted text |
| Educational reviewer/source-page approval | **Not obtained** |

Machine gamma evidence is supplemented by validate-graph.mjs: **1180 graphs / 61688
selections** against an independent reference, all optima accepted and scoring checked.
Three-vertex replacement Q134 has not been silently reduced to the old single-C4 activity.
Having a supported default source mode does not create a renderer or assess the whole prompt.
The old source report's “150 usable” means source completeness, not these runtime counts.

## Unresolved release prerequisites

- T006/T015–T017: integrate reviewed current-bank adapters, response_mode_by_tab precedence,
  source context, all allowed modes, figures, version/meaning compatibility. They remain unchecked.
- Directed/multigraph models stay outside the simple domination engine. Q055 (14), Q114 (16)
  and Q115 (13) exceed its 12-vertex bound. No topology/size was guessed to bypass the bound.
- Fifteen null modeling fields are not automatically bank errors; product presentation still
  requires meaningful scenario/vertex/edge/goal supplements where appropriate.
- Q141 source says no report/speed bonus; current product stores ordinary challenge outcomes.
  This source/product conflict needs explicit content policy resolution, not a silent change.
- Existing local Attempts lack per-record bankVersion. Old records, especially Q134, need a
  reviewed compatibility policy. Current-bank export/import repair does not solve this migration.
- meta.counts.by_type says text=30, compute_gamma=40; actual values are **31 / 39**.
  The source was preserved; the machine report records these as metadata warnings.
- Every book-page/rubric/figure claim needs a named human educational review of pp.32–54.
  No teacher approval, PDF figure completion or five-student outcome is inferred from scripts.

Full per-ID evidence: [content-reachability.json](content-reachability.json).
T053 remains open; local polish is reviewable, full product publication is blocked.
