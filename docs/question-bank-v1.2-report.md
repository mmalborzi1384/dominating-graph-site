# Question bank v1.2 — report (2026-11-11)

Built from v1.1 (`question-bank.json`, untouched) by `build_v1.2.py`,
which computes every γ by brute-force subset search and re-verifies **all
150 graphs** (old and new). No γ value was hand-entered.

## Files

- `question-bank-v1.2.json` — the new bank (150 questions, same IDs).
- `build_v1.2.py` — build + verify script. Run `python3 build_v1.2.py`
  to rebuild; `python3 build_v1.2.py --verify-only` to re-check the file.
- `question-bank.json` (v1.1) and `question-bank-v1.0.json` — untouched.

## Final counts

| | v1.1 | v1.2 |
|---|---|---|
| Total questions | 150 | 150 |
| With `modeling` | 45 | **64** |
| With `graph` | 51 | **78** |
| With both | 4 | **29** |
| With neither | 58 | **37** |
| Practice-ready (rule below) | 39 / 126 | **47 / 126** |

By type in v1.2 (modeling / graph): modeling 38/38, 5 · text 30, 1/0 ·
compute_gamma 40, 2/40 · interactive_graph 26, 19/24 · draw 9, 3/9 ·
proof 7, 1/0. Categories, difficulty, APOS, sahat tags: unchanged
(31/30/25/25/20/19; 60/73/17; 33/37/39/41; 60/25/20/15/15/15).

**Practice-ready rule used** (T006-flavoured): tab `practice` + `modeling`
present + a `graph` present when the type needs one to run
(`interactive_graph` / `compute_gamma` / `draw`). Text/proof/modeling
types need only the modeling context. Note: Codex's message quoted
"11 of 126 practice questions ready" — that number could not be
reproduced under this rule or under modeling+graph (4 in v1.1); the
rule above is the one this report uses, so use 39 → 47.

## What was added per question

### Book figures read from the PDF (book page = PDF page − 8)

| ID | Graph added | γ | Source |
|---|---|---|---|
| Q014 | directed, V={a,b,c,d}, E={(a,b),(a,c),(c,a),(d,b)} | — (directed, γ n/a) | Fig. 6, lesson 1, p. 34 |
| Q015 | 6 vertices, edges ab,ac,cd,ef,bd,cf,be | 2 (3 sets) | Ex. 1, lesson 1, p. 41 (edges from the question text) |
| Q017 | K3,3 | 2 (9 sets) | Fig. 9, lesson 1, p. 35 — hexagon + 3 diameters = K3,3 |
| Q019 | K9 (36 edges) | 1 (9 sets) | Ex. 6, lesson 1, p. 42; p(p−1)/2=36 ⇒ p=9 |
| Q024 | Fig. 16 graph G, 5 vertices, 6 edges | 2 (6 sets) | Fig. 16, lesson 1, p. 37; complement Ḡ edges listed in the note |
| Q034 | ATM graph, 8 vertices, 9 edges | **2, unique set {b,f}** | Fig. 2, lesson 2, p. 44 |
| Q064 | Petersen, 10 vertices, 15 edges | 3 (10 sets) | Fig. 5, lesson 2, p. 46; edge set identical to Q140's stored Petersen |
| Q065 | Fig. 6, 9 vertices, 13 edges | 3 (14 sets; {b,d,f} among them) | Fig. 6, lesson 2, p. 47; cross-checked against the book's own sets |
| Q150 | Fig. 17, vertices u,v,w,x,y,z, 9 edges | **1, unique set {w}** (w is universal) | Fig. 17, lesson 1, p. 38; 5-cycle e.g. u-v-w-y-z-u |

### Standard / constructed graphs (not book figures — said so in each note)

| ID | Graph added | γ | Basis |
|---|---|---|---|
| Q005, Q006 | K3,3 | 2 | The question/answer itself state K3,3 (Sheikh Bahai) |
| Q046 | P5 (example) + modeling | 2 | Illustrative example for N[v]; no book figure exists |
| Q055 | 14 employees = cliques K4,K4,K4,K2 | 4 (128 sets) | Follows the question's own modeling field (edge = same taxi) |
| Q074 | double-star: ab,ac,ad,be,bf | 2, **unique set {a,b}** | Ex. 9-a, lesson 2, p. 53; found by exhaustive search |
| Q078 | P6 | 2, unique {b,e} | Repo targeted practice; {b,d,f} is the minimal non-minimum set |
| Q114 | Q4 hypercube, 16 vertices, 32 edges, 4-regular | 4 (40 sets) | Fig. 9, lesson 2, p. 49 — two Q3 cubes + matching; γ(Q4)=4 as expected |
| Q133 | P3 + isolated vertex (n=4) | 2, unique {b,d} | Ex. 10-a, lesson 2, p. 54 (see error fix below) |
| Q135, Q136, Q149 | P5 (example base) | 2 | Lab activity starting point |
| Q139 | edgeless 7-vertex starter | 7 | Student builds the edges; γ=7 is the honest start state |
| Q142 | P3 (representative) | 1 | Station 1; C4, K4, S4 must load from the standard library (see note) |
| Q143 | P7 (representative) | 3 (8 sets) | Station 2; all Pn/Cn, n=1..7, from the standard library (see note) |
| Q144 | bound_not_tight graph (same as Q111) | 3 | Station 3; n=6, Δ=3, bound 2, γ=3 |
| Q145 | P6 | 2 | Station 4; {b,d,f} minimal non-minimum |
| Q147 | P9 | 3, unique {b,e,h} | The answer's own example |
| Q148 | C6 | 2 (3 sets) | The answer's own sets {v1,v4},{v2,v5},{v3,v6} |

Modeling fields were also added where they genuinely apply:
Q017, Q024, Q046, Q064, Q065, Q074, Q078, Q133, Q135, Q136, Q139,
Q142–Q145, Q147–Q150 (19 new modeling fields; 45 → 64).
No modeling was forced onto category C/D formula/proof questions.

### Section-2 decision (36 modeling-without-graph questions)

Kept `graph: null` — the student builds the graph from the scenario;
the modeling field is the deliverable. List unchanged from
content-gaps.md §2 (Q001–Q003, Q005–Q011 except Q005/Q006 got K3,3,
Q032, Q033, Q035, Q039–Q042, Q112–Q131 except Q114 got Q4).
Notes: Q001/Q003 Königsberg is a **multigraph** (7 bridges, parallel
edges) which the bank's simple-graph schema cannot store; Q042 is the
8×8 chessboard (64 squares — a lab experience, not a stored graph).

## Errors found in v1.1 and fixed

1. **Q133 / book exercise 10-a is wrong for n=3 (proved).** The exercise
   asks for an n-vertex graph with γ=2 and a unique γ-set for every
   n ≤ 4. Exhaustive search over all graphs on 3 vertices finds none.
   Proof: if {x,y} dominates, the third vertex is adjacent to x or y;
   then the other pair also dominates — so a unique γ-set is
   impossible. The answer now says so, with the full picture:
   n=1 impossible, n=2 works (edgeless graph, unique {a,b}), n=3
   impossible, n=4 works (P3 + isolated vertex, unique {b,d}).
2. **Q074's answer was vague** ("a correct example: two connected
   universal vertices…"). Replaced with a concrete verified example
   (double-star above, unique γ-set {a,b}); the S6 non-example
   discussion in the old answer was correct and is kept.
3. **Five questions had only 2 hints instead of the required 3**
   (T006): Q099, Q100, Q101, Q102, Q134. A level-3 hint (the γ
   itself, per repo convention) was added to each; the first two
   hints are unchanged.

No other v1.1 field was changed: the build script asserts that only
`graph`, `modeling`, `answer_fa`, `answer_value` and `hints` differ,
and that category/difficulty/APOS/sahat/tabs/type/lesson/title/
question/source are byte-identical. All 51 pre-existing graphs
re-verified by brute force — no γ error found in them.

## What remains unready (and why)

- **Q141** (timed challenge, 5 graphs in 3 min) and **Q146** (station-5
  two-group game): meta-questions about the lab mechanics. No single
  stored graph applies; the challenge/game draws its graphs from the
  standard library at runtime. `graph` stays null by design. These are
  the only two `interactive_graph` questions without a graph; all
  `compute_gamma` (40/40) and `draw` (9/9) questions now have graphs.
- **Q055 caveat:** n=14 exceeds the T007 prepared-graph limit of 12
  vertices. The site board must allow 14 vertices for this question,
  or the question stays practice-unready until then.
- **Q014 caveat:** directed graph; `gamma` is null by design and the
  graph carries `"directed": true` (the only schema extension in v1.2).
  The site must not feed it to the undirected domination evaluator.
- **Q142 / Q143 caveat:** the stored graph is a representative (P3 /
  P7); the station needs the whole family from the standard library.
- **Q139 caveat:** the stored graph is the empty start state (γ=7);
  the student's built graph is what gets evaluated.
- **Still without modeling (86 questions):** mostly text/proof and
  category C/D formula questions where no modeling scenario applies,
  plus the 37 text/proof questions of content-gaps.md §3. Forcing
  modeling onto them would be fabrication, not completion.
- **Human review still pending (T015–T017):** the figures above were
  read from the PDF by this build and cross-checked against the book
  text where the book states sets/values (Q064/Q065/Q114/Q150); a
  human educational review before publication is still required by
  the spec, as is the content audit for the 37 text/proof questions.
