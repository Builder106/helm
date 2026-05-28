# Helm — scope lock

This document freezes what Helm is and is not. See [`CLAUDE.md`](../CLAUDE.md) at the repo root for the operational guide; this file is the durable scope contract.

## One-line pitch

A Claude + MCP executive co-pilot that runs four real back-office workflows for a small-and-mid-market business, with measured cost and accuracy per workflow.

## The four sub-features (contract)

### 1. AP Invoice OCR pipeline

**Input.** A directory of invoice images/PDFs from heterogeneous vendors with varied layouts (synthetic, generated locally).

**Output.** A normalized `invoices.jsonl` with one record per invoice: vendor, invoice number, line items (description, qty, unit price, total), subtotal, tax, total, due date. Plus an `anomalies.jsonl` for invoices where the line-item math doesn't reconcile or a field is missing.

**Workflow.**
1. Watch a folder; for each new file, call Claude vision with a structured-extraction prompt.
2. Validate the extracted JSON against a Zod schema.
3. Compute reconciliation: `sum(line_items) + tax ?= total`. Flag mismatches.
4. Push valid invoices to a Postgres `ap_invoices` table; emit anomalies to a review queue.

**Measurement.** On a 200-invoice labeled holdout:
- **Line-item accuracy** (exact match per field, micro-averaged): target ≥ 95%.
- **Cost per invoice** in USD (Anthropic input + output tokens × current pricing).
- **p50 / p95 latency** end-to-end (file landed → row in DB).

### 2. Creator Payout Reconciler

**Input.** A CSV of creator orders in a TikTok-Shop-like schema (`creator_id`, `order_id`, `gross_revenue`, `refunds`, `shipping_cost`, `platform_fee`, `promo_credit`, `currency`, `paid_out`). Plus a `policy.md` written in natural language describing commission tiers, refund rules, and minimum-payout thresholds.

**Output.** A `payouts.csv` with one row per creator: gross, deductions itemized by rule, net payout, currency-normalized USD net. Plus a `discrepancies.md` markdown report flagging cases where the policy is ambiguous.

**Workflow.**
1. Claude reads `policy.md` once with prompt caching (the policy is the stable prefix).
2. For each creator, Claude applies the cached policy to that creator's order rows and produces a structured payout breakdown.
3. A deterministic Python/JS reconciler re-computes from the rule output and flags any creator whose Claude-computed total disagrees with the deterministic re-computation.

**Measurement.** On a 50-creator fixture with hand-computed ground truth:
- **Exact-match rate** of Claude payout vs. ground truth: target ≥ 99%.
- **Total dollars reconciled** and total time vs. a stopwatch-measured "do it in Google Sheets" baseline.

### 3. Tier-1 Customer Service Responder

**Input.** Inbound customer messages (synthetic email + chat corpus, ~500 labeled with intent + canonical answer).

**Output.** Per message: an intent classification, a drafted reply grounded in a small knowledge-base markdown corpus, a confidence score in `[0,1]`, and an action: `auto_send` (≥ 0.85), `human_review` (0.5–0.85), or `escalate` (< 0.5).

**Workflow.**
1. Embed the knowledge-base markdown once into pgvector (Supabase).
2. For each inbound message, retrieve top-k passages; pass message + passages to Claude with a structured-output prompt.
3. Confidence threshold gates the action.

**Measurement.** On the labeled corpus:
- **Auto-response rate** (% of messages that cleared the 0.85 threshold).
- **Auto-response precision** (of those auto-sent, % whose drafted reply matched the canonical answer's intent).
- **Escalation recall** (of messages labeled "needs-human", % the system actually escalated).

### 4. Cross-Company KPI Q&A

**Input.** A natural-language question from the dashboard's chat box. Example: *"Which vendor's AP invoices grew fastest in Q3?"* or *"Which creator has the highest unreconciled balance?"*

**Output.** A grounded answer with citations to specific rows in the four MCP-served data sources.

**Workflow.**
1. Claude receives the question + tool descriptions for each MCP server (ERP, CRM, accounting/AP, retail channel).
2. Claude plans a retrieval sequence, calls MCP tools, and synthesizes an answer.
3. Every claim in the answer is cited back to a specific row via the Anthropic Citations API.

**Measurement.** A ten-question canned battery with hand-built ground-truth row IDs:
- **Citation accuracy** (does the cited row actually support the claim).
- **Tool-routing precision** (did the agent call the right MCP server for the question).

## Synthetic-data contract

All generators live in `data/generators/` and obey:

1. **Deterministic.** Every generator takes a seed; same seed → same output.
2. **Versioned.** Generated fixtures are checked in under `data/fixtures/<feature>/<seed>/`.
3. **Labeled.** Every fixture ships with a `labels.json` alongside it.
4. **Realistic-feeling.** Vendor names from a curated list of plausible SMB suppliers; addresses from real US cities; reasonable invoice totals; messy-but-parseable layouts.
5. **No real-world data.** Never check in anything sourced from a real customer, real platform, or scraped from a real site.

## What ships in the dashboard

A single React + Vite + Tailwind + Chart.js SPA at `/`. Four panels matching the four sub-features. Each panel shows:

- Current measurements (the README's headline numbers for that sub-feature).
- A live activity log of the last 50 operations.
- A "run a synthetic batch" button that re-runs the generator + processor end-to-end so a visitor can watch it work.

A fifth panel — the executive Q&A chat — sits across the top of the dashboard.

## What does *not* ship in v1

- User accounts. Single hardcoded workspace.
- A real billing integration (Stripe, Plaid, etc.).
- Slack/Teams/Discord beyond the one webhook for escalation demo.
- A custom-trained model. The lane is agent/automation.
- Mobile responsiveness beyond "doesn't break on a tablet."
- Internationalization. English-only.

## Definition of done for the README banner finding

The headline number is *measured*, not estimated. It is supported by a script under `data/measurements/` whose output is checked in alongside the README. If a number in the README has no corresponding measurement file in the repo, it is not allowed in the README.
