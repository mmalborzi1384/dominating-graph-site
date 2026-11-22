# UI contract

- lab-tools-build/change/review are native details with stable identity across edits.
- Existing station, build/load/draw, mode, move/edge, check/hint/solutions/clear IDs remain.
- One lab-notice polite live region follows the board. No automatic answer disclosure.
- update(selected,{diagnostics:{missed:[],removable:[]}}) is opt-in. Legacy missed/hinted
  options remain unchanged. Both renderers display a solid uncovered ring/! or dashed
  removable ring/minus. Full text key and accessible vertex names explain the symbols.
- svg.graphView.getState()/restoreState(snapshot) is transient adapter support. destroy
  removes the property, listeners/observers and GPU resources through existing cleanup.
- Input, keyboard and text selection outside the graph remain native. The lab does not
  call repository writes; practice, teaching and competition retain prior policy.
