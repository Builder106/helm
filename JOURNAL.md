# JOURNAL — Helm

> Dated log of decisions, pivots, incidents, and quotes. Add entries as
> things happen — retrospectives need this raw material to land.
> Reverse-chronological; one paragraph max per entry.

## 2026-05-28 — Project kickoff #milestone #decision

Helm claims AI_ML slot 1 of 3. Scoped against five Handshake postings (Smart Circle, FHI Heat, Source Creative, BIOMED, Equitar); Helm directly targets the first three, which all describe the same SMB-back-office shape. Locked the four sub-features as the contract (AP invoice OCR, creator payout reconciler, Tier-1 customer service, cross-company KPI Q&A). Lane committed: agent/automation, not applied ML — that's slot 2's job (GLP-1 outcomes predictor). Stack locked to Node + Express + React + Chart.js + Anthropic SDK + MCP, matching the FHI Heat posting verbatim. Repo named *Helm* for the ship-steering metaphor and to match the user's existing single-word naming style (Halberd, Quarry, EconOS).

## 2026-05-28 — Headline finding is a contract, not a sketch #decision

Wrote into `CLAUDE.md` that the README banner finding must be backed by a re-runnable measurement script under `data/measurements/`. This is the anti-AI-slop guardrail that matters most: portfolio repos in this space tend to claim outcomes their code can't reproduce, and the user's portfolio bar (CapitolAlpha's "+2.58% Jensen's alpha, p < 0.05") is set higher than that. Every README number traces to a measurement file or it is not allowed in the README.
