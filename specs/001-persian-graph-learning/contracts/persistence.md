# Persistence and Transfer Contract

## Repository boundary

Read returns validated state or an explicit absent/corrupt/unavailable result. Commit accepts
a complete next state plus expected revision, validates/serializes in memory, checks current
revision, then performs one localStorage.setItem. Unknown schema versions are never overwritten
with defaults. Corrupt raw state remains available for user export/recovery. There is no
remote storage or server API. Prefix keys by application and normalized deployment base path.

Teaching writes use an explicit progress allowlist. An attempt payload with tab=teach is
rejected. Reset replaces only teachingProgress with empty completion, empty passed prefix
and first stage location. Never call localStorage.clear(). Failure preserves old persisted
state and marks current work unsaved; an inline status must not claim successful reset/save.

## Export format

Download a UTF-8 JSON file with MIME application/json. Envelope:

```json
{
  "format": "persian-graph-learning-backup",
  "schemaVersion": 1,
  "curriculumVersion": 1,
  "bankVersion": "1.1",
  "exportedAt": "2026-11-10T00:00:00Z",
  "data": {
    "teachingProgress": {
      "completedActivityIds": [],
      "passedStageIds": [],
      "lastVisitedStageId": "Action"
    },
    "attempts": {},
    "sessions": {},
    "settings": {"theme": "day"}
  }
}
```

This empty example is a valid initial state, not a question/attempt schema example.
Do not export revision or derived report caches as authoritative data. Never export teaching
responses, selected vertices, hint counts, score or attempt history.

## Import protocol

1. User selects a JSON file <=5 MiB; parse as data, not code.
2. Validate format/schema/curriculum/bank compatibility, allowed fields, bounded strings and
   collections, enum values, graph references, timestamps, finite numbers and IDs. Reject
   dangerous object keys and executable markup. Recompute derived score/coverage where possible.
3. Validate complete referential consistency before mutation. Conflicting duplicate attempt
   or finalized-turn IDs with different content reject the whole candidate, not overwrite, except for the explicit
   same-turn deletion precedence below.
4. Prepare preview: counts added/deduplicated, teaching progress before/after, whether an
   imported backup restores completion cleared by an earlier reset, and settings policy.
5. Inline confirm commits the complete merged state in one write; cancel changes nothing.
6. Return added/deduplicated counts or explicit validation/quota/revision-conflict error.

Same-version teaching merge unions valid completion IDs and recomputes the sequential passed
prefix. Preserve local last visited stage if valid, otherwise use imported valid location.
Imported zero progress cannot reset existing progress; reset is a separate confirmed action.
Existing local theme wins on merge; a fresh profile adopts imported settings. Exact duplicate
attempts/sessions deduplicate; active-session conflicts pause for user reconciliation rather
than starting two copies of a competition. Incompatible schemas/curricula are rejected until
an explicit tested migration is available. No generic best-effort data coercion.

## Deletion

Preview selected stored records and affected derived reports, then confirm inline. Delete
only the selected attempts; for a finalized competition/challenge result, atomically set
its turn resultStatus=finalized-deleted and finalizedAttemptId=null. Keep stable turn identity
and spent status, remove all result/response/score copies and display «حذف‌شده» in Records.
No turn in finalized or finalized-deleted may be replayed. pending has null attempt reference;
finalized must reference an existing matching Attempt; finalized-deleted must not reference one.
Export/import carries these statuses and validates these rules, so deletion creates no dangling
reference. A tombstone contributes neither a score nor a question-coverage attempt. Session totals and coverage derive
from remaining records; an empty result displays no data. Teaching progress changes only via
its dedicated reset action, exposed from Teaching and the teaching panel in Records.

## Deleted-turn merge precedence

For the same session/turn identity and matching question/group context, finalized-deleted
wins over pending or finalized on either side. Remove the associated incoming/local Attempt
from the merged candidate; never resurrect the response, score or scoring opportunity from
an older backup. This is an intentional conflict exception, shown in preview. Identity/context
mismatch still rejects the complete import. Re-importing the marker is idempotent. Ordinary
practice deletion without a turn marker retains the existing general record-merge policy.

## Identical local/import limits

Use the shared rules in [data-model.md](../data-model.md): name 30, label 50, text response
1000 Unicode code points, 200 live Attempt records, 100 Session objects. Use the same NFC/
whitespace normalization, enum checks and capacity code for UI/local commit and file import.
Reject length overflow rather than truncate. Check both incoming data and the fully merged
candidate; show counts/violations in preview and leave existing state untouched on failure.
These count limits do not guarantee storage quota: a setItem quota failure remains recoverable.

## Implemented foundation API and schema details (T008/T011/T012)

`validateStoredEnvelope(value, curriculum, context)` is the shared boundary for local commits
and future import candidates both before and after merge. It returns a normalized deep copy,
never mutates input, rejects unknown fields at every modeled level, unsafe object keys,
accessors/non-JSON objects, nonfinite values, bad enums/IDs/times and broken references.
`context.questions` is the source question array, used for tab permission, graph and numeric
expected-value checks; registered custom activity IDs are supplied in `context.activityIds`.
Without a catalog, Q001–Q150 remain the only known source IDs and graph-dependent records
need a modeled snapshot. Custom IDs are rejected unless explicitly registered. Loading and
reviewing the whole source bank is separately deferred under T006/T015–T017.

The optional `graphSnapshot` (also `Session.graphDraft`) has `graph`, `modeling`, optional
`places` and optional `label`. `graph` allows only n/vertices/edges and optional directed=false,
multigraph=false, exact gamma. `modeling` requires scenario_fa, vertex_means_fa, edge_means_fa,
question_in_model_fa. `places`, when present, contains exactly one `{id,label,x,y}` per vertex;
x/y are normalized to [0,1]. All user labels use the shared 50-character rule. Modeled user
text uses the 1000-character text limit and must be nonempty for the four modeling fields.
Custom graphs allow 2–10 vertices; prepared source snapshots may have 12.

Attempt required fields: id/tab/recordedAt/responseMode/response/target/evaluation/hintLevel,
plus at least questionId or registered activityId. Optional fields are exactly those in the
data model. baseScore/finalScore are either both absent or both equal recomputed scores.

| Response mode | response / target | evaluation |
| --- | --- | --- |
| vertex-selection | unique vertex-ID array / dominating, minimal or minimum | complete output of evaluateSelection, checked against exact graph evaluation |
| integer | integer / gamma | satisfiesTarget and expectedValue, checked against exact gamma; competition uses selection instead |
| self-assessed-text | normalized text / rubric | boolean satisfiesTarget and selfAssessed=true; 10 or 0, unavailable in competition |
| graph-construction | simple graph / `{n,gamma}` | satisfiesTarget, n and exact gamma; response and modeled snapshot topology must agree |

Record timestamps and startedAt use valid ISO-8601 UTC strings (fractional seconds optional).
The absolute `deadlineAt`, when present, is an epoch millisecond integer >=startedAt.
Session requires id/kind/status/questionIds/startedAt/currentIndex, and allows only the optional
fields documented in the data model. Group objects are exactly id/name/order with contiguous
zero-based order. Competition requires 2–10 groups, positive roundCount and turns; active or
completed allocation gives each group exactly roundCount turns. Lab groups, when present,
number exactly two. A finalized turn must point to one matching result (session, question,
group and consumed hints), and a result cannot belong to two turns. Pending/deleted turns
have null pointers. Deleted turns reject response/score/evaluation fields. A completed
session cannot contain pending turns. Producer lifecycle controllers are later features.

`createRepository(curriculum, storage?, context?)` exposes:

- `snapshot()` with validated in-memory state, readStatus (absent/ready/corrupt/unsupported/
  unavailable), dirty/conflict/persisted/warning, and structured lastResult.
- `prepare(nextState, expectedRevision)` validates without mutation or storage; success returns
  normalized nextState with the expected revision, ready for `commit(nextState, expectedRevision)`.
- `commit(nextState, expectedRevision)` rejects malformed/stale proposals without changing memory;
  valid candidates become recoverable memory if storage fails. It rechecks the exact raw
  baseline, then performs one setItem. Only successful writes increment revision. It returns
  a boolean; detailed saved/invalid/conflict/unsaved status is available in snapshot.lastResult.
- `changeProgress`, `resetTeaching` and `setTheme` provide narrow updates. Only resetTeaching
  permits completion removal, and it modifies only teachingProgress. Ordinary commits preserve
  finalized result content, completed sessions, spent-turn identity/status and consumed hints.
- `setEditingDirty(token, boolean)` protects transient forms from external updates. Teaching
  registers its temporary selections/hints without serializing them. Clean storage events
  refresh the view; dirty forms/work pause writes until explicit reconciliation.
- `retry()`, `reload({discardUnsaved:true})`, `recoveryJSON()`, `originalJSON()` and `dispose()`
  support errors and cleanup. Reload of dirty/conflicting work requires explicit confirmation;
  default reload refuses it. Recovery validates memory again and omits authoritative revision.

Version dispatch lives in migrate.js: schema/curriculum 1 are validated; unsupported versions
are preserved until a real reviewed migration exists. Only the prior shell theme is migrated,
and its old key is removed after a durable new envelope. There is no generic coercion, eviction,
partial multi-key save or localStorage.clear. The check-before-write protects stale revisions
but does not provide a transactional multi-tab lock; one active writer remains the contract.
