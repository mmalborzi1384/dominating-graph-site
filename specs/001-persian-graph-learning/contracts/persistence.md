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
   or finalized-turn IDs with different content reject the whole candidate, not overwrite.
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
only the selected attempts; keep spent turn markers for finalized competition/challenge turns
so deleting results cannot create another scoring chance. Session totals and coverage derive
from remaining records; an empty result displays no data. Teaching progress changes only via
its dedicated reset action, exposed from Teaching and the teaching panel in Records.
