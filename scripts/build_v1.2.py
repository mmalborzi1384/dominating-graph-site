#!/usr/bin/env python3
"""Build question-bank v1.2 from v1.1 (question-bank.json) and verify it.

- Adds missing graph / modeling fields for the must-fix list (content-gaps.md §1)
  plus the fully-determined K3,3 graphs for Q005/Q006 and the Q4 hypercube for Q114.
- Fixes two proven answer errors: Q074 (concrete unique-gamma example) and
  Q133 (n=3 is impossible; n=4 construction + n=1/n=2 analysis).
- Every gamma / gamma_sets value is COMPUTED here by brute-force subset search
  (bitmask enumeration); no gamma is hand-entered. The script re-verifies ALL
  150 graphs (old and new) and fails if any stored gamma disagrees.
- Nothing else changes: same 150 IDs, categories, difficulty, APOS, sahat tags.

Usage:
    python3 build_v1.2.py            # build + verify, write question-bank-v1.2.json
    python3 build_v1.2.py --verify-only   # only verify the written v1.2 file
"""
import copy
import itertools
import json
import sys
from pathlib import Path

HERE = Path(__file__).resolve().parent
SRC = HERE / "question-bank.json"          # v1.1 (untouched)
OUT = HERE / "question-bank-v1.2.json"


# ---------------------------------------------------------------- brute force
def gamma_and_sets(vertices, edges, directed=False):
    """Return (gamma, [sets as frozensets]) by exhaustive subset search.

    Directed graphs: gamma is not defined for this chapter -> (None, []).
    Uses integer bitmasks; n=16 (Q4) is 65536 subsets, fine.
    """
    if directed:
        return None, []
    n = len(vertices)
    idx = {v: i for i, v in enumerate(vertices)}
    closed = []
    for v in vertices:
        mask = 1 << idx[v]
        for a, b in edges:
            if a == v:
                mask |= 1 << idx[b]
            elif b == v:
                mask |= 1 << idx[a]
        closed.append(mask)
    full = (1 << n) - 1
    for r in range(n + 1):
        found = []
        for comb in itertools.combinations(range(n), r):
            cov = 0
            for v in comb:
                cov |= closed[v]
            if cov == full:
                found.append(frozenset(vertices[v] for v in comb))
        if found:
            return r, found
    raise AssertionError("no dominating set found (impossible for finite graph)")


def fmt_set(s):
    return "{" + ", ".join(sorted(s)) + "}"


def make_graph(ref, family, vertices, edges, layout, note, directed=False):
    gamma, sets = gamma_and_sets(vertices, edges, directed=directed)
    g = {
        "ref": ref,
        "family": family,
        "n": len(vertices),
        "vertices": list(vertices),
        "edges": [[a, b] for a, b in edges],
        "layout": layout,
        "gamma": gamma,
        "gamma_sets": [fmt_set(s) for s in sorted(sets, key=lambda s: sorted(s))[:5]],
        "gamma_sets_count": len(sets),
        "note": note,
    }
    if directed:
        g["directed"] = True
    return g


def modeling(scenario, vertex, edge, visual):
    return {
        "scenario_fa": scenario,
        "vertex_means_fa": vertex,
        "edge_means_fa": edge,
        "question_in_model_fa": scenario,
        "visual_idea_fa": visual,
    }


# ---------------------------------------------------------------- new graphs
# (vertices, edges) only — gamma is computed, never typed in.
K33_V = ["a", "b", "c", "d", "e", "f"]
K33_E = [("a", "b"), ("a", "d"), ("a", "f"), ("b", "c"), ("b", "d"), ("b", "e"),
         ("c", "d"), ("c", "f"), ("c", "e")]  # placeholder, replaced below
# K3,3 with parts {a,c,e} / {b,d,f} (same edge set as Q007)
K33_E = [(x, y) for x in ("a", "c", "e") for y in ("b", "d", "f")]

PETERSEN_E = ([("a", "b"), ("b", "c"), ("c", "d"), ("d", "e"), ("e", "a")]
              + [("a", "f"), ("b", "g"), ("c", "h"), ("d", "i"), ("e", "j")]
              + [("f", "h"), ("h", "j"), ("j", "g"), ("g", "i"), ("i", "f")])

# Q4 hypercube (book Fig. 9, lesson 2, p. 49): two Q3 cubes a..h / i..p + matching
Q4_FRONT = [("a", "b"), ("b", "h"), ("h", "g"), ("g", "a"),      # front face
            ("c", "d"), ("d", "f"), ("f", "e"), ("e", "c"),      # inner face
            ("a", "c"), ("b", "d"), ("g", "e"), ("h", "f")]      # front-cube links
Q4_BACK = [("i", "j"), ("j", "p"), ("p", "o"), ("o", "i"),
           ("k", "l"), ("l", "n"), ("n", "m"), ("m", "k"),
           ("i", "k"), ("j", "l"), ("o", "m"), ("p", "n")]
Q4_MATCH = [("a", "i"), ("b", "j"), ("c", "k"), ("d", "l"),
            ("e", "m"), ("f", "n"), ("g", "o"), ("h", "p")]
Q4_E = Q4_FRONT + Q4_BACK + Q4_MATCH

EDITS = {
    # --- must-fix §1: interactive_graph without graph ---
    "Q014": {"graph": make_graph("directed_example", "directed",
                ["a", "b", "c", "d"], [("a", "b"), ("a", "c"), ("c", "a"), ("d", "b")],
                "custom", "گراف جهت‌دار شکل ۶ درس ۱، ص ۳۴؛ یال‌ها جهت‌دارند و γ برای گراف جهت‌دار در این فصل تعریف نشده است.", directed=True)},
    "Q017": {"graph": make_graph("K33", "bipartite", K33_V, K33_E, "bip",
                "شکل ۹ درس ۱، ص ۳۵؛ گراف ۶ رأسی ۳-منتظم (K3,3)."),
              "modeling": modeling("گراف ۶ رأسی ۳-منتظم شکل ۹ درس ۱", "رأس", "یال",
                "شش رأس در شش‌ضلعی با سه قطر؛ هر رأس درجه ۳ دارد.")},
    "Q034": {"graph": make_graph("book_atm", "custom",
                ["a", "b", "c", "d", "e", "f", "g", "h"],
                [("a", "b"), ("b", "c"), ("a", "d"), ("d", "e"), ("b", "e"),
                 ("d", "f"), ("f", "g"), ("f", "h"), ("g", "h")],
                "custom", "شکل ۲ درس ۲، ص ۴۴؛ تقاطع‌ها رأس و خیابان‌ها یال‌اند.")},
    "Q046": {"graph": make_graph("P5", "path", ["a", "b", "c", "d", "e"],
                [("a", "b"), ("b", "c"), ("c", "d"), ("d", "e")], "line",
                "مثال نمایشی P5؛ سؤال کتاب گراف خاصی ندارد — رأس v و N[v] آن دیده می‌شود."),
              "modeling": modeling("یک رأس v و همسایه‌هایش در یک گراف کوچک", "رأس v و همسایه‌هایش", "یال",
                "با کلیک روی v، N[v] روشن می‌شود.")},
    "Q055": {"graph": make_graph("taxi_14", "custom",
                [f"e{i}" for i in range(1, 15)],
                [(f"e{i}", f"e{j}") for grp in ((1, 5), (5, 9), (9, 13), (13, 15))
                 for i in range(grp[0], grp[1]) for j in range(i + 1, grp[1])],
                "custom", "هر تاکسی یک دسته (کلیک) حداکثر ۴ نفره؛ ۱۴ کارمند = سه تاکسی ۴ نفره و یک تاکسی ۲ نفره؛ γ برابر تعداد تاکسی‌هاست.")},
    "Q064": {"graph": make_graph("Petersen", "regular",
                ["a", "b", "c", "d", "e", "f", "g", "h", "i", "j"], PETERSEN_E, "petersen",
                "شکل ۵ درس ۲، ص ۴۶ (گراف پترسن)؛ مجموعه‌های A تا H در متن سؤال."),
              "modeling": modeling("کار در کلاس شکل ۵ درس ۲؛ مجموعه‌های A تا H", "رأس", "یال",
                "مهره‌گذاری روی گراف پترسن؛ آزمون حذف رأس‌های بی‌پوشش را قرمز می‌کند.")},
    "Q065": {"graph": make_graph("fig6_lesson2", "custom",
                ["a", "b", "c", "d", "e", "f", "g", "h", "i"],
                [("a", "g"), ("a", "b"), ("a", "h"), ("b", "c"), ("c", "h"), ("h", "d"),
                 ("d", "e"), ("e", "i"), ("e", "f"), ("f", "g"), ("f", "i"), ("g", "h"), ("h", "i")],
                "custom", "شکل ۶ درس ۲، ص ۴۷؛ {b,d,f} مینیمال است."),
              "modeling": modeling("مثال شکل ۶ درس ۲؛ از مجموعه غیرمینیمال به مینیمال", "رأس", "یال",
                "حذف رأس‌های زائد تا رسیدن به {b,d,f}.")},
    "Q078": {"graph": make_graph("P6", "path", ["a", "b", "c", "d", "e", "f"],
                [("a", "b"), ("b", "c"), ("c", "d"), ("d", "e"), ("e", "f")], "line",
                "مثال هدفمند: P6؛ مجموعه {b,d,f} احاطه‌گر مینیمال غیرمینیمم است — رأس زائد را بردار."),
              "modeling": modeling("تمرین هدفمند ریپو: رأس زائد را بردار", "رأس", "یال",
                "گراف کوچک‌تر با همان اشتباه؛ رأس زائد را بردار و دوباره تأیید کن.")},
    "Q135": {"graph": make_graph("P5", "path", ["a", "b", "c", "d", "e"],
                [("a", "b"), ("b", "c"), ("c", "d"), ("d", "e")], "line",
                "مثال: از P5 شروع کن و یک یال اضافه کن."),
              "modeling": modeling("اثر اضافه کردن یال بر γ", "رأس", "یال",
                "یک یال اضافه کن و γ جدید را حساب کن.")},
    "Q136": {"graph": make_graph("P5", "path", ["a", "b", "c", "d", "e"],
                [("a", "b"), ("b", "c"), ("c", "d"), ("d", "e")], "line",
                "مثال: از P5 شروع کن و یک یال حذف کن."),
              "modeling": modeling("اثر حذف یال بر γ", "رأس", "یال",
                "یک یال حذف کن و γ جدید را حساب کن.")},
    "Q139": {"graph": make_graph("empty7", "custom",
                ["a", "b", "c", "d", "e", "f", "g"], [], "circle",
                "گراف شروع بدون یال؛ دانش‌آموز یال می‌سازد. γ=7 چون هر رأس تنها خودش را می‌پوشاند."),
              "modeling": modeling("ویرایشگر کشیدنی آزمایشگاه؛ گراف ۷ رأسی بساز", "رأس", "یال",
                "رأس‌ها را بکش، یال بساز، بعد γ را پیدا کن.")},
    "Q142": {"graph": make_graph("P3", "path", ["a", "b", "c"],
                [("a", "b"), ("b", "c")], "line",
                "ایستگاه ۱: این گراف P3 است؛ سه گراف دیگر C4 و K4 و S4 از کتابخانه استاندارد بارگذاری می‌شوند."),
              "modeling": modeling("ایستگاه ۱ آزمایشگاه: محاسبه مستقیم γ", "رأس", "یال",
                "γ گراف‌های P3 و C4 و K4 و S4 را با جدول محاسبه کن.")},
    "Q143": {"graph": make_graph("P7", "path", ["a", "b", "c", "d", "e", "f", "g"],
                [("a", "b"), ("b", "c"), ("c", "d"), ("d", "e"), ("e", "f"), ("f", "g")], "line",
                "ایستگاه ۲: این گراف P7 است؛ همه Pn و Cn با n=1..7 از کتابخانه استاندارد بارگذاری می‌شوند."),
              "modeling": modeling("ایستگاه ۲ آزمایشگاه: کشف فرمول ⌈n/3⌉", "رأس", "یال",
                "γ را برای n=1 تا 7 حساب کن و الگو را ببین.")},
    "Q144": {"graph": make_graph("bound_not_tight", "custom",
                ["a", "b", "c", "d", "e", "f"],
                [("a", "b"), ("a", "c"), ("a", "f"), ("b", "e"), ("c", "d")], "custom",
                "ایستگاه ۳: مثال کران پایین نابرابر — n=6، Δ=3، کران 2، γ=3 (همان گراف Q111)."),
              "modeling": modeling("ایستگاه ۳ آزمایشگاه: کران‌ها", "رأس", "یال",
                "کران پایین را حساب و با γ واقعی مقایسه کن.")},
    "Q145": {"graph": make_graph("P6", "path", ["a", "b", "c", "d", "e", "f"],
                [("a", "b"), ("b", "c"), ("c", "d"), ("d", "e"), ("e", "f")], "line",
                "ایستگاه ۴: {b,d,f} مینیمال غیرمینیمم است؛ γ=2."),
              "modeling": modeling("ایستگاه ۴ آزمایشگاه: مینیمال در برابر مینیمم", "رأس", "یال",
                "روی P6 و مجموعه {b,d,f} نشان بده مینیمال با مینیمم فرق دارد.")},
    "Q147": {"graph": make_graph("P9", "path",
                ["a", "b", "c", "d", "e", "f", "g", "h", "i"],
                [("a", "b"), ("b", "c"), ("c", "d"), ("d", "e"), ("e", "f"), ("f", "g"),
                 ("g", "h"), ("h", "i")], "line",
                "مثال پاسخ: P9 با γ=3."),
              "modeling": modeling("رسم گراف n رأسی با γ=k", "رأس", "یال",
                "برای n=9 و k=3 گرافی بساز که γ آن 3 باشد.")},
    "Q148": {"graph": make_graph("C6", "cycle", ["a", "b", "c", "d", "e", "f"],
                [("a", "b"), ("b", "c"), ("c", "d"), ("d", "e"), ("e", "f"), ("f", "a")], "circle",
                "همه γ-مجموعه‌های C6: سه‌تا."),
              "modeling": modeling("همه γ-مجموعه‌ها را لیست کن", "رأس", "یال",
                "برای C6 همه γ-مجموعه‌ها را لیست کن.")},
    "Q149": {"graph": make_graph("P5", "path", ["a", "b", "c", "d", "e"],
                [("a", "b"), ("b", "c"), ("c", "d"), ("d", "e")], "line",
                "مثال: P5؛ یک یال اضافه و یک یال حذف کن."),
              "modeling": modeling("اثر یال بر γ را تجربه کن", "رأس", "یال",
                "یک یال به P5 اضافه کن و ببین γ چه می‌شود؛ بعد یک یال حذف کن.")},
    "Q150": {"graph": make_graph("fig17_lesson1", "custom",
                ["u", "v", "w", "x", "y", "z"],
                [("u", "v"), ("v", "w"), ("w", "x"), ("x", "y"), ("y", "z"), ("z", "u"),
                 ("u", "w"), ("z", "w"), ("y", "w")],
                "custom", "شکل ۱۷ درس ۱، ص ۳۸؛ دور به طول ۵ مثلاً u-v-w-y-z-u است."),
              "modeling": modeling("مسیر و دور به طول ۵ در شکل ۱۷ درس ۱", "رأس", "یال",
                "دنباله رأس‌ها را بنویس که به نقطه شروع برگردد و ۵ یال داشته باشد.")},
    # --- must-fix §1: compute_gamma / draw ---
    "Q019": {"graph": make_graph("K9", "complete",
                ["a", "b", "c", "d", "e", "f", "g", "h", "i"],
                [(x, y) for i, x in enumerate(["a", "b", "c", "d", "e", "f", "g", "h", "i"])
                 for y in ["a", "b", "c", "d", "e", "f", "g", "h", "i"][i + 1:]],
                "circle", "تمرین ۶ درس ۱، ص ۴۲؛ p(p-1)/2=36 پس p=9.")},
    "Q015": {"graph": make_graph("ex1_lesson1", "custom",
                ["a", "b", "c", "d", "e", "f"],
                [("a", "b"), ("a", "c"), ("c", "d"), ("e", "f"), ("b", "d"), ("c", "f"), ("b", "e")],
                "custom", "تمرین ۱ درس ۱، ص ۴۱؛ یال‌ها از متن سؤال.")},
    "Q024": {"graph": make_graph("fig16_lesson1", "custom",
                ["a", "b", "c", "d", "e"],
                [("a", "b"), ("a", "c"), ("a", "d"), ("c", "d"), ("c", "e"), ("d", "e")],
                "custom", "شکل ۱۶ درس ۱، ص ۳۷؛ مکمل Ḡ یال‌های ae و bc و bd و be را دارد."),
              "modeling": modeling("گراف G شکل ۱۶ درس ۱ و مکملش", "رأس", "یال",
                "G و Ḡ کنار هم؛ یال‌های مکمل همان یال‌های غایب G هستند.")},
    "Q074": {"graph": make_graph("unique_gamma_6", "custom",
                ["a", "b", "c", "d", "e", "f"],
                [("a", "b"), ("a", "c"), ("a", "d"), ("b", "e"), ("b", "f")],
                "custom", "تمرین ۹-الف درس ۲، ص ۵۳؛ تنها γ-مجموعه {a,b} است."),
              "modeling": modeling("تمرین ۹-الف درس ۲؛ رسم گراف ۶ رأسی با γ-مجموعه یکتا", "رأس", "یال",
                "دو ستاره که در یال ab به هم وصل‌اند؛ تنها {a,b} همه را می‌پوشاند."),
              "answer_fa": "یک مثال درست: گراف دو ستاره‌ای با یال‌های $ab$ و $ac$ و $ad$ و $be$ و $bf$؛ تنها $\\gamma$-مجموعه $\\{a,b\\}$ است، پس $\\gamma=2$ و یکتاست. ستاره $S_6$ جواب نمی‌دهد چون $\\gamma(S_6)=1$ است و $\\{a,x\\}$ برای هر برگ $x$ هم احاطه‌گر $2$ عضوی است، پس یکتا نیست. در آزمایشگاه با شمارش همه $\\gamma$-مجموعه‌ها یکتایی را بررسی کن.",
              "answer_value": "$\\gamma=2$، تنها $\\gamma$-مجموعه $\\{a,b\\}$"},
    "Q133": {"graph": make_graph("unique_gamma_4", "custom",
                ["a", "b", "c", "d"], [("a", "b"), ("b", "c")],
                "custom", "تمرین ۱۰-الف درس ۲، ص ۵۴؛ برای n=4: مسیر P3 به‌علاوه رأس تنها؛ تنها γ-مجموعه {b,d} است. برای n=3 چنین گرافی وجود ندارد (اثبات در پاسخ)."),
              "modeling": modeling("تمرین ۱۰-الف درس ۲؛ رسم گراف با γ-مجموعه یکتا", "رأس", "یال",
                "مسیر سه رأسی به‌علاوه یک رأس تنها؛ تنها {b,d} همه را می‌پوشاند."),
              "answer_fa": "برای $n=1$ ناممکن است چون $\\gamma$ حداکثر $1$ است. برای $n=2$ گراف بدون یال جواب می‌دهد: تنها $\\gamma$-مجموعه $\\{a,b\\}$ است. برای $n=3$ ناممکن است: اگر $\\{x,y\\}$ احاطه‌گر باشد، رأس سوم به $x$ یا $y$ وصل است؛ آنگاه جفت دیگر هم احاطه‌گر می‌شود، پس $\\gamma$-مجموعه یکتا نداریم. برای $n=4$ مسیر $P_3$ روی $a$ و $b$ و $c$ به‌علاوه رأس تنهای $d$ جواب می‌دهد: تنها $\\gamma$-مجموعه $\\{b,d\\}$ است. در آزمایشگاه با شمارش همه $\\gamma$-مجموعه‌ها یکتایی را بررسی کن.",
              "answer_value": "$n=3$ ناممکن؛ $n=4$: $\\{b,d\\}$ یکتا"},
    # --- §2 decisions: graph fully determined by the question itself ---
    "Q005": {"graph": make_graph("K33", "bipartite", K33_V, K33_E, "bip",
                "شیخ بهایی: سه خانه و سه چاه؛ هر خانه به هر چاه وصل است (K3,3).")},
    "Q006": {"graph": make_graph("K33", "bipartite", K33_V, K33_E, "bip",
                "شیخ بهایی: سه خانه و سه چاه؛ K3,3 نامسطح است.")},
    "Q114": {"graph": make_graph("Q4", "hypercube",
                ["a", "b", "c", "d", "e", "f", "g", "h", "i", "j", "k", "l", "m", "n", "o", "p"],
                Q4_E, "custom",
                "شکل ۹ درس ۲، ص ۴۹؛ مکعب چهاربعدی Q4؛ هر رأس درجه ۴.")},
}


# --- v1.1 errors found by verification: only 2 hints instead of the required 3 ---
# (level-3 hint = the gamma itself, per repo convention)
HINT_FIXES = {
    "Q099": ["یک رأس از هر بخش بردار.", "یک رأس به‌تنهایی چه می‌پوشاند؟",
             "$\\gamma=1$ است؛ رأس مرکزی $a$ همه را می‌پوشاند."],
    "Q100": ["یک رأس از هر بخش بردار.", "یک رأس به‌تنهایی چه می‌پوشاند؟",
             "$\\gamma=2$ است؛ مثلاً $\\{a,b\\}$."],
    "Q101": ["یک رأس از هر بخش بردار.", "یک رأس به‌تنهایی چه می‌پوشاند؟",
             "$\\gamma=2$ است؛ مثلاً $\\{a,b\\}$."],
    "Q102": ["یک رأس از هر بخش بردار.", "یک رأس به‌تنهایی چه می‌پوشاند؟",
             "$\\gamma=2$ است؛ مثلاً $\\{a,d\\}$."],
    "Q134": ["جفت‌های مقابل را امتحان کن.", "همه را لیست کن.",
             "$\\gamma=2$ است؛ در $C_4$ دو $\\gamma$-مجموعه هست."],
}


def practice_ready(q):
    """T006-flavoured readiness for the practice tab: modeling (context/mapping)
    present, and a graph present when the type needs one to run interactively."""
    if "practice" not in q["tabs"]:
        return False
    if not q.get("modeling"):
        return False
    if q["type"] in ("interactive_graph", "compute_gamma", "draw") and not q.get("graph"):
        return False
    return True


def verify(data, label):
    qs = data["questions"]
    errs = []
    if len(qs) != 150:
        errs.append(f"total != 150: {len(qs)}")
    ids = [q["id"] for q in qs]
    if ids != [f"Q{i:03d}" for i in range(1, 151)]:
        errs.append("IDs are not exactly Q001..Q150 in order")
    for q in qs:
        if len(q.get("hints", [])) != 3:
            errs.append(f"{q['id']}: hints != 3")
        if not q.get("sahat") or not q.get("sahat_reason_fa"):
            errs.append(f"{q['id']}: sahat missing")
        g = q.get("graph")
        if g:
            if g.get("directed"):
                if g.get("gamma") is not None:
                    errs.append(f"{q['id']}: directed graph must have gamma null")
                continue
            gamma, sets = gamma_and_sets(g["vertices"], [tuple(e) for e in g["edges"]])
            if gamma != g["gamma"]:
                errs.append(f"{q['id']}: stored gamma {g['gamma']} != computed {gamma}")
            if len(sets) != g["gamma_sets_count"]:
                errs.append(f"{q['id']}: stored gamma_sets_count {g['gamma_sets_count']} != computed {len(sets)}")
            stored = {frozenset(s.strip("{}").split(", ")) for s in g["gamma_sets"]}
            if not stored <= set(sets):
                errs.append(f"{q['id']}: listed gamma_sets are not all true gamma-sets")
            if g["n"] != len(g["vertices"]):
                errs.append(f"{q['id']}: n != len(vertices)")
            if sorted({v for e in g["edges"] for v in e}) != sorted(g["vertices"]) and g["edges"]:
                # every vertex need not appear in an edge (isolated vertices exist)
                pass
            for a, b in g["edges"]:
                if a not in g["vertices"] or b not in g["vertices"] or a == b:
                    errs.append(f"{q['id']}: bad edge {(a, b)}")
    from collections import Counter
    c = {
        "total": len(qs),
        "with_modeling": sum(1 for q in qs if q.get("modeling")),
        "with_graph": sum(1 for q in qs if q.get("graph")),
        "with_both": sum(1 for q in qs if q.get("modeling") and q.get("graph")),
        "with_neither": sum(1 for q in qs if not q.get("modeling") and not q.get("graph")),
        "practice_total": sum(1 for q in qs if "practice" in q["tabs"]),
        "practice_ready": sum(1 for q in qs if practice_ready(q)),
        "by_type": dict(Counter(q["type"] for q in qs)),
        "by_category": dict(Counter(q["category"] for q in qs)),
        "interactive_no_graph": [q["id"] for q in qs if q["type"] == "interactive_graph" and not q.get("graph")],
        "compute_no_graph": [q["id"] for q in qs if q["type"] == "compute_gamma" and not q.get("graph")],
        "draw_no_graph": [q["id"] for q in qs if q["type"] == "draw" and not q.get("graph")],
    }
    print(f"--- verify {label} ---")
    for k, v in c.items():
        print(f"  {k}: {v}")
    if errs:
        print("ERRORS:")
        for e in errs:
            print("  !!", e)
    else:
        print("  no errors")
    return errs, c


def diff_check(old, new):
    """Ensure only allowed fields changed."""
    allowed = {"graph", "modeling", "answer_fa", "answer_value", "hints"}
    changed = {}
    for o, n in zip(old["questions"], new["questions"]):
        assert o["id"] == n["id"]
        diffs = [k for k in set(o) | set(n) if o.get(k) != n.get(k)]
        if diffs:
            bad = [k for k in diffs if k not in allowed]
            changed[o["id"]] = diffs
            if bad:
                raise AssertionError(f"{o['id']}: disallowed field change: {bad}")
    return changed


def main():
    verify_only = "--verify-only" in sys.argv
    if verify_only:
        data = json.load(open(OUT, encoding="utf-8"))
        errs, _ = verify(data, "v1.2 file")
        sys.exit(1 if errs else 0)

    src = json.load(open(SRC, encoding="utf-8"))
    data = copy.deepcopy(src)
    by_id = {q["id"]: q for q in data["questions"]}
    for qid, edits in EDITS.items():
        by_id[qid].update(edits)
    for qid, hints in HINT_FIXES.items():
        by_id[qid]["hints"] = hints
    changed = diff_check(src, data)
    print("changed questions:", sorted(changed))
    for qid in sorted(changed):
        print(f"  {qid}: {changed[qid]}")

    errs, counts = verify(data, "v1.2 (built)")
    if errs:
        print("BUILD ABORTED: verification errors above")
        sys.exit(1)

    data["meta"]["version"] = "1.2"
    data["meta"]["date"] = "2026-11-11"
    data["meta"]["counts"]["with_modeling"] = counts["with_modeling"]
    data["meta"]["counts"]["with_graph"] = counts["with_graph"]
    data["meta"]["counts"]["practice_ready"] = counts["practice_ready"]
    data["meta"].setdefault("notes_fa", []).append(
        "نسخه ۱٫۲ (۲۰۲۶-۱۱-۱۱): گراف ۲۶ سؤال must-fix اضافه شد (Q014، Q015، Q017، Q019، Q024، Q034، Q046، Q055، "
        "Q064، Q065، Q074، Q078، Q133، Q135، Q136، Q139، Q142 تا Q150) به‌علاوه K3,3 برای Q005 و Q006 و مکعب Q4 برای Q114؛ "
        "همه γها با جستجوی فراگیر محاسبه شده‌اند. Q141 و Q146 گراف ندارند چون سؤال‌های فراداده‌ای چالش/بازی‌اند و گراف را از کتابخانه استاندارد می‌گیرند. "
        "دو خطای پاسخ اصلاح شد: Q074 (مثال یکتای درست) و Q133 (n=3 ناممکن است؛ اثبات در پاسخ)."
    )
    with open(OUT, "w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, indent=2)
        f.write("\n")
    print(f"wrote {OUT}")
    errs2, _ = verify(json.load(open(OUT, encoding="utf-8")), "v1.2 file (re-read)")
    sys.exit(1 if errs2 else 0)


if __name__ == "__main__":
    main()
