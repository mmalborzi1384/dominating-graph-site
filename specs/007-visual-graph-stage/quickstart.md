# Review

Run python3 -m http.server 8772 --bind 127.0.0.1 and open /?preview=graph-stage#lab.
The drawing board has a title and named tools below it. Select a vertex, zoom, switch3D,
expand and restore twice. State stays. Escape from inside restores; outside does not.
Repeat at320px and both themes. No backend, package install or build is needed.

Run node scripts/validate-graph-stage-browser.mjs plus the five graph validators listed
in plans/001-shared-graph-stage.md. Chrome and Node with built-in WebSocket are required.
See anti-slop/audit-007-graph-stage.md for measured results and test limits.
