# Persistence and Transfer Contract

## Repository boundary

Lab-review scoped deletion: `deleteLabResult(id, expectedRevision)` accepts only an existing
lab Attempt, checks current revision/write readiness, constructs the complete candidate and
commits once. It removes only that Attempt; a referencing game/challenge turn is atomically
set to finalized-deleted with null attempt reference. Sessions and spent identities remain;
scores derive from retained Attempts. Cancel/stale validation changes no stored data; failed
writes preserve old disk state and recoverable temporary work. Other tabs/progress/settings
are unaffected. This lab-only control does not implement the general Records/import UI.
Family comparison observations are in-memory only and never enter snapshots or backups.

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

Lab phase-6 details: registered custom activity IDs are lab:gamma, lab:formula, lab:bounds,
lab:minimal and lab:draw. They carry modeled snapshots and do not imply a source question
or sahat tag. Prepared unmodified models keep their permitted source ID. Editing alone
creates no record. A source model beyond custom bounds remains viewable, but an edited
custom snapshot must still satisfy 2–10 vertices.

Timed lab sessions persist five question IDs and an absolute 180-second deadline before play.
After the deadline no new Attempt can be finalized. Explicit expiration sets status=completed
and currentIndex=turns.length; unanswered turns remain pending with null result references,
and create no score/coverage. This is a narrowly validated exception to the all-turns-final
completed-state rule, only for lab sessions whose deadline has elapsed. A completed session
cannot be reopened. Future transfer must preserve this distinction from deleted results.

Download a UTF-8 JSON file with MIME application/json. Envelope:

```json
{
  "format": "persian-graph-learning-backup",
  "schemaVersion": 1,
  "curriculumVersion": 1,
  "bankVersion": "1.2",
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
Phase-7 compatibility decision: export and import bankVersion=1.2 only. Reject 1.1
with a specific preservation/migration message before any mutation: v1.2 changed source
answers and a safe mapping has not been reviewed. Never relabel, silently coerce or partially
import a 1.1 backup. Preserve the original file for a separately reviewed migration. Unknown
bank/schema/curriculum versions are also rejected. The JSON format/schema stays version 1.
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

Phase-4 graph-construction targets additionally allow optional minimumSetCountMin and
minimumSetCountMax (integers 1–1024, max >= min). Both constrain the exact count of distinct
minimum sets: Q074 requires exactly one; Q075 requires at least two. Existing targets with
neither field keep their original n/gamma behavior. These constraints are validated during
local recording and are part of the shared validation boundary for future imports.

## Explicit whole-competition reset/delete (user amendment)

Randomization follow-up: persist the full distinct-question turn schedule before the first
turn; reloading keeps it. Reset continues to retain those question choices with fresh IDs.
Teaching draws are transient and add no fields to teachingProgress or backup payloads.

`repository.manageCompetition(id, restart, expectedRevision)` is the narrow confirmed action.
It validates a complete candidate and commits once, using the same revision/conflict/quota
boundary. Generic commit still cannot remove a session or reopen spent turns. Delete removes
only the selected competition and all Attempts referencing its ID. Reset performs that removal
and creates a new active session, fresh group/turn/session IDs, the same names/order/rounds/
question choices, index zero and no consumed hints/results. It may restart a completed match;
no old finalized turn is reopened. Other sessions/results/settings/progress are preserved.
A failed write retains old disk state and clearly marked temporary memory with retry/recovery.
Confirmation against an outdated revision is rejected. Reset is refused if another match is
active or remaining record capacity cannot accommodate the full restarted match.

This explicit whole-match removal supersedes the no-session-removal rule only for this API.
US5 selected-result deletion within a retained session still requires spent tombstones and
never permits replay. No import or older-backup merge behavior is implemented by this action.

## Phase-7 implementation boundary

`transfer.js` validates the UTF-8 byte limit and exact top-level/data fields, then uses the
same envelope validator before and after merge. Shared guards are exported from validate.js;
there is no second permissive schema. Scores are recomputed and checked; reports derive
optional absent scores. `exportBackup` includes recoverable unsaved memory and excludes
revision/caches and all teaching responses. Malformed original disk bytes have a separate
raw recovery download and are never offered as a validated backup.

Same-session merge requires identical immutable metadata, ordered turn identities, question
and group context. It unions compatible finalization, takes nondecreasing hint levels/current
index/status, and rejects distinct finalized results. Matching deletion wins in both directions
and removes linked old Attempts. Candidate validation rejects any resulting score/hint
inconsistency. More than one unfinished competition or lab session rejects the entire import;
finish the current activity and review the file again. No automatic winner or partial import.

A fresh destination is an empty initial repository (revision <=1, no completion/results/
sessions); it adopts imported theme/location. Otherwise valid local theme/location win.
Union completion is ordered by curriculum and prefix recomputed. Preview explicitly warns
when completion flags are restored, including pre-reset backups. Confirmation uses the exact
preview revision; storage change requires a new preview. Cancellation performs no write.
`repository.deleteResults(ids, expectedRevision)` deletes selected live Attempts across tabs
in one commit, checks revision/readiness and retains sessions/spent markers. The existing
lab-only delete remains supported. Quota failure retains old disk and recoverable memory.

## PR#1.1 — قرارداد تأییدشدهٔ آموزش تازه

مرجع: [طرح بازنویسی APOS](../amendments/pr-1-1-apos-redesign.md). این بخش قرارداد نسخهٔ تازهٔ آموزش پس از تأیید کاربر است.

نسخهٔ آموزش ۲ با همان schema=1 و format قبلی ارائه می‌شود. برنامهٔ ثابت نسخهٔ ۱ در
content/teaching-v1.json فقط برای اعتبارسنجی داده و بک‌آپ قدیمی نگه داشته می‌شود.
مخزن پس از اعتبارسنجی، تبدیل آزمایشی محلی را خودکار انجام می‌دهد: فقط teachingProgress
صفر و curriculumVersion برابر ۲ می‌شود؛ رابط مهاجرت یا ورودیِ منتظر تأیید نداریم.
commit یک‌باره، بررسی baseline/revision و بازیابی شکست سهم مخزن است.
بک‌آپ نسخهٔ ۱ با بانک ۱٫۲ ابتدا با نسخهٔ خود اعتبارسنجی و سپس با پیشرفت ورودی صفر
ادغام می‌شود. بک‌آپ نسخهٔ ۲ پیشرفت تازه را منتقل می‌کند. برگشت به نسخهٔ ۱ رد می‌شود.
هیچ فیلد اعتبار قبلی و هیچ پاسخ/امتیاز/راهنمای آموزش به envelope اضافه نشده است.

### اصلاح قطعی پس از تأیید کاربر — PR#1.1

طرح دوازده‌فعالیتی تأیید شد؛ گیت طراحی باز است. هر بند پیشنهادیِ قبلی دربارهٔ انتقال
اعتبار پیشرفت، legacyPassedStageIds یا بازماندن مراحل قدیمی لغو است. آموزش curriculum=2
برای دادهٔ نسخهٔ ۱ از صفر و فقط Action باز آغاز می‌شود. دادهٔ قدیمی ابتدا با curriculum=1
اعتبارسنجی و با تأیید مهاجرت در یک نوشتن به نسخهٔ ۲ تبدیل می‌شود؛ شکل envelope/schema=1
ثابت است. سوابق سایر تب‌ها/نشست‌ها/تم/علامت‌های حذف حفظ می‌شوند. ورود بک‌آپ قدیمی نیز
هیچ پیشرفت قدیمی را منتقل نمی‌کند؛ پیشرفت تازهٔ موجود نسخهٔ ۲ را کم نمی‌کند. واردکردن
نسخهٔ ۲ پیشرفت تازه را ادغام می‌کند. هیچ پاسخ/امتیاز/راهنمای آموزش ذخیره نمی‌شود.
قرارداد کاملِ فعال این بازنویسی در بخش ۵ ضمیمهٔ APOS آمده است. فاز ۸ مجوز اجرا ندارد.

## اصلاح بازبینی رابط — ۲۰۲۶-۱۱-۱۲

کاربر اعلام کرد سایت هنوز انتشار عمومی نداشته و نمایش/جریان نسخهٔ قبلی لازم نیست.
تبدیل معتبر نسخهٔ آزمایشی قدیمی به آموزش صفر، در مخزن خودکار و یک‌بار انجام می‌شود؛
هیچ دکمه یا پیام مهاجرت و هیچ پیام موفقیت نسخهٔ قبلی در رابط معمول وجود ندارد.
حفظ داده‌های دیگر و بازیابی شکست ذخیره پابرجاست. این تصمیم جایگزین نیاز قبلی به
پیش‌نمایش/تأیید مهاجرت محلی است؛ ورود فایل پشتیبان همچنان پیش‌نمایش/تأیید مستقل دارد.

توضیح‌های فرعیِ رفتار برنامه به کمک اختیاری ⓘ منتقل شوند: ماوس، لمس، فوکوس/Enter و
Escape پشتیبانی شوند؛ متن در جریان صفحه باز شود، نه مودال. صورت مسئله، هدف، معیار
قبولی و هشدار واقعی ذخیره پنهان نشوند. دکمهٔ مسئلهٔ دیگر اندازهٔ محتوایی داشته باشد؛
درس‌نامه‌های کوتاه بازشونده و فاصله/پدینگ مشترک پنج تب کمتر شوند. قلم/کنتراست، برد و
هدف لمسی ۴۴ پیکسل حفظ شوند. این تغییر چیدمان است، نه شروع فاز ۸ یا تکمیل بانک سؤال.


## Phase 8 preference extension

settings requires theme and optionally motion in {off,low,medium,full}. Missing motion uses
medium without invalidating historical envelopes. A preference update preserves the other
setting; export includes it when present, import validates it through the same boundary.
Reduced motion changes effective display only, never the stored user choice. Schema remains 1.
Current bank 1.4 backups round-trip; 1.2/1.3 exports are rejected pending a reviewed semantic
migration, particularly for replaced Q134. Local historical result reinterpretation is a
separate release gate documented by the content audit.
