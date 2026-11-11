# US5 / Phase 7 — Records, coverage and transfer

Date: 2026-11-11. Implementation scope: T046–T052 only. Human review is pending;
no phase-8 content, accessibility/browser matrix, deployment or usability gate is completed.

## Implemented behavior

- Teaching completion/percent/continue and separately confirmed reset; no teaching attempts,
  answers, scores or hint history. Practice/competition/lab history includes outcomes, hints,
  scores, self-assessment labels, question/group/date and collapsible response details.
- Per-tab/lesson/APOS aggregates; unique question count separate from attempt count. Six
  coverage denominators use all 150 source IDs, not only ready exercises. Untagged custom
  activity contributes only activity totals. No personality or educational-growth claim.
- Selected deletion previews affected result/turn counts, supports cancel and checks revision.
  Only selected Attempts disappear; game/challenge/competition turns retain spent tombstones.
  Scores, coverage and rankings use remaining results; teaching state is preserved.
- UTF-8 JSON download, strict complete-file parse, deterministic complete-candidate merge and
  inline preview/confirm/cancel. Same shared schema/normalization/capacity before and after
  merge; one-key commit. Preview contains added/duplicate/suppressed results, sessions and
  completion restoration. Current local settings/location win except for an empty initial
  profile. Fresh profile restores imported settings/location.
- Same-turn deletion beats old finalization in either direction. Conflicting stable content,
  changed identity/schedule, two unfinished same-kind sessions and incompatible versions
  reject the entire import. Finish the local activity before resolving active-session conflict.
- Version decision: bank 1.2 only. Bank 1.1 is explicitly rejected without reinterpretation
  because reference answers changed; original file remains available for reviewed migration.
- Corrupt/unsupported disk is not overwritten. Unsaved valid memory can be exported; raw disk
  recovery, retry and confirmed reload remain available. No new persistent schema fields.

## Dependency-free local verification

`node scripts/validate-records.mjs`: **90 checks passed**. Fixtures cover:

- Empty and populated round trips; repeat import; teaching union, prefix/location/theme policy,
  reset-backup restoration preview; no revision/teaching response export.
- Unique six-sahat coverage, repeated question, untagged custom activity; optional absent scores
  derived correctly; imported selection scores recomputed and competition hint caps preserved.
- Corrupt JSON, unsafe keys/markup, unknown fields/IDs/version/timestamp, impossible APOS prefix,
  conflicting stable IDs, active sessions, broken references and deleted-turn context mismatch.
- Shared local/import limits: 30/31 name, 50/51 label, 1000/1001 text (including Unicode code
  points), 200/201 live results and 100/101 sessions; merged totals over capacity rejected.
- Selected deletion isolation, null tombstone pointer, spent no-replay and old-backup precedence
  in both directions, including competition and lab; expired unanswered turns stay pending.
- Stale confirmation, preview/cancel no-write, one-write confirm, injected storage write failure,
  old-disk preservation, valid unsaved recovery export and retry.

Existing foundation (104), teaching (46), practice (37), competition (174), random-selection
(136) and lab (211) checks also passed. These are lightweight development scripts; no Node
runtime, runner, Playwright package, build step or server API is added to the product.

## Browser verification

Actual Chrome headless browser with isolated `/tmp/phase7-chrome` profile and static HTTP
server. Native DevTools protocol was used for browser interactions, file-input selection,
download and screenshots; no browser driver/test framework was installed. This is developer
browser verification, not a claim of physical-phone or participant testing.

- **30 flow/layout checks passed**, no runtime exceptions. Fresh no-data; five fixture results
  from all three recorded tabs and 25% teaching progress; selected delete cancel/confirm;
  visible deleted marker; progress preserved; malformed file; import preview without mutation;
  cancel; older-result suppression; repeat idempotence; tab filter; refresh persistence;
  isolated teaching reset; old-backup completion restoration warning; fresh-profile import.
- **20 boundary/transfer checks passed** through the actual file input: exact/one-over name,
  label, response, result/session counts and 5 MiB byte size; invalid files left state unchanged;
  stale preview after a settings write rejected; downloaded JSON format/revision exclusion.
- A separate live-browser check passed for KaTeX title and construction-target rendering with LTR isolation.
- Responsive screenshots at **360×900** and **1280×900**, **day and night**: no horizontal
  overflow, readable populated history rows, intrinsic desktop buttons / full-width mobile
  controls, glass cards. Visual inspection caught raw TeX in bank titles; titles now render
  with shared KaTeX and target formulas use isolated LTR spans. Screenshots kept in /tmp during
  review; no synthetic user data is added to the repository.

Physical mobile, Firefox/WebKit, screen-reader testing, full-bank educational review and
external-host deployment of this phase are not verified here. They remain later release
work; local success is not an approval or authorization to merge/publish.
