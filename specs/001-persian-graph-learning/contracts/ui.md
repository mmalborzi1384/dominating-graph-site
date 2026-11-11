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
Each activity shows context, target, selectable graph, check, inline diagnostics/hint and
separate reveal action. No teaching score table, attempt log or stored selected vertices.
Records has a dedicated progress summary with continue and reset, not teaching score analytics.

## Practice / competition

Randomization controls: Teaching activities display stage/exact difficulty and offer
«سؤال تصادفی دیگر» from the compatible ready pool without changing progress. Practice's
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
