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
