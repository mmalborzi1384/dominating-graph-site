# Fifteen browser comments — controls and publication copy

2026-11-12. Same PR9, no merge/publication. Current code supersedes earlier screenshots.

| Comments | Delivered |
| --- | --- |
| 1 | Clinic label y31→43, SVG viewBox height230→250, keeping the label below the node |
| 2–3 | Removed lesson-reference note and both noninteractive lesson cards from shared shell |
| 4,6,7 | Removed “ready for review”, duplicate source-bank disclosure and development fallback copy; shared title is گراف و مدل‌سازی. Full original task remains visible in each prompt; actual source figures/answers retained |
| 5 | Glass day/night switch, sliding sun/moon, correct switch checked state and existing persisted theme |
| 8 | Brand edges draw and nodes pulse once at full motion; no indefinite animation |
| 9,14 | All single selects become in-page glass listboxes; long lists searchable, theme scrollbars, disabled/current choice synchronized; no modal/browser selection window |
| 10 | No rectangular SVG focus outline; circular keyboard focus and canonical selection/coverage paint retained |
| 11 | Theme-based checkbox/radio, touch-sized containing labels; existing four-level motion rail retained |
| 12 | Grouped transfer actions, Persian file-picker label over the native file input, ordered recovery controls; inline confirm/import behavior unchanged |
| 13 | Inline short math no overflow scrollbar; display/long content keeps appropriate theme scrolling; KaTeX structure intact |
| 15 | Four result actions in a desktop row/mobile2-column grid, compact content-width shared buttons, ≥44px hit targets |

## Validation actually performed

Chrome157, Linux, emulated360/1280 CSS widths, day/night. Twenty views and **53 checks**:
all five tabs, touch opening, listbox inside viewport, search selectingQ048, keyboard arrow/
Enter/Escape and focus return, theme switch/checked state, transfer grouping, four lab actions,
inline K3,3 math, no duplicate native interaction and reduced-motion0 running animations.
No document horizontal overflow or JavaScript exceptions. Separate Records transfer views
checked both widths. Gallery contains actual day mobile header and desktop open listbox.
The test originally focused a hidden destination tab too early; sequencing was corrected
and the final uninterrupted full run passed. No product issue was hidden by that test fix.

Existing checks still pass: foundation104, Records90, APOS245, Practice37 (126 connected),
Lab211, competition174, random94, preference42 and full150-ID content audit.
Final file-picker presentation preserves the native file field and the same change handler;
no storage schema, response evaluation or question permissions changed. The custom control
keeps native select values/change events for domain controllers while hiding native menus.

Keyboard contract: trigger Enter/Space or arrows opens; selected option/arrow focus, Home/End,
Enter selection, Escape close/return, Tab exit. Long lists have a labeled search. Menus close
on outside pointer, focus leaving, tab switch, disabled source or controller replacement.
Select re-render observers are disconnected when source controls leave the document.

Physical phones, Firefox/WebKit and independent human educational review remain unobserved;
this visual polish does not relabel them passed. No new production dependency/build is added.
