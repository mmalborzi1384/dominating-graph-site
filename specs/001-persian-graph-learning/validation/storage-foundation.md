# Storage/math/feedback foundation follow-up — 2026-11-11

## Authorization and gates

User scope: complete T008, T011, T012 before phase 4, then stop for review. T006 and
T015–T017 remain unchecked and are moved to the mandatory pre-release gate. No scored
Practice, Competition, Records or Lab controller was started. Existing uncommitted Teaching
work was preserved. This follow-up does not claim full-bank or source-page readiness.

Read constitution 1.1.0, implementation plan, relevant tasks, data model, persistence/UI/
evaluation contracts, research and quickstart. The requirements checklist is read-only:

| Checklist | Total | Checked | Unchecked | Result |
| --- | --- | --- | --- | --- |
| requirements.md | 16 | 16 | 0 | PASS |

No extensions.yml exists, so no before/after implement hooks are registered. Ignore patterns
remain appropriate for the static project. No test framework, Playwright, package install,
build step, storage backend or external service was added. No commit/PR/merge/deployment.

## T008 — strict boundary and shared limits

Implemented domain/limits.js and storage/{validate,migrate}.js:

- Only version/curriculum 1; explicit absent/ready/corrupt/unsupported dispatch, no repair or
  overwrite of unsupported raw state. One explicit prior-shell theme migration remains.
- Allowlisted complete envelope, nested Attempt/Session/Group/Turn/GraphSnapshot/response
  schemas, JSON-only data, finite numbers, valid stable IDs/enums/UTC timestamps/references.
- Teaching attempts are rejected. Extra teaching fields are rejected; its persisted data
  remains only completion/navigation. Graph-dependent evaluations and scores are recomputed.
- NFC/code-point limits 30 group name, 50 label, 1000 response; trim names/labels only.
  200 live results/100 sessions inclusive, no truncation/eviction. Same validator is available
  to both sides of future import/merge and has post-merge over-capacity fixtures.
- Every finalized result has a unique matching turn reference. Pending/deleted require null.
  Deleted turns cannot keep response/score/evaluation copies. Spent turns cannot reopen or
  resurrect results across ordinary commits. Custom activity IDs need explicit registration.
- Modeled custom graphs 2–10; prepared graphs may have 12. Graph labels and normalized layout
  are validated separately from topology. Detailed wire shapes are in contracts/persistence.md.

No importer or producer factory/controller is claimed here; those later tasks will consume
this shared validator. Source questions are supplied as the existing bank catalog for
permission/graph checks, without performing the deferred content-authoring work.

## T011 — general localStorage repository

Complete-state prepare/commit API with explicit expected revision. Validation and JSON
serialization occur in memory, the exact current raw baseline is reread, then one setItem
writes the whole state. Only success increments revision. Invalid proposals change neither
memory nor disk; valid failed writes remain recoverable memory. Corrupt/unsupported raw
state is preserved for a separate original-data download; no localStorage.clear is used.

Snapshots expose read status, write outcome, conflict, warning, dirty and persisted flags.
Retry handles quota/access failure; default reload refuses dirty/conflicting work, while
explicit confirmed reload reconciles it. Recovery JSON validates memory and excludes revision,
teaching answers, hints, scores and attempt history. Old theme key deletion follows a durable
new-envelope write. Dispose removes listeners.

Clean storage events refresh state; dirty forms/work preserve local memory and pause writes.
Teaching now marks transient selections/hints as form state without serializing them. The
write check is not an atomic multi-tab lock; the existing single-active-writer rule remains.

## T012 — shared text/math/feedback

Shared math tokenizer supports inline/display delimiters and escaped dollars; unmatched
or invalid math and missing KaTeX retain readable text plus Persian inline diagnostics.
KaTeX runs with trust=false, strict error handling and bounded expansion/size. Plain text
never becomes HTML, and math spans are isolated LTR/left-aligned. Long display math scrolls
inside its container instead of widening the mobile page.

feedback.js supplies safe live feedback, target-specific selection diagnostics/hints and
normal-flow confirmations with explicit confirm/cancel, focus handling and Escape cancellation.
No native alert/confirm/prompt or modal. Teaching reset/reload/feedback and the application
storage/math notices use the shared helpers; no extra product workflow was added.

## Local validation evidence

- `node scripts/validate-foundation.mjs`: PASS, 103 meaningful boundary/transaction/math/
  feedback fixtures. Covers exact/over Unicode limits, 200/201 results, 100/101 sessions,
  merged-capacity overflow, 2/10/11 groups, source 12/custom >10, invalid field/version/ID/time/
  score/reference, tombstone/null integrity, immutable spent turn, one-write revision,
  prepare without writes, explicit revision, rejected proposal without memory mutation,
  quota/recovery/retry, clean and dirty storage events, confirmed reload, cleanup and decoder.
- `node scripts/validate-teaching.mjs`: PASS, all 46 existing progress/storage checks.
  Its previously partial record fixtures now use the strict documented schema.
- Syntax checks for changed/new modules and `git diff --check`: PASS.

The scripts are dependency-free local checks, not a test-runner or browser-driver dependency.

## Browser evidence

Chrome 157.0.8103.50 on Linux, isolated temporary browser contexts. Desktop viewport 1280px,
emulated mobile 360px, both themes. The existing 36 Teaching flow observations passed after
the shared-helper/repository integration, including all progress values/reloads, automatic
hints, reset/cancel, unsaved-write feedback and unchanged inactive tab placeholders.

22 additional foundation observations passed: KaTeX inline/display, isolated direction, literal HTML,
invalid formula/missing renderer fallback, safe live feedback, confirmation focus, Escape
cancel/focus return, explicit confirm once, no horizontal overflow in both widths/themes,
real localStorage one-write commit/rejected proposal, dirty Teaching selection versus external
storage event, confirmed reconciliation, corrupt-raw preservation and unavailable storage
with usable Teaching. No application Runtime.exceptionThrown events occurred. Final targeted
checks also cover unmatched delimiters and untrusted TeX links.

Screenshots /tmp/foundation-1280-day.png and /tmp/foundation-360-night.png were generated;
the mobile/night screenshot was visually inspected. Review-only helper fixtures were inserted
in isolated browser contexts, not shipped as a product tab. Temporary browser inspection
scripts stay outside the repository, with no driver or package dependency.

Physical mobile devices, Firefox/WebKit, real GitHub Pages/VPS hosting, complete source-book
review, full-bank content audit and import UI remain unverified/not implemented. T017's full
integrated smoke evidence is still a pre-release task; this document is only the requested
T008/T011/T012 acceptance evidence. Human feature review remains pending.

Graphify update ran after each completed code slice. Final AST index: 692 nodes, 1185 edges, 48 communities. Unsupported font/binary extractor warnings did not block indexing.
