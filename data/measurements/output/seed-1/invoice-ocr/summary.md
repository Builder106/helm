# Invoice OCR — measurement (seed=1, extractor=mock)

> ⚠️ **Mock extractor.** Field accuracy, cost, and latency numbers below are derived from a controlled-noise mock of the vision call, not real API output. Only the reconciler stats and labor model reflect actual pipeline logic. Run with `--extractor groq` for measured numbers.

> 200 invoices processed. Field accuracy 99.0%, line-item recall 98.0%. Mean cost $0.000370/invoice. Reconciler F1 0.836 (precision 0.718, recall 1.000).

## Labor model

At 6 minutes/invoice manual handling × $25/hr loaded wage, this batch would cost $500.00 in labor. Helm-routed (review only on the 39 flagged invoices, 2 min each) costs $32.50 — a 15.38× reduction.

## Extraction

| metric | value |
| --- | --- |
| parse rate | 99.0% |
| field accuracy | 99.0% |
| line-item recall | 98.0% |

## Cost

| metric | value |
| --- | --- |
| mean per invoice | $0.000370 |
| total | $0.0740 |

## Latency (per-invoice end-to-end)

| metric | value |
| --- | --- |
| p50 | 859 ms |
| p95 | 1336 ms |
| p99 | 1385 ms |

## Reconciler (anomaly-detection classifier)

| metric | value |
| --- | --- |
| true positives | 28 |
| false positives | 11 |
| false negatives | 0 |
| true negatives | 161 |
| precision | 0.718 |
| recall | 1.000 |
| F1 | 0.836 |

---

_Reproduced by_ `pnpm measure:invoice-ocr --seed 1 --extractor mock`. _The full per-invoice trace is in_ `report.json`.
