# UI contract

## Shared shell and tokens (US1, US2)
Keep five hash destinations and navigation popover behavior. Reuse central tokens in `assets/css/tokens.css`; use logical properties. Preserve theme/motion preferences. No global overflow hiding to mask defects. Main text minimum 1rem; normal text contrast >=4.5, large text >=3; controls >=44px both axes. Focus, active and disabled states must not rely solely on color. Test native and enhanced selects, opening direction and stacking after layout changes. Blur remains confined to the navigation window.

## Lab (US3)
At >=1000px: right tool column and flexible board column using minmax(0,1fr); below 1000px stack tool groups above board, using native details/summary or equivalent named buttons with expanded state. Summary below board reports actual graph only. DOM focus order follows visible RTL reading order. Preserve `#lab-drawing-board`, existing lab action IDs and data semantics. Moving/collapsing tools must not recreate controller state. If focus would be hidden, keep group open until focus leaves or move focus to its summary. No fixed bottom overlay.

## Graph (US4)
Shared renderer/selection implementation remains source of truth. Selected vertices remain solid; covered single-owner nodes retain hatching; multi-owner equal sectors retain canonical order. Uncovered feedback gets a textual/shape cue only when feedback is allowed. Respect directed edges, parallel edges and loops already supported. Rapid toggles, theme or view change and destroy cancel old visual work. Off/reduced motion instantly shows current authorized state. 3D shows the same semantic state and has a no-WebGL fallback. Do not inject coverage into a pre-prediction teaching board.

## Route (US5)
Retain lesson, unit and activity layers; draw connectors as decorative only. Current station has aria-current at the appropriate layer; completion has a tick and text; locked station has reason text. Use native buttons with existing handlers, not a second router. Do not invent shortcuts past fresh exit tasks. Only current station details expand by default; completed steps remain reviewable. Keep actual activity IDs and `#teaching-stage`.

## Hero (US6)
Retain existing five neighborhood place identities and edge list. Add a native mode control with clear current state, reversible label and textual explanation. Remove aria-hidden from any container enclosing controls; decorative SVG parts may remain hidden with a separate text equivalent. Map/graph transformation changes representation only. CTA text «شروع یادگیری گراف» links to `#teach`. SVG reserves dimensions/aspect ratio. No new persistent mode or automatic looping movement. At <=640px, title/copy precedes diagram; the diagram fits container including labels.

## Recovery and states
Loading retains reserved layout and readable status; empty explains the missing model or record with a real next action; errors retain existing retry/fallback paths. Never replace corrupt storage with a visual reset. Practice/competition scores, records import/export and lab scratch-only behavior are immutable feature boundaries.
