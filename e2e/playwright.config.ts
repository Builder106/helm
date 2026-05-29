// QA suite: fast, headless, no videos. Runs against the dashboard
// (front/) once it lands; feature files will fill in under
// e2e/features/. The demo-recording suite lives in
// playwright.demo.config.ts — see the global ~/.claude/CLAUDE.md
// "Gherkin E2E Tests + Demo Video Recording" section for the
// shared-step-library + two-suite pattern.

import { defineConfig, devices } from '@playwright/test';
import { defineBddConfig } from 'playwright-bdd';

const testDir = defineBddConfig({
  features: 'e2e/features/**/*.feature',
  steps: 'e2e/steps/**/*.steps.ts',
});

export default defineConfig({
  testDir,
  timeout: 30_000,
  fullyParallel: true,
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
