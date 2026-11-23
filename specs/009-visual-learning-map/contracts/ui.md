# UI contract

Preserve .apos3-lessons button[data-lesson-id], .apos3-units button[data-unit-id],
.apos3-step-route button, #teaching-stage data attributes and #learning-activity-heading.
Lesson order and unit order follow curriculum.lessons/unitIds. Locked buttons disabled.
Exactly one aria-current=step unit and one activity step while an activity is shown.
Navigation buttons retain focus across unrelated progress/settings events. Fresh-exit and
success never auto-advance. Current/completed/locked are text plus shape, not color alone.
Map completion animation consumes no answer data and cannot enable a destination.

Records preserve all records-* action IDs, records-list, records-filter, inline confirmation
IDs, archive/migration IDs. New .records-timeline is ordered newest first with semantic time.
A title and visible label identify filter and deletion. Backup/recovery visible in management.
All existing metrics/breakdowns/six domains remain; no laboratory new scores or writes.
