# Implementation Plan: APOS map and ledger

Base d0e3387; static HTML/CSS and native ES modules. No install/build/new dependency.

## Constitution check
Local-only persistence untouched. All five tabs preserved. Actual curriculum prerequisites
and assessTeachingEvidence remain authoritative. Answers stay in closures, no timestamps
added. Six-domain view is the existing unique-question coverage, not a learner score.
All active contracts 002/004/005/006 reviewed; phase1 shared board and phase2 lab retained.

## Design and ownership
US1: in teach-v3.js keep stable native route buttons, an ordered list within existing nav,
labelled prerequisite connections derived from curriculum, node number/status/objective.
Use CSS logical borders for static connections, a finite trace only on newly passed units.
Update existing nodes rather than replacing focused buttons on every repository event.
Keep steps in renderActivity; title and clear current/completed/locked/exit labels.
US2: records.js derived view only: top overview, completion map by lesson, summary counts,
ordered attempt timeline with time and details, six-domain coverage. No parallel renderer.
US3: named visible management area contains current backup controls; deletion toolbar remains
beside timeline. Preserve element IDs and all callback transactions.
Scoped CSS uses existing tokens. Shapes and written statuses distinguish lock/done/current.
Mobile route vertical; desktop ordered horizontal path. Long copy wraps fully, not truncated.

## Evidence and validation
Run six existing phase commands before changes. New CDP harness follows existing APOS
browser fixture setup with in-memory storage and isolated Chrome, not personal localStorage.
Exercise real native events and imports, snapshots before/after cancellation/deletion.
Baseline and final evidence in quickstart.md, screenshots in /tmp and live static preview.
Use SPECIFY_FEATURE_DIRECTORY=specs/009-visual-learning-map with NO_PERSIST=1.
No extension hooks file at base. Keep local .specify feature settings unchanged.

## Sequence
Contract/baseline -> US1 route and steps -> Graphify/checks -> US2/US3 ledger and controls
-> Graphify/checks -> responsive/a11y/fixtures -> antislop gate -> focused PR and stop.
No parallel agent work is requested. Each story is independently browser-testable.
