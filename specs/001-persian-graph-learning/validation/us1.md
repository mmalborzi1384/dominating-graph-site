# US1 / phase-3 Teaching review — 2026-11-11

## Authorized scope and task status

The user requested rereading constitution/spec/tasks, implementing only the Teaching tab,
and stopping for human review. Constitution 1.1.0, the complete specification, tasks,
plan/research/data-model/contracts/quickstart were reread. Requirements checklist: 16/16
checked, no unchecked items. No extensions.yml exists, so no before/after implement hooks
were registered. No reviewer checklist markers were changed.

T018–T023 and repository integration of T013 are implemented. T024 (the initial Records
progress panel) is explicitly deferred by the latest “do not start other tabs” instruction.
T025 remains unchecked for the Records/transfer integration still to come; its Teaching-only
acceptance evidence follows. Other tab controllers were not created. Existing placeholders
remain. No commit, PR, merge or publication was performed; human review is still pending.

## Delivered behavior

- Four ordered stages, two required activities each; 0/25/50/75/100 percent derives from
  the completed sequential prefix. No independent unlock/percentage flags exist.
- Graphs and IDs from the source bank: Action Q087/Q088; Process Q067/Q070; Object
  Q048/Q079; Schema Q081/Q082. Allowed tab/APOS and exact gamma are validated before use.
- Editable lesson blocks in content/teaching.json and model contexts/layout/hints/adaptation
  reasons in content/question-overrides.json. Original question/title remain accessible
  in each card. Source bank is unchanged. Supplemental review status is ready-for-user-review,
  not a fabricated human approval. These eight activities are not a full 150-question audit.
- Target-specific assessment accepts nonminimal dominating sets for a dominating request
  and nonminimum minimal sets for a minimal request. Minimum assessment accepts all optima.
- Wrong answers show inline diagnostics plus a free relevant hint before a separately
  requested solution. Hints are sequential. Solution reveal neither selects vertices nor
  records completion. Teaching has no score view or score aggregation.
- Previous/continue and stage selector enforce unlocks; #teach/Stage links cannot bypass
  prerequisites. Prior passed stages never relock on wrong review answers.
- Completion flags and last visited stage survive refresh; no answers, selected vertices,
  hint levels, attempts, teaching timestamps or scores enter localStorage.
- Confirmed inline reset clears only teachingProgress. Cancel is a no-op. Failed writes
  show unsaved status, preserve old raw data and permit recovery download/retry.

## Persistence boundary

Key graph-learning:v1:<module-base-path>, schemaVersion=1/curriculumVersion=1 and revision
increment after a successful atomic setItem. Progress has only completedActivityIds,
passedStageIds and lastVisitedStageId. Repository patches progress/theme only; unrelated
attempts/sessions are preserved exactly. Its partial validation of existing record containers
is not the future full Attempt/Session/import schema (T008/T011 remain open).

The old shell theme is migrated and its key removed only after the new envelope is durable.
Corrupt/unsupported raw data is not overwritten. Revision plus raw-baseline checks prevent
stale commits; storage events update clean state or stop dirty writes. Use one active writer;
localStorage cannot provide a true multi-tab transaction. Reload reconciliation requires an
inline confirmation. Recovery download is a failure/recovery action in Teaching, not the
Records import/export feature; import remains unimplemented.

## Lightweight local validation

`node scripts/validate-teaching.mjs`: PASS — 8 modeled activities, 4 stages, 46 checks.
Includes partial flags, all progress values, forbidden later-stage navigation/completion,
extra progress-field rejection, old/unknown curriculum/schema/corrupt raw preservation,
quota/denied storage, retry, reset preserving unrelated records/settings, revision conflict,
recovery allowlist and successful/failed legacy theme migration.

`node --check` passed for added/changed teaching/data/storage/math/theme/app modules.
`git diff --check` passed. No package, test runner, Playwright, browser-driver download or
product dependency was added. Mathematical evaluator itself was unchanged.

## Actual browser review

Chrome 157.0.8103.50 on Linux; isolated incognito browser context via temporary DevTools
inspection scripts in /tmp, without adding any browser automation dependency to this project.
Desktop viewport 1280px and emulated mobile viewport 360px, both themes. This is browser
viewport evidence, not a claim of physical mobile-device, Firefox or Safari verification.

36 flow observations passed: fresh locks/0%, blocked direct links, automatic hints before
solution, reveal without completion, dominating nonminimal acceptance, partial refresh
without selections/hints, smaller-set and removable-vertex diagnostics, accepted minimal
nonminimum sets, all progress steps through 100% with refresh, alternate optimum, previous
navigation, last-stage restoration, wrong review preserving all unlocks, allowlisted storage,
reset cancel/confirm/durability and visibly unsaved write/reset failure. Four other tabs
retained their unavailable placeholders. No Runtime.exceptionThrown events occurred.

11 additional checks passed: graph circles and labels do not overlap in every stage at
1280/360px; no horizontal overflow; static /site/ subpath loads with its own storage key;
HTML-looking content stays text and invalid TeX has readable Persian fallback. Minimum
circle gap across stage models: 74 SVG units on desktop / 59 on mobile (radius stays 23).
Reduced-motion disables entrance animation. Locally vendored math/font requests succeeded.

Screenshots inspected: /tmp/apos-initial.png, /tmp/apos-360-night.png and
/tmp/apos-mobile-process.png. The latter shows a six-vertex model with selected and shared
hatched coverage. Final preview is http://127.0.0.1:8765/#teach.

## Remaining review gates

Human educational review of supplemental contexts/APOS lesson text, exact book page/figure
coverage and the full-bank readiness audit remain T053. Records progress/reset and full
transfer allowlist need their later integration. Real GitHub Pages, Windows/Linux VPS,
Firefox/WebKit and physical touch-device checks were not performed. No new release claim.

Graphify was updated after each code slice; final AST update completed with 601 nodes, 955 edges and 46 communities. Unsupported font/binary extractor warnings are expected; they do not prevent the
source AST index from updating.
