# Content gaps in question-bank.json v1.1 — checked 2026-11-11

Checked against the local v1.1 file (150 questions, meta version 1.1, date 2026-11-10).
Codex plan numbers verified exactly: 105 without a modeling field, 99 without a graph.
Only 4 questions have BOTH modeling and a graph: Q007, Q036, Q037, Q038. 58 have NEITHER.

## 1) Must-fix before the site can run these as interactive items (26 questions)
These are interactive_graph / compute_gamma / draw questions whose type needs a stored graph, but graph is null:

interactive_graph without graph (21): Q014, Q017, Q034, Q046, Q055, Q064, Q065, Q078, Q135, Q136, Q139, Q141, Q142, Q143, Q144, Q145, Q146, Q147, Q148, Q149, Q150
compute_gamma without graph (1): Q019  — note: Q019 asks for p of K_p with 36 edges, so the graph is K_9, derivable, low priority.
draw without graph (4): Q015, Q024, Q074, Q133

## 2) Modeling-type questions without a graph (36 of 38)
All 38 modeling-type questions HAVE a modeling scenario; only Q036 and Q038 also have a graph.
Whether each of the other 36 needs a stored graph is a judgment call — the scenario is the model, and the student builds the graph. List:
Q001, Q002, Q003, Q005, Q006, Q008, Q009, Q010, Q011, Q032, Q033, Q035, Q039, Q040, Q041, Q042, Q112, Q113, Q114, Q115, Q116, Q117, Q118, Q119, Q120, Q121, Q122, Q123, Q124, Q125, Q126, Q127, Q128, Q129, Q130, Q131

## 3) Text / proof questions without a graph (37) — mostly legitimate
text without graph: Q004, Q012, Q013, Q016, Q018, Q021, Q022, Q023, Q025, Q026, Q027, Q028, Q030, Q031, Q043, Q044, Q045, Q047, Q052, Q053, Q054, Q056, Q059, Q061, Q063, Q066, Q077, Q106, Q107, Q109
proof without graph (7): Q020, Q029, Q076, Q093, Q094, Q108, Q137
These usually do not need a graph; do not fill them just to reach zero.

## 4) Without a modeling field, by type (105 total)
- compute_gamma: 38 — Q019, Q048, Q049, Q050, Q051, Q057, Q058, Q062, Q069, Q070, Q071, Q072, Q073, Q079, Q080, Q081, Q082, Q083, Q084, Q085, Q086, Q087, Q088, Q089, Q090, Q091, Q092, Q095, Q096, Q097, Q098, Q099, Q100, Q101, Q102, Q103, Q104, Q105
- draw: 9 — Q015, Q024, Q074, Q075, Q110, Q111, Q132, Q133, Q134
- interactive_graph: 23 — Q017, Q046, Q060, Q064, Q065, Q067, Q068, Q078, Q135, Q136, Q138, Q139, Q140, Q141, Q142, Q143, Q144, Q145, Q146, Q147, Q148, Q149, Q150
- modeling: 0 — none
- proof: 6 — Q029, Q076, Q093, Q094, Q108, Q137
- text: 29 — Q012, Q013, Q016, Q018, Q021, Q022, Q023, Q025, Q026, Q027, Q028, Q030, Q031, Q043, Q044, Q045, Q047, Q052, Q053, Q054, Q056, Q059, Q061, Q063, Q066, Q077, Q106, Q107, Q109

Note: every modeling-type question (38) and every category-E question (20) already has modeling.
Category C (minimal vs minimum, 25) has modeling in none of its questions; category D (formulas & bounds, 25) likewise —
for those, a modeling scenario may not be applicable at all. The 105 is a count, not a to-do list.

## 5) Graphs that ARE present (51) — all have gamma and gamma_sets
No graph present lacks gamma; no graph present lacks gamma_sets. Nothing to repair there.

## How this maps to tasks.md
T006 / T015–T017 (complete the 150-question content) are deferred to before publication.
When that work starts, section 1 (26 IDs) is the concrete must-do list; section 2 is the decision list; section 3 should stay empty.
