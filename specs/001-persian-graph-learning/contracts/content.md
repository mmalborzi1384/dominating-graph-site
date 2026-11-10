# Static Content Contract

## Inputs

- `docs/question-bank.json`: authoritative existing IDs/metadata, fetched as JSON.
- `content/question-overrides.json`: versioned reviewed supplements keyed by question ID.
- `content/teaching.json`: curriculumVersion, ordered stages, lesson blocks and activities.
- `content/lab.json`, `content/competition.json`: declarative activity settings.

Load and validate before enabling dependent activities. Use an index by ID, never search by
question text. Supplement fields must declare why they were added and source/reviewer status;
source meaning, sahat and question identity cannot silently change. References resolve
relative to entry/module base and work from GitHub Pages project subpaths.

## Eligibility and readiness

A question is ready if required context, response mode, hints and every answer-dependent
figure/graph are present and reviewed. A purely textual question need not have a graph.
Teach requires its tab permission, matching APOS stage and selection-capable simple graph.
Competition requires its tab permission and interactive_graph or compute_gamma type.
Practice maps difficulty 1 to easy, 2/3 to hard. Lab respects question permissions; custom
activities are identified separately and do not expand the 150 source question count.

No eligible candidates -> inline explanatory empty state, not a crash or unauthorized question.
An unready question appears as unavailable during development, never as a required stage
blocker. Publication requires all 150 questions ready and reachable in an allowed tab.

## Rendering and assessment

Plain text is rendered as text nodes. Parse $...$ and $$...$$ math segments and render with
KaTeX in isolated LTR spans. Do not execute imported HTML, URLs or TeX trust commands.
Malformed math leaves readable fallback plus an inline diagnostic. A text proof is a
self-assessed rubric activity outside teaching; no claim of automated natural-language grading.

Every teaching activity explicitly declares target=dominating|minimal|minimum. Choose source
questions whose reviewed semantics support selection; do not relabel unrelated foundational
questions as domination exercises just to populate a stage. Explanatory APOS content still
covers the prescribed lessons/pages. Release review verifies this instructional mapping.

## Validation evidence

Validator checks 150 unique IDs, six category counts, APOS/tab references, three hints,
sahat counts 60/25/20/15/15/15, graph endpoint integrity and gamma consistency.
Human review verifies modeling meaning, book figures, rubrics, APOS fit and page coverage.
Machine structure checks alone do not certify instructional correctness.
