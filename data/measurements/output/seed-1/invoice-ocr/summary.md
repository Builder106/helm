# Invoice OCR — measurement (seed=1, extractor=mock)

> ⚠️ **Mock extractor.** Field accuracy, cost, and latency numbers below are derived from a controlled-noise mock of the Claude vision call, not real API output. Only the reconciler stats and labor model reflect actual pipeline logic. Run with `--extractor claude` for measured numbers.

> 200 invoices processed. Field accuracy 99.0%, line-item recall 98.0%. Mean cost $0.0102/invoice. Reconciler F1 0.800 (precision 0.703, recall 0.929).

## Labor model

At 6 minutes/invoice manual handling × $25/hr loaded wage, this batch would cost $500.00 in labor. Helm-routed (review only on the 37 flagged invoices, 2 min each) costs $30.83 — a 16.22× reduction.

## Extraction

| metric | value |
| --- | --- |
| parse rate | 99.0% |
| field accuracy | 99.0% |
| line-item recall | 98.0% |

## Cost

| metric | value |
| --- | --- |
| mean per invoice | $0.0102 |
| total | $2.04 |

## Latency (per-invoice end-to-end)

| metric | value |
| --- | --- |
| p50 | 861 ms |
| p95 | 1333 ms |
| p99 | 1377 ms |

## Reconciler (anomaly-detection classifier)

| metric | value |
| --- | --- |
| true positives | 26 |
| false positives | 11 |
| false negatives | 2 |
| true negatives | 161 |
| precision | 0.703 |
| recall | 0.929 |
| F1 | 0.800 |

---

_Reproduced by_ `pnpm measure:invoice-ocr --seed 1 --extractor mock`. _The full per-invoice trace is in_ `report.json`.
