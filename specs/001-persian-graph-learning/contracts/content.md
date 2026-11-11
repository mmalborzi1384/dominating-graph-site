# Static Content Contract

## Inputs

- `docs/question-bank.json`: authoritative existing IDs/metadata, currently v1.2, fetched as JSON.
- `docs/گسسته-دوازدهم.pdf`: local book source; `docs/question-bank-v1.2-report.md`
  describes v1.2 changes. `docs/content-gaps.md` is a historical v1.1 audit, not a
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

Teaching: each stable activity draws from ready, teach-permitted selection models matching
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
Teach requires its tab permission, matching APOS stage and selection-capable simple graph.
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

Every teaching activity explicitly declares target=dominating|minimal|minimum. Choose source
questions whose reviewed semantics support selection; do not relabel unrelated foundational
questions as domination exercises just to populate a stage. Explanatory APOS content still
covers the prescribed lessons/pages. Release review verifies this instructional mapping.

## Validation evidence

Validator checks 150 unique IDs, six category counts, APOS/tab references, three hints,
sahat counts 60/25/20/15/15/15, graph endpoint integrity and gamma consistency.
Human review verifies modeling meaning, book figures, rubrics, APOS fit and page coverage.
Machine structure checks alone do not certify instructional correctness.

## v1.2 baseline and outstanding decisions

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
