---
name: project-workflow
description: Working agreement for graph-site changes, review boundaries, and regression checks.
---

# Graph-site workflow

1. Read repository `AGENTS.md`, `.specify/memory/constitution.md`, and the active feature's
   `spec.md`, `plan.md`, and `tasks.md`. User instructions override older repository rules.
2. Query the knowledge graph before code exploration when `graphify-out/graph.json` exists.
   Read only the owning sources located by the graph or previous reads.
3. Record the requested behavior and affected surfaces before editing. Keep UI, content,
   pure evaluation and local persistence separate. Preserve question IDs, scoring and
   saved data unless the requested change explicitly covers them.
4. Use existing theme/font/motion tokens. Test Persian RTL, math, both themes, mobile,
   keyboard and touch. Keep keyboard focus visible when removing touch-only feedback.
5. Run the relevant Node validators and real browser checks. Browser fixtures are not
   evidence of learner mastery. Record actual results and limitations, never invented passes.
6. Update the knowledge graph after code changes and keep instructions/review evidence current.
7. Provide a preview and focused PR when that is the agreed review workflow. Never merge
   without explicit human authorization; stop at the requested phase/review boundary.

The active APOS contract is under `specs/002-apos-teaching-v11/`.
The navigation/lab follow-up contract is under `specs/003-lab-navigation/`.
Use `README.md` for content editing, migration and validation commands.
