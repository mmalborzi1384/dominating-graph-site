# Feature Specification: APOS learning map and records ledger

Branch: `codex/visual-learning-map` | Base: `d0e3387` | Date: 2026-11-23
Status: phase 3 implemented and validated, ready for human review. Merge is not authorized.

## User stories

### US1 (P1): Find my place in the learning path
A learner sees the current lesson's ordered units, their existing APOS names and objectives,
real prerequisite connections, completed/current/available/locked text and distinct shapes.
The two lesson buttons remain. On phones the route becomes vertical in reading order.
Native unit buttons keep `data-unit-id`, disabled and `aria-current=step`; locked hash
links cannot bypass `unlockedUnits`. A connection is decorative, never a graph editor.
Current activity steps remain below the current unit, with title, completion and exit status.
Assessment, fresh exit, predictions, hint gates, manual continue and temporary answers remain intact.

Acceptance: compare count/order/state/prerequisite edges with shipped curriculum for fresh,
partial, all-complete and legacy snapshots. Test mouse, keyboard, touch and deep links.
A finite connection trace may only reflect a newly completed prerequisite; off/low/reduced
motion disable it. Rendering and unlocking never wait for animation.

### US2 (P1): Read an honest learning record
Records begin with learning completion and a compact real-attempt summary. A chronological
ledger uses each attempt's existing `recordedAt`, descending, with native answer details.
Training has a completion map only, no invented dates, saved answers or mastery claim.
Keep six-domain coverage, all current breakdowns, tab filter, selection and deleted-turn markers.
Keep accessible empty states and long Persian/math answers at 320px without page overflow.

### US3 (P1): Manage my data safely
Backup/import/recovery and selective deletion are clearly named administrative sections,
visible by default, not hidden behind a new modal or disclosure. Keep all current IDs and
inline preview/confirm/cancel, revision checks, migration/archive, retry and reset behavior.
Parse errors and quota/conflict warnings stay legible. No state/schema changes.

## Constraints
Only `teach-v3.js`, `teaching.css`, `records.js`, `records.css` and strictly necessary central
tokens; new `scripts/validate-learning-map-browser.mjs`, supporting specs/README/plans/audit.
No curriculum, questions, storage/domain, score rules, legacy teaching or renderer edits.
All learning graphs continue through existing teaching adapter and shared graph component.
Vazirmatn, KaTeX, existing day/night tokens; matte reading surfaces and no new glass/assets.
ENERGY 3 / RHYTHM 2 / MOTION 2: connected mathematical path, readable ledger, purposeful
short completion feedback. Keep approved background and navigation window unchanged.

## Success criteria
All phase-table validators compared with baseline, new data-driven browser scenarios pass,
zero introduced runtime exceptions, 320/390/768/1280 day/night and 200% text/reflow,
44px actionable targets, >=8px control gaps and measured text contrast >=4.5:1.
Disclose browser emulation vs physical hardware and existing unrelated failures honestly.
Graphify updated, focused PR and teach/records preview delivered, stop without merge/phase4.
