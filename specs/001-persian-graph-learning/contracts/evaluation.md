# Evaluation Contract

## Domain inputs / output

Input: simple undirected graph G=(V,E), selected unique IDs S subset V, and requested target
`dominating`, `minimal` or `minimum`. Unknown IDs or incompatible graph kind are validation
errors, not wrong student answers. Positions never enter mathematical evaluation.

Output: `dominates`, `minimal`, `minimum`, `satisfiesTarget`, `uncoveredVertexIds`,
`removableVertexIds`, exact `gamma`, and a diagnostic code with parameters.

- Dominates iff union of closed neighborhoods of S equals V.
- Minimal iff dominates and no selected vertex can be removed while retaining domination.
- Minimum iff dominates and |S|=gamma(G); compute exact gamma, never infer it from a sample set.
- satisfiesTarget selects the property named in the question. A minimum set satisfies all
  three targets. A dominating nonminimal set satisfies only the dominating target.
- Base score: not dominating 0; dominating/nonminimal 5; minimal/nonminimum 10; minimum 15.

Exact enumeration in increasing subset size supports current prepared graphs <=12 vertices.
Every optimal selection is accepted. Recompute/cache by canonical topology after edge changes;
dragging invalidates layout only. Large future graphs require explicit reviewed limits, not
an unbounded UI-blocking search.

## Feedback / hints

First explain the requested-target failure: uncovered vertex if non-dominating; removable
vertex if minimal is requested; smaller-set possibility if minimum is requested. Do not
mark a correct weaker-target answer wrong for not being minimum.
Teaching wrong submission automatically reveals one inline contextual hint before any full
solution action; subsequent hints/reveal are explicit and never create stored attempts.
Revealing an answer does not itself mark completion. Existing three bank hints are reviewed
for target relevance; generic gamma hints must not contradict the current target.

## Score caps

| Base quality | Practice, any hints | Competition 0 hints | 1 hint | 2 hints | 3 hints |
| --- | --- | --- | --- | --- | --- |
| 0 | 0 | 0 | 0 | 0 | 0 |
| 5 | 5 | 5 | 5 | 5 | 0 |
| 10 | 10 | 10 | 10 | 5 | 0 |
| 15 | 15 | 15 | 10 | 5 | 0 |

Third cap zero follows the explicit spec assumption. Teaching shows correctness/diagnostics,
not an accumulated score. Numeric gamma responses in competition must use vertex selection
as the response interaction for the quality table; original question type and IDs remain.
Other practice integer answers use reviewed exact expected values; correct=declared maximum,
incorrect=0. Self-assessed-text uses the bank 10-point rubric and is labeled accordingly.

## Finalization and fairness

Practice may preview/retry; finalized attempts are distinct records. In competition, hints
are counted once per reveal level per turn and persisted immediately; score is committed
once on final submit. Show current cap before accepting hint. No editing a finalized turn.
At timeout, reject new answers even when the timer callback was throttled in a hidden tab.
Equal positive round count gives each of 2–10 groups the same turn count, with same-difficulty
question allocation from the eligible pool. Pool exhaustion repeats only across completed
cycles and is disclosed. Equal totals have shared rank; no hidden tie-break rule.

## PR#1.1 — قرارداد تأییدشدهٔ آموزش تازه

مرجع: [طرح بازنویسی APOS](../amendments/pr-1-1-apos-redesign.md). این بخش قرارداد نسخهٔ تازهٔ آموزش پس از تأیید کاربر است.

علاوه بر انتخاب رأس، پاسخ موقت آموزش می‌تواند مجموعهٔ یال، توالی مسیر، پیش‌بینی
مجموعه، پاسخ‌های عددی و دسته‌بندی/توجیه ساخت‌یافته باشد. هرکدام ارزیاب متناسب خود
را دارد؛ ترتیب نمایش مجموعه‌ها/دو سر یال مؤثر نیست، ولی ترتیب گام‌های مسیر مؤثر است.
قبولیِ کارت چندجزئی به درستی تمام اجزای الزامی وابسته است. متن آزاد اختیاری قفل را
باز نمی‌کند و تصحیح زبانی خودکار ادعا نمی‌شود. قواعد امتیاز تمرین/مسابقه تغییر نمی‌کند.

### اصلاح قطعی پس از تأیید کاربر — PR#1.1

طرح دوازده‌فعالیتی تأیید شد؛ گیت طراحی باز است. هر بند پیشنهادیِ قبلی دربارهٔ انتقال
اعتبار پیشرفت، legacyPassedStageIds یا بازماندن مراحل قدیمی لغو است. آموزش curriculum=2
برای دادهٔ نسخهٔ ۱ از صفر و فقط Action باز آغاز می‌شود. دادهٔ قدیمی ابتدا با curriculum=1
اعتبارسنجی و با تأیید مهاجرت در یک نوشتن به نسخهٔ ۲ تبدیل می‌شود؛ شکل envelope/schema=1
ثابت است. سوابق سایر تب‌ها/نشست‌ها/تم/علامت‌های حذف حفظ می‌شوند. ورود بک‌آپ قدیمی نیز
هیچ پیشرفت قدیمی را منتقل نمی‌کند؛ پیشرفت تازهٔ موجود نسخهٔ ۲ را کم نمی‌کند. واردکردن
نسخهٔ ۲ پیشرفت تازه را ادغام می‌کند. هیچ پاسخ/امتیاز/راهنمای آموزش ذخیره نمی‌شود.
قرارداد کاملِ فعال این بازنویسی در بخش ۵ ضمیمهٔ APOS آمده است. فاز ۸ مجوز اجرا ندارد.
