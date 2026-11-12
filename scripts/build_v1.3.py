#!/usr/bin/env python3
"""Build question-bank v1.3 from v1.2 (question-bank-v1.2.json) and verify it.

Goal: raise the practice-ready count as far as legitimately possible,
without inventing book figures.

- Adds a genuine modeling field to every compute_gamma / interactive_graph /
  draw question that lacked one (their graphs were already stored in v1.2),
  plus to text questions whose own text already implies a network, a standard
  family, a book figure, or the domination-as-service-coverage reading.
- Adds graphs only where the graph is derivable from the question text or
  from another question's already-verified graph of the same figure:
  the ATM graph for Q032/Q033/Q035 (same Fig. 2 as Q034), the radio graph
  for Q039 (same 11-city graph as Q036-Q038), the Q4 hypercube for Q115
  (same Fig. 9 as Q114), C6 for Q120 (the answer names it), and the
  directed tournament graph for Q008-Q011 (all six results are stated in
  the book text, example 5 lesson 1).
- Every gamma / gamma_sets value is COMPUTED here by brute-force subset
  search; no gamma is hand-entered. The script re-verifies ALL 150 graphs.
- NOT touched: sahat tags/reasons, categories, difficulty, APOS, IDs,
  existing correct graphs/modeling. Proof questions and pure
  definition/notation questions (Q016, Q018, Q021, Q056, Q059, Q061, Q066,
  Q029, Q076, Q093, Q094, Q108, Q137) get no modeling — forcing it there
  would be fabrication. Q141/Q146 stay graph-null (meta questions);
  Q014 stays directed with gamma null; Q055/Q114 stay as-is.

Usage:
    python3 build_v1.3.py            # build + verify, write question-bank-v1.3.json
    python3 build_v1.3.py --verify-only   # only verify the written v1.3 file
"""
import copy
import itertools
import json
import sys
from pathlib import Path

HERE = Path(__file__).resolve().parent
SRC = HERE / "question-bank-v1.2.json"       # v1.2 (untouched)
OUT = HERE / "question-bank-v1.3.json"


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


def modeling(scenario, vertex, edge, question_in_model, visual):
    return {
        "scenario_fa": scenario,
        "vertex_means_fa": vertex,
        "edge_means_fa": edge,
        "question_in_model_fa": question_in_model,
        "visual_idea_fa": visual,
    }


# ---------------------------------------------------------------- shared graphs
# ATM graph (Fig. 2, lesson 2, p. 44) — same as Q034 in v1.2.
ATM_V = ["a", "b", "c", "d", "e", "f", "g", "h"]
ATM_E = [("a", "b"), ("b", "c"), ("a", "d"), ("d", "e"), ("b", "e"),
         ("d", "f"), ("f", "g"), ("f", "h"), ("g", "h")]

# Radio-stations graph (11 cities, edge iff distance <= 50 km) — same as Q036-Q038.
RADIO_V = ["a", "b", "c", "d", "e", "f", "g", "h", "i", "j", "k"]
RADIO_E = [("a", "b"), ("a", "d"), ("a", "g"), ("a", "i"), ("a", "k"),
           ("b", "d"), ("c", "d"), ("c", "f"), ("c", "g"), ("d", "e"),
           ("d", "g"), ("d", "h"), ("e", "f"), ("e", "g"), ("e", "h"),
           ("f", "g"), ("f", "h"), ("g", "h"), ("i", "j"), ("i", "k"),
           ("j", "k")]

# Q4 hypercube (Fig. 9, lesson 2, p. 49) — same as Q114 in v1.2.
Q4_FRONT = [("a", "b"), ("b", "h"), ("h", "g"), ("g", "a"),
            ("c", "d"), ("d", "f"), ("f", "e"), ("e", "c"),
            ("a", "c"), ("b", "d"), ("g", "e"), ("h", "f")]
Q4_BACK = [("i", "j"), ("j", "p"), ("p", "o"), ("o", "i"),
           ("k", "l"), ("l", "n"), ("n", "m"), ("m", "k"),
           ("i", "k"), ("j", "l"), ("o", "m"), ("p", "n")]
Q4_MATCH = [("a", "i"), ("b", "j"), ("c", "k"), ("d", "l"),
            ("e", "m"), ("f", "n"), ("g", "o"), ("h", "p")]
Q4_V = ["a", "b", "c", "d", "e", "f", "g", "h", "i", "j", "k", "l", "m", "n", "o", "p"]
Q4_E = Q4_FRONT + Q4_BACK + Q4_MATCH

# Tournament (example 5, lesson 1): five teams, directed edge winner -> loser.
# Book text states all six results: a beat b, e and lost to c; b beat d;
# c beat a, e; d lost to b, e; e beat d and lost to a, c.
TOURN_V = ["a", "b", "c", "d", "e"]
TOURN_E = [("a", "b"), ("a", "e"), ("b", "d"), ("c", "a"), ("c", "e"), ("e", "d")]
TOURN_NOTE = ("مثال ۵ درس ۱؛ گراف جهت‌دار بازی‌های پنج تیم؛ جهت یال از برنده به بازنده است: "
              "a→b، a→e، b→d، c→a، c→e، e→d. γ برای گراف جهت‌دار در این فصل تعریف نشده است.")

C6_V = ["a", "b", "c", "d", "e", "f"]
C6_E = [("a", "b"), ("b", "c"), ("c", "d"), ("d", "e"), ("e", "f"), ("f", "a")]


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


# ---------------------------------------------------------------- new modeling
# Each entry is a genuine reading of the question's own text: the domination
# questions are read as "fewest service centres covering every place"
# (the chapter's own motivation: ATMs, radio stations, hospitals), and the
# family questions as the network of that family (line / ring / star / ...).
# No modeling was added to pure proofs or pure definition/notation questions.
MODELING = {
    # --- compute_gamma: standard families (graph already stored in v1.2) ---
    "Q019": modeling("۹ شهر که هر دو شهر به هم راه مستقیم دارند؛ در کل ۳۶ راه مستقیم بین آن‌هاست (گراف کامل K9)",
        "هر شهر یک رأس", "راه مستقیم بین دو شهر",
        "در این شبکه کامل، p چند است و درجه هر شهر چند است؟",
        "۹ شهر در یک دایره که همه به هم وصل‌اند؛ هر شهر ۸ راه دارد."),
    "Q048": modeling("۵ ایستگاه در یک خط کنار یک جاده؛ هر ایستگاه فقط با همسایه‌های کناری‌اش راه دارد (مسیر P5)",
        "هر ایستگاه یک رأس", "جاده مستقیم بین دو ایستگاه همسایه",
        "کمترین مرکز خدمت برای این ۵ ایستگاه در یک خط چند است؟",
        "۵ ایستگاه در یک خط؛ مرکز خدمت، ایستگاه خودش و همسایه‌هایش را پوشش می‌دهد."),
    "Q049": modeling("۶ مکان دور یک میدان که جاده‌ای حلقوی آن‌ها را به هم وصل می‌کند (دور C6)",
        "هر مکان یک رأس", "جاده مستقیم بین دو مکان همسایه در حلقه",
        "کمترین مرکز خدمت برای این ۶ مکان دور میدان چند است؟",
        "۶ مکان در یک حلقه؛ دو مکان مقابل هم همه را پوشش می‌دهند."),
    "Q050": modeling("۴ مکان که هر دو مکان به هم راه مستقیم دارند (گراف کامل K4)",
        "هر مکان یک رأس", "راه مستقیم بین دو مکان",
        "کمترین مرکز خدمت برای این ۴ مکان چند است؟",
        "۴ مکان که همه به هم وصل‌اند؛ یک مرکز همه را می‌پوشاند."),
    "Q051": modeling("یک مرکز و ۴ مکان اطراف آن که فقط به مرکز وصل‌اند و به هم راه ندارند (ستاره S5)",
        "مرکز و هر مکان اطراف یک رأس", "راه مستقیم بین مرکز و هر مکان اطراف",
        "کمترین مرکز خدمت برای این شبکه ستاره‌ای چند است؟",
        "یک مرکز در وسط و ۴ مکان دور آن؛ مرکز همه را می‌پوشاند."),
    "Q057": modeling("۳ ایستگاه در یک خط؛ ایستگاه وسط با هر دو ایستگاه کناری راه دارد (مسیر P3)",
        "هر ایستگاه یک رأس", "جاده مستقیم بین دو ایستگاه همسایه",
        "چرا یک مرکز در ایستگاه وسط برای هر سه ایستگاه کافی است؟",
        "۳ ایستگاه در یک خط؛ ایستگاه وسط با هر دو طرف مجاور است."),
    "Q058": modeling("۴ مکان دور یک میدان مربعی که جاده‌ای حلقوی آن‌ها را وصل می‌کند (دور C4)",
        "هر مکان یک رأس", "جاده مستقیم بین دو مکان همسایه در حلقه",
        "کمترین مرکز خدمت برای این ۴ مکان چند است؟",
        "۴ مکان در یک مربع؛ دو مکان مقابل هم همه را پوشش می‌دهند."),
    "Q060": modeling("دو گروه مکان: ۲ مکان در گروه اول و ۳ مکان در گروه دوم؛ هر مکان گروه اول به همه مکان‌های گروه دوم وصل است و درون هر گروه راهی نیست (K2,3)",
        "هر مکان یک رأس", "راه مستقیم بین یک مکان گروه اول و یک مکان گروه دوم",
        "آیا یک مرکز به‌تنهایی همه مکان‌ها را پوشش می‌دهد؟ کمترین مرکز چند است؟",
        "دو ستون مکان؛ یال‌ها فقط بین دو ستون کشیده می‌شوند."),
    "Q062": modeling("۷ مکان دور یک میدان (شکل ۳ درس ۲، دور C7)؛ مجموعه‌های داده‌شده در کتاب را بررسی کن",
        "هر مکان یک رأس", "جاده مستقیم بین دو مکان همسایه در حلقه",
        "کدام‌یک از مجموعه‌های {v1,v3,v5,v7} و {v1,v4,v7} و {v1,v2,v5} احاطه‌گرند و γ چند است؟",
        "۷ مکان در یک حلقه؛ مجموعه‌های سه‌عضوی و چهارعضوی را با مهره امتحان کن."),
    "Q067": modeling("۶ ایستگاه در یک خط (مسیر P6)؛ مجموعه {v2,v4,v6} را بررسی کن",
        "هر ایستگاه یک رأس", "جاده مستقیم بین دو ایستگاه همسایه",
        "آیا {v2,v4,v6} احاطه‌گر است؟ مینیمال است؟ مینیمم است؟",
        "۶ ایستگاه در یک خط؛ سه مرکز یکی‌درمیان همه را می‌پوشانند ولی کمترین نیستند."),
    "Q068": modeling("۱۲ ایستگاه در یک خط (مسیر P12، تمرین ۱۱ درس ۲)",
        "هر ایستگاه یک رأس", "جاده مستقیم بین دو ایستگاه همسایه",
        "یک γ-مجموعه و یک مجموعه مینیمال ۶ عضوی از این ۱۲ ایستگاه مشخص کن.",
        "۱۲ ایستگاه در یک خط؛ مرکزها را یکی‌درمیان بگذار و با مجموعه ۶ عضوی مقایسه کن."),
    "Q069": modeling("۷ ایستگاه در یک خط (مسیر P7)",
        "هر ایستگاه یک رأس", "جاده مستقیم بین دو ایستگاه همسایه",
        "γ چند است؟ یک γ-مجموعه و یک مجموعه مینیمال غیرمینیمم بنویس.",
        "۷ ایستگاه در یک خط؛ سه مرکز کافی‌اند ولی یک انتخاب چهارمرکزی هم مینیمال است."),
    "Q070": modeling("۶ مکان دور یک میدان (دور C6)",
        "هر مکان یک رأس", "جاده مستقیم بین دو مکان همسایه در حلقه",
        "γ چند است؟ یک γ-مجموعه و یک مجموعه مینیمال غیرمینیمم بنویس.",
        "۶ مکان در یک حلقه؛ دو مکان مقابل هم کافی‌اند ولی سه مکان یکی‌درمیان هم مینیمال است."),
    "Q071": modeling("یک مرکز و ۳ مکان اطراف آن که فقط به مرکز وصل‌اند (ستاره S4)",
        "مرکز و هر مکان اطراف یک رأس", "راه مستقیم بین مرکز و هر مکان اطراف",
        "γ چند است؟ یک γ-مجموعه و یک مجموعه مینیمال غیرمینیمم بنویس.",
        "یک مرکز در وسط و ۳ مکان دور آن؛ مرکز به‌تنهایی کافی است."),
    "Q072": modeling("دو گروه مکان: ۲ مکان در گروه اول و ۳ مکان در گروه دوم؛ هر مکان گروه اول به همه مکان‌های گروه دوم وصل است (K2,3)",
        "هر مکان یک رأس", "راه مستقیم بین یک مکان گروه اول و یک مکان گروه دوم",
        "γ چند است؟ یک γ-مجموعه و یک مجموعه مینیمال غیرمینیمم بنویس.",
        "دو ستون مکان؛ یک مرکز از هر ستون همه را می‌پوشاند."),
    "Q073": modeling("یک مرکز و ۵ مکان دور آن در یک حلقه؛ مرکز به همه مکان‌های حلقه وصل است (چرخ W5)",
        "مرکز و هر مکان حلقه یک رأس", "راه مستقیم بین مرکز و هر مکان حلقه، و بین مکان‌های همسایه در حلقه",
        "γ چند است؟ یک γ-مجموعه و یک مجموعه مینیمال غیرمینیمم بنویس.",
        "یک مرکز در وسط و ۵ مکان دور آن؛ مرکز به‌تنهایی همه را می‌پوشاند."),
    "Q079": modeling("۴ ایستگاه در یک خط (مسیر P4)؛ مجموعه {a,c} را بررسی کن",
        "هر ایستگاه یک رأس", "جاده مستقیم بین دو ایستگاه همسایه",
        "آیا {a,c} احاطه‌گر است؟ مینیمال است؟ مینیمم است؟",
        "۴ ایستگاه در یک خط؛ دو مرکز یکی‌درمیان همه را می‌پوشانند."),
    "Q080": modeling("۴ مکان دور یک میدان (دور C4)؛ مجموعه {a,b} را بررسی کن",
        "هر مکان یک رأس", "جاده مستقیم بین دو مکان همسایه در حلقه",
        "آیا {a,b} احاطه‌گر است؟ مینیمال است؟ مینیمم است؟",
        "۴ مکان در یک مربع؛ دو مکان مجاور هم همه را می‌پوشانند."),
    "Q081": modeling("۳ مکان که هر دو به هم راه مستقیم دارند (گراف کامل K3)؛ مجموعه {a} را بررسی کن",
        "هر مکان یک رأس", "راه مستقیم بین دو مکان",
        "آیا {a} احاطه‌گر است؟ مینیمال است؟ مینیمم است؟",
        "۳ مکان که همه به هم وصل‌اند؛ یک مرکز همه را می‌پوشاند."),
    "Q082": modeling("یک مرکز و ۴ مکان اطراف آن (ستاره S5)؛ مجموعه {a} یعنی همان مرکز را بررسی کن",
        "مرکز و هر مکان اطراف یک رأس", "راه مستقیم بین مرکز و هر مکان اطراف",
        "آیا {a} احاطه‌گر است؟ مینیمال است؟ مینیمم است؟",
        "یک مرکز در وسط و ۴ مکان دور آن؛ مرکز به‌تنهایی همه را می‌پوشاند."),
    "Q083": modeling("دو گروه ۲+۲ مکان؛ هر مکان گروه اول به هر دو مکان گروه دوم وصل است (K2,2)",
        "هر مکان یک رأس", "راه مستقیم بین یک مکان گروه اول و یک مکان گروه دوم",
        "آیا {a,b} احاطه‌گر است؟ مینیمال است؟ مینیمم است؟",
        "دو ستون دوتایی؛ دو مکان یک ستون همه را می‌پوشانند."),
    "Q084": modeling("یک مرکز و ۴ مکان دور آن در یک حلقه (چرخ W4)؛ مجموعه {e} یعنی همان مرکز را بررسی کن",
        "مرکز و هر مکان حلقه یک رأس", "راه مستقیم بین مرکز و هر مکان حلقه، و بین مکان‌های همسایه در حلقه",
        "آیا {e} احاطه‌گر است؟ مینیمال است؟ مینیمم است؟",
        "یک مرکز در وسط و ۴ مکان دور آن؛ مرکز به‌تنهایی همه را می‌پوشاند."),
    "Q085": modeling("۵ ایستگاه در یک خط (مسیر P5)؛ مجموعه {a,d} را بررسی کن",
        "هر ایستگاه یک رأس", "جاده مستقیم بین دو ایستگاه همسایه",
        "آیا {a,d} احاطه‌گر است؟ مینیمال است؟ مینیمم است؟",
        "۵ ایستگاه در یک خط؛ مرکزهای a و d همه را می‌پوشانند."),
    "Q086": modeling("۵ مکان دور یک میدان (دور C5)؛ مجموعه {a,c} را بررسی کن",
        "هر مکان یک رأس", "جاده مستقیم بین دو مکان همسایه در حلقه",
        "آیا {a,c} احاطه‌گر است؟ مینیمال است؟ مینیمم است؟",
        "۵ مکان در یک حلقه؛ دو مرکز همه را می‌پوشانند."),
    "Q087": modeling("۳ ایستگاه در یک خط (مسیر P3)؛ فرمول γ=⌈n/3⌉ را بررسی کن",
        "هر ایستگاه یک رأس", "جاده مستقیم بین دو ایستگاه همسایه",
        "γ چند است و آیا با فرمول ⌈n/3⌉ جور درمی‌آید؟",
        "۳ ایستگاه در یک خط؛ یک مرکز وسط همه را می‌پوشاند."),
    "Q088": modeling("۴ ایستگاه در یک خط (مسیر P4)؛ فرمول γ=⌈n/3⌉ را بررسی کن",
        "هر ایستگاه یک رأس", "جاده مستقیم بین دو ایستگاه همسایه",
        "γ چند است و آیا با فرمول ⌈n/3⌉ جور درمی‌آید؟",
        "۴ ایستگاه در یک خط؛ دو مرکز یکی‌درمیان لازم‌اند."),
    "Q089": modeling("۵ ایستگاه در یک خط (مسیر P5)؛ فرمول γ=⌈n/3⌉ را بررسی کن",
        "هر ایستگاه یک رأس", "جاده مستقیم بین دو ایستگاه همسایه",
        "γ چند است و آیا با فرمول ⌈n/3⌉ جور درمی‌آید؟",
        "۵ ایستگاه در یک خط؛ دو مرکز همه را می‌پوشانند."),
    "Q090": modeling("۸ ایستگاه در یک خط (مسیر P8)؛ فرمول γ=⌈n/3⌉ را بررسی کن",
        "هر ایستگاه یک رأس", "جاده مستقیم بین دو ایستگاه همسایه",
        "γ چند است و آیا با فرمول ⌈n/3⌉ جور درمی‌آید؟",
        "۸ ایستگاه در یک خط؛ سه مرکز با فاصله سه‌تایی همه را می‌پوشانند."),
    "Q091": modeling("۹ مکان دور یک میدان (دور C9)؛ فرمول γ=⌈n/3⌉ را بررسی کن",
        "هر مکان یک رأس", "جاده مستقیم بین دو مکان همسایه در حلقه",
        "γ چند است و آیا با فرمول ⌈n/3⌉ جور درمی‌آید؟",
        "۹ مکان در یک حلقه؛ سه مرکز با فاصله سه‌تایی همه را می‌پوشانند."),
    "Q092": modeling("۱۰ مکان دور یک میدان (دور C10)؛ فرمول γ=⌈n/3⌉ را بررسی کن",
        "هر مکان یک رأس", "جاده مستقیم بین دو مکان همسایه در حلقه",
        "γ چند است و آیا با فرمول ⌈n/3⌉ جور درمی‌آید؟",
        "۱۰ مکان در یک حلقه؛ چهار مرکز لازم‌اند."),
    "Q095": modeling("۵ مکان که هر دو به هم راه مستقیم دارند (گراف کامل K5)",
        "هر مکان یک رأس", "راه مستقیم بین دو مکان",
        "γ چند است؟ چرا یک مرکز کافی است؟",
        "۵ مکان که همه به هم وصل‌اند؛ هر مرکز به‌تنهایی همه را می‌پوشاند."),
    "Q096": modeling("۳ مکان که هر دو به هم راه مستقیم دارند (گراف کامل K3)",
        "هر مکان یک رأس", "راه مستقیم بین دو مکان",
        "γ چند است؟ چرا یک مرکز کافی است؟",
        "۳ مکان که همه به هم وصل‌اند؛ هر مرکز به‌تنهایی همه را می‌پوشاند."),
    "Q097": modeling("یک مرکز و ۳ مکان اطراف آن (ستاره S4)",
        "مرکز و هر مکان اطراف یک رأس", "راه مستقیم بین مرکز و هر مکان اطراف",
        "γ چند است؟ چرا مرکز به‌تنهایی کافی است؟",
        "یک مرکز در وسط و ۳ مکان دور آن؛ مرکز همه را می‌پوشاند."),
    "Q098": modeling("یک مرکز و ۴ مکان اطراف آن (ستاره S5)",
        "مرکز و هر مکان اطراف یک رأس", "راه مستقیم بین مرکز و هر مکان اطراف",
        "γ چند است؟ چرا مرکز به‌تنهایی کافی است؟",
        "یک مرکز در وسط و ۴ مکان دور آن؛ مرکز همه را می‌پوشاند."),
    "Q099": modeling("دو گروه مکان: ۱ مکان در گروه اول و ۴ مکان در گروه دوم؛ مکان گروه اول به همه مکان‌های گروه دوم وصل است (K1,4)",
        "هر مکان یک رأس", "راه مستقیم بین مکان گروه اول و هر مکان گروه دوم",
        "γ چند است؟ یک γ-مجموعه بنویس.",
        "یک مکان تنها در یک ستون و ۴ مکان در ستون دیگر؛ مکان تنها همه را می‌پوشاند."),
    "Q100": modeling("دو گروه ۲+۲ مکان؛ هر مکان گروه اول به هر دو مکان گروه دوم وصل است (K2,2)",
        "هر مکان یک رأس", "راه مستقیم بین یک مکان گروه اول و یک مکان گروه دوم",
        "γ چند است؟ یک γ-مجموعه بنویس.",
        "دو ستون دوتایی؛ دو مکان یک ستون همه را می‌پوشانند."),
    "Q101": modeling("دو گروه مکان: ۲ مکان در گروه اول و ۳ مکان در گروه دوم (K2,3)",
        "هر مکان یک رأس", "راه مستقیم بین یک مکان گروه اول و یک مکان گروه دوم",
        "γ چند است؟ یک γ-مجموعه بنویس.",
        "دو ستون مکان؛ یک مرکز از هر ستون همه را می‌پوشاند."),
    "Q102": modeling("دو گروه ۳+۳ مکان؛ هر مکان گروه اول به همه مکان‌های گروه دوم وصل است (K3,3)",
        "هر مکان یک رأس", "راه مستقیم بین یک مکان گروه اول و یک مکان گروه دوم",
        "γ چند است؟ یک γ-مجموعه بنویس.",
        "دو ستون سه‌تایی؛ دو مکان همه را می‌پوشانند."),
    "Q103": modeling("یک مرکز و ۴ مکان دور آن در یک حلقه (چرخ W4)",
        "مرکز و هر مکان حلقه یک رأس", "راه مستقیم بین مرکز و هر مکان حلقه، و بین مکان‌های همسایه در حلقه",
        "γ چند است؟ یک γ-مجموعه بنویس.",
        "یک مرکز در وسط و ۴ مکان دور آن؛ مرکز به‌تنهایی همه را می‌پوشاند."),
    "Q104": modeling("یک مرکز و ۵ مکان دور آن در یک حلقه (چرخ W5)",
        "مرکز و هر مکان حلقه یک رأس", "راه مستقیم بین مرکز و هر مکان حلقه، و بین مکان‌های همسایه در حلقه",
        "γ چند است؟ یک γ-مجموعه بنویس.",
        "یک مرکز در وسط و ۵ مکان دور آن؛ مرکز به‌تنهایی همه را می‌پوشاند."),
    "Q105": modeling("۱۰ ایستگاه در شبکه پترسن: پنج‌ضلعی بیرونی و ستاره درونی که با هم وصل‌اند",
        "هر ایستگاه یک رأس", "راه مستقیم بین دو ایستگاه مجاور در شبکه پترسن",
        "γ شبکه پترسن چند است؟ یک γ-مجموعه بنویس.",
        "پنج‌ضلعی بیرونی و ستاره درونی؛ سه مرکز همه را می‌پوشانند."),
    # --- draw (graph already stored in v1.2) ---
    "Q015": modeling("شش مکان با هفت راه مستقیم بین آن‌ها (تمرین ۱ درس ۱)",
        "هر مکان یک رأس", "راه مستقیم بین دو مکان",
        "نمودار این گراف را رسم کن؛ مرتبه و اندازه آن چند است؟",
        "شش مکان با هفت راه؛ رأس f فقط با e و c وصل است."),
    "Q075": modeling("۶ مکان دور یک میدان (دور C6)؛ گرافی با بیش از یک γ-مجموعه",
        "هر مکان یک رأس", "جاده مستقیم بین دو مکان همسایه در حلقه",
        "یک گراف ۶ رأسی با γ=2 رسم کن که بیش از یک γ-مجموعه داشته باشد.",
        "۶ مکان در یک حلقه؛ جفت‌های مقابل هم هر سه γ-مجموعه‌اند."),
    "Q110": modeling("۳ مکان در یک خط (مسیر P3)؛ کران پایین ⌈n/(Δ+1)⌉ در اینجا دقیق است",
        "هر مکان یک رأس", "جاده مستقیم بین دو مکان همسایه",
        "گرافی مشخص کن که γ آن برابر کران پایین ⌈n/(Δ+1)⌉ باشد.",
        "۳ مکان در یک خط؛ یک مرکز وسط، کران و γ هر دو ۱ است."),
    "Q111": modeling("۶ مکان با راه‌های ab و ac و af و be و cd؛ کران پایین ⌈n/(Δ+1)⌉ در اینجا دقیق نیست",
        "هر مکان یک رأس", "راه مستقیم بین دو مکان",
        "گرافی مشخص کن که γ آن برابر کران پایین ⌈n/(Δ+1)⌉ نباشد.",
        "۶ مکان؛ کران پایین ۲ می‌گوید ولی γ برابر ۳ است."),
    "Q132": modeling("۱۲ مکان در یک حلقه (دور C12)؛ گراف ۲-منتظم با کمترین γ ممکن",
        "هر مکان یک رأس", "جاده مستقیم بین دو مکان همسایه در حلقه",
        "یک گراف ۲-منتظم ۱۲ رأسی بکش که γ آن کمترین مقدار ممکن باشد.",
        "۱۲ مکان در یک حلقه؛ چهار مرکز با فاصله سه‌تایی همه را می‌پوشانند."),
    "Q134": modeling("۴ مکان دور یک میدان (دور C4)؛ بیش از یک γ-مجموعه برای n≤4",
        "هر مکان یک رأس", "جاده مستقیم بین دو مکان همسایه در حلقه",
        "برای هر n≤4 گرافی با γ=2 و بیش از یک γ-مجموعه رسم کن.",
        "۴ مکان در یک مربع؛ جفت‌های مقابل هم هر دو γ-مجموعه‌اند."),
    # --- text: the question itself is about a network, a family, a figure,
    #     or domination-as-service-coverage (the chapter's own motivation) ---
    "Q012": modeling("۹ مکان که با ۱۰ راه مستقیم به هم وصل‌اند؛ مرتبه و اندازه گراف آن‌ها را می‌خواهیم",
        "هر مکان یک رأس", "راه مستقیم بین دو مکان",
        "مرتبه و اندازه این گراف چند است؟",
        "۹ نقطه و ۱۰ خط بین آن‌ها؛ مرتبه تعداد نقطه‌هاست و اندازه تعداد خط‌ها."),
    "Q013": modeling("نقشه یک محله: مکان‌ها و راه‌های مستقیم بین آن‌ها",
        "هر مکان یک رأس", "راه مستقیم بین دو مکان",
        "چرا می‌توان به‌جای شکل نقشه، فهرست مکان‌ها و راه‌ها (V و E) را نوشت؟",
        "نقشه محله کنار فهرست مکان‌ها و راه‌هایش؛ هر دو یک اطلاعات را می‌دهند."),
    "Q022": modeling("راه‌های یک محله (شکل ۱۲ درس ۱)؛ دو راه bc و cd در تقاطع c به هم می‌رسند",
        "هر تقاطع یک رأس", "راه مستقیم بین دو تقاطع",
        "دو راه کی مجاورند؟ چرا bc و cd مجاورند؟",
        "دو راه که در یک تقاطع به هم می‌رسند؛ نقطه مشترکشان c است."),
    "Q023": modeling("شبکه مکان‌ها و راه‌های شکل ۱۳ درس ۱",
        "هر مکان یک رأس", "راه مستقیم بین دو مکان",
        "Δ و δ این شبکه را چطور پیدا می‌کنی؟",
        "روی هر مکان عدد درجه‌اش را بنویس؛ بیشترین و کمترین را پیدا کن."),
    "Q025": modeling("شبکه شکل ۲۱ درس ۱؛ رأس x همسایه‌هایش a و c هستند",
        "هر مکان یک رأس", "راه مستقیم بین دو مکان",
        "اگر N(x) برابر {a,c} باشد، x کدام مکان است؟",
        "مکان‌هایی را پیدا کن که دقیقاً به a و c وصل‌اند."),
    "Q026": modeling("۵ مکان در یک خط (مسیر P5) در برابر ۵ مکان دور یک میدان (دور C5)",
        "هر مکان یک رأس", "راه مستقیم بین دو مکان همسایه",
        "مسیر P5 و دور C5 چه فرقی دارند؟",
        "۵ نقطه در یک خط در برابر ۵ نقطه در یک حلقه؛ حلقه یک راه بیشتر دارد."),
    "Q027": modeling("مسیر یک پیک موتوری در شهر: از مکانی به مکان دیگر می‌رود",
        "هر مکان یک رأس", "راه مستقیم بین دو مکان",
        "گذر و مسیر و دور چه فرقی دارند؟",
        "دنباله حرکت پیک روی نقشه؛ تکرار مکان در گذر مجاز است، در مسیر نیست."),
    "Q028": modeling("دو شبکه راه (شکل ۲۰ درس ۱): گراف G ناهمبند و گراف H همبند است",
        "هر مکان یک رأس", "راه مستقیم بین دو مکان",
        "گراف همبند یعنی چه؟ چرا H همبند و G ناهمبند است؟",
        "دو نقشه کنار هم؛ در یکی بین هر دو مکان راه هست، در دیگری دو بخش جدا هست."),
    "Q030": modeling("n مکان که می‌خواهیم بین هر دوتایشان راه مستقیم بسازیم (شبکه کامل)",
        "هر مکان یک رأس", "راه مستقیم بین دو مکان",
        "یک گراف n رأسی حداکثر چند یال می‌تواند داشته باشد؟",
        "n مکان که همه به هم وصل‌اند؛ تعداد راه‌ها برابر تعداد جفت‌هاست."),
    "Q031": modeling("n مکان؛ هر دو مکان یا راه مستقیم دارند یا ندارند (گراف و مکملش)",
        "هر مکان یک رأس", "راه مستقیم بین دو مکان در G",
        "q(G)+q(مکمل G) چند است؟",
        "هر جفت مکان یا در G یال دارد یا در مکملش؛ جمعشان تعداد کل جفت‌هاست."),
    "Q043": modeling("مراکز خدمت در یک شبکه مکان‌ها: هر مکان یا خودش مرکز دارد یا با یک مرکز مجاور است",
        "هر مکان یک رأس", "راه مستقیم بین دو مکان",
        "زیرمجموعه D کی احاطه‌گر است؟",
        "مکان‌ها را با مرکزها بپوشان؛ هر مکان یا مرکز است یا همسایه مرکز."),
    "Q044": modeling("مراکز خدمت در یک شبکه مکان‌ها: در هر مکان یک مرکز بگذاریم",
        "هر مکان یک رأس", "راه مستقیم بین دو مکان",
        "آیا مجموعه شامل همه مکان‌ها احاطه‌گر است؟",
        "در همه مکان‌ها مرکز بگذار؛ هر مکان خودش مرکز دارد."),
    "Q045": modeling("مراکز خدمت در یک شبکه مکان‌ها: به مجموعه مرکزها، مرکز تازه اضافه کنیم",
        "هر مکان یک رأس", "راه مستقیم بین دو مکان",
        "اگر D احاطه‌گر باشد و D زیرمجموعه D' باشد، آیا D' هم احاطه‌گر است؟",
        "اضافه کردن مرکز، پوشش هیچ مکانی را از بین نمی‌برد."),
    "Q047": modeling("مکانی تنها در یک شبکه که به هیچ مکانی راه ندارد",
        "هر مکان یک رأس", "راه مستقیم بین دو مکان",
        "رأس تنها در هر مجموعه احاطه‌گر چه وضعی دارد؟",
        "مکانی بدون راه؛ فقط خودش می‌تواند به خودش خدمت بدهد."),
    "Q052": modeling("چند محله جدا از هم که بینشان راهی نیست؛ هر محله جداگانه باید پوشش داده شود",
        "هر مکان یک رأس", "راه مستقیم بین دو مکان",
        "γ یک گراف ناهمبند چطور از مؤلفه‌هایش به دست می‌آید؟",
        "دو محله جدا؛ مرکزهای هر محله را جدا حساب کن و جمع بزن."),
    "Q053": modeling("مکانی مرکزی که به همه مکان‌های دیگر راه مستقیم دارد (رأس فراگیر)",
        "هر مکان یک رأس", "راه مستقیم بین دو مکان",
        "اگر گراف رأس فراگیر داشته باشد، γ آن چند است؟",
        "یک مکان مرکزی که به همه وصل است؛ همان یک مرکز همه را می‌پوشاند."),
    "Q054": modeling("یک مرکز خدمت که به‌تنهایی همه مکان‌ها را پوشش می‌دهد",
        "هر مکان یک رأس", "راه مستقیم بین دو مکان",
        "اگر γ=1 باشد، آیا حتماً رأس فراگیر داریم؟",
        "مرکزی که همه را می‌پوشاند یعنی به همه مکان‌ها وصل است."),
    "Q063": modeling("مراکز خدمت در یک شبکه مکان‌ها: مرکزی که حذفش پوشش را خراب می‌کند، در برابر کمترین تعداد مرکز",
        "هر مکان یک رأس", "راه مستقیم بین دو مکان",
        "مینیمال با مینیمم چه فرقی دارد؟",
        "مرکزهای زائد را یکی‌یکی بردار؛ مجموعه‌ای که دیگر نمی‌شود از آن کم کرد مینیمال است."),
    "Q077": modeling("بازی «چالش γ» در ریپو: روی گراف مهره می‌گذاری و امتیاز می‌گیری",
        "هر رأس گراف یک مکان", "یال گراف",
        "امتیازهای ۰ و ۵ و ۱۰ و ۱۵ به چه وضعیتی می‌رسند؟",
        "صفحه بازی با مهره‌ها؛ مهره‌هایی که همه رأس‌ها را می‌پوشانند امتیاز می‌گیرند."),
    "Q106": modeling("مراکز خدمت در یک شبکه n مکانی که هر مرکز حداکثر Δ+1 مکان را پوشش می‌دهد",
        "هر مکان یک رأس", "راه مستقیم بین دو مکان",
        "چه نامساوی‌ای بین |D| و n و Δ برقرار است؟",
        "هر مرکز خودش و حداکثر Δ همسایه‌اش را می‌پوشاند؛ پس |D| ضربدر (Δ+1) باید به n برسد."),
    "Q107": modeling("شبکه ۱۰ مکانی فعالیت شکل ۸ درس ۲؛ بیشترین درجه ۳ است",
        "هر مکان یک رأس", "راه مستقیم بین دو مکان",
        "Δ چند است؟ چرا حداقل ⌈10/4⌉ رأس لازم است؟ γ چند است؟",
        "۱۰ مکان؛ هر مرکز حداکثر ۴ مکان را می‌پوشاند، پس حداقل ۳ مرکز لازم است."),
    "Q138": modeling("۸ ایستگاه در یک خط (مسیر P8)؛ در آزمایشگاه گرافی با n=8 و γ=3 رسم کن",
        "هر ایستگاه یک رأس", "جاده مستقیم بین دو ایستگاه همسایه",
        "گرافی با n=8 و γ=3 رسم کن و یک γ-مجموعه‌اش را نشان بده.",
        "۸ ایستگاه در یک خط؛ سه مرکز با فاصله سه‌تایی همه را می‌پوشانند."),
    "Q140": modeling("۱۰ ایستگاه در شبکه پترسن: پنج‌ضلعی بیرونی و ستاره درونی که با هم وصل‌اند",
        "هر ایستگاه یک رأس", "راه مستقیم بین دو ایستگاه مجاور در شبکه پترسن",
        "همه γ-مجموعه‌های گراف پترسن را پیدا کن؛ چندتا هستند؟",
        "پنج‌ضلعی بیرونی و ستاره درونی؛ γ-مجموعه‌ها را با مهره لیست کن."),
    "Q109": modeling("شبکه مکان‌ها که هیچ مکانی تنها نیست؛ هر مکان دست‌کم یک همسایه دارد (قضیه اور)",
        "هر مکان یک رأس", "راه مستقیم بین دو مکان",
        "برای گرافی بدون رأس تنها، چه کران بالایی برای γ داریم؟",
        "در چنین شبکه‌ای حداکثر نیمی از مکان‌ها برای مرکز کافی‌اند."),
}


# ---------------------------------------------------------------- new graphs
# Only where the graph is derivable from the question text or is the same
# already-verified figure as another question. Gamma is recomputed here.
GRAPH_EDITS = {
    "Q008": {"graph": make_graph("tournament", "directed", TOURN_V, TOURN_E, "custom", TOURN_NOTE, directed=True)},
    "Q009": {"graph": make_graph("tournament", "directed", TOURN_V, TOURN_E, "custom", TOURN_NOTE, directed=True)},
    "Q010": {"graph": make_graph("tournament", "directed", TOURN_V, TOURN_E, "custom", TOURN_NOTE, directed=True)},
    "Q011": {"graph": make_graph("tournament", "directed", TOURN_V, TOURN_E, "custom", TOURN_NOTE, directed=True)},
    "Q032": {"graph": make_graph("book_atm", "custom", ATM_V, ATM_E, "custom",
                "شکل ۲ درس ۲، ص ۴۴؛ همان گراف Q034؛ تقاطع‌ها رأس و خیابان‌ها یال‌اند.")},
    "Q033": {"graph": make_graph("book_atm", "custom", ATM_V, ATM_E, "custom",
                "شکل ۲ درس ۲، ص ۴۴؛ همان گراف Q034؛ شرط ۱ یعنی مجموعه خودپردازها احاطه‌گر باشد.")},
    "Q035": {"graph": make_graph("book_atm", "custom", ATM_V, ATM_E, "custom",
                "شکل ۲ درس ۲، ص ۴۴؛ همان گراف Q034؛ شرط ۲ یعنی مجموعه احاطه‌گر مینیمم.")},
    "Q039": {"graph": make_graph("book_radio", "radio", RADIO_V, RADIO_E, "circle",
                "گراف ایستگاه‌های رادیویی (یازده شهر، یال یعنی فاصله حداکثر ۵۰ کیلومتر)؛ همان گراف Q036 تا Q038.")},
    "Q115": {"graph": make_graph("Q4", "hypercube", Q4_V, Q4_E, "custom",
                "شکل ۹ درس ۲، ص ۴۹؛ همان مکعب چهاربعدی Q4 در Q114؛ شبکه ۱۶ رایانه‌ای.")},
    "Q120": {"graph": make_graph("C6", "cycle", C6_V, C6_E, "circle",
                "شش خانه دور یک میدان (پاسخ سؤال)؛ γ=2.")},
}


def main():
    verify_only = "--verify-only" in sys.argv
    if verify_only:
        data = json.load(open(OUT, encoding="utf-8"))
        errs, _ = verify(data, "v1.3 file")
        sys.exit(1 if errs else 0)

    src = json.load(open(SRC, encoding="utf-8"))
    data = copy.deepcopy(src)
    by_id = {q["id"]: q for q in data["questions"]}
    for qid, m in MODELING.items():
        by_id[qid]["modeling"] = m
    for qid, edits in GRAPH_EDITS.items():
        by_id[qid].update(edits)
    changed = diff_check(src, data)
    print("changed questions:", len(changed))
    for qid in sorted(changed):
        print(f"  {qid}: {changed[qid]}")

    errs, counts = verify(data, "v1.3 (built)")
    if errs:
        print("BUILD ABORTED: verification errors above")
        sys.exit(1)

    # Guards: the untouchables.
    for qid in ("Q141", "Q146"):
        assert by_id[qid].get("graph") is None, f"{qid} must stay graph-null"
    assert by_id["Q014"]["graph"].get("directed") and by_id["Q014"]["graph"]["gamma"] is None
    for qid in ("Q016", "Q018", "Q021", "Q056", "Q059", "Q061", "Q066",
                "Q029", "Q076", "Q093", "Q094", "Q108", "Q137"):
        assert by_id[qid].get("modeling") is None, f"{qid} must stay without modeling"

    data["meta"]["version"] = "1.3"
    data["meta"]["date"] = "2026-11-12"
    data["meta"]["counts"]["with_modeling"] = counts["with_modeling"]
    data["meta"]["counts"]["with_graph"] = counts["with_graph"]
    data["meta"]["counts"]["practice_ready"] = counts["practice_ready"]
    data["meta"].setdefault("notes_fa", []).append(
        "نسخه ۱٫۳ (۲۰۲۶-۱۱-۱۲): فیلد modeling به ۶۹ سؤال اضافه شد (همه compute_gamma، همه draw، "
        "سه interactive_graph مانده و ۲۲ سؤال متنی که متن خودشان شبکه/خانواده/شکل یا خوانش خدمت‌رسانی احاطه‌گری را می‌دهد)؛ "
        "گراف به ۱۰ سؤال اضافه شد: گراف خودپرداز برای Q032 و Q033 و Q035، گراف رادیویی برای Q039، مکعب Q4 برای Q115، "
        "دور C6 برای Q120، و گراف جهت‌دار مسابقات برای Q008 تا Q011 (هر شش نتیجه در متن کتاب، مثال ۵ درس ۱). "
        "همه γها با جستجوی فراگیر محاسبه شده‌اند. Q141 و Q146 همچنان بدون گراف‌اند؛ به سؤال‌های اثباتی و تعریف‌های محض modeling داده نشد."
    )
    with open(OUT, "w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, indent=2)
        f.write("\n")
    print(f"wrote {OUT}")
    errs2, _ = verify(json.load(open(OUT, encoding="utf-8")), "v1.3 file (re-read)")
    sys.exit(1 if errs2 else 0)


if __name__ == "__main__":
    main()
