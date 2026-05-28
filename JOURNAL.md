# JOURNAL — Helm

> Dated log of decisions, pivots, incidents, and quotes. Add entries as
> things happen — retrospectives need this raw material to land.
> Reverse-chronological; one paragraph max per entry.

## 2026-05-28 — AP invoice OCR pipeline scaffolded with mock extractor #milestone #decision

Sub-feature 1 reaches end-to-end-runnable in mock mode. Pipeline: PDF render (Playwright) → mock vision extraction (label + controlled noise) → Zod validation → reconciliation (math + anomaly flags) → measurement script with per-invoice traces + a headline block. Measurement output for seed=1 lives under `data/measurements/output/seed-1/invoice-ocr/`. Architectural choice worth flagging: the extractor is an `Extractor = (pdfPath) → Promise<ExtractionResult>` interface with two implementations (`createMockExtractor` ships today, `claudeExtract` will plug in later) so swapping in real Claude is a one-line change in the measurement script's `buildExtractor`. **The summary.md and headline numbers carry a "mock extractor" warning banner when running with the mock so the README can't accidentally quote simulated numbers as real ones.** This matters because the README headline finding is a contract per [`CLAUDE.md`](CLAUDE.md). User explicitly chose mock-first to validate the pipeline scaffolding without spending API budget — the swap to real Claude is the gating event for the headline finding.

## 2026-05-28 — Synthetic-data generators landed (seed=1 committed) #milestone #decision

Three generators built and seed=1 fixture committed (commit `aa5e9d5`). Architectural call worth flagging: the creator-payout policy lives in **two** files — `orders/policy.md` (the natural-language version Claude reads) and `orders/policy.ts` (the programmatic mirror that produces ground-truth payouts for measurement). They must move together; the deterministic re-computer in policy.ts IS the ground truth Claude is scored against. Caught one generator bug mid-verification: the duplicate-invoice-number anomaly was collapsing all six duplicates onto the same source number (one invoice number appearing seven times). Fixed by picking randomly from the issued-list rather than always reusing the first issue. Lesson: verify fixture distribution, not just fixture counts — the count looked right but the underlying structure was wrong.

## 2026-05-28 — Project kickoff #milestone #decision

Helm claims AI_ML slot 1 of 3. Scoped against five Handshake postings (Smart Circle, FHI Heat, Source Creative, BIOMED, Equitar); Helm directly targets the first three, which all describe the same SMB-back-office shape. Locked the four sub-features as the contract (AP invoice OCR, creator payout reconciler, Tier-1 customer service, cross-company KPI Q&A). Lane committed: agent/automation, not applied ML — that's slot 2's job (GLP-1 outcomes predictor). Stack locked to Node + Express + React + Chart.js + Anthropic SDK + MCP, matching the FHI Heat posting verbatim. Repo named *Helm* for the ship-steering metaphor and to match the user's existing single-word naming style (Halberd, Quarry, EconOS).

## 2026-05-28 — Headline finding is a contract, not a sketch #decision

Wrote into `CLAUDE.md` that the README banner finding must be backed by a re-runnable measurement script under `data/measurements/`. This is the anti-AI-slop guardrail that matters most: portfolio repos in this space tend to claim outcomes their code can't reproduce, and the user's portfolio bar (CapitolAlpha's "+2.58% Jensen's alpha, p < 0.05") is set higher than that. Every README number traces to a measurement file or it is not allowed in the README.
