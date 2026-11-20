# Research and decisions

Planned at `0310d1c`, 2026-11-20. Recon only; no browser execution or performance measurement.

## Decision: preserve static architecture
Rationale: README and constitution require HTML/CSS/ES modules, local Vazirmatn/KaTeX and static deployment. No package install, build, backend or new animation framework is needed.
Alternatives: React migration and GSAP were rejected as unrelated infrastructure.

## Decision: authoritative current surfaces
Evidence read directly: `index.html:58` contains `.site-landing`, hero map and real hash links; `assets/css/editorial.css:2` owns hero composition; `assets/css/tokens.css:8` defines warm paper, green, type and motion, with night overrides at line 67. `assets/js/tabs/teach.js:15` routes curriculumVersion 3 to `teach-v3.js`, whose lines 14-41 build lessons, units, step route and model key. `assets/js/tabs/lab.js:18-45` owns scratch tools and workspace. `assets/js/ui/graph-surface.js:6` owns shared rendering; `attachGraphView` observes the same SVG for 3D. `specs/004-graph-workspace/spec.md` fixes scratch-only lab and shared 2D/3D semantics.
Rationale: older reports describe saved lab results and earlier APOS interfaces; do not revive these.
Alternatives: editing legacy teach.js renderer or deleting old storage structures rejected.

## Decision: order and reviews
US1 typography, US2 night palette, US3 lab composition, US4 graph feedback, US5 route, US6 hero. Rationale: establish tokens before layouts, stabilize graph presentation before reusing its language in route/hero. Each story is one independent PR and requires explicit permission before the next story. Setup and foundation are included in US1 PR. Final cross-cutting evidence is included in US6 PR, with earlier phases also fully tested.
Alternatives: six changes in one PR rejected because review and regressions become difficult.

## Decision: design language
Reading this as a Persian mathematics learning workspace for grade-12 students, in an interactive atlas language; ENERGY 2 / RHYTHM 3 / MOTION 2.
Warm paper supports reading; green is the existing academic identity; gold is a sparse hierarchy accent, not a new meaning for vertices. Vazirmatn supports Persian continuity; KaTeX stays LTR. Main copy line height target 1.8, controls 1.5; body minimum 1rem. Shared spacing tokens target .5/1/1.5/2/3rem; component exceptions require a reason. Larger radius belongs to board/hero, smaller to controls; not every element becomes a pill. Matte panels prevent blur stacking. Shadows distinguish navigation elevation only where needed. The hero graph, lab board and current route station are their respective focal points. Whitespace separates scenario, model and action. Repeated connected nodes are the identity motif.
Alternatives: generic neon gradients, full-page grid and glass cards rejected as decorative and inconsistent with existing identity. Existing semantic node colors are not a decorative palette and must not be reduced to the UI accent count.

## Decision: UI/UX Pro Max guidance verification
Initial design-system search `mathematics learning interactive editorial` returned music-oriented type/color; rejected. Narrow `education learning --domain product --rtl` returned Educational App, partial RTL: useful hierarchy/micro-interaction guidance, not its clay style. Specific UX searches `dragging movements` and `focus not obscured` matched non-drag alternatives and focus visibility. Preserve direction-pad buttons, logical CSS, and unobscured focus. Use the minimum focus visibility requirement accurately; full visibility is a project quality target, not a claim of AAA certification. Native HTML/CSS/ES modules are the detected stack; do not mislabel it as Tailwind.

## Decision: finite graph feedback
Logical state commits first, effects use existing motion helpers/tokens, interrupted effects cancel. Duration target 160-280ms and no infinite loop. Reduced-motion/off use final state immediately. Teach-specific reveal gate remains owned by the teaching controller. Never compute or reveal minimum sets in presentation code. 3D observes final state; animated parity does not require a second state engine.
Alternatives: animate independently in 3D or delay scoring until animation completion rejected.

## Decision: hero illustration
Reuse current five labeled places and existing edges in code-native SVG. Add manual reversible map/graph mode, no new bitmap/logo or people assets. Keep a textual equivalent and reserve aspect ratio. No autoplay: user action triggers finite transformation. SVG is a native diagram, not a raster hero photo; no image fetch is introduced.
