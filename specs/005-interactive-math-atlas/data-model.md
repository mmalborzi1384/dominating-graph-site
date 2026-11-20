# Presentation data model

No persisted schema change, migration or new localStorage key.

| Entity | Fields and source | Constraints |
|---|---|---|
| GraphPresentation | existing graph, places, selectedIds; current renderer | vertex/edge identity and topology unchanged |
| CoveragePresentation | owners and uncoveredIds from existing authorized feedback | never derive hidden solutions in UI; preserve canonical owner order |
| ViewMode | existing 2D/3D toggle | same selection/model; failed WebGL returns to 2D |
| LabToolState | existing station, editMode, pending vertex; expanded tool groups | transient only; resize/collapse must not reset graph or selectedIds |
| LearningStation | existing lesson/unit/activity ids; locked/current/completed | derive from existing progress helpers, never create another progress store |
| HeroMode | map or graph | transient; same five places and same edges; no scoring/persistence |
| Appearance | existing day/night and off/low/medium/full | OS reduced-motion overrides animation, not content |

Transitions: hero map <-> graph; selected <-> unselected updates state before motion; allowed reveal enables coverage without changing answers; tool expanded <-> collapsed retains state; route activation delegates to existing navigation and unlock checks. Empty/loading/error are explicit view states, not invented domain records. Leaving a tab cancels pending effects; later renders derive from authoritative current state.
