// Demo-recording suite: single-worker, slow-motion, full video on every
// scenario. Produces the narrated walkthroughs that ship in the README's
// `<details>` blocks. See the global ~/.claude/CLAUDE.md
// "Gherkin E2E Tests + Demo Video Recording" section — that document
// is binding for the recording pipeline (slowMo, fill-patch, cursor
// injection, dwell helper, ffmpeg conversion, etc.).
//
// The 0-byte-first-test-video Playwright bug is real; add at least two
// warmup feature files under e2e/demo/features/ named 00-warmup-*.feature
// before any narrative scenarios land. The custom reporter (when it
// exists) will discard their videos by slug prefix.

import { defineConfig, devices } from '@playwright/test';
import { defineBddConfig } from 'playwright-bdd';

const testDir = defineBddConfig({
  features: 'e2e/demo/features/**/*.feature',
  steps: 'e2e/steps/**/*.steps.ts',
});

export default defineConfig({
  testDir,
  timeout: 180_000,
  fullyParallel: false,
  workers: 1,
  retries: 0,
  reporter: 'list',
  testMatch: /.*\.(spec|test|feature\.spec)\.(ts|js)/,
  use: {
    baseURL: process.env.HELM_BASE_URL ?? 'http://localhost:5173',
    headless: true,
    viewport: { width: 2560, height: 1600 },
    video: { mode: 'on', size: { width: 2560, height: 1600 } },
    launchOptions: {
      slowMo: Number(process.env.DEMO_SLOWMO ?? 1200),
    },
  },
  projects: [
    {
      name: 'chromium',
      use: {
        ...devices['Desktop Chrome'],
        // Re-pin viewport at project level — device preset silently
        // overrides the top-level `use` block otherwise.
        viewport: { width: 2560, height: 1600 },
        video: { mode: 'on', size: { width: 2560, height: 1600 } },
      },
    },
  ],
});
