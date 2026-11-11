# Quickstart and Validation Guide

This is a future implementation validation guide. At planning completion no website has
been built. Commands referencing proposed files become runnable after implementation.

## Prerequisites and local serving

Python 3 for a development-only static server, a modern browser, and repository files with
vendored KaTeX/Vazirmatn assets. No build, package manager or database is required for serving.
From the repository root:

```sh
python3 -m http.server 8000 --bind 127.0.0.1
```

Open http://127.0.0.1:8000/. `file://` is not supported. For a local subpath check, serve the
parent directory and open the repository-name path; verify relative JSON/font/script requests.
Production supports standard static HTTP servers, not the Python process as a required backend.

## Lightweight local validation and manual browser checks

Optional development prerequisite: Node.js 22+ to run one dependency-free content script.
No test runner, browser automation, browser-driver download or package installation is required.

```sh
node scripts/validate-content.mjs
```

The script reports 150 stable IDs, valid stage/tab references, gamma checks and reviewed
context/required figures. Execute the acceptance walkthrough manually in mobile and desktop
browsers; record browser/device, steps, actual outcomes and failures in validation evidence.
Mathematical, scoring, persistence and transfer checks use known fixtures and boundary inputs.
Run `graphify update .` after each code slice; this is separate from serving the static site.

## Acceptance walkthrough

| Scenario | Steps | Expected result |
| --- | --- | --- |
| Fresh teaching | Clear only application key; open Teaching | 0%, first stage open, later locked |
| Target-specific feedback | Submit nonminimal dominating set to dominating then minimal tasks | First accepted; second explains removable vertex before revealing solution |
| Complete stage | Pass all required activities, refresh | 25%; stage 2 open, progress shown identically in Records |
| Partial stage resume | Complete one required activity, refresh | Completion flag retained; no saved answer or selected vertices |
| Return and review | Visit a passed stage, submit wrong answer, refresh | Pass flags/percent unchanged; previously unlocked stages remain open |
| Four stages | Complete sequentially | 0→25→50→75→100, direct links never bypass locks |
| Reset cancel/confirm | Cancel reset, then confirm | Cancel leaves state; confirm gives 0%, first stage only; other tabs' records retained |
| Teaching data exclusion | Inspect localStorage/export after answers and hints | Only completion/navigation data; no teaching attempts/scores/answers/hints |
| Practice hints | Same correct set with 0–3 hints | Same base score; no teaching unlock effect |
| Competition caps | Minimum answers with 0/1/2/3 hints | 15/10/5/0; refresh does not restore cap |
| Competition bounds | Complete matches with every count 2–10; try 1/11/fraction | Valid counts equal turns; invalid counts blocked; ties share rank |
| Lab stations | Run every station with a modeled fixture | All five accessible; before/after metrics and minimal/minimum distinctions correct |
| Custom graph | Build 2 then 10 vertices, drag, edit edges | Bounds enforced; drag changes positions only; edges change evaluation |
| Multiple optimums | Submit two distinct optimal sets on same fixture | Both accepted, even if one absent from sample bank gamma_sets |
| Deadline | Start challenge, hide tab, return after 180s | No new answer accepted; completed results persisted |
| Records coverage | Repeat then delete a question attempt | Unique coverage unchanged by repetition; recomputed from remaining records after deletion |
| Transfer | Export, import into fresh browser, import again | Progress/records restored; second import idempotent |
| Deleted turn transfer | Finalize a turn, delete its result, refresh, export/import; then import an older result backup | Records shows «حذف‌شده»; turn remains spent, no answer/score restored, no dangling attempt reference |
| Text boundaries | Locally enter then import group names 30/31, labels 50/51, text answers 1000/1001 characters | Exact limit accepted; one over rejected identically with no truncation or partial save |
| Capacity boundaries | Prepare 200/201 live attempts and 100/101 sessions; also merge two individually valid backups over capacity | Limit accepted; new save or complete merge above limit rejected, existing state retained, no silent eviction |
| Bad transfer | Corrupt JSON, curriculum, score or IDs | Whole import rejected; existing state unchanged |
| Failed storage | Deny storage or fill quota, then complete action | Inline unsaved warning; no false success; in-memory work exportable |
| Theme and RTL | Review both themes at 360px/1280px | Correct math isolation, readable contrast, no overlap, keyboard-accessible controls |

Fixtures must include disconnected/edgeless graphs, isolated vertices, a minimal nonminimum
set, several optima and directed introductory models rejected by the undirected evaluator.
Cross-check small-graph results with hand-enumerated subset fixtures and the lightweight
content script; this does not require an automated test suite.

## Static hosting matrix

- GitHub Pages: publish the static repository files including `.nojekyll`; visit project
  subpath, refresh every hash tab, verify JSON/font/math assets and no root-absolute paths.
- Linux VPS: serve the same directory with Nginx or Apache as static content; no rewrite
  fallback, API process or database. Check exact filename case and MIME types.
- Windows VPS: serve the same directory in IIS; configure standard .json/.mjs (if used)/.woff2
  MIME mappings if unavailable. Repeat navigation, math/font and storage checks.

Verify localStorage scope separately per origin/base path: cross-host progress moves via
export/import, not automatic sharing. Deployment is a later authorized action, not executed
by this planning command. Record actual URLs, browsers, host settings and outcomes in the PR.

## Review gates

Human educational review confirms lesson/page accuracy, all modeling contexts, missing book
figures, APOS activity choices and text rubrics. Five-student usability check requires 4/5
to locate/answer a practice item and find its report unaided. Human PR review verifies
constitution compliance. Runtime, host and usability results remain pending implementation.

## Phase-7 review walkthrough

Run `node scripts/validate-records.mjs` for dependency-free transfer/coverage/deletion fixtures.
Serve normally and open `#records`. Check 0%/no-data in a fresh browser; record a practice,
competition and lab result and complete an APOS stage. Verify counts versus unique coverage,
lesson/APOS breakdowns and text self-assessment labels. Select rows, cancel deletion, then
confirm: only chosen results disappear, spent turns show «حذف‌شده», progress remains.

Download JSON, import it in a fresh browser, inspect preview, cancel then confirm. Repeat:
no duplicate outcomes. Import an older backup after turn-result deletion: preview suppresses
that old result. Reset teaching, then import a pre-reset backup: restoration warning and
completion union must appear. Try corrupt/oversized/1.1 files and conflicting IDs: no write.
Check name 30/31, label 50/51, response 1000/1001, results 200/201, sessions 100/101; limits
apply to merged totals as well. Change storage after preview: confirmation must be rejected.
For quota failure, preserve disk and export current temporary work, then retry after recovery.
Review 360px/1280px and both palettes. Actual evidence/limitations are in validation/us5.md;
phase 8 release gates are not included in this phase.

## APOS redesign / curriculum 2

Run `node scripts/validate-apos.mjs`. The twelve current activities use typed temporary
responses; old scripts keep their curriculum-1 fixtures for backward compatibility. Start
fresh: 0%, Action only. Solve three activities in order per stage; expected sequence is
25/50/75/100. Try an incomplete compound response, hint then reveal: reveal alone must not
complete it. Process diagrams must not allow live coverage experiments. Randomize a whole
stage chain: temporary responses clear and completed flags stay; every card uses the same
variant. Verify keyboard/touch, both palettes and 360/1280 layouts.

Load a valid old state with completed teaching and other results: automatic one-write conversion resets only old teaching progress to 0%
and retains other records/tombstones/settings; no legacy-version flow is shown. Reload does not repeat the migration. Import
an old curriculum-1 backup into curriculum 2: preview explains zero old-progress transfer;
current new progress is not lowered. Test new backup round-trip, quota/retry, reset isolation
and exact revision conflicts. Evidence: validation/apos-redesign.md. No phase-8 gate is claimed.

### Compact-layout review

Check all five tabs at 360px and desktop in day/night. The random-question button has
intrinsic width, stage labels are short, and the mission card starts collapsed. Secondary
behavioral copy is inside an inline ⓘ disclosure, reachable by hover, click/touch, keyboard
and Escape. Essential problem/rubric/error copy stays visible. A valid old test state silently
starts the new teaching at zero, preserving other results; current progress is not repeatedly
reset. No review of this layout should be counted as completing the full question bank.
