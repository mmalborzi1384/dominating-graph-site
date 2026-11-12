# Phase 8 — presentation and interaction / T054, T059–T062

2026-11-12, Linux x86_64, Chrome 157 headless (native DevTools Protocol), DPR 1.
Browser work was performed through native touch/key/file-input events and DOM inspection;
no Playwright/driver dependency or application build was added. Sizes are **emulated CSS
viewports**, not physical phones. Firefox and WebKit are unavailable here and remain untested.

## Verified

- **80 combinations**: 5 tabs × 2 widths (360/1280) × 2 palettes × 4 motion levels.
  Touch the actual rail and tab targets; effective preference and visible panel match,
  rail targets ≥44px, one landing per panel, no horizontal document overflow.
- A second 20-view pass checked populated Records, Latin/math isolation, opaque graph
  filter, and both themes/sizes after the last controller fixes. See screenshots below.
- Five distinct finite ornaments: drawn teaching route, floating practice card, 2→10
  decorative group count, slow lab graph rotation, filling Records chart. Ornaments do
  not claim live group/result counts; competition copy explicitly says 2–10 groups.
- Tab entrance fades/slides in ≤180ms, glass-only backdrop reveal, CSS detail disclosures,
  per-vertex stagger, bead tap, changed-owner hatch fade. Canonical u%10 colors and exact
  45° single/multi-owner patterns remain; graph/pieces themselves have no blur/filter.
- Correctness includes ✓/! and text, plus bounded success pulse/error shake. Practice
  0→15 score interpolation was observed after a free hint; competition totals use stable
  group IDs; lab saves/turns use the same counter. Final accessible values are immediate.
- All twelve APOS activities were completed through rendered controls; each correct answer
  reveals only the next activity, progress reaches 100%, reload retains it. Off has no
  transition hold. Wrong Enter submission stays put and gives a free hint. No answers/hints/
  scores enter teaching storage. New stage alone receives a lock-open cue.
- Native RTL ArrowLeft activates Practice from Teaching, with focus on its tab. Native
  radio arrows choose levels; Enter checks/submits answers and opens/confirms/cancels actions.
- Native touch vertex controls solve a practice selection and connect/disconnect two
  graph endpoints. ArrowRight moves a lab vertex without topology changes. Gamma check,
  all five station modes, family observation, 2/10-group schedules, wrong-turn error,
  selected deletion and real downloaded-file 1.4 import were exercised.
- Preference reload; changing theme preserves motion; reduced-motion forces effective off
  while preserving selection, shows its short status, and leaves **0 running animations**.
  Off cancels counters at final values and APOS pending holds; low omits spatial/decorative
  effects. Full ornaments terminate (no infinite animation).
- Disabled-blur test forces opaque shared surface; controls and six-node graph remain
  readable; off has no running animations. CSS @supports fallback is the opaque surface.
- KaTeX/Vazirmatn use local files. Math spans are LTR/left aligned, plain Latin fragments
  receive isolated spans; imported data stays text. Focus outlines remain visible.

## Contrast

Calculated WCAG relative luminance from actual token colors against surface composited at
alpha .84 over paper/grid/surface, for ink/ink-soft/heading/error/hint in both themes.
Minimum ordinary-text contrast **5.69:1** (day hint on grid-backed glass); all tested pairs
exceed 4.5:1. Palette/bead colors were not replaced. See phase8-metrics.json for all pairs.
This is a deterministic token/compositing check, not a claim about untested OS rendering.

## Screenshots

- [360 day — teaching](screenshots/phase8-360-day-teach.png)
- [360 night — lab](screenshots/phase8-360-night-lab.png)
- [1280 night — teaching](screenshots/phase8-1280-night-teach.png)
- [360 day — populated Records](screenshots/phase8-360-day-populated.png)

## Open gate

T054 is **partial** until Firefox/WebKit and physical device/accessibility review are recorded.
The requested Chromium viewport/touch/keyboard checks passed; they are not substituted for
unavailable browser engines or real users. T059–T062 local implementation/checks are complete.
