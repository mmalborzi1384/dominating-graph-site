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

**Testing**: pure domain tests with Node.js 22+ built-in test runner; browser integration
with Playwright as development-only tooling; manual RTL, instructional and deployment review.
No package installation or test tooling is required to serve the site.

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
All locally persisted user data is bounded by available browser storage, not an unlimited log.

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
    ├── domain/{graph,evaluate,scoring,progress,coverage}.js
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
tests/
├── unit/                           # exact graph, score, progress, coverage
├── contract/                       # content/import validation and round-trip
└── browser/                        # persistence, reset, navigation and workflows
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

## Phase Outputs and Validation

Phase 0 decisions: [research.md](research.md). Phase 1: [data-model.md](data-model.md),
[contracts](contracts/), [quickstart.md](quickstart.md). All 23 FRs are assigned below.

| Requirements | Design / validation location |
| --- | --- |
| FR-001–004, FR-018–022 | UI/content contracts, static-host and instructional audit |
| FR-005–008, FR-023 | Evaluation/progress/storage contracts; reset and hint tests |
| FR-009–010 | Practice/competition UI, scoring and session tests |
| FR-011–013 | Graph/evaluation contracts and all five lab station checks |
| FR-014–017 | Records/storage/coverage/transfer contracts and round-trip tests |

## Complexity Tracking

No violations or additional infrastructure to justify.
