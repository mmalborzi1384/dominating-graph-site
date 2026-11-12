# Phase 8 — static deployment / T056

2026-11-12. No branch merge or external publication was performed.

| Environment | Actual evidence | Status |
| --- | --- | --- |
| Local repository root | Chrome loads all five panels/local font/math/JSON | Pass |
| Local project subpath `/dominating-graph-site/` | 76 static file requests, all HTTP 200; same files | Pass |
| Existing GitHub Pages | [current site](https://mmalborzi1384.github.io/dominating-graph-site/) HTTP 200; phase-8 stylesheet absent, as expected before merge | Current main reachable; this branch not published |
| Linux Nginx/Apache | Copy-only/root/index/MIME instructions prepared in README | Actual target server not available; untested |
| Windows IIS | Copy-only/default-document/MIME instructions prepared in README | Actual target server not available; untested |

Relative module, CSS, JSON and vendor URLs work at the local project prefix. Native browser
module and application/current-bank backup behavior was verified at root; subpath requests
were additionally checked without a backend/rewrite. No package install/build/CDN/database
was introduced. All user persistence uses the existing localStorage envelope.

Read-only Pages API/source metadata and public HTTP check were collected; no Pages settings
were changed. This PR requires review/merge before its files can appear on main-based Pages.
Deployment readiness still depends on content/human/browser gates in release.md. An existing
Pages 200 response is not evidence that the new branch passed target-host checks.
