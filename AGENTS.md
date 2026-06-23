# Helm — project guide

A Gemini + MCP-routed executive co-pilot for small-and-mid-market business operations. Aggregates data across mocked business systems (ERP, CRM, accounting, retail channel) and runs four real workflows end-to-end. The portfolio target is a hiring manager from a back-office AI/automation team who needs to see a working artifact in under thirty seconds.

This file is the source of truth for *Helm*'s scope, stack, and guardrails. The global guide at `~/.claude/CLAUDE.md` covers cross-repo baseline (README pattern, banner SVGs, JOURNAL.md cadence, Gherkin E2E). Read that too; this file does not repeat it.

## Lane and audience

**Lane:** agent/automation (per [[ai-ml-scope]] in user memory). *Not* an applied-ML project — no novel model training, no benchmarks against research baselines. The "intelligence" comes from Gemini; the engineering contribution is the orchestration, the data plumbing, and the cost/accuracy measurement.

**Primary audience for the README:** AI/automation hiring managers at SMB-portfolio companies (the Handshake postings: Smart Circle International, FHI Heat, Source Creative). Secondary audience: any "ops-team-at-a-growing-company" reader who has felt the pain of manual invoice processing.

**Note on the model question.** Helm has been through three provider commits — Anthropic Claude (dropped: API cost), Llama 4 Scout via Groq (dropped: 500K-tokens-per-day free-tier cap blocked the 200-invoice corpus at ~70 invoices), then briefly Gemini 2.0 Flash (dropped: Google pulled 2.0 Flash from the free tier in 2026), and now **Gemini 3.1 Flash Lite via Google AI Studio**. Gemini wins because its image input is flat-rated per tile (~258 tokens per typical PNG vs. Groq's per-pixel ~6,400), so the 200-invoice corpus fits comfortably under the free tier. Model name is **env-overridable** via `GEMINI_MODEL` (default `gemini-3.1-flash-lite`; `gemini-3.1-flash-lite` for more headroom, `gemini-2.5-pro` for deeper reasoning on the KPI Q&A path) so the next time Google reshuffles model availability, no code change is needed. The `Extractor` interface in `back/src/ap/extraction.ts` is provider-agnostic by design; `extraction-groq.ts` remains in the repo as an alternative provider.

## Stack — locked

- **Frontend:** React 19 + Vite + Chart.js + Tailwind CSS. (FHI Heat posting names React + Chart.js explicitly. Vite over Next.js because Helm is an SPA dashboard, not a content site.)
- **Backend:** Node.js 22 + Express 5. (FHI Heat names this stack verbatim.)
- **LLM:** Gemini 3.1 Flash Lite via Google AI Studio (`@google/genai`). Default model: `gemini-3.1-flash-lite` (env-overridable via `GEMINI_MODEL`) for all four sub-features — multimodal, fast, and image input is flat-rated per tile. `gemini-2.5-pro` is the reach option for the KPI Q&A path if Flash's reasoning depth proves too shallow; `gemini-3.1-flash-lite` is the cheaper / higher-RPM option for development iteration. Use `responseSchema` to constrain output JSON to the Zod schema server-side; combined with Zod parsing on the client, schema drift becomes effectively impossible.
- **Agent layer:** Custom MCP servers (one per data source). The FHI Heat posting calls out MCP by name — this is the differentiator, not boilerplate. See `mcp/` for the per-source servers. MCP is provider-agnostic; Gemini's tool-use API talks to MCP servers the same way any other model would.
- **OCR:** Gemini 3.1 Flash Lite vision on a PNG render of each invoice. Do not bolt on Tesseract or AWS Textract — the point is to show that a single multimodal-LLM call replaces a multi-tool OCR pipeline at a known cost.
- **Storage:** libsql (Turso's SQLite fork) via `@libsql/client`. A single file at `data/helm.db` locally; the dev default is `LIBSQL_URL=file:./data/helm.db`. libsql ships native vector support (`F32_BLOB` + `vector_distance_cos`) so the Tier-1 CS Responder's KB retrieval does not need a separate vector store. Swap `LIBSQL_URL` to a `libsql://<name>.turso.io` URL + auth token to deploy against Turso Cloud (free tier) without changing any SQL. Do not pull in Supabase, Postgres, pgvector, or Drizzle — the data volume here is small enough that adding a managed service or an ORM is the wrong call.
- **Deployment:** Vercel for the front end; Vercel Functions for the back end where it fits, fall back to a long-running Node host (Fly.io or Railway) only if a feature genuinely needs it.
- **Testing:** Playwright + `playwright-bdd` (per global guide). Two suites: fast headless QA + narrated demo recordings. Playwright is also Helm's HTML→PNG renderer for invoice fixtures.
- **CI:** GitHub Actions. One workflow that lints, types, unit-tests, integration-tests, and deploys on push to `main`.

## Four sub-features — what "done" looks like

Each sub-feature must produce a concrete number that lands in the README. Do not ship a sub-feature without its measurement.

1. **AP Invoice OCR pipeline.** Synthetic-invoice generator → Playwright HTML→PNG render → Llama 4 Scout vision extraction → Zod schema validation → anomaly flags → ledger push. **Measurement:** extraction accuracy on a held-out labeled set, cost per invoice in USD, p50/p95 latency.

2. **Creator Payout Reconciler.** TikTok-Shop-style CSV of creator orders + a commission-rule policy → Llama reasons across rules → payout statement per creator with discrepancies flagged. **Measurement:** rule-coverage rate, total payouts reconciled, time vs. a spreadsheet baseline.

3. **Tier-1 Customer Service Responder.** Inbound message classifier → drafted reply with confidence score → auto-send above threshold, escalate below. **Measurement:** auto-response rate, escalation precision/recall on a held-out labeled set.

4. **Cross-Company KPI Q&A.** Natural-language query → MCP-routed retrieval across the four data sources → grounded answer with citation back to source rows. **Measurement:** retrieval accuracy (does the cited row actually answer the question), hallucination rate.

## README headline finding — the bar

The README has one job: convince a stranger in ten seconds that this works. The headline number must be specific, defensible, and ideally surprising. Draft target shape:

> *Processed N synthetic invoices with X% line-item extraction accuracy at $Y per invoice. At a $25/hr loaded wage and 6 min/invoice manual baseline, the system recovers Z labor-hours/month equivalent — an R× cost reduction.*

Numbers are placeholders until measured. Do not claim a number you have not run. **The README banner finding is a contract: the project is not "done" until the measurement supports it.** When running with `--extractor=mock`, the cost/accuracy/latency numbers are simulated and carry a warning banner in the generated `summary.md`. Only `--extractor=groq` numbers are allowed in the README headline.

## Schedule (rough)

| Phase | Output | Done when |
|---|---|---|
| Scaffold | Repo skeleton, CLAUDE.md, README skeleton, JOURNAL, CONTRIBUTING, LICENSE, CI stub | This file exists; first commit pushed |
| Data | Synthetic-invoice + CSV + email-corpus generators with labels | Three generators output reproducible fixtures with seeds |
| Sub-feature 1 | AP Invoice OCR + measurement | Extraction accuracy printed; cost-per-invoice logged |
| Sub-feature 2 | Payout Reconciler + measurement | Reconciliation matches a hand-computed ground truth on the fixture |
| Sub-feature 3 | Tier-1 CS Responder + measurement | Auto-response rate + escalation P/R printed |
| Sub-feature 4 | KPI Q&A across all four MCP servers | Citation-back-to-row works for ten canned questions |
| Polish | Banner SVGs, E2E demo videos, deployed URL, social card | README banner finding swap-in; live URL responds 200 |

## Anti-slop guardrails — specific to Helm

The global guide covers the general "anti-AI-slop" posture. These are project-specific tells to avoid:

- **No "let me imagine a dataset." Generators are real code with seeds.** The data has to be inspectable, reproducible, and versioned.
- **No LLM-as-a-judge for the measurements.** Accuracy is computed against hand-labeled fixtures, not "the model rated the answer 8/10."
- **No "demo mode" toggles that fake the result.** If a sub-feature isn't done, it's not in the dashboard.
- **No four-paragraph docstrings.** This project is a working SaaS-style app, not a tutorial. Comments only when WHY is non-obvious (per global guide).
- **No "powered by AI" marketing language in the UI.** The dashboard reads like an internal tool, not a landing page.
- **No "production-ready", "enterprise-grade", or "robust" in the README.** Those are the AI-slop tells judges flag first.

## Out of scope — do not drift

- User authentication / multi-tenant. Single demo workspace, hardcoded.
- A custom-trained model. The lane is agent/automation.
- A mobile app.
- Slack/Teams/Discord integrations beyond a single webhook for the customer-service escalation demo.
- Real customer data of any kind. Synthetic only.
- A pricing page, a marketing site, an "about us." This is a portfolio repo, not a startup.

## How to handle scope creep

If a session surfaces a "wouldn't it be cool if…" addition, write it in `docs/parking-lot.md` rather than building it. The four sub-features are the contract.
