# Shared graph stage

Phase 1 authorized 2026-11-21. One matte frame with optional plain text title (fallback:
existing SVG accessible name), tool groups below the drawing, inline expanded working view.
P1 acceptance: 2D/3D, zoom and input controls usable at 320px; keyboard and touch.
P1 acceptance: two expand/restore cycles preserve selection, zoom and renderer identity.
Escape acts only inside the expanded frame and returns focus to its button.
P1 acceptance: independent boards, clean teardown, existing lazy loading and WebGL fallback.
Verify both themes at 320/390/768/1280, reduced motion and enlarged text.
No modal, domain, storage, APOS, scoring, topology or renderer change. No phase 2.

## Explicit review follow-up, 2026-11-21

User expands scope to navigation: move existing day/night and motion controls inside the
selected small navigation window, refine its visual hierarchy. Keep five graph routes,
nonmodal behavior, focus return and all settings persistence. No new graph engine.
Additional files: index.html, assets/js/ui/navigation.js, assets/css/navigation.css,
scripts/validate-navigation-lab-browser.mjs and focused navigation preferences test.
