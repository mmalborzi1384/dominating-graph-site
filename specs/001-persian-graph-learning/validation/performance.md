# Phase 8 — performance / T055

2026-11-12. Intel Core i7-8650U @1.90GHz, Linux x86_64, 8 reported logical processors.
Chrome 157 headless, no CPU throttling; Node v26.5.0 supplemental domain check.
Measurements are observations on this host, not guarantees on low-end phones.

| Measurement | Dataset | Median | p95 | Maximum / result |
| --- | --- | --- | --- | --- |
| Browser exact evaluation | 200 seeded random n=12 graphs, all 4096 subsets, 32-entry cache eviction | 0.40ms | 0.70ms | 1.00ms (<100ms target) |
| Node exact evaluation | 300 seeded n=12 graphs | 0.32ms | 0.97ms | 9.36ms |
| Pointer-path geometry update | 100 accepted 12-node moveVertex calls | 0.00ms | 0.10ms | 0.30ms |
| Loaded tab first double-rAF paint opportunity | all five tabs, full motion | — | — | 22.4–33.4ms; entrance 180ms (<200ms) |

The pointer measurement covers synchronous geometry update time, comfortably within the
16.7ms budget; it **does not measure end-to-end physical input/GPU presentation**. That
full-frame timing remains a device validation limitation. No speculative evaluator cache
rewrite was justified: existing exhaustive bitmask analysis and bounded cache meet the
observed target. Geometry updates reuse nodes/edges; they never rebuild topology or enumerate
subsets during drag. Low/off motion offers a direct control for slower hardware.
Raw dataset/timings/browser details: [phase8-metrics.json](phase8-metrics.json).
