# Implementation plans

Generated 2026-11-20 with improve and Spec Kit. US1 execution authorized; later phases require separate authorization.

| Plan | Priority | Effort | Depends on | Status |
|---|---|---|---|---|
| [001 Interactive mathematics atlas](001-interactive-math-atlas.md) | P1 | L | reviewed current baseline | US1 ready for review; US2-US6 TODO |

Canonical Spec Kit package: ../specs/005-interactive-math-atlas/ . This handoff inlines scope, contracts, verification and tasks for an executor without chat history. Keep it synchronized with that package if the plan changes.

Order: typography -> night theme -> lab workspace -> graph feedback -> learning route -> neighborhood hero. Six separate implementation PRs, each with user review before any next phase. No implementation/commit/push/PR/merge occurred in this planning task.

## Considered and rejected

- Generic music-oriented palette/fonts from initial design-system search: product mismatch.
- New frontend framework, animation dependency, bitmap/logo, progress store: unrelated cost and scope.
- Early coverage reveal or persisted lab results: violates current learning and scratch-workspace contracts.
