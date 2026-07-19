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
import path from 'node:path';

export default defineConfig({
  testDir: 'demo/features',
  // The per-test budget covers fixture teardown too, and saving a
  // 2560x1600 video on context.close() is slow. A recorded run failed with
  // "Tearing down context exceeded the test timeout of 300000ms" — the body
  // finished but video finalization ran out the clock. Give teardown headroom.
  timeout: 600_000,
  fullyParallel: false,
  workers: 1,
  retries: 0,
  reporter: 'list',
  testMatch: /.*\.(spec|test|feature\.spec)\.(ts|js)/,
  // Self-start the front so a demo run never silently records a blank page
  // when no dev server is up. Reuses an already-running server locally.
  webServer: {
    command: 'pnpm --filter ./back dev',
    // webServer cwd defaults to this config's dir (e2e/); the workspace
    // filter only resolves from the repo root.
    cwd: path.resolve(__dirname, '..'),
    url: process.env.HELM_BASE_URL ?? 'http://127.0.0.1:3000',
    reuseExistingServer: true,
    timeout: 120_000,
  },
  use: {
    baseURL: process.env.HELM_BASE_URL ?? 'http://127.0.0.1:3000',
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
