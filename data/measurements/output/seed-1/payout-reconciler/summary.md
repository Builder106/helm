# Creator Payout Reconciler — measurement (seed=1, extractor=gemini)

_Model: Gemini 3.1 Flash Lite via Google AI Studio._

> 50 creators reconciled. Exact-match rate **6.0%**, field accuracy **54.1%**, status classification **98.0%**. Total payouts reconciled: $14183.84 (ground truth: $15645.84; max single-creator drift $285.48). Mean cost $0.000237/creator.

## Labor model

Hand-reconciling each creator's payout from CSV + policy takes ~3 min at $25/hr; Helm reduces that to ~1 min review on discrepancies only. Manual baseline cost: $62.50; Helm-routed: $19.58 — a 3.19× reduction.

## Reconciliation quality

| metric | value |
| --- | --- |
| parse rate | 98.0% |
| exact-match rate | 6.0% (3 / 50) |
| field accuracy | 54.1% |
| payout_status correct | 98.0% (49 / 50) |
| total $ reconciled | $14183.84 |
| max creator drift | $285.48 |

## Cost & latency

| metric | value |
| --- | --- |
| mean cost / creator | $0.000237 |
| total cost | $0.0118 |
| p50 latency | 1419 ms |
| p95 latency | 9536 ms |

---

_Reproduced by_ `pnpm measure:payout-reconciler --seed 1 --extractor gemini`. _Per-creator trace is in_ `report.json`.
