# Contributing to Helm

Helm is a personal portfolio project, so the "contributor" is usually me-from-next-week. This document captures the conventions so the codebase stays coherent across sessions.

## Dev environment

- **Node 22+** (use `nvm use` once `.nvmrc` lands).
- **pnpm** for package management. The repo uses pnpm workspaces; npm and yarn will not produce the right `node_modules` layout.
- **Anthropic API key** in `.env` as `ANTHROPIC_API_KEY`. See `.env.example` for the full list.
- **Supabase project** linked via the Supabase CLI for local Postgres + pgvector. The Vercel Marketplace install (`/vercel:bootstrap`) is the path of least resistance.
- **Playwright browsers** installed via `pnpm exec playwright install --with-deps chromium`.

## First-run commands

```bash
pnpm install
cp .env.example .env   # then fill in ANTHROPIC_API_KEY and SUPABASE_URL/KEY
pnpm dev               # runs front + back + mcp servers concurrently
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
- **Zod for I/O boundaries.** Every Claude response that needs to be JSON is parsed through Zod. Every Express request body is parsed through Zod.
- **Comments only when WHY is non-obvious.** WHAT is self-evident from named identifiers. Follow the global guidance in `~/.claude/CLAUDE.md`.
- **No file-header docblocks.** The filename and the imports tell the story.

### Anthropic SDK usage

- **Prompt caching is mandatory** for any call where the same prompt prefix is reused across requests. The policy reasoner, the KPI Q&A tool catalog, and the KB-retrieval system prompt all qualify.
- **Use the official `@anthropic-ai/sdk`**, not a third-party wrapper.
- **Default to Sonnet 4.6** (`claude-sonnet-4-6`); reach for Opus 4.7 (`claude-opus-4-7`) only on the KPI Q&A path where reasoning depth matters.
- **Every Claude call logs** input tokens, output tokens, cache hits, latency, and USD cost to a structured log. The dashboard surfaces these in the metrics panel; no measurement is allowed in the README that does not derive from this log.

### Commits

- Imperative present tense: "add invoice OCR pipeline", not "added" or "adds".
- **No `Co-Authored-By: Claude` trailers.** Per the user's global instruction.
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
- A custom-trained model. The lane is agent/automation; Claude is the model.
- Mobile responsiveness beyond "doesn't break on a tablet."
- A pricing page. This is a portfolio repo, not a startup.

If something here seems wrong, open an issue rather than a PR — the scope contract in [`docs/scope.md`](docs/scope.md) is the discussion artifact.

## Hot tips

- **`pnpm dev` is fragile when an MCP server crashes.** It will not auto-restart; check the terminal for the offender and `pnpm --filter mcp-<name> dev` to recover it independently.
- **Synthetic-data fixtures are versioned.** Don't regenerate a fixture you didn't change. If a generator's output drifts due to a model change, that's a measurement-affecting event — write a JOURNAL entry.
- **Don't claim a README number you didn't measure.** This is the single hardest rule and the easiest to break under time pressure.
