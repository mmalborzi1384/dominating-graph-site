# Data Model

All identifiers are stable strings; timestamps are ISO-8601 UTC or epoch milliseconds
where a timer needs arithmetic. Persist only allowlisted fields. Content is static and
separate from user state. Schema version starts at 1; curriculum version starts at 1.

## Static content entities

| Entity | Fields / relationships | Validation |
| --- | --- | --- |
| Question | id, title_fa, category, lesson, apos_stage, tabs, difficulty, type, modeling, graph, hints, scoring, source, sahat_code, sahat_reason_fa | Q001–Q150 exactly once, category A–F, difficulty 1–3, three hints, one known sahat, valid tab list |
| ModelingContext | scenario_fa, vertex_means_fa, edge_means_fa, question_in_model_fa, optional visual asset | nonempty context/mapping/goal before publication |
| QuestionOverride | questionId, context/graph supplement, responseMode, target, review metadata | existing ID only; no silent source replacement; human-approved semantic adaptation |
| TeachingStage | id Action/Process/Object/Schema, order 0–3, lesson blocks, requiredActivityIds | exactly four, nonempty required list; prerequisites sequential |
| TeachingActivity | id, stageId, chainId, learningObjective, cognitiveOperation, difficulty, context, prompt, graph, parts, rubric, hints, prerequisites, sourceReferences, reviewStatus | 12 authored typed activities; 3 per stage; 2 compatible variants; no fabricated questionId; legacy source references retain permission/APOS constraints |
| GraphModel | vertex IDs, labeled positions, edges, directed, multigraph, optional gamma | unique IDs; edge endpoints exist; count matches n; simple evaluator rejects loops/direction/parallel edges |
| LabStation | id, title, instruction blocks, template/question references | exactly five; valid references and modeling contexts |
| CompetitionConfig | default rounds, eligible IDs, hint cap table | rounds positive integer; eligible question types and tab permission enforced |

Graph layout is a mapping from vertex ID to normalized x/y; topology and layout are independent.
For simple graphs use canonical sorted endpoint pairs and distinct edges. An empty edge set
is valid mathematics when situated in a model. Custom vertex count is 2–10; prepared graphs
may have 12. graph.gamma is verified against exact enumeration in content validation; bank
sample gamma_sets is not assumed exhaustive.

Response modes: vertex-selection, integer, graph-construction, self-assessed-text. Every
mode declares a target/expected value or a reviewed answer rubric. Teaching assessments use
only vertex-selection; other introductory material can remain instructional blocks.

## Persistent user envelope

One localStorage key: `graph-learning:v1:<normalized-base-path>`; pathname is derived from the
entry/module base, not a current hash. This separates sites sharing the same origin.

| Field | Shape | Invariants |
| --- | --- | --- |
| schemaVersion | 1 | unsupported versions rejected without overwriting |
| revision | nonnegative integer | increments on successful local commit |
| curriculumVersion | 2 (legacy 1 read only for migration) | legacy progress resets; other records preserved after validation |
| teachingProgress | object below | completion only, never answers or scores |
| attempts | map from attemptId to Attempt | excludes teach entirely |
| sessions | map from sessionId to Session | practice/competition/lab only |
| settings | theme day/night | allowlist; no arbitrary executable configuration |

TeachingProgress: `completedActivityIds`, `passedStageIds`, `lastVisitedStageId`.
Completion IDs reference known activities. Passed stages are the completed sequential prefix;
each requires all mandatory activities. Current percent = 25 * passed prefix length. Unlocked
stages = passed prefix plus the first incomplete stage; if all four are passed all are open.
Validate consistency on import; do not silently accept impossible stage jumps. No separate
persisted percentage/unlock booleans that could disagree. No per-attempt teaching timestamps,
selected vertices, correctness history, scores or hints are persisted.

## Recorded activity

Attempt: `id`, `sessionId?`, `tab` (practice/competition/lab), `questionId?`, `activityId?`,
`recordedAt`, `responseMode`, `response`, `target`, `evaluation`, `baseScore?`, `hintLevel`,
`finalScore?`, `groupId?`, `graphSnapshot?`, `durationMs?`.

- At least questionId or lab activityId exists. A custom graph attempt includes the model snapshot.
- Evaluation includes satisfiesTarget, dominates, minimal, minimum when applicable and
  uncovered/removable IDs. Numeric/text modes have mode-specific results, not fabricated
  graph properties. Self-assessed text is explicitly labeled, never reported as machine-verified.
- Text self-assessment compares to a reviewed rubric; accepted result 10, otherwise 0.
- No questionnaire, imported record or UI event can create an Attempt with tab=teach.
- Finalized response is immutable. Practice retry creates a new attempt. Competition/timed
  challenge permits one finalized answer per turn; preview is not a finalized score.

Session: `id`, `kind`, `status` (configured/active/completed), `questionIds`, `startedAt`,
`deadlineAt?`, `currentIndex`, `groups?`, `roundCount?`, `turns?`, `graphDraft?`.
Groups have stable id, name and order, count 2–10 for competition and exactly 2 in lab station 5.
Each turn has stable id, groupId (nullable for an individual timed challenge), questionId,
consumedHintLevel, resultStatus and finalizedAttemptId. resultStatus is one of pending,
finalized, finalized-deleted. pending requires finalizedAttemptId=null; finalized requires
an existing matching Attempt; finalized-deleted requires finalizedAttemptId=null and retains
only turn identity/context and consumed status, not response/evaluation/score copies.
Both finalized statuses are spent and cannot accept another answer. Deletion is irreversible
for the same turn identity, including when an older backup is imported.
Question choices and hint usage persist before display so refresh cannot grant fresh hints.
Clock uses absolute deadline; timeout is re-evaluated on visibility change and resume.
Group totals are derived from remaining finalized attempts, not independently editable totals.
Deleting a finalized result removes its Attempt, clears finalizedAttemptId and sets
resultStatus=finalized-deleted atomically. Records displays «حذف‌شده» for that turn; it has no
score/outcome/coverage contribution. The marker is session metadata, not a new Attempt.
Standalone practice attempt deletion removes that record without creating a turn marker.

## Derived reports

Teaching panel: passed stages, percent and continue target; no teaching score or attempt counts.
Other panels: attempts, outcomes, scores/hints by tab/lesson/APOS label. Coverage per sahat:
unique questionIds in remaining attempts / total bank IDs for that tag, multiplied by 100;
attempt counts separate. Custom untagged lab activities contribute activity reports only.

## State transitions

1. Teaching answer accepted -> add completion flag -> recompute passed prefix -> persist.
   Wrong answer, hint, reveal or reviewing a passed stage cannot remove any completion flag.
2. Navigate backward -> persist lastVisitedStageId if unlocked; passed flags unchanged.
3. Confirm teaching reset -> empty completion/passed flags and first-stage location; persist
   only this logical subtree. Cancel is a no-op. Other attempts/sessions/settings remain.
4. Session configured -> active -> completed; finalized turns cannot return to active.
5. Delete selected attempts -> remove exactly selected IDs -> recompute reports/totals and
   retain spent turn metadata; teaching subtree unchanged.
6. Import -> parse -> validate complete candidate -> preview -> inline confirm -> one commit.
   Same-version teaching merge unions completion flags and recomputes prefix, preserving local
   location when valid. Explicitly importing an old backup can restore pre-reset completion;
   say so in preview. Reset does not imply permanent rejection of user-chosen backups.
7. Failed write -> persisted state unchanged; in-memory work marked unsaved with export option.
   Never claim a successful save. In-memory progress can continue while storage is unavailable.

## Capacity and concurrency

### Shared user-data limits

The implementation has one source `assets/js/domain/limits.js`, used by UI validation,
local commits, export validation and both pre-merge/post-merge import validation.

| User field / collection | Inclusive maximum |
| --- | --- |
| Group name | 30 characters |
| User-entered label (vertex/graph/activity label) | 50 characters |
| Text response | 1000 characters |
| Live stored Attempt records, total across all recorded tabs | 200 |
| Stored Session objects, total across all kinds/statuses | 100 |

Character count is Unicode code points after NFC normalization; trim leading/trailing
whitespace on names/labels, but not answer text. Internal whitespace counts. Group names
and labels must remain nonempty after trimming. Apply these rules to every user-entered
copy, including graph snapshots/drafts and imports; source-bank instructional text is not
user input and is not truncated to these bounds. Tombstones stay within the 100-session
limit and are not additional live Attempt records. Completed sessions still count.
A new attempt/session beyond a maximum is refused with an inline explanation and an offer
to export/delete chosen data; never silently evict, truncate or partially commit.
Exactly 200/100 is valid. Validate the merged candidate, not just each incoming file.

Set an import file limit of 5 MiB and validate before mutation. Do not silently evict records
when quota is reached; offer selective deletion/export. Same-origin storage events refresh
clean views; a dirty active form/turn pauses commits and asks for inline reload/reconciliation.
Re-read revision before write to detect stale state. localStorage is not a multi-tab transaction
service: one active writer is supported and simultaneous-tab use is explained to users.

## Phase-7 derived data and version policy

Report objects are never persisted: per-tab/lesson/APOS attempt/correctness/score/hint
aggregates, distinct question count and six {code,label,count,total,percent} coverage rows.
Teaching flags and untagged custom activities do not contribute question coverage. Optional
absent scores are derived by the same scoring rubric. Import/export stays schema/curriculum
1 and requires bank 1.2; bank 1.1 is rejected without mutation pending a reviewed migration.
No new persistent fields or new storage engine are introduced.

## APOS curriculum 2

Envelope schema remains 1; curriculumVersion is 2. TeachingProgress retains exactly its three allowlisted fields. Valid curriculum-1 state is validated against content/teaching-v1.json and automatically converted by replacing only teachingProgress with initialProgress and curriculumVersion with 2. No legacy credit field. Curriculum-1 backup imports reset incoming old progress, while retaining existing curriculum-2 completion. Other records and tombstones are unchanged.
