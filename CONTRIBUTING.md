# Contributing to Helm

Helm is a personal portfolio project, so the "contributor" is usually me-from-next-week. This document captures the conventions so the codebase stays coherent across sessions.

## Dev environment

- **Node 22+** (use `nvm use` to pin via `.nvmrc`).
- **pnpm** for package management. The repo uses pnpm workspaces; npm and yarn will not produce the right `node_modules` layout.
- **Gemini API key** in `.env` as `GEMINI_API_KEY`. Free key at [aistudio.google.com/app/apikey](https://aistudio.google.com/app/apikey). Default model is `gemini-3.1-flash-lite` (overridable via `GEMINI_MODEL`). Free tier on 2.5 Flash is ~10 RPM and ~250 RPD; the extractor self-paces at 6.5s between calls so a 200-invoice run takes ~22 minutes. Set `GEMINI_MODEL=gemini-3.1-flash-lite` and `GEMINI_MIN_INTERVAL_MS=4500` for the more generous Lite tier. (Optional secondary: `GROQ_API_KEY` if you want to compare against the Llama 4 Scout extractor.)
- **libsql** runs locally as a single file at `data/helm.db` — no setup required, no account. The dev default in `.env.example` is `LIBSQL_URL=file:./data/helm.db`. For deployment, swap to a Turso Cloud URL (`libsql://<name>.turso.io`) + `LIBSQL_AUTH_TOKEN`; SQL is identical.
- **Playwright browsers** installed via `pnpm exec playwright install chromium`.

## First-run commands

```bash
pnpm install
cp .env.example .env   # then fill in GEMINI_API_KEY (and optionally GROQ_API_KEY)
pnpm data:generate --seed 1            # synthetic-data fixture
pnpm data:render-png --seed 1          # HTML → PNG renders for invoice OCR
pnpm measure:invoice-ocr --seed 1      # mock pipeline (no API spend)
pnpm measure:invoice-ocr --seed 1 --extractor gemini   # real Gemini 3.1 Flash Lite vision (~22 min, free)
pnpm measure:invoice-ocr --seed 1 --extractor groq     # alternative: Llama 4 Scout via Groq
pnpm test              # unit + integration
pnpm test:e2e          # headless Playwright QA suite
pnpm test:demo         # narrated demo recordings (see global CLAUDE.md for the recording pipeline)
```

## Project layout

See the "Architecture" section of [`README.md`](README.md). The two non-obvious bits:

- **`mcp/<source>/`** — each MCP server is its own workspace package. Servers speak the Model Context Protocol stdio transport in dev and SSE in production.
- **`data/measurements/`** — every number that appears in `README.md` traces to a script in this folder. The script is the source of truth; the README quotes it.

## Conventions

### Code

- **TypeScript everywhere** in `front/`, `back/`, `mcp/`. Strict mode on. No `any` without an `// eslint-disable-next-line @typescript-eslint/no-explicit-any -- <reason>` comment.
- **Zod for I/O boundaries.** Every model response that needs to be JSON is parsed through Zod. Every Express request body is parsed through Zod.
- **Comments only when WHY is non-obvious.** WHAT is self-evident from named identifiers. Follow the global guidance in `~/.claude/CLAUDE.md`.
- **No file-header docblocks.** The filename and the imports tell the story.

### Gemini SDK usage

- **Use the official `@google/genai`** (Google's unified Gemini SDK; replaces the legacy `@google/generative-ai`). Don't pull in OpenRouter, LiteLLM, or other wrappers — they obscure the cost-tracking story.
- **Default model: `gemini-3.1-flash-lite`** for all four sub-features. `gemini-2.5-pro` is the reach option for the KPI Q&A path if 2.5 Flash's reasoning depth proves too shallow under real-world questions; `gemini-3.1-flash-lite` is the cheaper / higher-RPM option for development. Override via the `GEMINI_MODEL` env var — never hard-code a model string in component code.
- **Use `responseMimeType: 'application/json'` + `responseSchema`** on every call that produces structured output. Gemini enforces the schema server-side; combined with Zod parsing on the client, schema drift becomes effectively impossible.
- **`temperature: 0`** for any path that is graded against a deterministic ground truth (extraction, payout reconciliation). Q&A paths can run at a low non-zero temperature if needed.
- **Self-pace at 10 RPM** (one request every ~6.5 seconds) for `gemini-3.1-flash-lite` to stay under the free-tier limit; drop to 4.5s for `-lite`. The Gemini extractor in `back/src/ap/extraction-gemini.ts` does this internally and reads `GEMINI_MIN_INTERVAL_MS` from env — callers don't need to add delays.
- **Every Gemini call logs** input tokens (image tokens are flat-rated per tile), output tokens, latency, and USD cost (computed from Gemini 3.1 Flash Lite's published pricing: $0.30/M input, $2.50/M output) to a structured log. The dashboard surfaces these in the metrics panel; no measurement is allowed in the README that does not derive from this log.
- **The `Extractor` interface in [`back/src/ap/extraction.ts`](back/src/ap/extraction.ts) is provider-agnostic by design.** `createGroqLlamaExtractor` lives alongside `createGeminiExtractor`; a Claude or OpenAI implementation could land next to them without touching the measurement script — the constructor accepts the model identity in its options.

### Commits

- Imperative present tense: "add invoice OCR pipeline", not "added" or "adds".
- **No `Co-Authored-By` trailers attributing work to any AI assistant.** Per the user's global instruction.
- One concern per commit. A formatting sweep is its own commit, separate from a feature.

### Tests

- **Unit tests** live next to the code they cover (`foo.ts` next to `foo.test.ts`).
- **Integration tests** go in `*/integration/` per workspace.
- **E2E tests** are Gherkin under `e2e/features/` (QA) and `e2e/demo/features/` (demo). The step library is shared. See the global `~/.claude/CLAUDE.md` "Gherkin E2E Tests + Demo Video Recording" section — that section is binding.

## Out of scope — PRs that won't be accepted

To save anyone the trouble:

- A user-authentication system. Helm is single-workspace by design.
- A real billing integration. Synthetic data only.
- Slack/Teams/Discord integrations beyond the one escalation webhook.
- Internationalization. English-only.
- A custom-trained model. The lane is agent/automation; Gemini 3.1 Flash Lite is the model.
- Mobile responsiveness beyond "doesn't break on a tablet."
- A pricing page. This is a portfolio repo, not a startup.

If something here seems wrong, open an issue rather than a PR — the scope contract in [`docs/scope.md`](docs/scope.md) is the discussion artifact.

## Hot tips

- **`pnpm dev` is fragile when an MCP server crashes.** It will not auto-restart; check the terminal for the offender and `pnpm --filter mcp-<name> dev` to recover it independently.
- **Synthetic-data fixtures are versioned.** Don't regenerate a fixture you didn't change. If a generator's output drifts due to a model change, that's a measurement-affecting event — write a JOURNAL entry.
- **Don't claim a README number you didn't measure.** This is the single hardest rule and the easiest to break under time pressure.
