# Shared graph controls and theme ornament audit

Mode: after, following the session choice. Scope: requested graph interaction fixes, device switch and subsequent theme ornament request.

**Remaining change recommendations: none in the reviewed scope.**

Direction: retain graph-learning identity, central palette and compact toolbar; ENERGY2/RHYTHM2/MOTION2. Large hit targets improve touch, per-ID depth and a screen-facing drag plane preserve movement after rotation. Tapered curved sun rays, opposing fading light trails and a slow crescent sway implement the explicit follow-up, without new assets or libraries.

## Delivery Gate

| Rule | Status and evidence |
|---|---|
| R-01 | PASS: No new color gradient/glow; SVG luminance mask fades light trails as explicitly requested. Existing palette. |
| R-02 | PASS: No em dash in new product copy. |
| R-03 | PASS: Native input suite tests 320/390/1280 widths; no document overflow. |
| R-04 | PASS: Existing plus/minus symbols name zoom actions; device mode uses text. |
| R-05 | PASS: Existing educational layout retained. |
| R-06 | PASS: Existing Vazirmatn typography retained. |
| R-07 | PASS: Background unchanged in this patch. |
| R-08 | PASS: No decorative CTA arrows added. |
| R-09 | PASS: Percentage is an operative zoom reset, not a badge. |
| R-10 | PASS: No additional glass or blur layers. |
| R-11 | PASS: Existing graph beads, toolbar and field shapes retained. |
| R-12 | PASS: No new elevation/shadows. |
| R-13 | PASS: No new glow. |
| R-14 | PASS: No repeated feature-card layout added. |
| R-15 | PASS: Control labels identify graph mode and operation. |
| R-16 | PASS: No promotional copy added. |
| R-17 | PASS: Check counts come from validator output. |
| R-18 | PASS: No testimonials introduced. |
| R-19 | PASS: Sun/moon motion explicitly requested; off/low/reduced tested. |
| R-20 | PASS: Vertex coverage and theme sun/moon remain product-specific. |
| R-21 | PASS: Both themes exercised. |
| R-22 | PASS: No generic illustration introduced. |
| R-23 | PASS: User authorized the mode switch and theme ornaments; inline SVG only. |
| R-24 | PASS: No navigation destinations changed. |
| R-25 | PASS: Switch heading/surface contrast: day 7.48:1, night 6.24:1; graph labels unchanged. |
| R-26 | PASS: Native input exercises zoom, view switches, device switch, dragging and selection. |
| R-27 | PASS: Existing lazy loading and WebGL fallback retained; no new network dependency. |
| R-28 | PASS: No FAQ introduced. |
| R-29 | PASS: Uses central existing palette tokens. |
| R-30 | PASS: No borrowed application layout introduced. |
| R-31 | PASS: Larger hit targets serve touch; depth retention serves rotated dragging; tapered rays depict sunlight. |
| R-32 | PASS: Native switch button and existing visible keyboard focus retained; prior zoom keyboard suite rerun. |
| R-33 | PASS: Changes live in source modules/CSS/SVG; no runtime patch script. |
| R-34 | PASS: Both themes at mobile and desktop widths tested. |
| R-35 | PASS: Real Chrome CDP input and regression scripts executed; limitations recorded. |
| R-36 | PASS: No hardware performance claims; lower DPR is an implementation cap, not a benchmark. |
| R-37 | PASS: Direction recorded before edits: existing compact toolbar and palette; ENERGY2/RHYTHM2/MOTION2. |
| R-38 | PASS: No fabricated content or links. |
| R-39 | PASS: Named native buttons, ARIA switch state, existing disabled/active/focus states; motion stop respected. |
| R-40 | PASS: No media downloads; inline SVG has explicit viewBox and fixed knob dimensions. |

Liveliness PASS: graph remains the focal content; structural spacing and established motif retained; a single emphasis on the active mode. Dials and direction recorded before building.

C-1 PASS: decisions have purposes stated above.
C-2 PASS: new controls tested with native input.
C-3 PASS: no content section added.
C-4 PASS within measured widths/themes/input cases; physical Safari not assessed.
C-5 PASS: counts and limitations match validation evidence.

Resolved during requested work: SVG-level capture swallowed mouse clicks after dragging. Pointer-up selects the original ID for a tap; the following native click is suppressed to avoid double toggles. Touch and mouse tests cover this path. No unrelated redesign suggested.

Evidence: specs/006-graph-mobile/validation.md. This is a scoped review, not a guarantee that all mobile devices or every app route are bug-free. Physical Android/iPhone, Safari, pen and simultaneous multitouch were not tested.
