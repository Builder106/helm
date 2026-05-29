# Helm — end-to-end tests

Two Playwright + `playwright-bdd` suites that share a step library.
Architecture, anti-AI-slop guardrails, and the recording pipeline are
documented in the global `~/.claude/CLAUDE.md` "Gherkin E2E Tests +
Demo Video Recording" section — that document is binding.

## Layout

- `features/` — **QA suite.** Fast, headless, no videos. Assertion-bearing
  scenarios that grow alongside the dashboard.
- `demo/features/` — **Demo suite.** Single-worker, slow-motion, full
  video on every scenario. Produces the README walkthroughs.
- `steps/` — shared step definitions. Reused across both suites.

## Status

The dashboard isn't built yet, so neither suite has feature files.
The configs (`playwright.config.ts`, `playwright.demo.config.ts`)
are in place; populate `features/` once the first dashboard panel
(AP Invoice OCR) renders.

## Running

```bash
pnpm test:e2e          # QA suite, headless
pnpm test:demo         # demo recording suite
```

Both default to `HELM_BASE_URL=http://localhost:5173` (Vite dev server).
