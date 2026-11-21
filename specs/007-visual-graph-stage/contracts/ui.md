# UI contract

attachGraphView(svg, options = {}) accepts optional plain text title; old calls valid.
Named group contains original viewport, existing 3D host, toolbar and status.
Focus button aria-expanded and aria-controls reflect inline expansion. Scoped keydown
Escape returns focus to that button. No global listener or persistent state.
Existing pressed/checked states and accessible names remain intact. destroy unwraps
original viewport and removes its new listener, observers and renderer.
