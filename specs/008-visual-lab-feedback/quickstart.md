# Validation

Use modern Node with native WebSocket and local Chrome. No installation or build.

Run node scripts/validate-lab-stage-browser.mjs for the new real lab workflows and
node scripts/validate-{lab,practice,competition}.mjs separately for existing domain checks.
Run the mobile, hatching and stage browser validators listed in plans/002-lab-feedback.md.
They create isolated temporary browser profiles. Do not clear personal browser data.

Serve the phase checkout with python3 -m http.server 8773 --bind 127.0.0.1 and open
http://127.0.0.1:8773/#lab. Open Build for a prepared/custom/n-gamma model; Change for
movement and edge editing; Check for coverage, free hint and minimum sets. Check an
empty selection, then choose centers and verify stale rings disappear. Toggle 3D and
change an edge to inspect retained view/zoom. Compare mobile and desktop, both themes.

The Delivery Gate records actual results and limitations. Stop at PR review, no merge.
