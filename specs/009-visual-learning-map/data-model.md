# Derived views only

Unit node: existing id/title/stageId/objective/requiredActivityIds/prerequisites plus derived
open, passed, current, completed count. Runtime DOM only, no new persistent fields.
Connection: actual prerequisite ID -> dependent ID; decorative and hidden from accessibility
when its information is already in node text. No new domain relation.
Timeline item: existing attempt ID, recordedAt, tab, question/activity, evaluation and response.
Training map: existing passedUnitIds or passedStageIds and lastVisited ID; no date field.
Import candidate, selected attempt IDs and confirmations retain existing runtime contracts.
