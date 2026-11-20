# Phase 01: typography and reading rhythm

Date: 2026-11-20. Baseline: 0310d1c. Branch: codex/atlas-01-typography.
Scope: Setup, foundations and US1 only. No later story, curriculum, storage, scoring or product JavaScript changed.

## Baseline and inventory

No source drift from planned revision. All ten Node validators passed before edits. Baseline antislop browser: 492 checks, no failures/errors. Baseline screenshots retained locally in /tmp/atlas-before/.

Existing central roles remain: Vazirmatn (Persian), KaTeX (LTR mathematics), paper/surface/ink/heading/accent, canonical bead/hatch colors and motion tokens. No paint value changed. New roles: section/subheading size, heading weight, body/heading/control line heights, 68ch reading measure and .5/1/1.5/2/3rem spacing. Small status labels retain their existing size; problem prose and model explanations use at least 1rem.

## Reasons

- Keep Vazirmatn and KaTeX for Persian continuity and independent mathematical direction.
- Body line height 1.8 gives Persian prose room; controls use 1.5 for compact actions with existing hit targets.
- A responsive section/subheading hierarchy distinguishes navigation, scenario and evidence prompts.
- Space separates scenario, model meaning and action; the reading measure avoids long lines on wide displays.
- minmax(0,...) grid tracks and logical wrapping let long Persian content shrink on phones.
- Existing warm paper, green and sparse gold identify this mathematics workspace; semantic node colors retain their domain meaning.
- No new asset, icon, navigation, layout framework or motion is introduced. ENERGY 2 / RHYTHM 3 / MOTION 2 remains the approved direction, with later composition changes still pending.

## Actual validation

Use Node at /home/coding/.nvm/versions/node/v26.5.0/bin/node in this host: plain node was absent from PATH. Chrome: /usr/bin/google-chrome. No install/build step.

| Command suffix after node scripts/ | Result |
|---|---|
| validate-polish.mjs | PASS: 42 |
| validate-foundation.mjs | PASS: 104 |
| validate-graph.mjs | PASS: 1180 graphs / 61688 selections |
| validate-graph-workspace.mjs | PASS: 317 |
| validate-apos-v3.mjs | PASS: 289 foundation + 395 content checks |
| validate-teaching.mjs | PASS: 54 |
| validate-practice.mjs | PASS: 37 |
| validate-competition.mjs | PASS: 174 final total |
| validate-lab.mjs | PASS: 211 final total |
| validate-records.mjs | PASS: 90 final total |
| validate-atlas-browser.mjs --story US1 | PASS: 122, zero runtime exceptions |
| validate-graph-workspace-browser.mjs | PASS: 31, zero errors |
| validate-apos-v3-browser.mjs | PASS: 39, zero errors |
| validate-antislop-browser.mjs | PASS: 492, zero failures/errors |
| validate-navigation-lab-browser.mjs | BASELINE FAILURE: same failure on untouched main and this branch |

The legacy navigation/lab check expects an empty drawing in connect mode, then #lab-draw-submit and a persisted attempt. Current spec 004 lab constructs a scratch model and does not record scored attempts. Both runs fail at the same assertion and missing control. The existing validator was not changed or weakened. Current navigation, scratch behavior and keyboard paths are covered by the workspace/antislop/atlas checks.

Atlas matrix: all five routes, day/night, widths 320/390/768/1280/1440; heading hierarchy, >=16px body and no document overflow. Long Persian prose and a synthetic KaTeX formula use actual mounted teaching/practice containers and the production renderer without saving content. The first teaching activity has no visible formula, so the fixture explicitly supplies one. Keyboard Enter includes its native carriage-return text in the CDP event; the theme fixture uses graphShellTheme so shell/repository state stays synchronized. Initial harness mistakes were corrected before the final passing result.

| Text role on surface | Day contrast | Night contrast |
|---|---|---|
| ink | 14.37 | 11.92 |
| ink-soft | 9.06 | 8.99 |
| heading | 9.53 | 8.44 |

## Interaction ledger

| Action | Observed result / evidence |
|---|---|
| Each five-route activation | Correct panel visible; atlas matrix |
| Theme button with Enter | Night becomes day; atlas |
| Four motion radio controls | Actual root preference matches selected value; atlas |
| OS reduced-motion | Smooth document scroll disabled; atlas |
| Tab / Enter / Escape | Visible focus, navigation opens and closes; atlas |
| Practice/lab enhanced selects | Real options, expanded targets, dropdown stacking and response review work; 492-check antislop script |
| Source graph touch, drag, keyboard and edge edits | Actual positions/topology change, targets remain inside canvas; antislop |
| Lab build/check/hint/solutions and 2D/3D | Shared selection preserved, no attempts/sessions added, WebGL fallback works; workspace browser |
| APOS evidence/exit and records transfer | Existing browser and Node validators preserve completion rules and import/export behavior |
| Typography and preferences | Attempts/sessions/teaching progress unchanged by atlas run |

Screenshots: [mobile day](screenshots/phase01-day-mobile.png), [desktop night](screenshots/phase01-night-desktop.png), [long prose](screenshots/phase01-long-text.png). Full geometry/contrast output: [US1 browser report](us1-browser.json). Screenshots visually reviewed for reading hierarchy, Persian wrapping and theme legibility; they are not proof of every interaction.

## Limits and review boundary

200% reflow was modeled as 1280 physical / 640 CSS px; native browser toolbar zoom was not exercised. Touch was emulated, not a physical device. No Lighthouse score or educational mastery claim. The old navigation/lab validator remains a documented baseline failure. No public deployment or merge. Stop after the focused phase PR; US2-US6 remain unchecked.

Graphify update completed using AST extraction; PDF extraction was skipped because optional pypdf is absent. The local ignored graph output is not added to Git.

## Delivery Gate: US1 change scope

This gate covers the changed typography and its shared-surface regressions. Baseline issues and untested native zoom/physical touch remain disclosed above; later stories are not certified.

- R-02 PASS: Authored changes scanned for prohibited punctuation.
- R-03 PASS: 122 atlas checks include long prose, all five widths/routes and no document overflow.
- R-17 PASS: No statistic added to product.
- R-18 PASS: No testimonial/person added.
- R-23 PASS: No asset or navigation generated.
- R-24 PASS: Five real route targets exercised.
- R-25 PASS: Ink, soft ink and heading measured above 4.5 in both themes.
- R-26 PASS: No control added; existing changed-surface interactions exercised by atlas/workspace/antislop.
- R-27 PASS: Existing loading/empty/error paths retained; no controller modified.
- R-28 PASS: No FAQ added.
- R-32 PASS: Tab focus, Enter and Escape pass in actual Chrome.
- R-33 PASS: CSS edited directly with apply_patch, not an external patch script.
- R-34 PASS: Day/night geometry and screenshots inspected.
- R-35 PASS: Chrome ran all changed surfaces; interaction ledger above.
- R-36 PASS: No fabricated compliance/security/performance claim.
- R-37 PASS: Previously approved atlas direction, not an unreviewed concept.
- R-38 PASS: Existing curriculum retained; synthetic text lives only in tests.
- R-39 PASS: Existing native controls and states retained; keyboard/motion checks passed.
- R-40 PASS: No media, scripts or resource loading changed.
- R-01 PASS: No new gradient or glow.
- R-04 PASS: No icon introduced.
- R-06 PASS: Vazirmatn for Persian continuity, KaTeX for math; rationale above.
- R-07 PASS: Existing notebook grid retained as graph-learning identity; no new pattern.
- R-08 PASS: No arrow introduced.
- R-09 PASS: No badge introduced.
- R-10 PASS: 492-check antislop suite verifies blur confined to navigation.
- R-12 PASS: No shadow introduced.
- R-13 PASS: No glow introduced.
- R-14 PASS: No feature-card layout added.
- R-19 PASS: Motion unchanged; preference controls and OS reduced-motion checked.
- R-22 PASS: No illustration introduced.
- C-1 PASS: Type, spacing and wrapping reasons recorded above.
- C-2 PASS: No dead control introduced; interaction ledger passes.
- C-3 PASS: Only existing learning content surfaces affected.
- C-4 PASS: Five widths, two themes, long text and keyboard checked; disclosed device limits.
- C-5 PASS: Only measured results reported.
- R-05 PASS: Different existing hero, learning and records compositions retained.
- R-11 PASS: No radius change.
- R-15 PASS: No CTA changed in US1; hero rewrite remains US6.
- R-16 PASS: No marketing copy added.
- R-20 PASS: Persian mathematics hierarchy and connected-node motif retained.
- R-21 PASS: Both user-selectable themes pass.
- R-29 PASS: Paint tokens unchanged, semantic node colors preserved.
- R-30 PASS: No product clone.
- R-31 PASS: One-line reasons above for every major change.
- Dials PASS: ENERGY2/RHYTHM3/MOTION2 recorded before editing.
- Consistency PASS: US1 strengthens hierarchy within existing varied compositions; future composition stories remain pending.
- Focal point PASS: Scenario and evidence headings distinguish the learning task from help.
- Whitespace PASS: Shared spacing separates scenario/model/action.
- Accent PASS: Existing green hierarchy and sparse gold preserved.
- Motif PASS: Neighborhood and connected nodes retained.
- Design Read PASS: Confirmed Persian mathematics atlas direction in research.md.
