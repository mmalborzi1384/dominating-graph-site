# Implementation Plan: آموزش فارسی گراف و مدل‌سازی

**Branch**: `main` (actual checkout; setup reports logical feature `001-persian-graph-learning`)
| **Date**: 2026-11-10 | **Spec**: [spec.md](spec.md)

**Input**: `specs/001-persian-graph-learning/spec.md`

## Summary

Deliver five static Persian RTL tabs for chapter 2, using the 150-question source bank.
Use native browser modules, SVG graph interaction and exact small-graph evaluation.
Persist only teaching completion flags/navigation, never teaching responses or scores;
record practice, competition and lab activity separately. Keep content and presentation
editable without a compilation step. This command produces design documents only.

## Technical Context

**Language/Version**: HTML5, CSS custom properties, native ECMAScript modules (ES2022).

**Primary Dependencies**: locally vendored, pinned KaTeX browser distribution and Vazirmatn
WOFF2 with licenses and provenance; no framework, bundler or runtime CDN requirement.
Exact artifact versions/hashes are recorded when acquired in implementation, before merging.

**Storage**: one versioned localStorage envelope per site base path; no database, cookies,
IndexedDB, service-worker persistence or remote user-data endpoint.

**Validation**: manual mobile/desktop browser acceptance checks, instructional/deployment
review and the dependency-free local content script `node scripts/validate-content.mjs`.
Node.js 22+ is optional development tooling for that script only; no automated test framework,
browser driver, test runner or package installation is required.

**Target Platform**: modern Chromium, Firefox and WebKit; 360px mobile and 1280px desktop;
HTTP(S) static hosting on GitHub Pages project subpaths, Linux Nginx/Apache and Windows IIS.
Opening `file://` is not a supported deployment mode; a static HTTP server suffices.

**Project Type**: static educational web application.

**Performance Goals**: graph evaluation <100ms for <=12 vertices on reference test desktop;
pointer redraw within a 16.7ms frame target; tab changes <200ms after content is loaded.
These are implementation budgets to measure, not claims of achieved performance.

**Constraints**: no build/backend/database; localStorage-only persistence; exactly five tabs;
inline confirmation instead of modals; teaching progress monotonic until explicit reset;
modeling context mandatory; ordinary text contrast >=4.5:1 in both palettes.

**Scale/Scope**: 150 stable questions, six categories/sahat, four APOS stages, 2–10 local
groups, five lab stations, custom graphs 2–10 vertices; existing prepared graphs up to 12.
User-data limits are shared across local writes and imports: group names 30 characters,
labels 50, text responses 1000, live attempt records 200 and sessions 100. See the exact
counting and capacity rules in data-model.md and contracts/persistence.md.

## Constitution Check

*GATE: evaluated before research and re-evaluated after design.*

| Principle / gate | Before research | After design and evidence |
| --- | --- | --- |
| I: static/no build/localStorage | PASS | Native modules and static JSON; storage contract has one envelope |
| II: five tabs, APOS locks, 2–10 groups, no popups | PASS | UI contract covers locks, inline feedback and reset |
| III: all examples/questions model-based | PASS in design | Content adapters require context; release gate audits all 150 |
| IV: Persian/KaTeX/Vazirmatn/day-night | PASS | Central tokens, local assets and isolated LTR spans |
| V: editability and separation | PASS | Data files, pure domain functions and tab controllers separated |
| Human review, one feature per PR, Graphify | PASS | Ordered feature slices below; update after every code slice |
| No unanswered behavioral clarification | PASS | User decisions in spec; third-hint cap zero remains explicit assumption |

No constitutional exceptions. Missing instructional assets are release dependencies, not
permission to publish bare or unanswerable questions. Runtime verification remains future work.

## Project Structure

### Documentation (this feature)

```text
specs/001-persian-graph-learning/
├── spec.md
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── checklists/requirements.md
└── contracts/
    ├── content.md
    ├── evaluation.md
    ├── persistence.md
    └── ui.md
```

`tasks.md` is produced subsequently by `$speckit-tasks`, not by this command.

### Source Code (repository root)

Proposed paths below are future implementation files, not files created by planning.

```text
index.html
.nojekyll
assets/
├── css/{tokens,base,layout,graph}.css
├── vendor/{katex,vazirmatn}/
├── content/                         # reviewed figures and modeling scenes
└── js/
    ├── app.js
    ├── domain/{graph,evaluate,scoring,progress,coverage,limits,attempts,sessions}.js
    ├── data/{load,validate,adapt}.js
    ├── storage/{repository,validate,migrate,transfer}.js
    ├── ui/{tabs,math,graph-editor,feedback}.js
    └── tabs/{teach,practice,competition,records,lab}.js
docs/question-bank.json             # existing authoritative source, 150 IDs
content/
├── teaching.json                   # four stages and required activity mappings
├── question-overrides.json         # context/graph/response contracts by existing ID
├── lab.json                        # stations, templates, timed challenge
└── competition.json                # rounds, scoring and question eligibility
scripts/validate-content.mjs
specs/001-persian-graph-learning/validation/  # recorded manual checks and script outputs
```

**Structure Decision**: browser-loadable files are served directly from the repository.
Use relative URLs resolved against module URLs and hash navigation; no server route fallback.
Pure domain modules know neither DOM nor localStorage. Tab controllers use shared evaluation,
repository and rendering interfaces; content edits do not require rewriting algorithms.

## Delivery and Verification Order

1. Static shell, five-tab navigation, tokens, local font/math assets and storage baseline.
2. Reviewed content normalization and graph evaluation/editor, preserving all question IDs.
3. APOS self-assessment with persisted flags, monotonic unlock, previous navigation and reset.
4. Scored practice with free hints and explicit text-response evaluation mode.
5. Competition with equal rounds, hint caps, immutable finalized turns and resume.
6. Five lab stations, custom graphs, draw-by-n/gamma and timed challenge.
7. Records, six-sahat coverage, selected deletion and validated import/export.
8. Full content audit, usability and static-host deployment checks.

Each independently reviewable feature is one PR with human approval before merge. Foundation
changes precede dependent features; partial delivery does not constitute the full release.
Run `graphify update .` after each completed code slice. Plan-only documents do not modify code.

## Scheduling amendment — 2026-11-11

T008, T011 and T012 were completed before the previously requested phase 4. The user has
subsequently prioritized bank completion ahead of further feature phases, superseding the
earlier pre-release deferral of T006 and T015–T017. The present slice only aligns documents;
it does not implement those tasks or authorize a new tab workflow. The v1.2 bank and local
book PDF are now available; assess compatibility, context, human review and full readiness
as described in the content contract before treating any source item as usable.

## Phase Outputs and Validation

Lab review implementation: dedicated assets/css/lab.css supplies grouped tools, compact
connection controls and a symmetric direction pad without changing shared palette/font tokens.
familyGraph owns topology; labPlaces owns family-aware layout. Draw targets are independent
from builder controls and prepared models; preflight prevents unsupported custom snapshots.
Follow-up clarifies station-specific tasks and transient observations. A lab-only saved-result
panel uses the existing Attempt schema and a narrow one-write deletion API; game/challenge
turn tombstones preserve replay prevention. General Records analytics/transfer remains later work.

Phase 0 decisions: [research.md](research.md). Phase 1: [data-model.md](data-model.md),
[contracts](contracts/), [quickstart.md](quickstart.md). All 25 FRs are assigned below.

| Requirements | Design / validation location |
| --- | --- |
| FR-001–004, FR-018–022 | UI/content contracts, static-host and instructional audit |
| FR-005–008, FR-023 | Evaluation/progress/storage contracts; manual reset and hint checks |
| FR-009–010 | Practice/competition UI, manual scoring and session checks |
| FR-011–013 | Graph/evaluation contracts and all five lab station checks |
| FR-014–017 | Records/storage/coverage/transfer contracts and manual round-trip checks |
| FR-024 | Shared limits, local/import boundary checks and capacity failure handling |
| FR-025 | Glass tokens/containers, opaque graph, reduced-motion and fallback verification |

## Liquid Glass Presentation Amendment

Constitution 1.1.0 / FR-025: apply shared glass container classes to tab bar, question cards,
board panels and future records cards. Centralize translucent fills, bright thin borders,
soft shadows, blur strength and motion durations in tokens.css for day/night. The fallback
is an opaque theme surface; enhance with backdrop-filter under @supports. Do not apply
opacity/filter to a whole container: its text and children remain opaque. SVG graph canvas,
nodes and selection pieces use opaque token fills without filters; coverage also uses
patterns/text. Validate composited text contrast >=4.5:1 against the actual patterned backdrop.

Use a brief opacity/position entrance for active tab/card and targeted color/background
transitions for theme changes. Under prefers-reduced-motion: reduce, remove entrance motion
and nonessential transitions. No continuous decorative animation. The interactive board
review slice adopts these styles now; future question/records flows reuse the same classes.
Manual checks cover both themes, 360px/1280px, reduced motion and disabled blur. Map FR-025 /
SC-010 to shared styles and T054 presentation verification; do not implement future tab
workflows merely to demonstrate their container styles.

## Complexity Tracking

No violations or additional infrastructure to justify.
