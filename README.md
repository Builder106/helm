<picture>
  <source media="(prefers-color-scheme: dark)"  srcset="assets/banner-dark.svg"  type="image/svg+xml">
  <source media="(prefers-color-scheme: light)" srcset="assets/banner-light.svg" type="image/svg+xml">
  <source media="(prefers-color-scheme: dark)"  srcset="assets/banner-dark.png">
  <source media="(prefers-color-scheme: light)" srcset="assets/banner-light.png">
  <img alt="Helm — Gemini 2.0 Flash + MCP co-pilot for small-business operations. Four back-office workflows, measured cost and accuracy." src="assets/banner-dark.svg">
</picture>

[![CI](https://github.com/Builder106/Helm/actions/workflows/deploy.yml/badge.svg)](https://github.com/Builder106/Helm/actions/workflows/deploy.yml)
[![Live demo](https://img.shields.io/badge/demo-live-success.svg)](https://helm-bridge.vercel.app)
[![Node](https://img.shields.io/badge/Node-22%2B-339933.svg?logo=node.js&logoColor=white)](https://nodejs.org/)
[![React](https://img.shields.io/badge/React-19-61DAFB.svg?logo=react&logoColor=white)](https://react.dev/)
[![Gemini](https://img.shields.io/badge/Gemini%202.0%20Flash-vision-4285F4.svg?logo=google&logoColor=white)](https://ai.google.dev/gemini-api/docs/models/gemini)
[![MCP](https://img.shields.io/badge/MCP-Model%20Context%20Protocol-0A0A0A.svg)](https://modelcontextprotocol.io/)
[![libsql](https://img.shields.io/badge/libsql-SQLite%20%2B%20vector-4FF8D2.svg)](https://github.com/tursodatabase/libsql)
[![License](https://img.shields.io/badge/license-MIT-blue.svg)](#license)

> **Helm is a Gemini 2.0 Flash + MCP executive co-pilot for small-and-mid-market business operations.** Four back-office workflows — AP-invoice OCR, creator-payout reconciliation, Tier-1 customer-service responses, and cross-company KPI Q&A — running end-to-end with measured cost and accuracy per task. The dashboard is the demo.

**Live dashboard:** [helm-bridge.vercel.app](https://helm-bridge.vercel.app) — the MOCK DATA badge swaps to MEASURED · Gemini 2.0 Flash on the next measurement run.

## The headline finding

> _Placeholder until measured. The README banner finding is a contract: the project is not "done" until the measurement supports it. See [`CLAUDE.md`](CLAUDE.md) for the discipline around this number, and [`data/measurements/`](data/measurements/) for the reproducibility scripts that will produce it._

## What this is

Helm is a portfolio project: a working sketch of what an AI/automation team would actually build inside a growing SMB. The Handshake postings that motivated it — Smart Circle International, FHI Heat, Source Creative — all describe the same shape of work: an LLM-powered layer that sits between human operators and their messy stack of business systems, runs the repetitive parts, and surfaces decisions for humans. Helm is that layer, built against synthetic stand-ins for the systems and measured against hand-labeled ground truth.

The lane is **agent/automation**, not applied ML. There is no novel model here. The engineering contribution is the orchestration — four MCP servers, a Gemini-vision OCR pipeline, a policy reasoner, and a citation-grounded executive Q&A path — and the per-workflow cost/accuracy measurement that lets the README make a defensible claim. The model is Gemini 2.0 Flash via Google AI Studio; the extractor interface is provider-agnostic and a Llama-via-Groq implementation lives alongside (`back/src/ap/extraction-groq.ts`) as an alternative.

## How it works

```mermaid
sequenceDiagram
    autonumber
    participant U as User
    participant D as Dashboard (React + Chart.js)
    participant API as API (Node + Express)
    participant L as Gemini 2.0 Flash
    participant MCP as MCP servers
    participant DB as libsql (SQLite + vector)

    rect rgb(245, 245, 255)
    Note over U,DB: AP Invoice OCR
    U->>D: Drop invoice PDFs
    D->>API: POST /api/ap/ingest
    API->>API: render PDF → PNG
    API->>L: vision call (extract structured fields)
    L-->>API: invoice JSON
    API->>API: Zod schema + math reconciliation
    API->>DB: insert ap_invoices, flag anomalies
    API-->>D: live activity log
    end

    rect rgb(245, 255, 245)
    Note over U,DB: Creator Payout Reconciler
    U->>D: Upload orders CSV + policy.md
    D->>API: POST /api/payouts/run
    API->>L: policy + creator rows
    L-->>API: payout breakdown
    API->>API: deterministic re-compute, flag diffs
    API-->>D: payouts.csv + discrepancies.md
    end

    rect rgb(255, 250, 240)
    Note over U,DB: Tier-1 CS Responder
    U->>D: Inbound message arrives
    D->>API: POST /api/cs/draft
    API->>DB: vector_distance_cos retrieve KB passages
    API->>L: message + KB → reply + confidence
    L-->>API: structured response
    API-->>D: auto-send / review / escalate
    end

    rect rgb(255, 240, 250)
    Note over U,DB: Cross-Company KPI Q&A
    U->>D: Ask a question
    D->>API: POST /api/kpi/ask
    API->>L: question + MCP tool catalog
    loop one or more
        L->>MCP: tool call (ERP / CRM / AP / channel)
        MCP->>DB: query rows
        DB-->>MCP: rows
        MCP-->>L: tool result
    end
    L-->>API: answer with grounded citations
    API-->>D: grounded answer, click to source row
    end
```

## The four sub-features

Each panel of the dashboard maps to one sub-feature, and each sub-feature ships with a measurement. The full contract — workflow, schema, and exact measurement protocol — lives in [`docs/scope.md`](docs/scope.md).

| Sub-feature | Stack | Measurement |
|---|---|---|
| **AP Invoice OCR** | Gemini 2.0 Flash vision, Zod, libsql | Line-item accuracy on 200-invoice holdout, USD/invoice, p50/p95 latency |
| **Creator Payout Reconciler** | Gemini + a programmatic re-computer | Exact-match rate vs. hand-computed ground truth on 50-creator fixture |
| **Tier-1 CS Responder** | libsql vector retrieval, Gemini structured output, confidence gating | Auto-response rate, precision; escalation recall |
| **Cross-Company KPI Q&A** | Gemini tool-use, four custom MCP servers | Citation accuracy, tool-routing precision on a 10-question battery |

## Architecture

```
Helm/
├── front/        React 19 + Vite + Chart.js + Tailwind — the dashboard
├── back/         Node 22 + Express 5 — API surface, agent orchestration
├── mcp/          Four MCP servers — one per data source (erp, crm, ap, channel)
│   ├── erp/
│   ├── crm/
│   ├── ap/
│   └── channel/
├── data/
│   ├── generators/   Seed-driven synthetic-data generators
│   ├── render-png/   Playwright-driven HTML → PNG renderer for invoices
│   ├── fixtures/     Versioned generated fixtures with labels
│   └── measurements/ Reproducibility scripts for every README number
├── e2e/          Playwright + playwright-bdd: QA suite + demo-recording suite
├── docs/         scope.md, architecture.md, anything else durable
├── assets/       Banner SVGs, logo, demo recordings
└── .github/workflows/  CI + deploy
```

The deeper architectural notes — the model-routing decisions, the MCP-server protocol Helm uses, the prompt layout for each path — live in [`docs/architecture.md`](docs/architecture.md) as those decisions land.

## Why this exists

Three Handshake postings (Smart Circle, FHI Heat, Source Creative) describe the same operational gap: small companies with real revenue but no in-house AI/automation team, drowning in invoice processing, creator-payout math, customer-service triage, and "where do I find that number" executive questions. Helm is a sketch of what shipping that team's first quarter of work would look like — with the constraint that every claim in the README has to be backed by a re-runnable measurement, not a generated screenshot.

This is a portfolio piece, not a product. The synthetic data is synthetic; the workflows are real.

## Running it locally

```bash
pnpm install
pnpm exec playwright install chromium    # first run only
cp .env.example .env                     # add GEMINI_API_KEY (free at aistudio.google.com); LIBSQL_URL defaults to file:./data/helm.db
pnpm data:generate --seed 1              # generators
pnpm data:render-png --seed 1            # HTML → PNG, ~17s
pnpm measure:invoice-ocr --seed 1        # full pipeline against the mock extractor
pnpm measure:invoice-ocr --seed 1 --extractor gemini   # against real Gemini 2.0 Flash vision (~15 min, free)
```

See [`CONTRIBUTING.md`](CONTRIBUTING.md) for the longer dev-environment story.

## Demos

_Recorded walkthroughs land here once the dashboard renders end-to-end. The recording pipeline is the Playwright + playwright-bdd demo suite described in the global `~/.claude/CLAUDE.md`._

## Project status

| Phase | Status |
|---|---|
| Scaffold | ✅ |
| Synthetic-data generators (seed=1 committed) | ✅ |
| Sub-feature 1 — AP Invoice OCR | 🟡 mock + Gemini (and Groq fallback) extractors wired; real measurement pending API key |
| Sub-feature 2 — Creator Payout Reconciler | ⬜ |
| Sub-feature 3 — Tier-1 CS Responder | ⬜ |
| Sub-feature 4 — Cross-Company KPI Q&A | ⬜ |
| Banner SVGs + favicon + social card | ✅ |
| Dashboard SPA (AP panel rendering live measurement) | ✅ |
| Demo videos | ⬜ |
| Deployed dashboard | ✅ [helm-bridge.vercel.app](https://helm-bridge.vercel.app) |

## License

MIT. See [`LICENSE`](LICENSE).
