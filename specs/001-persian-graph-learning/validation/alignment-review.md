# Seven browser comments — switch, labels, response spacing and math

2026-11-12, same PR9, no merge/publication.

- Removed the switch's outer glass container/border/shadow. The single visible track is
  84×50px; the neighboring motion rail is50px high. Its button keeps switch semantics,
  accessible name, keyboard/touch hit area and persisted theme.
- Practice response is a flex column with12px gap; the rubric/reveal control has margin0
  and no longer touches the textarea. Question card and response panel also have spacing.
- All vertex labels use shared x0/y0, central dominant baseline, middle text anchor and LTR
  isolation; no hardcoded baseline shift. This applies to source letters and Persian numbers,
  both ordinary and selected bold paint. Graph geometry/selection/hatching remain unchanged.
- Custom select values **and menu options** use the same safe KaTeX/text renderer as tasks.
  Native option values/change contracts remain. The accessible combobox name references
  the field label and rendered selected content (including MathML); TeX is not an aria-label.
- Removed the Q141 version/repository-difference notice. Its site adapter now asks about
  this product's actual five-graph/three-minute challenge: quality scores0/5/10/15, no speed
  bonus, results available in Records/Lab, deleted turns remain spent. Scenario/hints/rubric
  agree. Raw source-bank Q141 stays unchanged for provenance; adaptation reason lives only
  in content metadata/docs. This resolves the visible source/product conflict without
  displaying migration/version-development prose to learners.

## Observed checks

Chrome157 on Linux, emulated360/1280 CSS viewports, day/night: **69 checks,20 tab views**,
zero JavaScript exceptions and no horizontal overflow. For Q001's x/y/z/w, automatic Q048
Persian numbers, and Q141/Q142 a/b/c/d/e/f diagrams, SVG label bounding-box center is within
0.6 SVG units of the vertex center, including selected labels. Both ordinary and bold
states were checked. Q142 gamma renders in both selected trigger and the open menu;
KaTeX is LTR and no raw delimiters remain visible. Response control gap is at least10px.
Switch border is0px and height equals the motion rail in all size/theme/tab views.
Reduced-motion leaves0 running animations. Actual screenshots accompany this report.

Existing local checks passed: foundation104, Practice37, APOS245, Lab211, Records90,
competition174, random94, motion42, and full150-ID content audit. No storage/evaluation
changes. Graphify updated after the code slice. These are Chrome emulations; physical
phones/Firefox/WebKit and independent educational review are not claimed.
