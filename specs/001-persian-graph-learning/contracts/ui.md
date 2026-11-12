# User Interface Contract

## Navigation and shared presentation

Five top-level hash destinations: #teach, #practice, #competition, #records, #lab.
No additional top-level page flow, modal, browser alert/confirm/prompt or popup. Unknown hash
opens Teaching with a clear default. Browser back/forward and direct hash links preserve
state and cannot bypass APOS locks. Use accessible tablist/tab/tabpanel roles, arrow-key
navigation and visible focus. Buttons and graph selections work with keyboard and touch.
Dragging has a keyboard/button position alternative and cannot accidentally submit answers.

Document language fa and RTL; ordinary text right-aligned. Math/Latin vertex lists are
isolated in LTR spans with unicode-bidi:isolate and left alignment. KaTeX renders only math
segments with trust disabled. Text/labels are not innerHTML. Content images have Persian
alternative descriptions and associated vertex/edge meaning.

Theme variables define every font/color including SVG strokes, fills, focus, status and
patterns. Semantic classes consume tokens. Day/night use the bank's educational paper/green
family; validate normal-text contrast >=4.5:1. Coverage/error use pattern/text in addition
to color. Mobile 360px must expose usable controls without overlapping math/graph labels.

## Teaching

Show four APOS sections, overall progress 0/25/50/75/100, pass/lock states and reason for lock.
Provide previous/continue controls limited to unlocked stages, a stage selector and a
confirmed inline start-over control. A passed stage stays unlocked even after a wrong review
answer. Refresh restores the last visited unlocked stage and saved completion flags.
Each activity shows context, objective/rubric, stage-appropriate typed response, check, inline diagnostics/hint and
separate reveal action. No teaching score table, attempt log or stored selected vertices.
Records has a dedicated progress summary with continue and reset, not teaching score analytics.

## Practice / competition

Randomization controls: Teaching displays cognitive stage and exact difficulty separately. Curriculum 2 redraws a complete compatible stage chain, not an isolated dependent card, without changing progress. Practice's
question picker offers «تمرین با سؤال‌های تصادفی» for each exact difficulty and a next-random
button; lesson/category constraints remain active. Competition describes different random
questions at equal exact difficulty per round; insufficient capacity blocks start inline.
Legacy saved competitions retain their assignments; new draws never rewrite an active schedule.

Practice: lesson/category/easy-hard filters, question selection, free sequential hints,
feedback, final submission and retry. Text/proof response compares to an explicit rubric and
records the student's self-assessment as such. Competition: group count/names, rounds, current
group/round, selected graph response, current hint cap and final submit. Hint consumption
survives refresh. Finalized turn disables scoring inputs and advances on explicit action.

## Lab

Saved-result rows reserve flexible width for title/metadata and intrinsic width for Delete
on desktop; global full-width button styles must not collapse the text column. On mobile,
stack metadata and action. Render title, score and isolated semantic time separately;
verify populated rows, not just empty panels, in both themes.

Second review: show station title/goal immediately under the selector and provide an in-page
jump to its task heading. Common building/editing tools remain shared. Formula observations
show family, n (vertices), gamma (minimum centers), session-only lifetime, deduplication and
individual/clear-all removal. They are never presented as saved scores. Near Save, explain
local persistence and link to a lab-only saved-results details panel. Every deletion requires
inline confirm/cancel; list empty/deleted states truthfully. The shared lesson/page cards
are labeled as noninteractive curriculum scope references, not navigation controls.

Lab review amendment: distinguish custom builder, prepared-model loading and n/gamma target
with separate labeled groups and an explicit current-model summary. Custom input changes
apply only on Build. Target n is independent of prepared-model size. Use an equal-sized
four-direction pad on mobile and desktop; vertex labels match board numbering.
Replace all-pairs edge buttons with a two-select add/remove control and an opt-in board
connection mode (two vertex clicks); clicking the first vertex again cancels. Existing
edges remain removable in a collapsed list of touch-sized chips. Reject loops without change.
Large prepared models remain usable for analysis; custom-draw submission over 10 vertices
is refused before recording, with an actionable Persian message and no internal field paths.
Gamma has an explicit numeric check, formula has transient family observations, bounds update
after edge changes, minimality has a verified counterexample, and station 5 remains a real
two-group session. Verify these behaviors and both layouts/themes during review.

Five station selectors inside the Lab tab, never extra top-level tabs: gamma calculation;
formula discovery; bounds/edge effects; minimal versus minimum; two-group game.
Shared tools: modeled 2–10 vertex custom graph, add/remove edges, drag vertices, draw to n/gamma,
selected-set coverage and delete-one test. Timed challenge exposes 5 graphs/180 seconds with
absolute deadline and final result. Show before/after gamma on topology changes; never call
pattern observation a proof. Preserve directed/multigraph introductory displays separately
from simple-undirected custom domination tools.

## Records / transfer

Teaching progress panel plus practice/competition/lab analysis. Six-sahat coverage counts
unique bank question IDs with recorded attempts only; teaching flags and free lab edits
cannot fabricate sahat evidence. Allow row selection, inline delete preview/confirm/cancel,
JSON export, import preview/confirm/cancel and explicit validation errors. Finalized turns
whose result was removed display «حذف‌شده» and never expose a replay action. Report unknown or
empty data honestly; storage failure is visible throughout, with export for unsaved work.

Group names accept at most 30 characters, user labels 50, and text responses 1000 under
the shared normalization/counting rules. Show length errors inline. At 200 live results or
100 sessions, refuse additional storage with export/selective deletion options. A failure
must not claim persistence or silently discard existing records.


## Liquid-glass amendment (constitution 1.1.0, FR-025)

Use shared glass container tokens/classes for tab bar, question cards, board vessel and
future records cards. Background translucency and backdrop blur belong to the vessel, never
to a parent opacity/filter that blurs text or graph children. Keep the graph canvas, nodes
and pieces opaque; coverage hatching/text are additional to color. Retain educational
palettes and >=4.5:1 normal-text contrast on the composited background. Use an opaque theme
surface when backdrop filtering is unsupported. Tab/card entrance and theme transitions
are brief; prefers-reduced-motion removes all nonessential animation/transition.


Exact visual reference: `docs/repo-patterns.md`. Use --panel rgba(255,251,243,0.84) /
rgba(26,43,36,0.84) and 12px blur; all bead/hatch tokens come verbatim from the reference.
Vertex identity is zero-based graph.vertices index modulo 10. Selected=solid own bead;
nonselected=equal wedge per owner in N[v] intersect S, each with owner's 7x7/45-degree/2.2px
hatch on sheet. Empty=sheet. After assessment only, missed vertices get 3.2px error rings.

## Phase-7 Records controls

Progress/continue/reset is separate from scored history. Outcomes include explicit text
self-assessment; response details are collapsed, formulas use KaTeX/LTR spans, timestamps
are bidi-isolated. Filter history by recorded tab; row checkboxes select exact Attempt IDs.
Delete preview states count and affected spent turns, with inline confirm/cancel. Deleted
rows have no response/score or replay control. Analyses update from remaining records.

Import uses a labeled JSON file input, <=5 MiB byte guard, validation message and a preview
of added/deduplicated/suppressed results, sessions, progress and settings policy. Preview is
not a save. Confirmation checks the captured revision; cancel/Escape writes nothing. Reject
old/incompatible versions and conflicting active sessions explicitly. Export is labeled as
unsaved work when necessary; retry/reload/raw recovery remain inline. Cards share glass
styles and token colors, mobile buttons fill width while desktop buttons remain intrinsic.

## PR#1.1 — قرارداد تأییدشدهٔ آموزش تازه

مرجع: [طرح بازنویسی APOS](../amendments/pr-1-1-apos-redesign.md). این بخش قرارداد نسخهٔ تازهٔ آموزش پس از تأیید کاربر است.

Action ابزار اتصال و پیمودن مسیر و انتخاب مرکز با زبان روزمره دارد. Process مدل
ثابت و ورودی پیش‌بینی دارد؛ ابزار آزمون/نمایش زندهٔ پوشش خاموش است. Object درس‌نامهٔ
رسمی خردشده با مثال/ضدمثال و پاسخ مفهومی دارد. Schema نگاشت/ساخت/حل/توجیه/نقد مدل
تازه را در همان تب ترکیب می‌کند. هر کارت هدف و معیار موفقیت را پیش از پاسخ و راهنما
را پیش از پاسخ نمونه نشان می‌دهد؛ جواب نمونه قبولی نیست. آموزش قدیمی هیچ اعتباری در این مسیر ندارد؛ پیشرفت تازه با نسخهٔ ۲ مشخص است. هیچ پاپ‌آپ یا نمرهٔ آموزشی اضافه نمی‌شود.

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

## آموزش قدم‌به‌قدم — اصلاح بازبینی ۲۰۲۶-۱۱-۱۲

در هر لحظه فقط یک فعالیت آموزش ساخته و نمایش داده می‌شود؛ عنوان/صورت/ورودی سؤال‌های
آینده در صفحه یا در کارت‌های قفل‌شده آماده نمی‌شوند. ناوبری APOS فقط مرحلهٔ جاری و
مرحله‌های قبلاً بازشده را نشان می‌دهد. شمارندهٔ کوچک «قدم x از ۳» عنوان آینده را لو نمی‌دهد.
قبولیِ تمام اجزای فعالیت، با راهنما یا بدون راهنما، تکمیل را ثبت و خودکار فعالیت بعدی
را آشکار می‌کند؛ پاسخ غلط و صرف دیدن پاسخ نمونه هیچ پیشروی نمی‌آورد. پس از سومین
فعالیت، ساختار APOS بعدی خودکار باز و فعال می‌شود؛ پایان دوازدهم کارت پایان مسیر دارد.

گذار وابسته به پاسخ است: تأیید کوتاه، روشن‌شدن مسیر سه‌نقطه‌ای و تعویض نرم کارت؛ بدون
فلش/صدا/حرکت مداوم یا پاپ‌آپ. توکن زمان مرکزی، prefers-reduced-motion، فوکوس عنوان
سؤال جدید و جلوگیری از دوبار ثبت/جلو زدن هنگام تعویض الزامی است. تغییر تم یا تازه‌سازی
نباید نوبت دیگری را خودکار پاس کند. بازگشت به فعالیت‌های باز و مرحله‌های قبلی ممکن است؛
مرور نادرست قفل‌ها را برنمی‌گرداند. پس از refresh اولین فعالیت ناتمام مرحلهٔ جاری
بازیابی می‌شود؛ فقط پیشرفت و محل مرحله ذخیره‌اند، نه پاسخ یا حالت انیمیشن.


## Phase 8 — bounded motion

Each mounted panel has one compact, decorative landing illustration with its own motif.
Panels switch in <=180ms using opacity and small RTL-aware translation; same-tab hash changes
must not replay transitions or steal focus. Tab semantics/inertness change immediately.
Glass reveal animates backdrop blur only on containers, never graphs or descendants.
Radio rail off/low/medium/full has native arrow/Space behavior and 44px targets. Effective
motion is off under prefers-reduced-motion irrespective of saved preference; announce this.
Off cancels active Web Animations, CSS movement, counters and APOS transition delays; low
uses only short opacity/color responses; medium/full provide bounded progressive detail.
Graph entrance affects a nested visual group, preserving geometric translate/hit targets;
bead and coverage transitions do not change canonical colors, ownership or topology.
Feedback uses an explicit symbol and text; numeric counters expose the final accessible value
and never announce every frame. Progress rings have a final semantic percentage, with the
native progress element retained accessibly. New unlocks alone receive a finite lock-open cue.


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


## بازبینی کنترل‌ها و متن انتشار — ۱۵ نظر مرورگر، ۲۰۲۶-۱۱-۱۲

فاصلهٔ برچسب درمانگاه از دایره افزایش یابد؛ کادرهای راهنمای دو درس و توضیحشان،
«متن اصلی بانک» تکراری و نشان آمادهٔ بازبینی از رابط محصول حذف شوند. عنوان مشترک فقط
«گراف و مدل‌سازی» باشد. وضعیت واقعی بازبینی در مستندات باقی بماند، نه پابرگ محصول.
تم با switch شیشه‌ای متحرک و لوگو فقط در سطح کامل با حرکت محدود نمایش داده شوند.
همهٔ selectهای تک‌انتخابی به کنترل شیشه‌ای درون‌صفحه‌ای بدون مودال ارتقا یابند؛ select
بومی برای قرارداد value/change حفظ ولی از مسیر فوکوس/خواندن مخفی شود. فهرست دارای
role listbox/option، انتخاب با لمس/Enter/Space، جهت‌ها/Home/End، Escape و خروج از کنترل
باشد؛ فهرست بلند جست‌وجو و اسکرول هم‌تم داشته باشد. انتخاب/disabled/بازسازی پویا همگام
بمانند. هدف لمسی حداقل۴۴px حفظ شود. هیچ پنجرهٔ جدید یا dialog محصول اضافه نشود.
فوکوس رأس مربع نداشته باشد؛ نشان دایره‌ای focus-visible برای کیبورد حفظ شود. checkbox/
radio و کنترل فایل ظاهر هماهنگ بگیرند؛ ریـل حرکت دست‌نخورده بماند. فرمول کوتاه inline
اسکرول نداشته باشد و اسکرول لازم فرمول بلند/فهرست‌ها توکن‌های تم را مصرف کند.
کنترل‌های انتقال در grid، چهار اقدام اصلی آزمایشگاه در چهار ستون دسکتاپ/دو ستون موبایل
و سایر دکمه‌ها با عرض محتوایی و فاصلهٔ کم باشند. این پولیش منطق ارزیابی/ذخیره را تغییر
نمی‌دهد. بررسی موبایل۳۶۰/دسکتاپ۱۲۸۰ و دو تم، لمس و کیبورد الزامی است.


## بازبینی انتخاب رأس و فاصلهٔ کنترل‌ها — ۲۰۲۶-۱۱-۱۲

تمام بسترهای انتخاب رأس، از جمله کارگاه مدل منبع، موتور نمایش/انتخاب مشترک داشته
باشند: رنگ ثابت اندیس، مهرهٔ مات، ضربهٔ انتخاب، هاشور تک/چندمالک و پوشش تدریجی.
انتخاب صرف نباید SVG را دوباره بسازد یا فوکوس را از دست بدهد. ماژول مشترک نمایش از
ارزیاب گراف مستقل بماند تا گراف بزرگ/جهت‌دار/چندیالی به ارزیاب ساده وارد نشود؛
برای مدل خاص فقط انتخاب نمایش داده شود و احاطه‌گری بدون جهت جعل نشود.
بین کنترل‌های قدم و مرحله، و دکمه‌های همسایه در تمام بخش‌ها فاصلهٔ واضح باشد.
فقط شکل سوییچ تم دیده شود؛ نام دسترس‌پذیر و وضعیت switch حفظ شوند. لینک‌های عملیاتی
نمای دکمهٔ شیشه‌ای و بدون زیرخط داشته باشند ولی semantics و href ناوبری باقی بماند.
موبایل/دسکتاپ و هر دو تم، ورودی لمسی/کیبورد و reduced-motion بررسی شوند.
