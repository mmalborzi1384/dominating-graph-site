# Question bank v1.3 — report (2026-11-12)

Built from v1.2 (`question-bank-v1.2.json`, untouched) by `build_v1.3.py`,
which computes every γ by brute-force subset search and re-verifies **all
150 graphs** (old and new). No γ value was hand-entered.

## Files

- `question-bank-v1.3.json` — the new bank (150 questions, same IDs).
- `build_v1.3.py` — build + verify script. Run `python3 build_v1.3.py`
  to rebuild; `python3 build_v1.3.py --verify-only` to re-check the file.
- `question-bank-v1.2.json` (v1.2) and earlier versions — untouched.

## Final counts

| | v1.2 | v1.3 |
|---|---|---|
| Total questions | 150 | 150 |
| With `modeling` | 64 | **135** |
| With `graph` | 78 | **88** |
| With both | 29 | **88** |
| With neither | 37 | **15** |
| Practice-ready (rule below) | 47 / 126 | **114 / 126** |

Practice-ready by type in v1.3: compute_gamma **40/40**, draw **5/5**,
interactive_graph **10/10**, modeling **35/35**, text **23/30**,
proof **1/6**. Categories, difficulty, APOS, sahat tags: unchanged
(31/30/25/25/20/19; 60/73/17; 33/37/39/41; 60/25/20/15/15/15).

**Practice-ready rule used** (T006-flavoured, same as v1.2): tab
`practice` + `modeling` present + a `graph` present when the type needs
one to run (`interactive_graph` / `compute_gamma` / `draw`). Text/proof/
modeling types need only the modeling context.

## Decision rule for adding modeling

Modeling was added only where the question's own text already implies
one of these: (a) a standard graph family (P/C/K/S, K_{m,n}, W,
Petersen) read as a network of places/roads; (b) a book figure;
(c) domination read as service coverage — the chapter's own
motivation (ATMs, radio stations, hospitals), which is what the
definitions and theorems in section B/C/D are about. The scenario is
tailored per question (line of stations, ring around a square,
hub-and-spokes, two groups, …), not one copied template.

No modeling was forced onto pure proofs or pure definition/notation
questions — that would be fabrication, not completion (see "remains
unready").

## What was added per question

### Modeling — compute_gamma (38, all of them; graphs already in v1.2)

Q019 (K9, complete network of 9 cities), Q048 (P5 line), Q049 (C6 ring),
Q050 (K4), Q051 (S5 hub), Q057 (P3), Q058 (C4), Q062 (C7, Fig. 3
lesson 2), Q069 (P7), Q070 (C6), Q071 (S4), Q072 (K2,3), Q073 (W5),
Q079 (P4, check {a,c}), Q080 (C4, check {a,b}), Q081 (K3, check {a}),
Q082 (S5, check centre {a}), Q083 (K2,2), Q084 (W4, check centre {e}),
Q085 (P5, check {a,d}), Q086 (C5, check {a,c}), Q087–Q092 (P3/P4/P5/P8/
C9/C10, check the ⌈n/3⌉ formula), Q095 (K5), Q096 (K3), Q097 (S4),
Q098 (S5), Q099 (K1,4), Q100 (K2,2), Q101 (K2,3), Q102 (K3,3),
Q103 (W4), Q104 (W5), Q105 (Petersen network).

### Modeling — interactive_graph (5)

Q060 (K2,3 two groups), Q067 (P6, check {v2,v4,v6}), Q068 (P12,
exercise 11 lesson 2), Q138 (P8, lab draw-by-n-and-γ), Q140 (Petersen,
list all γ-sets).

### Modeling — draw (6)

Q015 (6 places, 7 roads, exercise 1 lesson 1), Q075 (C6, more than one
γ-set), Q110 (P3, tight lower bound), Q111 (6-vertex non-tight example),
Q132 (C12, 2-regular, least γ), Q134 (C4, more than one γ-set, n≤4).

### Modeling — text (22)

Q012 (9 places, 10 roads), Q013 (neighbourhood map as V/E lists),
Q022 (Fig. 12, adjacent roads bc/cd), Q023 (Fig. 13, Δ/δ),
Q025 (Fig. 21, find x with N(x)={a,c}), Q026 (P5 line vs C5 ring),
Q027 (courier's route: walk/path/cycle), Q028 (Fig. 20, G
disconnected, H connected), Q030 (complete network, max edges),
Q031 (a pair of places has the edge either in G or in its complement),
Q043 (domination definition as service coverage), Q044 (a centre in
every place), Q045 (adding centres cannot lose coverage), Q047 (an
isolated place must serve itself), Q052 (separate districts, sum over
components), Q053 (universal place), Q054 (γ=1 means a universal
place), Q063 (minimal vs minimum, removing redundant centres),
Q077 (the repo γ-challenge game scoring), Q106 (each centre covers at
most Δ+1 places), Q107 (Fig. 8 activity, 10 places, Δ=3),
Q109 (Ore's theorem, no isolated place).

### Graphs added (10) — all γ recomputed by brute force in the script

| ID | Graph added | γ | Basis |
|---|---|---|---|
| Q008–Q011 | directed tournament, 5 teams, 6 directed edges (a→b, a→e, b→d, c→a, c→e, e→d) | — (directed, γ n/a) | All six results stated in the book text, example 5 lesson 1 |
| Q032, Q033, Q035 | ATM graph, 8 vertices, 9 edges | 2, unique {b,f} | Same Fig. 2 lesson 2 as Q034 (already verified in v1.2) |
| Q039 | radio graph, 11 cities, 21 edges | 3 (27 sets) | Same 11-city graph as Q036–Q038 |
| Q115 | Q4 hypercube, 16 vertices, 32 edges | 4 (40 sets) | Same Fig. 9 lesson 2 as Q114 |
| Q120 | C6 | 2 (3 sets) | The answer itself names C6 (six houses around a square) |

No other field was changed: the build script asserts that only `graph`
and `modeling` differ from v1.2, and that category/difficulty/APOS/
sahat/tabs/type/lesson/title/question/source are byte-identical. All 78
pre-existing graphs re-verified by brute force — no γ error found in
them. No v1.2 answer error was found (the v1.2 fixes for Q074/Q133 and
the 2-hint questions stand).

## What remains unready (and why)

**Not practice-ready — 12 questions.** These are the only practice
questions still without modeling, deliberately:

- Text (7): Q016 (degree definition), Q018 (loop/multiedge),
  Q021 (N(v)/N[v] definitions), Q056 (ceiling notation), Q059 (empty
  set), Q061 (proof of the union characterisation), Q066 (proof that a
  non-minimal set can be reduced). Pure definitions/notation/proofs;
  a service scenario pasted onto them would be fabrication.
- Proof (5): Q029, Q076, Q093, Q094, Q108. Proofs of the handshaking
  parity, the γ(Pn)/γ(Cn) formulas and the regular-graph bound. A
  modeling field does not make a proof question runnable, and the
  task forbids forcing one.

**With neither modeling nor graph — 15 questions:** the 12 above, plus
Q137 (proof, lab only, not in practice) and Q141/Q146 (see below).

**Q141** (timed challenge) and **Q146** (station-5 game): meta-questions
about lab mechanics, no modeling and no single graph by design; they
draw from the standard library at runtime. These are the only two
`interactive_graph` questions without a graph; all `compute_gamma`
(40/40) and `draw` (9/9) questions now have graphs.

**Not added, deliberately:**

- Q001–Q003 (Königsberg): a multigraph (7 bridges, parallel edges)
  which the bank's simple-graph schema cannot store.
- Q008–Q011 tournament: directed graph added (above); γ is null by
  design, as for Q014.
- Q040–Q042 (chessboard queens): the 8×8 board graph has 64 vertices;
  a stored graph is not a lab experience, and brute-force γ over
  2^64 subsets is infeasible.
- Q112/Q113 (hospitals): the village map (Fig. 15, exercise 2
  lesson 2) is a picture; the road network and distances are not in
  the extractable text, and reconstructing shortest-path distances
  from the picture would be guessing. The questions are already
  practice-ready via their modeling fields; the site should show the
  book map beside them.
- Q115's graph is Q4 (added above); Q121–Q123 (social network,
  handshakes) name no specific friendships/edges, so the student
  builds the graph — that is the point of the question.
- Q116–Q119, Q124–Q131 (museum, cameras, fire stations, antennas,
  library, lights, relief, wifi, water pump, parking, bus, sensor):
  generic domination scenarios; the graph is the student's
  construction, no specific graph is given in the text.

**Human review still pending (T015–T017):** the 69 new modeling
fields and 10 new graphs were built from the question texts and the
book passages cited above; a human educational review before
publication is still required by the spec, as is the content audit
for the 12 unready questions (which need a decision, not more data:
they are definitions/proofs and may simply stay text-only in
practice).
