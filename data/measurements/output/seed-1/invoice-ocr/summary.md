# Invoice OCR — measurement (seed=1, extractor=groq)

_Model: Llama 4 Scout via Groq (meta-llama/llama-4-scout-17b-16e-instruct)._

> 200 invoices processed. Field accuracy 94.4%, line-item recall 89.6%. Mean cost $0.000142/invoice. Reconciler F1 0.326 (precision 0.194, recall 1.000).

## Labor model

At 6 minutes/invoice manual handling × $25/hr loaded wage, this batch would cost $500.00 in labor. Helm-routed (review only on the 144 flagged invoices, 2 min each) costs $120.00 — a 4.17× reduction.

## Extraction

| metric | value |
| --- | --- |
| parse rate | 35.0% |
| field accuracy | 94.4% |
| line-item recall | 89.6% |

## Cost

| metric | value |
| --- | --- |
| mean per invoice | $0.000142 |
| total | $0.0285 |

## Latency (per-invoice end-to-end)

| metric | value |
| --- | --- |
| p50 | 160 ms |
| p95 | 8583 ms |
| p99 | 8950 ms |

## Reconciler (anomaly-detection classifier)

| metric | value |
| --- | --- |
| true positives | 28 |
| false positives | 116 |
| false negatives | 0 |
| true negatives | 56 |
| precision | 0.194 |
| recall | 1.000 |
| F1 | 0.326 |

---

_Reproduced by_ `pnpm measure:invoice-ocr --seed 1 --extractor groq`. _The full per-invoice trace is in_ `report.json`.
