# Invoice OCR — measurement (seed=1, extractor=gemini)

> 200 invoices processed. Field accuracy 0.0%, line-item recall 0.0%. Mean cost $0.000000/invoice. Reconciler F1 0.246 (precision 0.140, recall 1.000).

## Labor model

At 6 minutes/invoice manual handling × $25/hr loaded wage, this batch would cost $500.00 in labor. Helm-routed (review only on the 200 flagged invoices, 2 min each) costs $166.67 — a 3× reduction.

## Extraction

| metric | value |
| --- | --- |
| parse rate | 0.0% |
| field accuracy | 0.0% |
| line-item recall | 0.0% |

## Cost

| metric | value |
| --- | --- |
| mean per invoice | $0.000000 |
| total | $0.0000 |

## Latency (per-invoice end-to-end)

| metric | value |
| --- | --- |
| p50 | 213 ms |
| p95 | 303 ms |
| p99 | 819 ms |

## Reconciler (anomaly-detection classifier)

| metric | value |
| --- | --- |
| true positives | 28 |
| false positives | 172 |
| false negatives | 0 |
| true negatives | 0 |
| precision | 0.140 |
| recall | 1.000 |
| F1 | 0.246 |

---

_Reproduced by_ `pnpm measure:invoice-ocr --seed 1 --extractor gemini`. _The full per-invoice trace is in_ `report.json`.
