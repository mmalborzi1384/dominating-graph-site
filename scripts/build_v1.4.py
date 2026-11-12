#!/usr/bin/env python3
"""Build question-bank v1.4 from v1.3 and verify it.

v1.4 = v1.3 + the full three-slice audit (A/B/C, 2026-11-12) applied.

Audit verdicts: A 22 OK / 10 FIX, B 32 OK / 26 FIX / 1 REPLACEMENT (Q134),
C 20 OK / 2 FIX (of 22 text-modeling IDs), 0 FABRICATED in any slice.
Every stored gamma was recomputed by brute-force subset search; no gamma
error was found anywhere in v1.3 — all defects are in answers, hints,
question_in_model_fa, source page attributions, or one missing edge (Q150 vz).

Changes in v1.4:
- Q134 REPLACED (same ID/category/APOS/difficulty/sahat/source): the book's
  exercise 10-b "for every n<=4" has no solution for n=1,2; the new question
  covers n=3 and n=4 and proves the impossibility for n=1,2. C4 graph kept.
- Q078 reframed (same graph P6, same topic): the old premise contradicted
  its own example ({b,d,f} is minimal, so there is no redundant vertex);
  the question now asks minimal vs minimum directly.
- Answers completed with the exact numbers the questions ask for:
  Q024 (complement edges), Q034 (concrete 4-set), Q064 (the seven book sets
  A-H with verdicts), Q107 (gamma=3), Q114/Q115 (gamma=4, set {a,b,m,n}),
  Q140 (all ten Petersen gamma-sets), Q144 (numbers), Q149 (P5 numbers),
  Q150 (the 5-cycle), Q025 (x=b).
- Wrong reasoning fixed: Q060 ("one from each part"), Q095-Q098 (copy-pasted
  complete/star sentence), Q111 (the real blocker is f), Q132 (C12 is not
  the unique minimizer), Q105 hint 3 (Petersen has no wheel centre).
- Graphs: Q025 gains the traced Fig. 21 graph (x=b, gamma=3); Q107 gains
  the Petersen graph of Fig. 8 (gamma=3); Q150 gains the missing vz edge;
  Q135's base graph becomes P3 + isolated vertex (P5 can never show gamma
  decreasing); Q001-Q003 gain the Koenigsberg multigraph (parallel edges,
  gamma null); Q019 type compute_gamma -> text (it asks for p/Delta/delta,
  not gamma).
- Source attributions: Q087-Q092 page 48 -> 53 (exercise 5, lesson 2);
  Q109 "Ore" is not in the book chapter: origin book -> derived, page null.
- New field response_mode (explicit on every question, enum in
  RESPONSE_MODES) + response_mode_by_tab where the mode differs per tab
  (Q003, Q041, Q141, Q146, Q142, Q143) + figure_ref for figure_text
  questions. "Ready to use" in v1.4 means: a defined response mode in at
  least one allowed tab, 3 hints, a correct answer, and a graph/modeling
  where the type needs one.
- NOT touched: IDs, sahat tags/reasons, categories, difficulty, APOS.
  The 12 v1.3 "practice-not-ready" text/proof questions need no replacement:
  they run as text/proof_text self-assessed responses (response_mode now
  makes that explicit). Q141/Q146 run via runtime_library / lab_activity.
  The hospital graph (Q112/Q113) is NOT added: its road distances were
  traced from the printed figure but not re-checked against the printed
  book, so the questions stay figure_text with the figure image shown.

Usage:
    python3 build_v1.4.py            # build + verify, write question-bank-v1.4.json
    python3 build_v1.4.py --verify-only   # only verify the written v1.4 file
"""
import copy
import itertools
import json
import sys
from collections import Counter
from pathlib import Path

HERE = Path(__file__).resolve().parent
SRC = HERE / "question-bank-v1.3.json"       # v1.3 (untouched)
OUT = HERE / "question-bank-v1.4.json"

RESPONSE_MODES = {
    "interactive_graph", "compute_gamma", "draw", "multigraph_draw", "board",
    "text", "proof_text", "figure_text", "runtime_library", "lab_activity",
}


# ---------------------------------------------------------------- brute force
def gamma_and_sets(vertices, edges, directed=False, multigraph=False):
    """Return (gamma, [sets as frozensets]) by exhaustive subset search.

    Directed graphs and multigraphs: gamma is not defined for this chapter
    -> (None, []). Parallel edges are harmless for domination anyway.
    """
    if directed or multigraph:
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


def make_graph(ref, family, vertices, edges, layout, note, directed=False,
               multigraph=False):
    gamma, sets = gamma_and_sets(vertices, edges, directed=directed,
                                 multigraph=multigraph)
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
    if multigraph:
        g["multigraph"] = True
    return g


# ---------------------------------------------------------------- shared graphs
# Fig. 21, lesson 1, p. 41 (Q025) — traced from the book figure; g isolated.
FIG21_V = ["a", "b", "c", "d", "e", "f", "g"]
FIG21_E = [("a", "b"), ("a", "e"), ("a", "f"), ("b", "c"),
           ("c", "d"), ("c", "e"), ("d", "e")]
# Fig. 8, lesson 2, p. 48 (Q107) — the Petersen graph, same structure as Q105.
PETERSEN_V = ["a", "b", "c", "d", "e", "f", "g", "h", "i", "j"]
PETERSEN_E = [("a", "b"), ("b", "c"), ("c", "d"), ("d", "e"), ("e", "a"),
              ("a", "f"), ("b", "g"), ("c", "h"), ("d", "i"), ("e", "j"),
              ("f", "h"), ("g", "i"), ("h", "j"), ("i", "f"), ("j", "g")]
# Koenigsberg multigraph, Fig. 2, lesson 1, p. 32 (Q001-Q003).
# wx twice (e1,e2), xy (e6), wy (e5), wz twice (e3,e4), zy (e7);
# degrees w=5, x=y=z=3; q=7.
KOENIG_V = ["x", "y", "z", "w"]
KOENIG_E = [("w", "x"), ("w", "x"), ("x", "y"), ("w", "y"),
            ("w", "z"), ("w", "z"), ("z", "y")]
KOENIG_NOTE = ("شکل ۲ درس ۱، ص ۳۲؛ چندگراف کونیگسبرگ: یال‌های موازی wx (دو یال) و wz (دو یال)؛ "
               "درجه‌ها: w=5 و x=y=z=3؛ p=4 و q=7. γ برای چندگراف در این فصل تعریف نشده است.")
# P3 + isolated vertex (Q135 base graph; both directions demonstrable).
P3ISO_V = ["a", "b", "c", "d"]
P3ISO_E = [("a", "b"), ("b", "c")]


def practice_ready(q):
    """T006-flavoured readiness for the practice tab: modeling present, and
    a graph present when the type needs one to run interactively."""
    if "practice" not in q["tabs"]:
        return False
    if not q.get("modeling"):
        return False
    if q["type"] in ("interactive_graph", "compute_gamma", "draw") and not q.get("graph"):
        return False
    return True


def usable(q):
    """v1.4 readiness: a defined, runnable response mode in at least one
    allowed tab, 3 hints and a non-empty answer."""
    if q.get("response_mode") not in RESPONSE_MODES:
        return False
    if len(q.get("hints", [])) != 3:
        return False
    if not q.get("answer_fa"):
        return False
    for tab, mode in (q.get("response_mode_by_tab") or {}).items():
        if mode not in RESPONSE_MODES or tab not in q["tabs"]:
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
        if q.get("response_mode") not in RESPONSE_MODES:
            errs.append(f"{q['id']}: response_mode missing/invalid")
        if q.get("response_mode") == "figure_text" and not q.get("figure_ref"):
            errs.append(f"{q['id']}: figure_text without figure_ref")
        g = q.get("graph")
        if g:
            if g.get("directed") or g.get("multigraph"):
                if g.get("gamma") is not None:
                    errs.append(f"{q['id']}: directed/multigraph must have gamma null")
                if g.get("gamma_sets_count") != 0:
                    errs.append(f"{q['id']}: directed/multigraph must have gamma_sets_count 0")
            else:
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
    c = {
        "total": len(qs),
        "with_modeling": sum(1 for q in qs if q.get("modeling")),
        "with_graph": sum(1 for q in qs if q.get("graph")),
        "with_both": sum(1 for q in qs if q.get("modeling") and q.get("graph")),
        "with_neither": sum(1 for q in qs if not q.get("modeling") and not q.get("graph")),
        "practice_total": sum(1 for q in qs if "practice" in q["tabs"]),
        "practice_ready": sum(1 for q in qs if practice_ready(q)),
        "usable": sum(1 for q in qs if usable(q)),
        "not_usable": [q["id"] for q in qs if not usable(q)],
        "by_type": dict(Counter(q["type"] for q in qs)),
        "by_category": dict(Counter(q["category"] for q in qs)),
        "by_response_mode": dict(Counter(q["response_mode"] for q in qs)),
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
    """Ensure only allowed fields changed (sahat/category/difficulty/APOS/IDs
    are enforced by exclusion)."""
    allowed = {"graph", "modeling", "answer_fa", "answer_value", "answer_latex",
               "hints", "question_fa", "title_fa", "type", "source",
               "response_mode", "response_mode_by_tab", "figure_ref",
               "multigraph"}
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


# ---------------------------------------------------------------- audit fixes
# All correction texts come from audit A / B / C (2026-11-12), verified
# against the book PDF and by brute-force gamma recomputation.
FIXES = {
    # --- audit A ---
    "Q024": {
        "answer_fa": ("زیرگراف گرافی است که رأس‌ها و یال‌هایش زیرمجموعه رأس‌ها و یال‌های G باشند. "
                      "در مکمل $\\bar G$ دو رأس متمایز دقیقاً وقتی به هم وصل‌اند که در G به هم وصل نباشند. "
                      "در گراف شکل ۱۶، مکمل Ḡ دقیقاً چهار یال دارد: ae و bc و bd و be."),
        "answer_value": "Ḡ یال‌های ae و bc و bd و be را دارد.",
        "answer_latex": "Ḡ یال‌های ae و bc و bd و be را دارد.",
    },
    "Q034": {
        "answer_fa": ("بله، مجموعه شامل همه رئوس احاطه‌گر است. یک مجموعه ۴ عضوی احاطه‌گر مثلاً {a,b,c,f} است: "
                      "a رأس‌های a و b و d، b رأس‌های a و b و c و e، c رأس‌های b و c، و f رأس‌های d و f و g و h را می‌پوشاند؛ "
                      "پس همه هشت تقاطع پوشیده می‌شوند."),
        "answer_value": "مثلاً {a,b,c,f}؛ مجموعه شامل همه رئوس هم احاطه‌گر است.",
        "answer_latex": "مثلاً {a,b,c,f}؛ مجموعه شامل همه رئوس هم احاطه‌گر است.",
    },
    "Q064": {
        "question_fa": ("در کار در کلاس شکل ۵ درس ۲، مشخص کن کدام‌یک از مجموعه‌های داده‌شده احاطه‌گرند و در آن‌هایی که احاطه‌گر بودند، "
                        "آیا رأسی هست که با حذفش مجموعه هنوز احاطه‌گر بماند؟ مجموعه‌ها این‌اند: "
                        "A={a,b,c,d,e}، B={f,g,h,i,j}، C={a,b,j,h,g}، D={a,i,h}، E={f,g,h,e,d}، F={f,g,h,e}، H={g,h,e}."),
        "answer_fa": ("احاطه‌گرند: A و B و D و E و F و H؛ C احاطه‌گر نیست چون رأس d را نمی‌پوشاند. "
                      "در میان احاطه‌گرها، A و B و D و H مینیمال‌اند و E و F مینیمال نیستند "
                      "(در E رأس‌های d و e و f و h، و در F رأس f را می‌توان حذف کرد و مجموعه هنوز احاطه‌گر می‌ماند). "
                      "یک مجموعه احاطه‌گر مینیمم مثلاً D={a,i,h} است (γ=3) و یک مینیمال غیرمینیمم مثلاً A={a,b,c,d,e} است."),
        "answer_value": "احاطه‌گر: A و B و D و E و F و H؛ C نیست. مینیمال: A و B و D و H.",
        "answer_latex": "γ=3؛ D={a,i,h} یک γ-مجموعه است.",
    },
    "Q078": {
        "title_fa": "مینیمال با مینیمم فرق دارد: P6",
        "question_fa": ("روی گراف P6 مجموعه {b,d,f} احاطه‌گر است. آیا این مجموعه مینیمال است؟ آیا مینیمم است؟ "
                        "یک γ-مجموعه برای P6 پیدا کن."),
        "answer_fa": ("{b,d,f} مینیمال است (با حذف هر رأسش دیگر احاطه‌گر نیست) ولی مینیمم نیست، "
                      "چون γ(P6)=2 و مثلاً {b,e} هم احاطه‌گر است. پس مینیمال با مینیمم فرق دارد."),
        "answer_value": "{b,d,f} مینیمالِ غیرمینیمم است؛ γ-مجموعه {b,e} است.",
        "answer_latex": "{b,d,f} مینیمالِ غیرمینیمم است؛ γ(P6)=2 و {b,e} یک γ-مجموعه است.",
    },
    "Q114": {
        "answer_fa": ("یک مجموعه احاطه‌گر مینیمم است؛ چون هر رایانه انتخاب‌شده خودش و رایانه‌های مستقیماً متصل به آن را پوشش می‌دهد. "
                      "در این شبکه γ=4 است؛ مثلاً {a,b,m,n} یک γ-مجموعه است (کران پایین ⌈16/5⌉=4 هم همین عدد را می‌دهد)."),
        "answer_value": "γ=4؛ مثلاً {a,b,m,n}",
        "answer_latex": "γ=4؛ مثلاً {a,b,m,n}",
    },
    "Q135": {
        "answer_fa": ("عدد احاطه‌گری نمی‌تواند زیاد شود؛ چون هر مجموعه احاطه‌گر قبلی هنوز احاطه‌گر است. "
                      "می‌تواند کم شود یا ثابت بماند؛ مثلاً در گراف P₃ به‌علاوه رأس تنها (γ=2)، "
                      "با اضافه کردن یال bd رأس b همه را می‌پوشاند و γ=1 می‌شود، "
                      "ولی با اضافه کردن یال ad عدد γ همان ۲ می‌ماند."),
        "graph": None,  # replaced below by the P3+isolated graph
    },
    "Q144": {
        "answer_fa": ("روی این گراف: n=6 و Δ=3 است، پس کران پایین ⌈6/4⌉=2 است ولی γ=3 است؛ "
                      "یعنی کران پایین برقرار است ولی تیز نیست. قضیه اور هم برقرار است: γ=3 ≤ n/2=3."),
        "answer_value": "n=6، Δ=3، کران پایین 2، γ=3، قضیه اور: 3 ≤ 3",
        "answer_latex": "n=6، Δ=3، کران پایین 2، γ=3، قضیه اور: 3 ≤ 3",
    },
    "Q149": {
        "answer_fa": ("اضافه کردن یال γ را زیاد نمی‌کند؛ حذف یال آن را کم نمی‌کند. روی P₅: "
                      "با اضافه کردن هر یال، γ همان ۲ می‌ماند؛ با حذف یال ab یا de عدد γ به ۳ می‌رسد "
                      "و با حذف bc یا cd همان ۲ می‌ماند. برای دیدن کاهش γ با اضافه کردن یال، "
                      "گراف P₃ به‌علاوه رأس تنها را امتحان کن: با اضافه کردن یال bd عدد γ از ۲ به ۱ می‌رسد."),
        "answer_value": "روی P5: یال اضافه γ را ۲ نگه می‌دارد؛ حذف ab یا de آن را ۳ می‌کند.",
    },
    "Q150": {
        "answer_fa": "مثلاً دور u–v–w–y–z–u به طول ۵ است: یال‌های uv و vw و wy و yz و zu.",
        "answer_value": "u–v–w–y–z–u",
        "answer_latex": "u–v–w–y–z–u",
        "graph": None,  # rebuilt below with the missing vz edge
    },
    # --- audit B ---
    "Q019": {"type": "text"},
    "Q060": {
        "answer_fa": ("یک رأس فقط رأس‌های بخش مقابل را می‌پوشاند، نه هم‌بخشی‌های خودش را؛ پس به دو رأس نیاز است. "
                      "مثلاً {a,b} (هر دو از بخش دوتایی) یا {a,c} (یکی از هر بخش) احاطه‌گرند. γ(K_{2,3})=2."),
    },
    "Q087": {"source_page": 53},
    "Q088": {"source_page": 53},
    "Q089": {"source_page": 53},
    "Q090": {"source_page": 53},
    "Q091": {"source_page": 53},
    "Q092": {"source_page": 53},
    "Q095": {
        "answer_fa": "γ(K5)=1؛ در گراف کامل هر تک‌رأس با همه رأس‌های دیگر مجاور است، پس هر تک‌رأس همه را احاطه می‌کند.",
    },
    "Q096": {
        "answer_fa": "γ(K3)=1؛ در گراف کامل هر تک‌رأس با همه رأس‌های دیگر مجاور است، پس هر تک‌رأس همه را احاطه می‌کند.",
    },
    "Q097": {
        "answer_fa": "γ(S4)=1؛ مرکز ستاره با همه رأس‌ها مجاور است، پس {a} همه را احاطه می‌کند.",
    },
    "Q098": {
        "answer_fa": "γ(S5)=1؛ مرکز ستاره با همه رأس‌ها مجاور است، پس {a} همه را احاطه می‌کند.",
    },
    "Q105": {"hint_3": ("γ برابر ۳ است؛ سه رأس را طوری بگذار که هر رأس یا انتخاب شده باشد یا همسایه یکی از آن‌ها باشد؛ "
                         "مثلاً {a,c,g} را امتحان کن.")},
    "Q111": {
        "answer_fa": ("گراف ۶ رأسی با یال‌های ab,ac,af,be,cd را بگیر: n=6 و Δ=3 (رأس a)، پس کران پایین ⌈6/4⌉=2 است؛ "
                      "ولی γ=3 است، چون برای پوشاندن d باید رأسی از {c,d} و برای پوشاندن e باید رأسی از {b,e} انتخاب شود؛ "
                      "هر مجموعه دوتاییِ ممکن، یعنی {b,c} و {b,d} و {c,e} و {d,e}، رأس f را بی‌پوشش می‌گذارد "
                      "(f فقط با a مجاور است)، پس هیچ مجموعه احاطه‌گر دوتایی وجود ندارد. "
                      "مثلاً {a,b,c} احاطه‌گر است، پس γ=3 و کران پایین دقیق نیست."),
    },
    "Q115": {
        "answer_fa": ("گراف شکل ۹ چهارمنتظم است، یعنی Δ=4؛ پس کران پایین ⌈16/(4+1)⌉=⌈16/5⌉=4 است، "
                      "یعنی حداقل ۴ رأس لازم است. مجموعه {a,b,m,n} احاطه‌گر است، پس γ=4 و کران پایین دقیق است."),
        "answer_value": "Δ=4، کران پایین ۴، γ=4، مثلاً {a,b,m,n}",
        "answer_latex": "Δ=4، کران پایین ۴، γ=4، مثلاً {a,b,m,n}",
    },
    "Q132": {
        "answer_fa": ("گراف ۲-منتظم، اجتماع دورهای جداست. مثلاً دور C12 با γ=⌈12/3⌉=4 جواب می‌دهد و این کمترین مقدار ممکن است، "
                      "چون هر دور دست‌کم ⌈طول دور/3⌉ به γ می‌افزاید و مجموع آن‌ها دست‌کم ۴ است. "
                      "توجه کن که C12 تنها جواب نیست؛ مثلاً C6∪C6 با γ=2+2=4 و C3∪C9 با γ=1+3=4 هم کمترین مقدار را می‌دهند."),
        "answer_value": "γ=4؛ مثلاً C12 (ولی تنها جواب نیست)",
    },
    "Q140": {
        "answer_fa": ("عدد احاطه‌گری پترسن ۳ است و دقیقاً ۱۰ γ-مجموعه دارد: "
                      "{a,c,g}، {a,d,j}، {a,h,i}، {b,d,h}، {b,e,f}، {b,i,j}، {c,e,i}، {c,f,j}، {d,f,g}، {e,g,h}."),
        "answer_value": "γ(Petersen)=3 با ۱۰ γ-مجموعه.",
        "answer_latex": "γ(Petersen)=3 با ۱۰ γ-مجموعه.",
    },
    # --- audit C ---
    "Q001": {"hint_1": "پل‌ها را بشمار، بعد ناحیه‌ها را."},
    "Q025": {
        "answer_fa": ("x=b است، چون N(b)={a,c}؛ در گراف شکل ۲۱، رأس b با a و c مجاور است. "
                      "همچنین Δ=3 و δ=0 و γ=3 است."),
        "answer_value": "x=b",
        "answer_latex": "x=b، N(b)={a,c}",
        "graph": None,  # built below from the traced Fig. 21
    },
    "Q107": {
        "answer_fa": ("Δ=3 است، پس هر رأس حداکثر ۴ رأس را احاطه می‌کند و حداقل ⌈10/4⌉=3 رأس لازم است. "
                      "γ(G)=3 است (مثلاً {a,c,g} یک γ-مجموعه است)."),
        "answer_value": "Δ=3، γ=3",
        "answer_latex": "Δ=3، γ=3",
        "graph": None,  # built below (Petersen, same structure as Q105)
    },
    "Q074": {"answer_latex": "γ=2، تنها γ-مجموعه {a,b}"},
    "Q109": {"source_origin": "derived", "source_page": None},
}

# question_in_model_fa fixes (audit B: the field repeated scenario_fa).
QIM_FIXES = {
    "Q008": "تیم a چه تیم‌هایی را برده و به چه تیمی باخته است؟",
    "Q009": "تیم c با کدام تیم‌ها بازی کرده و نتیجه هر بازی چه بوده است؟",
    "Q010": "اگر هر برد ۳ امتیاز داشته باشد، کدام تیم بیشترین امتیاز را دارد؟",
    "Q011": "تیم d با کدام تیم‌ها بازی نکرده است؟",
    "Q032": "در این مدل، تقاطع‌ها و خیابان‌ها هر کدام به چه صورت نمایش داده شده‌اند؟",
    "Q033": "شرط ۱ (دسترسی در همان تقاطع یا یک تقاطع مجاور) به زبان گراف چه می‌شود؟",
    "Q035": "شرط ۲ چیست و چرا به مجموعه احاطه‌گر مینیمم نیاز داریم؟",
    "Q039": "چرا مجموعه احاطه‌گر مینیمم دقیقاً جواب مسئله ایستگاه‌های رادیویی است؟",
    "Q115": "حداقل چند رأس برای احاطه کردن همه رئوس این شبکه ۱۶ رایانه‌ای لازم است؟ آیا با همان تعداد می‌توان مجموعه احاطه‌گر ساخت؟",
    "Q120": "یک مسئله واقعی بساز که مدل گرافی آن همین C6 باشد و جوابش γ=2 باشد.",
}

# Q134 REPLACEMENT (audit B) — same ID, category F_lab, APOS Action,
# difficulty 3, same sahat, same source (book p. 54, ex. 10-b, corrected
# n-range), type draw, tabs teach+lab, stored C4 graph unchanged.
Q134_REPLACEMENT = {
    "title_fa": "گراف n رأسی با γ=2 و بیش از یک γ-مجموعه (n=3 و n=4)",
    "question_fa": ("برای n=3 و n=4 توضیح دهید چگونه می‌توان یک گراف n رأسی با عدد احاطه‌گری ۲ رسم کرد "
                    "که بیش از یک γ-مجموعه با اندازه ۲ داشته باشد؛ و بگویید چرا برای n=1 و n=2 "
                    "چنین گرافی وجود ندارد (تمرین ۱۰-ب درس ۲، با تصحیح دامنه n)."),
    "answer_fa": ("برای n=4 دور C4 را بگیر: جفت‌های مقابل {a,c} و {b,d} هر دو γ-مجموعه‌اند "
                  "(در واقع C4 شش γ-مجموعه ۲ عضوی دارد). برای n=3 گرافی بگیر با سه رأس a و b و c و تنها یک یال ab "
                  "(رأس c منزوی): آنگاه {a,c} و {b,c} هر دو γ-مجموعه‌اند، پس بیش از یک γ-مجموعه داریم و γ=2 است. "
                  "برای n=1 چنین گرافی وجود ندارد، چون تنها گراف ۱ رأسی γ=1 دارد. "
                  "برای n=2 هم وجود ندارد، چون γ=2 فقط وقتی ممکن است که دو رأس یالی نداشته باشند، "
                  "و آن گراف فقط یک زیرمجموعه ۲ عضوی دارد، پس نمی‌تواند بیش از یک γ-مجموعه داشته باشد."),
    "answer_value": "n=3 با {a,c} و {b,c}؛ n=4 با C4؛ برای n=1 و n=2 ناممکن است.",
    "answer_latex": "n=3: γ=2 با دو γ-مجموعه؛ n=4: γ(C4)=2 با شش γ-مجموعه",
    "hints": ["برای n=4 جفت‌های مقابل دور C4 را امتحان کن.",
              "برای n=3 یک رأس منزوی لازم است؛ چرا؟",
              "برای n=2 فقط یک زیرمجموعه ۲ عضوی وجود دارد."],
    "modeling_scenario_fa": "۴ مکان دور یک میدان (دور C4)؛ و برای n=3: دو مکان وصل و یک مکان تنها",
    "modeling_qim_fa": "برای n=3 و n=4 گرافی با γ=2 و بیش از یک γ-مجموعه رسم کن؛ چرا برای n=1 و n=2 ناممکن است؟",
}

# ---------------------------------------------------------------- response modes
# Default inference from type; overrides below. Every question gets an
# explicit response_mode in v1.4.
DEFAULT_MODE_BY_TYPE = {
    "interactive_graph": "interactive_graph",
    "compute_gamma": "compute_gamma",
    "draw": "draw",
    "modeling": "text",
    "text": "text",
    "proof": "proof_text",
}
MODE_OVERRIDES = {
    "Q001": "figure_text", "Q002": "figure_text",
    "Q014": "draw",            # directed graph: draw it, never feed to the domination evaluator
    "Q022": "figure_text", "Q023": "figure_text", "Q025": "figure_text",
    "Q028": "figure_text", "Q107": "figure_text",
    "Q055": "text",            # the question is arithmetic (ceil(n/4)); the 14-vertex graph is supplementary
    "Q112": "figure_text", "Q113": "figure_text",
    "Q139": "draw",            # lab activity: build the graph from the edgeless starter
    "Q141": "text", "Q146": "text",
}
MODE_BY_TAB = {
    "Q003": {"teach": "text", "lab": "multigraph_draw"},
    "Q041": {"teach": "text", "lab": "board"},
    "Q141": {"teach": "text", "lab": "runtime_library"},
    "Q146": {"teach": "text", "lab": "lab_activity"},
    "Q142": {"teach": "text", "lab": "runtime_library"},
    "Q143": {"teach": "text", "lab": "runtime_library"},
}
FIGURE_REFS = {
    "Q001": {"lesson": 1, "figure": 2, "book_page": 32},
    "Q002": {"lesson": 1, "figure": 2, "book_page": 32},
    "Q003": {"lesson": 1, "figure": 2, "book_page": 32},
    "Q022": {"lesson": 1, "figure": 12, "book_page": 36},
    "Q023": {"lesson": 1, "figure": 13, "book_page": 37},
    "Q025": {"lesson": 1, "figure": 21, "book_page": 41},
    "Q028": {"lesson": 1, "figure": 20, "book_page": 39},
    "Q107": {"lesson": 2, "figure": 8, "book_page": 48},
    "Q112": {"lesson": 2, "figure": 15, "book_page": 52},
    "Q113": {"lesson": 2, "figure": 15, "book_page": 52},
}


def main():
    verify_only = "--verify-only" in sys.argv
    if verify_only:
        data = json.load(open(OUT, encoding="utf-8"))
        errs, _ = verify(data, "v1.4 file")
        sys.exit(1 if errs else 0)

    src = json.load(open(SRC, encoding="utf-8"))
    data = copy.deepcopy(src)
    by_id = {q["id"]: q for q in data["questions"]}

    # --- apply the audit fixes ---
    for qid, edits in FIXES.items():
        q = by_id[qid]
        for key, val in edits.items():
            if key == "source_page":
                q["source"]["page"] = val
            elif key == "source_origin":
                q["source"]["origin"] = val
            elif key == "hint_1":
                q["hints"][0] = val
            elif key == "hint_3":
                q["hints"][2] = val
            elif key == "graph" and val is None:
                pass  # rebuilt below
            else:
                q[key] = val
    for qid, qim in QIM_FIXES.items():
        by_id[qid]["modeling"]["question_in_model_fa"] = qim

    # --- Q134 replacement (audit B) ---
    r = Q134_REPLACEMENT
    q134 = by_id["Q134"]
    for k in ("title_fa", "question_fa", "answer_fa", "answer_value",
              "answer_latex", "hints"):
        q134[k] = r[k]
    q134["modeling"]["scenario_fa"] = r["modeling_scenario_fa"]
    q134["modeling"]["question_in_model_fa"] = r["modeling_qim_fa"]
    # graph (C4) unchanged; category/APOS/difficulty/sahat/source/type/tabs
    # unchanged by construction.

    # --- graph rebuilds / additions ---
    # Q025: traced Fig. 21 graph (gamma recomputed: 3, 4 sets).
    by_id["Q025"]["graph"] = make_graph(
        "fig21_lesson1", "custom", FIG21_V, FIG21_E, "custom",
        "شکل ۲۱ درس ۱، ص ۴۱؛ رأس g تنهاست؛ x=b چون N(b)={a,c}؛ γ=3.")
    # Q107: Petersen graph of Fig. 8 (gamma recomputed: 3, 10 sets).
    by_id["Q107"]["graph"] = make_graph(
        "Petersen", "petersen", PETERSEN_V, PETERSEN_E, "custom",
        "شکل ۸ درس ۲، ص ۴۸ (گراف پترسن)؛ همان ساختار Q105؛ Δ=3 و γ=3.")
    # Q150: add the missing vz edge (10 edges; gamma stays 1, unique {w}).
    q150g = by_id["Q150"]["graph"]
    q150g["edges"] = [list(e) for e in
                      [tuple(e) for e in q150g["edges"]] + [("v", "z")]]
    g150, s150 = gamma_and_sets(q150g["vertices"], [tuple(e) for e in q150g["edges"]])
    q150g["gamma"], q150g["gamma_sets_count"] = g150, len(s150)
    q150g["gamma_sets"] = [fmt_set(s) for s in sorted(s150, key=lambda s: sorted(s))[:5]]
    q150g["note"] = "شکل ۱۷ درس ۱، ص ۳۸؛ ۱۰ یال (از جمله قطر vz)؛ دور به طول ۵ مثلاً u-v-w-y-z-u است."
    # Q135: base graph P3 + isolated vertex (gamma recomputed: 2, unique {b,d}).
    by_id["Q135"]["graph"] = make_graph(
        "p3_plus_isolated", "custom", P3ISO_V, P3ISO_E, "custom",
        "از گراف P3 به‌علاوه رأس تنها شروع کن و یک یال اضافه کن: با یال bd رأس b فراگیر می‌شود و γ=1 می‌شود؛ "
        "با یال ad عدد γ همان ۲ می‌ماند.")
    by_id["Q135"]["modeling"]["visual_idea_fa"] = \
        "یک یال اضافه کن و γ جدید را حساب کن؛ یال bd عدد γ را از ۲ به ۱ می‌رساند."
    # Q001-Q003: Koenigsberg multigraph (gamma null by design).
    for qid in ("Q001", "Q002", "Q003"):
        by_id[qid]["graph"] = make_graph(
            "koenigsberg", "multigraph", KOENIG_V, KOENIG_E, "custom",
            KOENIG_NOTE, multigraph=True)
        by_id[qid]["multigraph"] = True
    # Q077: edge_means polish (audit C).
    by_id["Q077"]["modeling"]["edge_means_fa"] = "راه/ارتباط بین دو مکان در صفحه بازی"
    # Q078: modeling qim follows the reframe.
    by_id["Q078"]["modeling"]["question_in_model_fa"] = \
        "مینیمالِ غیرمینیمم روی P6؛ γ-مجموعه {b,e}"
    # Q064: graph note — seven sets, no G.
    by_id["Q064"]["graph"]["note"] = \
        "شکل ۵ درس ۲، ص ۴۶ (گراف پترسن)؛ مجموعه‌های A تا H (هفت مجموعه؛ G وجود ندارد) در متن سؤال."

    # --- response modes (explicit on every question) ---
    for q in data["questions"]:
        q["response_mode"] = MODE_OVERRIDES.get(
            q["id"], DEFAULT_MODE_BY_TYPE[q["type"]])
        if q["id"] in MODE_BY_TAB:
            q["response_mode_by_tab"] = dict(MODE_BY_TAB[q["id"]])
        if q["id"] in FIGURE_REFS:
            q["figure_ref"] = dict(FIGURE_REFS[q["id"]])

    changed = diff_check(src, data)
    print("changed questions:", len(changed))
    for qid in sorted(changed):
        print(f"  {qid}: {changed[qid]}")

    errs, counts = verify(data, "v1.4 (built)")
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
    # Q134 kept its identity fields.
    q134 = by_id["Q134"]
    assert q134["category"] == "F_lab" and q134["apos_stage"] == "Action"
    assert q134["difficulty"] == 3 and q134["type"] == "draw"
    assert q134["tabs"] == ["teach", "lab"]
    # Koenigsberg degrees with multiplicity.
    k = by_id["Q001"]["graph"]
    assert k["gamma"] is None and k["gamma_sets_count"] == 0
    assert len(k["edges"]) == 7
    deg = Counter()
    for a, b in k["edges"]:
        deg[a] += 1
        deg[b] += 1
    assert dict(deg) == {"w": 5, "x": 3, "y": 3, "z": 3}, dict(deg)
    # Q025 traced graph.
    assert by_id["Q025"]["graph"]["gamma"] == 3
    assert by_id["Q025"]["graph"]["gamma_sets_count"] == 4
    assert by_id["Q107"]["graph"]["gamma"] == 3
    assert by_id["Q150"]["graph"]["gamma"] == 1
    assert by_id["Q150"]["graph"]["gamma_sets_count"] == 1
    assert by_id["Q135"]["graph"]["gamma"] == 2
    assert by_id["Q135"]["graph"]["gamma_sets_count"] == 1
    # Every question usable in at least one allowed tab.
    assert counts["usable"] == 150, counts["not_usable"]

    data["meta"]["version"] = "1.4"
    data["meta"]["date"] = "2026-11-12"
    data["meta"]["counts"]["with_modeling"] = counts["with_modeling"]
    data["meta"]["counts"]["with_graph"] = counts["with_graph"]
    data["meta"]["counts"]["practice_ready"] = counts["practice_ready"]
    data["meta"]["counts"]["usable"] = counts["usable"]
    data["meta"].setdefault("notes_fa", []).append(
        "نسخه ۱٫۴ (۲۰۲۶-۱۱-۱۲): ممیزی کامل سه‌برش (A: ۲۲ OK و ۱۰ FIX؛ B: ۳۲ OK و ۲۶ FIX و یک جایگزینی؛ "
        "C: ۲۰ OK و ۲ FIX از ۲۲ مدل‌سازی متنی؛ در هیچ برش FABRICATED پیدا نشد) و همه اصلاحات اعمال شد. "
        "یک جایگزینی: Q134 (تمرین ۱۰-ب کتاب برای n=1 و n=2 جواب ندارد؛ سؤال جدید n=3 و n=4 را می‌سازد و ناممکن‌بودن n=1 و n=2 را اثبات می‌کند؛ "
        "همان شناسه/دسته/مرحله APOS/درجه سختی/ساحت/منبع؛ گراف C4 بدون تغییر). "
        "گراف‌های جدید: شکل ۲۱ برای Q025 (x=b و γ=3)، پترسن شکل ۸ برای Q107 (γ=3)، چندگراف کونیگسبرگ برای Q001 تا Q003؛ "
        "یال vz به Q150 اضافه شد؛ گراف پایه Q135 به P3 به‌علاوه رأس تنها تغییر کرد. "
        "فیلد جدید response_mode روی همه ۱۵۰ سؤال (به‌علاوه response_mode_by_tab برای Q003 و Q041 و Q141 و Q142 و Q143 و Q146 و figure_ref برای سؤال‌های figure_text)؛ "
        "همه ۱۵۰ سؤال در دست‌کم یک تب مجاز قابل اجرا هستند. "
        "گراف بیمارستان Q112 و Q113 اضافه نشد (خوانش مسافت‌های شکل ۱۵ با کتاب چاپی تطبیق داده نشده است)."
    )
    with open(OUT, "w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, indent=2)
        f.write("\n")
    print(f"wrote {OUT}")
    errs2, _ = verify(json.load(open(OUT, encoding="utf-8")), "v1.4 file (re-read)")
    sys.exit(1 if errs2 else 0)


if __name__ == "__main__":
    main()
