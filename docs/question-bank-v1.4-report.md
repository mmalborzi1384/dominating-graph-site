# گزارش نسخه ۱٫۴ بانک سؤال گراف احاطه‌گر

**تاریخ:** ۱۴۰۵/۰۸/۲۱ (۲۰۲۶-۱۱-۱۲)
**مبنا:** `question-bank-v1.3.json` → `question-bank-v1.4.json` (۱۵۰ سؤال، همان شناسه‌ها)
**منبع زمینی:** کتاب درسی `C112215_0_ay1g.pdf` (فصل ۲، ص ۳۲–۵۴) + ریپو `mmalborzi1384/graph-learning` (نسخه ۶٫۴٫۰)
**سازنده:** `build_v1.4.py` — ساخت + راستی‌آزمایی کامل، خروج ۰، بدون خطا

## خلاصه

نسخه ۱٫۴ نتیجه ممیزی کامل سه‌برش (A و B و C) روی همه تغییرات v1.2 و v1.3 است. **هیچ سؤال ساخته‌شده‌ای (FABRICATED) در هیچ برش پیدا نشد** و **هیچ خطای γ در هیچ‌یک از ۸۸ گراف v1.3 نبود** — همه γها با جستجوی فراگیر دوباره محاسبه و تأیید شدند. همه نقص‌ها در پاسخ، راهنما، `question_in_model_fa`، ارجاع صفحه منبع، یا یک یال جاافتاده (Q150) بود و همه اصلاح شدند.

**نتیجه نهایی: هر ۱۵۰ سؤال در دست‌کم یک تب مجاز قابل اجرا هستند (۱۵۰ از ۱۵۰). هیچ سؤال غیرقابل‌استفاده‌ای نمانده است.** یک جایگزینی انجام شد (Q134) و بقیه با اصلاح در همان شناسه درست شدند.

## ۱) یافته‌های ممیزی و همه اصلاحات

### برش A — تغییرات v1.2 (۳۲ شناسه): ۲۲ OK، ۱۰ FIX، ۰ FABRICATED، ۰ جایگزینی

| شناسه | مشکل | اصلاح |
|---|---|---|
| Q024 | پاسخ فقط تعریف مکمل را می‌داد و یال‌های Ḡ را نمی‌گفت | پاسخ کامل شد: Ḡ یال‌های ae و bc و bd و be را دارد (از روی شکل ۱۶، ص ۳۷) |
| Q034 | پاسخ هیچ مجموعه ۴ عضوی نمی‌داد؛ به نسخه تعاملی ارجاع می‌داد | پاسخ: {a,b,c,f} با پوشش هر رأس به‌تفکیک (a:‏ a,b,d؛ b:‏ a,b,c,e؛ c:‏ b,c؛ f:‏ d,f,g,h) |
| Q064 | سؤال به «مجموعه‌های داده‌شده» ارجاع می‌داد ولی هیچ مجموعه‌ای در سؤال نبود؛ پاسخ هیچ حکمی نمی‌داد | هفت مجموعه کتاب (A تا H، G وجود ندارد) به متن سؤال اضافه شد؛ پاسخ: احاطه‌گر A و B و D و E و F و H، C نیست (d بی‌پوشش)، مینیمال A و B و D و H، مینیمم مثلاً D={a,i,h} با γ=3، مینیمال غیرمینیمم مثلاً A |
| Q078 | پیش‌فرض سؤال با مثالش تناقض داشت: {b,d,f} مینیمال است، پس «رأس زائد» ندارد | سؤال بازنویسی شد: آیا {b,d,f} مینیمال است؟ مینیمم است؟ یک γ-مجموعه پیدا کن (پاسخ: مینیمالِ غیرمینیمم، γ-مجموعه {b,e})؛ همان گراف P6 و همان موضوع |
| Q114 | پاسخ فقط «نوع مجموعه» را می‌گفت؛ γ و مثال نداشت | پاسخ: γ=4، مثلاً {a,b,m,n}؛ کران پایین ⌈16/5⌉=4 هم همین عدد را می‌دهد |
| Q134 | پاسخ نادرست («C4 دو γ-مجموعه دارد» — در واقع شش تا) و n=1 و n=2 و n=3 را پوشش نمی‌داد | **جایگزینی کامل** — بخش ۵ را ببینید |
| Q135 | گراف پایه P5 نمی‌تواند کاهش γ را نشان دهد (اضافه کردن هر یال γ را ۲ نگه می‌دارد) | گراف پایه به P3 به‌علاوه رأس تنها تغییر کرد (γ=2، یکتا {b,d})؛ با یال bd رأس b فراگیر و γ=1 می‌شود، با یال ad همان ۲ می‌ماند |
| Q144 | پاسخ هیچ عددی نداشت | پاسخ: n=6، Δ=3، کران پایین ⌈6/4⌉=2، γ=3 (کران تیز نیست)، قضیه اور: 3 ≤ 3 |
| Q149 | پاسخ کلید جواب هیچ مشاهده عینی نداشت | پاسخ: روی P5 اضافه کردن هر یال γ را ۲ نگه می‌دارد؛ حذف ab یا de آن را ۳ می‌کند، حذف bc یا cd همان ۲ می‌ماند؛ کاهش γ با P3+رأس تنها و یال bd |
| Q150 | یک یال در شکل جا افتاده بود (قطر vz) و پاسخ هیچ دوری نمی‌داد | یال vz به گراف اضافه شد (۱۰ یال؛ γ همان ۱ با یکتای {w})؛ پاسخ: دور u–v–w–y–z–u به طول ۵ |

OK در برش A: Q005، Q006، Q014، Q015، Q017، Q019، Q046، Q055، Q065، Q074، Q099، Q100، Q101، Q102، Q133، Q136، Q139، Q142، Q143، Q145، Q147، Q148. همه γها و `gamma_sets_count`ها با جستجوی فراگیر تأیید شدند. یادداشت: Q014 گراف جهت‌دار است و γ ندارد (درست)؛ Q055 گراف ۱۴ رأسی دارد و بالای حد ۱۲ رأسی موتور است ولی به‌صورت متنی در teach قابل اجراست؛ Q133 (تمرین ۱۰-الف) درست است — کتاب برای n=3 اشتباه می‌کند و پاسخ v1.2 (ناممکن بودن n=3 با اثبات شمارشی) درست است.

### برش B — تغییرات v1.3، modeling و گراف‌های جدید (۵۹ شناسه): ۳۲ OK، ۲۶ FIX، ۱ جایگزینی، ۰ FABRICATED

**هر ۱۰ گراف جدید از نظر یال و γ درست‌اند** (مسابقات با مثال ۵ ص ۳۳، خودپرداز با شکل ۲ ص ۴۴، رادیو سطر‌به‌سطر با جدول فاصله ص ۴۵ و آستانه ≤۵۰ کیلومتر، Q4 با شکل ۹ ص ۴۹، C6). اصلاحات:

- **Q008 تا Q011، Q032، Q033، Q035، Q039، Q115، Q120:** `question_in_model_fa` عین `scenario_fa` تکرار شده بود؛ هر یک به سؤال خود آن شناسه تبدیل شد (مثلاً Q008: «تیم a چه تیم‌هایی را برده و به چه تیمی باخته است؟»).
- **Q019:** نوع `compute_gamma` بود ولی سؤال γ نمی‌خواهد (p و Δ و δ می‌خواهد) → نوع `text` شد.
- **Q060:** پاسخ ادعا می‌کرد γ-مجموعه باید «یکی از هر بخش» داشته باشد — نادرست است ({a,b} هر دو از بخش دوتایی هم γ-مجموعه است). اصلاح شد.
- **Q087 تا Q092:** ارجاع صفحه منبع ۴۸ → ۵۳ (فرمول γ(Pn)=γ(Cn)=⌈n/3⌉ در تمرین ۵ درس ۲، ص ۵۳ است، نه ص ۴۸).
- **Q095 تا Q098:** یک جمله قالبی کپی‌شده («در گراف کامل هر تک‌رأس… و در ستاره مرکز…») در هر چهار سؤال نیمی نادرست بود؛ هر پاسخ به خانواده خودش نوشته شد (K5 و K3: هر تک‌رأس؛ S4 و S5: مرکز ستاره).
- **Q105:** راهنمای سوم «مرکز چرخ را امتحان کن» از سؤال‌های چرخ کپی شده بود؛ پترسن مرکز ندارد. اصلاح شد.
- **Q111:** استدلال پاسخ نادرست بود («هیچ دو رأسی هم‌زمان d و e را نمی‌پوشانند» — {b,c} می‌پوشاند). دلیل واقعی: هر جفت پوشاننده d و e، رأس f را بی‌پوشش می‌گذارد (f فقط با a مجاور است).
- **Q115:** پاسخ هیچ عددی نمی‌داد (دستور کار بود، نه پاسخ). شد: Δ=4، کران پایین ⌈16/5⌉=4، γ=4، مثلاً {a,b,m,n}.
- **Q132:** پاسخ ادعا می‌کرد C12 تنها کمینه‌کننده است و تجزیه به دورهای کوچک‌تر همیشه γ را زیاد می‌کند — هر دو نادرست‌اند (C6∪C6 و C3∪C9 هم γ=4 می‌دهند). اصلاح شد.
- **Q134:** جایگزینی کامل — بخش ۵.
- **Q140:** پاسخ سؤال «چندتا هستند؟» را بی‌جواب می‌گذاشت. شد: γ=3 با دقیقاً ۱۰ γ-مجموعه، همه ده‌تا فهرست شدند (با جستجوی فراگیر تأیید شد).

OK در برش B: Q015، Q048–Q051، Q057، Q058، Q062، Q067–Q073، Q075، Q079–Q086، Q099–Q104، Q110، Q138.

### برش C — مدل‌سازی‌های متنی v1.3 (۲۲ شناسه): ۲۰ OK، ۲ FIX، ۰ FABRICATED

- **Q025:** مدل‌سازی درست بود ولی پاسخ x را نمی‌گفت. از روی شکل ۲۱ (ص ۴۱) ردیابی شد: V={a..g}، E={ab,ae,af,bc,cd,ce,de}، رأس g تنها → **x=b** (چون N(b)={a,c})؛ Δ=3، δ=0، **γ=3** (۴ γ-مجموعه). پاسخ کامل و گراف ردیابی‌شده به بانک اضافه شد.
- **Q107:** مدل‌سازی درست بود ولی پاسخ γ را نمی‌گفت. شکل ۸ (ص ۴۸) با چشم از روی PDF خوانده شد: **گراف پترسن** (پنج‌ضلعی بیرونی + ستاره درونی، ۳-منتظم، ۱۰ رأس) → **γ=3** (۱۰ γ-مجموعه). پاسخ کامل و گراف پترسن به بانک اضافه شد.
- **Q109 (یادداشت):** قضیه اور (γ ≤ n/2 برای گراف بدون رأس تنها) از نظر ریاضی درست است، ولی نام «اور» و این کران در متن فصل ۲ پیدا نشد (ص ۴۷ فقط مینیمال را بحث می‌کند). ارجاع منبع اصلاح شد: `origin` از `book` به `derived` و `page` به null. پیش از انتشار با کتاب چاپی تطبیق داده شود؛ اگر کتاب نام «اور» را نیاورده، سؤال باید به‌صورت «قضیه‌ای معروف در نظریه احاطه‌گری» برچسب بخورد.
- **Q001:** راهنمای اول («رأس بی‌پوشش را پیدا کن») نامربوط بود → «پل‌ها را بشمار، بعد ناحیه‌ها را.»
- **Q074 (اصلاح جزئی):** `answer_latex` جمله‌ای نثری بود → «γ=2، تنها γ-مجموعه {a,b}».
- **Q077 (اصلاح جزئی):** `edge_means_fa` از «یال گراف» به «راه/ارتباط بین دو مکان در صفحه بازی» تغییر کرد.

OK در برش C: Q012، Q013، Q022، Q023، Q026، Q027، Q028، Q030، Q031، Q043، Q044، Q045، Q047، Q052، Q053، Q054، Q063، Q077، Q106، Q109 (با یادداشت بالا).

## ۲) موارد خاص — قاعده دقیق ارائه در سایت

- **Q001 تا Q003 (کونیگسبرگ):** چندگراف کتاب از روی شکل ۲ ص ۳۲ ردیابی شد و به بانک اضافه شد: V={x,y,z,w}، یال‌ها wx دو بار، xy، wy، wz دو بار، zy؛ درجه‌ها w=5 و x=y=z=3؛ p=4 و q=7؛ γ تعریف نشده (null) با پرچم `multigraph: true`. حالت پاسخ: teach برابر `text`؛ Q003 در lab برابر `multigraph_draw` (یال موازی مجاز؛ اعتبارسنجی q=7 و دنباله درجه {۵،۳،۳،۳}).
- **Q040 تا Q042 (وزیرهای شطرنج):** گراف ۶۴ رأسی ذخیره نمی‌شود؛ **صفحه شطرنج خودش نمایش است**. Q041 در lab حالت `board` دارد (کلیک روی خانه → سطر و ستون و قطر روشن می‌شود). Q042: حداقل ۵ وزیر (نتیجه کلاسیک)؛ شرط برد در lab آینده: ۵ وزیر و ۰ خانه بی‌پوشش.
- **Q112 و Q113 (بیمارستان):** حالت `figure_text` با `figure_ref` شکل ۱۵ ص ۵۲؛ تصویر شکل کتاب همیشه کنار سؤال نمایش داده شود و هیچ یال یا مسافتی ساخته نشود. گراف آستانه بیمارستان به بانک اضافه **نشد** — خوانش مسافت‌ها از روی تصویر چاپی انجام شد ولی با کتاب چاپی تطبیق داده نشده است (γ=2 برای آن گراف، فقط پس از تطبیق با کتاب چاپی قابل ورود است).
- **Q141 (چالش زمان‌دار):** در teach حالت `text`؛ در lab کارت راهنما که چالش را با ۵ گراف از کتابخانه استاندارد در زمان اجرا آغاز می‌کند (`runtime_library`)؛ امتیاز چالش در کارنامه ثبت نمی‌شود — مطابق ریپو (README، نسخه ۶٫۴٫۰: «۵ گراف در ۳ دقیقه. امتیاز هر گراف از امتیاز دور و پاداش سرعت می‌آید. امتیاز در کارنامه ثبت نمی‌شود.»).
- **Q146 (ایستگاه ۵، بازی دو گروهی):** در teach حالت `text` (برنده: امتیاز کل بالاتر)؛ در lab حالت `lab_activity` (خود ایستگاه ۵؛ تکمیل فعالیت ثبت می‌شود، نه پاسخ متنی). ناسازگاری قبلی `type` و `scoring` این سؤال با فیلد جدید حل شد.
- **Q055 و Q114 (بالای حد ۱۲ رأسی موتور):** گراف‌ها ۱۴ و ۱۶ رأسی‌اند ولی γ آن‌ها در بانک ذخیره شده و سؤال‌ها به‌صورت متنی قابل اجرا هستند؛ حد موتور تغییر نکرد. Q055 حالت پاسخ `text` گرفت؛ Q114 هم `text` است.
- **Q014 (جهت‌دار):** γ ندارد (درست)؛ حالت پاسخ `draw` است و گراف آن هرگز نباید به ارزیاب احاطه‌گری بدون‌جهت داده شود.
- **Q142 و Q143:** در teach حالت `text`؛ در lab گراف‌های خانواده (C4 و K4 و S4 برای Q142؛ Pn و Cn برای Q143) از کتابخانه استاندارد کشیده می‌شوند (`runtime_library`).
- **۱۲ سؤال «آماده‌نیستِ تمرین» در v1.3** (متنی Q016، Q018، Q021، Q056، Q059، Q061، Q066 و اثباتی Q029، Q076، Q093، Q094، Q108) **نیازی به جایگزینی ندارند**: همه پاسخ مشخص، ۳ راهنما و امتیاز text/10 دارند و به‌صورت پاسخ متنی/اثباتیِ خودارزیاب (۱۰ کامل / ۵ ناقص / ۰) در teach و practice قابل اجرا هستند. `response_mode` آن‌ها اکنون صریح است (`text` برای Q016، Q018، Q021، Q056، Q059 و `proof_text` برای بقیه + Q137). نبود modeling برای تعریف و اثبات، نقص نیست.

## ۳) فیلد جدید `response_mode`

هیچ فیلد موجودی تغییر نکرده و هیچ فیلدی حذف نشده است. یک فیلد جدید به سطح سؤال اضافه شد؛ اگر نباشد، سایت از `type` استنتاج می‌کند.

| مقدار | معنا | امتیازدهی |
|---|---|---|
| `interactive_graph` | مهره‌گذاری روی گراف ذخیره‌شده | خودکار ۰/۵/۱۰/۱۵ |
| `compute_gamma` | وارد کردن عدد/مجموعه γ | خودکار در برابر γ ذخیره‌شده |
| `draw` | رسم گراف در ویراستار | خودکار در برابر گراف/γ ذخیره‌شده |
| `multigraph_draw` | رسم با یال موازی مجاز (فقط کونیگسبرگ) | خودکار: q=7 و دنباله درجه {۵،۳،۳،۳} |
| `board` | گذاشتن وزیر روی صفحه ۸×۸ | خودکار: شمارنده خانه بی‌پوشش |
| `text` | پاسخ متنی آزاد | خودارزیابی در برابر پاسخ نمونه: ۱۰ کامل / ۵ ناقص / ۰ |
| `proof_text` | اثبات متنی آزاد | خودارزیابی در برابر گام‌های کلیدی پاسخ نمونه: ۱۰ / ۵ / ۰ |
| `figure_text` | پاسخ متنی + تصویر شکل کتاب کنار سؤال | مانند `text`؛ `figure_ref` اجباری است |
| `runtime_library` | گراف(ها) در زمان اجرا از کتابخانه استاندارد کشیده می‌شوند | طبق منطق ایستگاه |
| `lab_activity` | خودِ سؤال یک کارت فعالیت آزمایشگاهی است | ثبت «تکمیل فعالیت»، بدون پاسخ متنی |

`response_mode_by_tab` فقط وقتی حالت پاسخ در تب‌ها فرق می‌کند: Q003 (teach: text، lab: multigraph_draw)، Q041 (teach: text، lab: board)، Q141 (teach: text، lab: runtime_library)، Q146 (teach: text، lab: lab_activity)، Q142 و Q143 (teach: text، lab: runtime_library). `figure_ref` برای ۹ سؤال `figure_text` ثبت شد: Q001 و Q002 و Q003 (درس ۱، شکل ۲، ص ۳۲)، Q022 (شکل ۱۲، ص ۳۶)، Q023 (شکل ۱۳، ص ۳۷)، Q025 (شکل ۲۱، ص ۴۱)، Q028 (شکل ۲۰، ص ۳۹)، Q107 (درس ۲، شکل ۸، ص ۴۸)، Q112 و Q113 (درس ۲، شکل ۱۵، ص ۵۲).

## ۴) شمارش‌های نهایی

| شمارش | v1.3 | v1.4 |
|---|---|---|
| کل سؤال‌ها | ۱۵۰ | **۱۵۰** |
| با modeling | ۱۳۵ | **۱۳۵** |
| با گراف | ۸۸ | **۹۳** (Q025، Q107، Q001–Q003) |
| با هر دو | ۸۸ | **۹۳** |
| بدون هیچ‌کدام | ۱۵ | **۱۵** |
| در تب practice | ۱۲۶ | **۱۲۶** |
| **آماده تمرین (قاعده T006)** | ۱۱۴ از ۱۲۶ | **۱۱۴ از ۱۲۶** |
| **قابل استفاده در دست‌کم یک تب مجاز** | — | **۱۵۰ از ۱۵۰** |

توزیع نوع سؤال: modeling ۳۸، text ۳۱ (از ۳۰؛ Q019 از compute_gamma به text رفت)، compute_gamma ۳۹ (از ۴۰)، interactive_graph ۲۶، draw ۹، proof ۷. دسته‌ها، درجه سختی، APOS و ساحت‌ها بدون تغییر: A ‏۳۱، B ‏۳۰، C ‏۲۵، D ‏۲۵، E ‏۲۰، F ‏۱۹؛ آسان ۶۰ / متوسط ۷۳ / سخت ۱۷؛ Action ‏۳۳ / Process ‏۳۷ / Object ‏۳۹ / Schema ‏۴۱.

توضیح قاعده T006: «آماده تمرین» یعنی modeling دارد و اگر نوعش تعاملی است گراف هم دارد. ۱۲ سؤال practice که این قاعده را نمی‌گذرانند (۷ متنی و ۵ اثباتیِ بخش ۲) **غیرقابل‌استفاده نیستند** — آن‌ها با حالت پاسخ `text`/`proof_text` در practice قابل اجرا هستند و در شمارش «قابل استفاده در دست‌کم یک تب» (۱۵۰ از ۱۵۰) آمده‌اند. قاعده T006 برای آن‌ها معیار نادرستی بود، چون modeling برای تعریف و اثبات لازم نیست.

راستی‌آزمایی مکانیکی (`build_v1.4.py`، خروج ۰): همه ۹۳ گراف (۸۸ بدون‌جهت + ۵ چندگراف/جهت‌دار با γ null) دوباره با جستجوی فراگیر محاسبه شدند؛ هیچ خطای γ و هیچ `gamma_sets` نادرستی نیست؛ همه سؤال‌ها ۳ راهنما و ساحت دارند؛ شناسه‌ها دقیقاً Q001 تا Q150 هستند؛ فقط فیلدهای مجاز تغییر کرده‌اند (ساحت/دسته/درجه سختی/APOS/شناسه دست نخورده‌اند).

## ۵) سؤال‌های جایگزین‌شده

**فقط یک جایگزینی: Q134.**

- **چرا سؤال قدیمی غیرقابل‌اجرا بود:** تمرین ۱۰-ب کتاب می‌گوید «برای هر n ≤ 4» گرافی با γ=2 و بیش از یک γ-مجموعه بسازید. برای n=1 چنین گرافی وجود ندارد (تنها گراف ۱ رأسی γ=1 دارد) و برای n=2 هم وجود ندارد (γ=2 فقط برای دو رأس منزوی ممکن است و آن گراف فقط یک زیرمجموعه ۲ عضوی دارد). پاسخ قدیمی هم فقط n=4 را می‌گفت و عددش نادرست بود («C4 دو γ-مجموعه دارد» — در واقع شش تا).
- **جایگزین (همان شناسه، همان دسته F_lab، همان مرحله APOS ‏Action‏، همان درجه سختی ۳، همان ساحت زیبایی‌شناختی و هنری، همان منبع کتاب ص ۵۴ تمرین ۱۰-ب با تصحیح دامنه n، همان نوع draw، همان تب‌های teach و lab، همان گراف C4):** سؤال جدید برای n=3 و n=4 ساخت می‌خواهد و ناممکن‌بودن n=1 و n=2 را می‌پرسد. پاسخ: n=4 با C4 (شش γ-مجموعه)؛ n=3 با یک یال ab به‌علاوه رأس منزوی c ({a,c} و {b,c} هر دو γ-مجموعه‌اند)؛ n=1 و n=2 ناممکن با اثبات شمارشی. همه با جستجوی فراگیر تأیید شد (گراف n=3 دقیقاً دو γ-مجموعه دارد؛ C4 دقیقاً شش تا).

هیچ سؤال دیگری جایگزین نشد — از جمله Q078 (با بازنویسی سؤال روی همان گراف P6 درست شد) و Q064 (با آوردن مجموعه‌های کتاب به متن سؤال درست شد).

## ۶) سؤال‌هایی که هنوز قابل استفاده نیستند

**هیچ‌کدام.** همه ۱۵۰ سؤال حالت پاسخ تعریف‌شده، ۳ راهنما و پاسخ درست دارند. تنها وابستگی‌های باقی‌مانده برای پیاده‌سازی در سایت (نه نقص بانک) این‌هاست:

- تصویرهای بریده‌شده شکل‌های کتاب باید به‌عنوان دارایی سایت ساخته شوند (شکل‌های ۱۲، ۱۳، ۲۰، ۲۱ درس ۱ و شکل‌های ۸ و ۱۵ درس ۲ و شکل ۲ کونیگسبرگ) — کلید هر کدام در `figure_ref` ثبت شده است.
- کتابخانه استاندارد گراف‌ها در زمان اجرا برای Q141 و Q146 و Q142 و Q143 باید در سایت موجود باشد (در مشخصات پروژه پیش‌بینی شده است).
- ویراستار گراف در lab باید یال موازی را برای Q003 بپذیرد و یال جهت‌دار را برای Q014 نمایش دهد.
- بررسی انسانی آموزشی (T015–T017) همچنان پابرجاست — به‌ویژه تطبیق Q109 («قضیه اور») و خوانش مسافت‌های شکل ۱۵ (Q112/Q113) با کتاب چاپی، پیش از انتشار.

## ۷) فهرست تکمیل هر سؤال

«آماده» یعنی: حالت پاسخ تعریف‌شده در دست‌کم یک تب مجاز، ۳ راهنما، پاسخ درست، و گراف/مدل‌سازی در جایی که نوع سؤال لازم دارد.

| شناسه | نوع | حالت پاسخ | تب‌ها | مدل‌سازی | گراف | وضعیت |
|---|---|---|---|---|---|---|
| Q001 | modeling | figure_text | teach,practice,lab | ✓ | ✓ | آماده |
| Q002 | modeling | figure_text | teach,practice | ✓ | ✓ | آماده |
| Q003 | modeling | text (teach:text، lab:multigraph_draw) | teach,lab | ✓ | ✓ | آماده |
| Q004 | text | text | teach,practice | ✓ | — | آماده |
| Q005 | modeling | text | teach,practice,lab | ✓ | ✓ | آماده |
| Q006 | modeling | text | teach,lab | ✓ | ✓ | آماده |
| Q007 | compute_gamma | compute_gamma | teach,practice | ✓ | ✓ | آماده |
| Q008 | modeling | text | teach,practice | ✓ | ✓ | آماده |
| Q009 | modeling | text | teach,practice | ✓ | ✓ | آماده |
| Q010 | modeling | text | teach,practice | ✓ | ✓ | آماده |
| Q011 | modeling | text | teach,practice | ✓ | ✓ | آماده |
| Q012 | text | text | teach,practice,lab | ✓ | — | آماده |
| Q013 | text | text | teach,practice | ✓ | — | آماده |
| Q014 | interactive_graph | draw | teach,lab | ✓ | ✓ | آماده |
| Q015 | draw | draw | teach,practice,lab | ✓ | ✓ | آماده |
| Q016 | text | text | teach,practice | — | — | آماده |
| Q017 | interactive_graph | interactive_graph | teach,practice,lab | ✓ | ✓ | آماده |
| Q018 | text | text | teach,practice | — | — | آماده |
| Q019 | text | text | teach,practice | ✓ | ✓ | آماده |
| Q020 | proof | proof_text | teach,practice | ✓ | — | آماده |
| Q021 | text | text | teach,practice | — | — | آماده |
| Q022 | text | figure_text | teach,practice | ✓ | — | آماده |
| Q023 | text | figure_text | teach,practice,lab | ✓ | — | آماده |
| Q024 | draw | draw | teach,lab | ✓ | ✓ | آماده |
| Q025 | text | figure_text | teach,practice | ✓ | ✓ | آماده |
| Q026 | text | text | teach,practice | ✓ | — | آماده |
| Q027 | text | text | teach,practice | ✓ | — | آماده |
| Q028 | text | figure_text | teach,practice | ✓ | — | آماده |
| Q029 | proof | proof_text | teach,practice | — | — | آماده |
| Q030 | text | text | teach,practice,lab | ✓ | — | آماده |
| Q031 | text | text | teach,practice | ✓ | — | آماده |
| Q032 | modeling | text | teach,practice,lab | ✓ | ✓ | آماده |
| Q033 | modeling | text | teach,practice | ✓ | ✓ | آماده |
| Q034 | interactive_graph | interactive_graph | teach,practice,lab | ✓ | ✓ | آماده |
| Q035 | modeling | text | teach,practice | ✓ | ✓ | آماده |
| Q036 | modeling | text | teach,practice,lab | ✓ | ✓ | آماده |
| Q037 | compute_gamma | compute_gamma | teach,practice,lab | ✓ | ✓ | آماده |
| Q038 | modeling | text | teach,practice | ✓ | ✓ | آماده |
| Q039 | modeling | text | teach,practice | ✓ | ✓ | آماده |
| Q040 | modeling | text | teach,practice | ✓ | — | آماده |
| Q041 | modeling | text (teach:text، lab:board) | teach,lab | ✓ | — | آماده |
| Q042 | modeling | text | teach,practice | ✓ | — | آماده |
| Q043 | text | text | teach,practice | ✓ | — | آماده |
| Q044 | text | text | teach,practice | ✓ | — | آماده |
| Q045 | text | text | teach,practice | ✓ | — | آماده |
| Q046 | interactive_graph | interactive_graph | teach,practice,lab | ✓ | ✓ | آماده |
| Q047 | text | text | teach,practice | ✓ | — | آماده |
| Q048 | compute_gamma | compute_gamma | teach,practice,competition,lab | ✓ | ✓ | آماده |
| Q049 | compute_gamma | compute_gamma | teach,practice,competition,lab | ✓ | ✓ | آماده |
| Q050 | compute_gamma | compute_gamma | teach,practice,competition,lab | ✓ | ✓ | آماده |
| Q051 | compute_gamma | compute_gamma | teach,practice,competition,lab | ✓ | ✓ | آماده |
| Q052 | text | text | teach,practice | ✓ | — | آماده |
| Q053 | text | text | teach,practice | ✓ | — | آماده |
| Q054 | text | text | teach,practice | ✓ | — | آماده |
| Q055 | interactive_graph | text | teach,practice,lab | ✓ | ✓ | آماده |
| Q056 | text | text | teach,practice | — | — | آماده |
| Q057 | compute_gamma | compute_gamma | teach,practice,lab | ✓ | ✓ | آماده |
| Q058 | compute_gamma | compute_gamma | teach,practice,lab | ✓ | ✓ | آماده |
| Q059 | text | text | teach,practice | — | — | آماده |
| Q060 | interactive_graph | interactive_graph | teach,practice,lab | ✓ | ✓ | آماده |
| Q061 | text | text | teach,practice | — | — | آماده |
| Q062 | compute_gamma | compute_gamma | teach,practice,lab | ✓ | ✓ | آماده |
| Q063 | text | text | teach,practice | ✓ | — | آماده |
| Q064 | interactive_graph | interactive_graph | teach,practice,lab | ✓ | ✓ | آماده |
| Q065 | interactive_graph | interactive_graph | teach,practice,lab | ✓ | ✓ | آماده |
| Q066 | text | text | teach,practice | — | — | آماده |
| Q067 | interactive_graph | interactive_graph | teach,practice,lab | ✓ | ✓ | آماده |
| Q068 | interactive_graph | interactive_graph | teach,practice,lab | ✓ | ✓ | آماده |
| Q069 | compute_gamma | compute_gamma | teach,practice,competition,lab | ✓ | ✓ | آماده |
| Q070 | compute_gamma | compute_gamma | teach,practice,competition,lab | ✓ | ✓ | آماده |
| Q071 | compute_gamma | compute_gamma | teach,practice,competition,lab | ✓ | ✓ | آماده |
| Q072 | compute_gamma | compute_gamma | teach,practice,competition,lab | ✓ | ✓ | آماده |
| Q073 | compute_gamma | compute_gamma | teach,practice,competition,lab | ✓ | ✓ | آماده |
| Q074 | draw | draw | teach,practice,lab | ✓ | ✓ | آماده |
| Q075 | draw | draw | teach,practice,lab | ✓ | ✓ | آماده |
| Q076 | proof | proof_text | teach,practice | — | — | آماده |
| Q077 | text | text | teach,practice | ✓ | — | آماده |
| Q078 | interactive_graph | interactive_graph | teach,practice,lab | ✓ | ✓ | آماده |
| Q079 | compute_gamma | compute_gamma | teach,practice,competition | ✓ | ✓ | آماده |
| Q080 | compute_gamma | compute_gamma | teach,practice,competition | ✓ | ✓ | آماده |
| Q081 | compute_gamma | compute_gamma | teach,practice,competition | ✓ | ✓ | آماده |
| Q082 | compute_gamma | compute_gamma | teach,practice,competition | ✓ | ✓ | آماده |
| Q083 | compute_gamma | compute_gamma | teach,practice,competition | ✓ | ✓ | آماده |
| Q084 | compute_gamma | compute_gamma | teach,practice,competition | ✓ | ✓ | آماده |
| Q085 | compute_gamma | compute_gamma | teach,practice,competition | ✓ | ✓ | آماده |
| Q086 | compute_gamma | compute_gamma | teach,practice,competition | ✓ | ✓ | آماده |
| Q087 | compute_gamma | compute_gamma | teach,practice,competition,lab | ✓ | ✓ | آماده |
| Q088 | compute_gamma | compute_gamma | teach,practice,competition,lab | ✓ | ✓ | آماده |
| Q089 | compute_gamma | compute_gamma | teach,practice,competition,lab | ✓ | ✓ | آماده |
| Q090 | compute_gamma | compute_gamma | teach,practice,competition,lab | ✓ | ✓ | آماده |
| Q091 | compute_gamma | compute_gamma | teach,practice,competition,lab | ✓ | ✓ | آماده |
| Q092 | compute_gamma | compute_gamma | teach,practice,competition,lab | ✓ | ✓ | آماده |
| Q093 | proof | proof_text | teach,practice | — | — | آماده |
| Q094 | proof | proof_text | teach,practice | — | — | آماده |
| Q095 | compute_gamma | compute_gamma | teach,practice | ✓ | ✓ | آماده |
| Q096 | compute_gamma | compute_gamma | teach,practice | ✓ | ✓ | آماده |
| Q097 | compute_gamma | compute_gamma | teach,practice | ✓ | ✓ | آماده |
| Q098 | compute_gamma | compute_gamma | teach,practice | ✓ | ✓ | آماده |
| Q099 | compute_gamma | compute_gamma | teach,practice,lab | ✓ | ✓ | آماده |
| Q100 | compute_gamma | compute_gamma | teach,practice,lab | ✓ | ✓ | آماده |
| Q101 | compute_gamma | compute_gamma | teach,practice,lab | ✓ | ✓ | آماده |
| Q102 | compute_gamma | compute_gamma | teach,practice,lab | ✓ | ✓ | آماده |
| Q103 | compute_gamma | compute_gamma | teach,practice,competition,lab | ✓ | ✓ | آماده |
| Q104 | compute_gamma | compute_gamma | teach,practice,competition,lab | ✓ | ✓ | آماده |
| Q105 | compute_gamma | compute_gamma | teach,practice,competition,lab | ✓ | ✓ | آماده |
| Q106 | text | text | teach,practice | ✓ | — | آماده |
| Q107 | text | figure_text | teach,practice,lab | ✓ | ✓ | آماده |
| Q108 | proof | proof_text | teach,practice | — | — | آماده |
| Q109 | text | text | teach,practice | ✓ | — | آماده |
| Q110 | draw | draw | teach,practice,lab | ✓ | ✓ | آماده |
| Q111 | draw | draw | teach,practice,lab | ✓ | ✓ | آماده |
| Q112 | modeling | figure_text | teach,practice,lab | ✓ | — | آماده |
| Q113 | modeling | figure_text | teach,practice,lab | ✓ | — | آماده |
| Q114 | modeling | text | teach,practice | ✓ | ✓ | آماده |
| Q115 | modeling | text | teach,practice,lab | ✓ | ✓ | آماده |
| Q116 | modeling | text | teach,practice | ✓ | — | آماده |
| Q117 | modeling | text | teach,practice | ✓ | — | آماده |
| Q118 | modeling | text | teach,practice | ✓ | — | آماده |
| Q119 | modeling | text | teach,practice | ✓ | — | آماده |
| Q120 | modeling | text | teach,practice,lab | ✓ | ✓ | آماده |
| Q121 | modeling | text | teach,practice | ✓ | — | آماده |
| Q122 | modeling | text | teach,practice | ✓ | — | آماده |
| Q123 | modeling | text | teach,practice | ✓ | — | آماده |
| Q124 | modeling | text | teach,practice | ✓ | — | آماده |
| Q125 | modeling | text | teach,practice | ✓ | — | آماده |
| Q126 | modeling | text | teach,practice | ✓ | — | آماده |
| Q127 | modeling | text | teach,practice | ✓ | — | آماده |
| Q128 | modeling | text | teach,practice | ✓ | — | آماده |
| Q129 | modeling | text | teach,practice | ✓ | — | آماده |
| Q130 | modeling | text | teach,practice | ✓ | — | آماده |
| Q131 | modeling | text | teach,practice | ✓ | — | آماده |
| Q132 | draw | draw | teach,lab | ✓ | ✓ | آماده |
| Q133 | draw | draw | teach,lab | ✓ | ✓ | آماده |
| Q134 | draw | draw | teach,lab | ✓ | ✓ | آماده |
| Q135 | interactive_graph | interactive_graph | teach,lab | ✓ | ✓ | آماده |
| Q136 | interactive_graph | interactive_graph | teach,lab | ✓ | ✓ | آماده |
| Q137 | proof | proof_text | teach,lab | — | — | آماده |
| Q138 | interactive_graph | interactive_graph | teach,lab | ✓ | ✓ | آماده |
| Q139 | interactive_graph | draw | teach,lab | ✓ | ✓ | آماده |
| Q140 | interactive_graph | interactive_graph | teach,lab | ✓ | ✓ | آماده |
| Q141 | interactive_graph | text (teach:text، lab:runtime_library) | teach,lab | — | — | آماده |
| Q142 | interactive_graph | interactive_graph (teach:text، lab:runtime_library) | teach,lab | ✓ | ✓ | آماده |
| Q143 | interactive_graph | interactive_graph (teach:text، lab:runtime_library) | teach,lab | ✓ | ✓ | آماده |
| Q144 | interactive_graph | interactive_graph | teach,lab | ✓ | ✓ | آماده |
| Q145 | interactive_graph | interactive_graph | teach,lab | ✓ | ✓ | آماده |
| Q146 | interactive_graph | text (teach:text، lab:lab_activity) | teach,lab | — | — | آماده |
| Q147 | interactive_graph | interactive_graph | teach,lab | ✓ | ✓ | آماده |
| Q148 | interactive_graph | interactive_graph | teach,lab | ✓ | ✓ | آماده |
| Q149 | interactive_graph | interactive_graph | teach,lab | ✓ | ✓ | آماده |
| Q150 | interactive_graph | interactive_graph | teach,lab | ✓ | ✓ | آماده |
