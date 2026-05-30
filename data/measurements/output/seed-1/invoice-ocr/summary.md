# Invoice OCR — measurement (seed=1, extractor=gemini)

> 200 invoices processed. Field accuracy 91.9%, line-item recall 84.1%. Mean cost $0.000298/invoice. Reconciler F1 0.776 (precision 0.667, recall 0.929).

## Labor model

At 6 minutes/invoice manual handling × $25/hr loaded wage, this batch would cost $500.00 in labor. Helm-routed (review only on the 39 flagged invoices, 2 min each) costs $32.50 — a 15.38× reduction.

## Extraction

| metric | value |
| --- | --- |
| parse rate | 99.0% |
| field accuracy | 91.9% |
| line-item recall | 84.1% |

## Cost

| metric | value |
| --- | --- |
| mean per invoice | $0.000298 |
| total | $0.0595 |

## Latency (per-invoice end-to-end)

| metric | value |
| --- | --- |
| p50 | 3115 ms |
| p95 | 9298 ms |
| p99 | 15525 ms |

## Reconciler (anomaly-detection classifier)

| metric | value |
| --- | --- |
| true positives | 26 |
| false positives | 13 |
| false negatives | 2 |
| true negatives | 159 |
| precision | 0.667 |
| recall | 0.929 |
| F1 | 0.776 |

---

_Reproduced by_ `pnpm measure:invoice-ocr --seed 1 --extractor gemini`. _The full per-invoice trace is in_ `report.json`.
