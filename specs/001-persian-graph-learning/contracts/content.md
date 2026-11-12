# Static Content Contract

## Inputs

- `docs/question-bank.json`: authoritative existing IDs/metadata, currently v1.4, fetched as JSON.
- `docs/گسسته-دوازدهم.pdf`: local book source; `docs/question-bank-v1.4-report.md`
  describes v1.4 changes. `docs/content-gaps.md` is a historical v1.1 audit, not a
  current outstanding-work list.
- `content/question-overrides.json`: versioned reviewed supplements keyed by question ID.
- `content/teaching.json`: curriculumVersion, ordered stages, lesson blocks and activities.
- `content/lab.json`, `content/competition.json`: declarative activity settings.

Load and validate before enabling dependent activities. Use an index by ID, never search by
question text. Supplement fields must declare why they were added and source/reviewer status;
source meaning, sahat and question identity cannot silently change. References resolve
relative to entry/module base and work from GitHub Pages project subpaths.

## Eligibility and readiness

### Random selection amendment

Competition: each round draws distinct question IDs without replacement for its groups,
all at the same exact source difficulty (1/2/3). A difficulty needs at least as many ready
questions as groups; otherwise it is excluded. If none qualifies, starting is blocked with
an inline explanation. Repetition across different rounds is allowed. Persist all choices
before play; reload never rerolls them. Reset retains the chosen questions as already agreed.

Legacy curriculum 1 only: each stable activity draws from ready, teach-permitted selection models matching
its APOS stage and its original source question's exact difficulty. Preserve the activity's
target and completion ID; use context, graph and hints belonging to the drawn question.
Choices stay in memory during the page session and may be redrawn on explicit request or
reload. Only completion/navigation persist; no teaching question assignment or answer is saved.

Practice: each exact difficulty 1/2/3 offers «تمرین با سؤال‌های تصادفی» under the existing
easy/hard filter. Draw only ready practice items matching that difficulty and active lesson/
category filters. Redraw avoids the current ID when alternatives exist; a singleton remains
usable with an explicit message, and an empty pool produces an inline empty state. Selecting
or redrawing does not finalize or save an attempt. Existing explicit finalization rules apply.

All draws use shuffled ready pools with no metadata relabeling or unsupported graph types.
New contextual adapters require human educational review; randomization is not that review.

A question is ready if required context, response mode, hints and every answer-dependent
figure/graph are present and reviewed. A purely textual question need not have a graph.
Bank-backed legacy teaching requires its tab permission, matching APOS stage and selection-capable simple graph. Curriculum 2 uses the authored typed-activity/chain contract below; a source-bank reference, if added, must still obey its permissions and meaning.
Competition requires its tab permission and interactive_graph or compute_gamma type.
Practice maps difficulty 1 to easy, 2/3 to hard. Lab respects question permissions; custom
activities are identified separately and do not expand the 150 source question count.

No eligible candidates -> inline explanatory empty state, not a crash or unauthorized question.
An unready question appears as unavailable during development, never as a required stage
blocker. Publication requires all 150 questions ready and reachable in an allowed tab.

## Rendering and assessment

Lab builder review: family topology and layout are distinct. Verify exact path endpoint/
interior degrees, cycle regularity, star center/leaves, complete and edgeless edge counts.
Layout expresses path/star structure and avoids overlapping circles at mobile projection.
Observations name the built family, not unapplied selector settings; topology edits invalidate
the family label. Prepared 11/12-vertex models must not become custom draw records.

Plain text is rendered as text nodes. Parse $...$ and $$...$$ math segments and render with
KaTeX in isolated LTR spans. Do not execute imported HTML, URLs or TeX trust commands.
Malformed math leaves readable fallback plus an inline diagnostic. A text proof is a
self-assessed rubric activity outside teaching; no claim of automated natural-language grading.

A domination-selection teaching part explicitly declares target=dominating|minimal|minimum. Other current typed responses declare the appropriate expected values/constraints instead. Choose source
questions whose reviewed semantics support selection; do not relabel unrelated foundational
questions as domination exercises just to populate a stage. Explanatory APOS content still
covers the prescribed lessons/pages. Release review verifies this instructional mapping.

## Validation evidence

Validator checks 150 unique IDs, six category counts, APOS/tab references, three hints,
sahat counts 60/25/20/15/15/15, graph endpoint integrity and gamma consistency.
Human review verifies modeling meaning, book figures, rubrics, APOS fit and page coverage.
Machine structure checks alone do not certify instructional correctness.

## Historical v1.2 baseline and outstanding decisions

The bank contains 150 questions, 78 graph fields and 64 modeling fields. The report's
47/126 practice-ready count uses only its own source-field rule: it does not establish
runtime support, compliance with the modeling principle or human approval. All presented
questions, including text/proof, require meaningful modeled context under the constitution;
do not invent source figures or silently change a question's meaning to supply it.
Q014 is directed with null gamma and must not enter the undirected evaluator; Q055 and Q114
have 14 and 16 vertices respectively, exceeding the existing 12-vertex prepared-graph limit.
Keep unsupported cases unavailable until a verified design supports them. Q141/Q146 obtain
graphs at runtime; Q139 is a starter, and Q142/Q143 require families of graphs. A null graph
alone is not an error for a textual, student-built or runtime activity. Verify the v1.2
corrections and source figures against the local PDF and obtain human educational review.
Do not conflate a source-bank version update with a storage/backup migration: define and
test the compatibility policy before changing the existing transfer contract.

## PR#1.1 — قرارداد تأییدشدهٔ آموزش تازه

مرجع: [طرح بازنویسی APOS](../amendments/pr-1-1-apos-redesign.md). این بخش قرارداد نسخهٔ تازهٔ آموزش پس از تأیید کاربر است.

الگوی محتوای آموزش تازه سه فعالیت در هر مرحله با learningObjective، cognitiveOperation،
صورت، زمینه، responseMode، پاسخ/قیود، معیار و سه راهنماست. نوع پاسخ لزوماً انتخاب
رأس نیست. Action باید از تعریف رسمی حتی در متن منبع قابل نمایش خالی باشد؛ Object
تعریف و نماد رسمی را با مثال/ضدمثال ارائه می‌کند. درس‌های تألیفی با شناسهٔ فعالیت
آموزشی مستقل‌اند و تعداد/شناسه‌های بانک تغییر نمی‌کند. منابع بانک باید واقعاً مجاز
و هم‌مرحله/هم‌سختی باشند؛ هدف شناختی و نوع پاسخ و وابستگی مدل نیز شرط تصادفی‌سازی‌اند.

### اصلاح قطعی پس از تأیید کاربر — PR#1.1

طرح دوازده‌فعالیتی تأیید شد؛ گیت طراحی باز است. هر بند پیشنهادیِ قبلی دربارهٔ انتقال
اعتبار پیشرفت، legacyPassedStageIds یا بازماندن مراحل قدیمی لغو است. آموزش curriculum=2
برای دادهٔ نسخهٔ ۱ از صفر و فقط Action باز آغاز می‌شود. دادهٔ قدیمی ابتدا با curriculum=1
اعتبارسنجی و با تأیید مهاجرت در یک نوشتن به نسخهٔ ۲ تبدیل می‌شود؛ شکل envelope/schema=1
ثابت است. سوابق سایر تب‌ها/نشست‌ها/تم/علامت‌های حذف حفظ می‌شوند. ورود بک‌آپ قدیمی نیز
هیچ پیشرفت قدیمی را منتقل نمی‌کند؛ پیشرفت تازهٔ موجود نسخهٔ ۲ را کم نمی‌کند. واردکردن
نسخهٔ ۲ پیشرفت تازه را ادغام می‌کند. هیچ پاسخ/امتیاز/راهنمای آموزش ذخیره نمی‌شود.
قرارداد کاملِ فعال این بازنویسی در بخش ۵ ضمیمهٔ APOS آمده است. فاز ۸ مجوز اجرا ندارد.


## Phase 8 actual content audit — v1.4

Active source has 150 stable IDs, 93 graph fields and 135 modeling fields. The runtime
catalogs expose 14 practice / 26 competition / 27 lab IDs, overlapping to 40 unique IDs.
Authored APOS activities do not expand bank reachability. Source completeness is distinct
from a supported/reviewed response adapter: response_mode_by_tab takes precedence, then
response_mode, then legacy type. Special modes/figures must not be silently coerced.
The audit script emits per-ID reachability and reports missing adapters, figure mappings
and human review as release blockers. Its --write report is reproducible; it never stamps
educational approval. Current v1.4 bank loading/current-bank backup round-trip is supported;
legacy-bank semantic migration remains a separate uncompleted release prerequisite.


## اتصال کامل بانک و پرداخت نهایی — مجوز کاربر ۲۰۲۶-۱۱-۱۲

هر ۱۵۰ شناسه باید در تب مجاز مسیر پاسخ واقعی داشته باشد: ۱۲۶ مورد در تمرین و ۲۴ مورد
بدون مجوز تمرین در بخش «کاوش‌های بانک» آزمایشگاه. مجوزهای منبع تغییر نمی‌کنند.
صورت، سه راهنما و پاسخ معیار منبع حفظ شوند؛ برای پرسش‌های مرکب، رسم و اثبات، ابزار
متناسب + پاسخ نوشتاری و خودارزیابی صریح ۱۰/۰ ارائه شود؛ ادعای تصحیح ماشینی کل اثبات
یا متن ممنوع است. ۱۴ آداپتور قبلی ارزیابی خودکار خود را حفظ می‌کنند. کارگاه گراف عمومی
جهت/چندیالی/طوقه و مدل منبع تا ۱۶ رأس را نمایش/ویرایش می‌کند؛ ارزیاب ساده همچنان حداکثر
۱۲ و ابزار سفارشی اصلی ۲–۱۰ رأس است. صفحهٔ شطرنج، خانواده‌ها، ویرایش یال/رأس و تحلیل
مدل ابزار پاسخ‌اند؛ صورت سؤال چندبخشی با یک محاسبهٔ گاما خلاصه نمی‌شود.
خلاصهٔ مدل همراه پاسخ متنی تحت حد مشترک ۱۰۰۰ حرف ثبت می‌شود. فعالیت صرفاً نمایشی
سابقه نمی‌سازد. هر figure_ref به تصویر واقعی صفحهٔ کتاب با توضیح و بارگیری تنبل وصل
شود. تصویر کتاب جایگزین حدسی دادهٔ گراف نمی‌شود. Q141 معنای ریپوی مرجع را از سیاست
ثبت نتیجهٔ سایت فعلی جدا توضیح می‌دهد. APOS دوازده فعالیت ترتیبی مستقل را حفظ می‌کند.
لندینگ عمومی و پنج سربرگ در سطح کامل، ورود متن/مسیرها/مکان‌ها و صحنهٔ هندسی هماهنگ
دارند؛ کاهش حرکت، سطوح کم/خاموش، خوانایی و گراف مات حفظ شوند. نسخهٔ موبایل/دسکتاپ
هر دو تم با بانک پرشده بررسی و نتایج قبلیِ ۴۰ سؤال به‌عنوان سابقه برچسب‌گذاری شوند.


## اصلاح سوییچ، مرکز برچسب و فرمول انتخاب‌گر — ۲۰۲۶-۱۱-۱۲

قاب بیرونی سوییچ حذف و فقط ریل تم با ارتفاع۵۰px هم‌اندازهٔ ریل حرکت نشان داده شود؛
هدف لمس و نام/وضعیت دسترس‌پذیر حفظ شوند. بخش پاسخ تمرین با gap مستقل از حاشیهٔ
textarea و دکمه، فاصلهٔ ثابت داشته باشد. برچسب داخلی تمام رأس‌ها در موتور مشترک
با x=0/y=0، text-anchor=middle و dominant-baseline=central، مستقل از خط‌مبنا و جهت
فارسی وسط شود؛ حروف منبع و اعداد فارسی، حالت معمول و انتخاب‌شده بررسی شوند.
انتخاب‌گر شیشه‌ای هم گزینه و هم مقدار فعال را با همان KaTeX امن/ریاضی LTR سؤال
رندر کند؛ مقدار اصلی select و رخدادهایش عوض نشوند و نام دسترس‌پذیر از عنوان کنترل
و مقدار رندرشده ساخته شود. متن خام LaTeX در برچسب قابل مشاهده نماند.
در رابط توضیح «تفاوت نسخه‌ها» و اشاره به ریپو/نسخهٔ دیگر حذف شود. برای Q141 مکمل
سایت، صورت و راهنما و معیار را با رفتار جاری چالش هماهنگ کند:۵ گراف/۳ دقیقه، کیفیت
۰/۵/۱۰/۱۵، بدون پاداش سرعت، ثبت در سوابق. دلیل اقتباس در دادهٔ توسعه/مستندات بماند؛
سؤال خام بانک برای منشأ دست‌نخورده است و در جریان محصول نشان داده نمی‌شود.
