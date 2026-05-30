// QA suite: fast, headless, no videos. Runs plain Playwright .spec.ts
// files at e2e/features/. The matching .feature documents are kept
// alongside as natural-English documentation; a future migration to
// playwright-bdd v8 is a paste job (the step semantics already match).
//
// The demo-recording suite lives in playwright.demo.config.ts — see
// the global ~/.claude/CLAUDE.md "Gherkin E2E Tests + Demo Video
// Recording" section for the two-suite pattern.

import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: 'features',
  testMatch: /.*\.spec\.ts$/,
  timeout: 30_000,
  // Parallel QA contexts overwhelm the dev server during Vite HMR — six
  // parallel React mounts produced inconsistent .rise animation timing
  // and visibility timeouts. Serial workers add ~30s to the suite for
  // dramatically better stability locally and in CI.
  fullyParallel: false,
  workers: 1,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? [['list'], ['html', { open: 'never' }]] : 'list',
  use: {
    baseURL: process.env.HELM_BASE_URL ?? 'http://localhost:5173',
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
});
