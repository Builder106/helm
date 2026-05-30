# Invoice OCR — measurement (seed=1, extractor=gemini)

> 200 invoices processed. Field accuracy 77.1%, line-item recall 54.5%. Mean cost $0.000117/invoice. Reconciler F1 0.261 (precision 0.150, recall 1.000).

## Labor model

At 6 minutes/invoice manual handling × $25/hr loaded wage, this batch would cost $500.00 in labor. Helm-routed (review only on the 187 flagged invoices, 2 min each) costs $155.83 — a 3.21× reduction.

## Extraction

| metric | value |
| --- | --- |
| parse rate | 9.0% |
| field accuracy | 77.1% |
| line-item recall | 54.5% |

## Cost

| metric | value |
| --- | --- |
| mean per invoice | $0.000117 |
| total | $0.0234 |

## Latency (per-invoice end-to-end)

| metric | value |
| --- | --- |
| p50 | 309 ms |
| p95 | 4837 ms |
| p99 | 10315 ms |

## Reconciler (anomaly-detection classifier)

| metric | value |
| --- | --- |
| true positives | 28 |
| false positives | 159 |
| false negatives | 0 |
| true negatives | 13 |
| precision | 0.150 |
| recall | 1.000 |
| F1 | 0.261 |

---

_Reproduced by_ `pnpm measure:invoice-ocr --seed 1 --extractor gemini`. _The full per-invoice trace is in_ `report.json`.
