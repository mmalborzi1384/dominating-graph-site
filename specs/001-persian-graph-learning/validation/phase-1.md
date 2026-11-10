# Phase 1 shell validation

Date: 2026-11-10. Scope explicitly limited by the user to infrastructure, shell, five tab
destinations and day/night appearance. No exercise, scoring, APOS progression, competition,
records analysis, import/export or interactive lab implementation has been started.

## Delivered tasks

T001–T005 complete: static Persian RTL entry/module, local vendor assets, central theme/font
tokens and responsive styles, editable shell text and README. The requested shell navigation
and theme bootstrap use `assets/js/ui/tabs.js` and `assets/js/theme.js`; the full foundation
T013 remains unchecked until repository integration. Only a versioned, base-path-scoped
shell theme setting is persisted. Its later migration is documented in README.

## Vendor evidence

- KaTeX 0.19.1 from the official package distribution. Upstream package SHA-512 integrity
  verified before extracting browser assets/fonts; per-file SHA-256 and MIT license retained.
- Vazirmatn v33.003 official upstream WOFF2; per-file SHA-256 and SIL OFL 1.1 retained.
- Exact provenance files: `assets/vendor/katex/PROVENANCE.md` and
  `assets/vendor/vazirmatn/PROVENANCE.md`. No package installation/runtime CDN dependency.

## Browser observations

Reviewed with installed Chrome in a temporary headless profile via its DevTools interface;
screenshots were visually inspected at 1280px desktop and 360px mobile-emulated width.
This is browser inspection, not a project test suite or a real handheld-device certification.
No browser driver or automation framework was added to the repository.

| Check | Observed result |
| --- | --- |
| Root static preview | HTTP server at 127.0.0.1:8765 serves entry, modules, JSON and fonts |
| Five tabs | teach/practice/competition/records/lab each show exactly one matching panel and one selected tab |
| Placeholders | Each panel explicitly says its workflow is not active; no fake progress, scores or actionable exercises |
| History | Back returns to #practice and forward to #records after navigation |
| Keyboard | ArrowLeft advances visually left in RTL; Home focuses #teach, End focuses #lab |
| Skip link | Focus moves to main-content without changing the current #lab destination |
| Theme | Day/night switch works; night survives reload and button says «حالت روز» |
| Scope of persistence | Only graph-learning:shell:v1:<base-path> theme preference created |
| Mobile width | innerWidth=360, document scrollWidth=360, tab targets about 62x66 CSS px |
| Local typography/math | Vazirmatn font loaded; KaTeX rendered all five cover-formula spans |
| Resource behavior | No failed HTTP requests, external asset requests or browser runtime exceptions in root checks |
| Subpath | /dominating-graph-site/#lab on parent-directory static server restores correct panel; font/math/JSON load with no asset errors |
| Failed write | Simulated setItem exception leaves visual toggle working and exposes an inline unsaved warning |
| Corrupt setting | Invalid stored JSON is preserved; day fallback/toggle work in memory and warning is visible |

Screenshot artifacts from the review environment: `/tmp/graph-shell-desktop-day.png`,
`/tmp/graph-shell-desktop-night.png`, `/tmp/graph-shell-mobile-day.png`,
`/tmp/graph-shell-mobile-night.png`. These temporary files are not product runtime assets.

## Local checks

- Entry HTML parsed: exactly five tabs and five panels, no duplicate IDs, local referenced
  styles/scripts/font files all exist.
- Editable shell JSON parses; local KaTeX CSS font URLs resolve.
- `node --check` passes for app.js, theme.js and ui/tabs.js.
- Hex colors are confined to tokens.css in first-party styles.
- Calculated normal-text contrast: day minimum 5.65:1 and night minimum 6.11:1 across
  ink/muted/heading/error on their paper/surface backgrounds; all exceed 4.5:1.
- `git diff --check` passes.
- `graphify update .` completed after each code slice; latest result 466 nodes / 675 edges.
  Font/binary/unsupported-file extractor warnings are expected; supported AST sources rebuilt.

## Review boundary

No real GitHub Pages, Linux VPS or Windows IIS deployment was performed. Firefox/WebKit and
physical-device checks are pending. Human appearance review is pending. Work stops at this
boundary as requested; later tasks remain unchecked. No PR was merged or site published.
