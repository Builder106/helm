// Demo-recording suite — produces the README's narrated walkthrough.
// Mirrors 01-helm-tour.feature; the .feature stays as documentation.
//
// This suite runs with slowMo (see playwright.demo.config.ts) and
// records full video on every scenario. Warmup scenarios under
// 00-warmup.feature exist to work around Playwright's 0-byte first-
// test-video bug in single-worker recording mode.

import { test, expect } from '@playwright/test';
import type { Page } from '@playwright/test';
import { INVOICE_PARSE_RATE, PAYOUT_EXACT_MATCH_RATE } from '../../helpers/report-data';

const DEMO_DWELL_MS = Number(process.env.DEMO_DWELL_MS ?? 1500);
const DEMO_TAIL_MS = Number(process.env.DEMO_TAIL_MS ?? 1800);

async function dwell(page: Page, ms = DEMO_DWELL_MS) {
  if (process.env.DEMO !== '1') return;
  try {
    await page.waitForTimeout(ms);
  } catch {
    /* page closed */
  }
}

// Open the app deterministically: `networkidle` can hang behind Vite's HMR
// websocket (it never goes idle), which is one way the context teardown blew
// past the test timeout. Wait on DOM + the rendered brand instead.
async function openDashboard(page: Page) {
  await page.goto('/', { waitUntil: 'domcontentloaded' });
  await page
    .getByRole('banner')
    .getByText('Helm', { exact: true })
    .waitFor({ state: 'visible' });
}

// Two warmups first — slug-prefix `00-warmup-` lets the (future)
// custom reporter discard their videos. Until that reporter ships,
// these record real videos that just need to be ignored by hand.
test.describe('00 warmup — discard these videos', () => {
  test('00-warmup-a — first viewport load', async ({ page }) => {
    await openDashboard(page);
    await page.waitForTimeout(500);
  });

  test('00-warmup-b — second viewport load', async ({ page }) => {
    await openDashboard(page);
    await page.waitForTimeout(500);
  });
});

test.describe('01 Helm — a one-minute tour', () => {
  test('Trial 01 then trial 02 with the headline measurements', async ({ page }) => {
    await openDashboard(page);
    await dwell(page, 2000);

    // Hero + brand sits long enough to read.
    const brand = page.getByRole('banner').getByText('Helm', { exact: true });
    await expect(brand).toBeVisible();
    await dwell(page);

    // Trial 01 title — main panel hero.
    const trial01 = page.getByRole('heading', { name: /AP Invoice/i, level: 1 });
    await expect(trial01).toBeVisible();
    await dwell(page);

    // Linger on the metric cards row for trial 01.
    const parseRate = page
      .getByText(/^parse rate$/i)
      .first()
      .locator('..')
      .locator('..');
    await parseRate.scrollIntoViewIfNeeded();
    await expect(parseRate).toContainText(INVOICE_PARSE_RATE);
    await dwell(page, 2200);

    // Descend to trial 02.
    const trial02 = page.getByRole('heading', { name: /Creator Payout/i, level: 1 });
    await trial02.scrollIntoViewIfNeeded();
    await dwell(page, 2000);
    await expect(trial02).toBeVisible();

    // Exact-match card for trial 02 — the surprising finding.
    const exactMatch = page
      .getByText(/^exact match$/i)
      .first()
      .locator('..')
      .locator('..');
    await exactMatch.scrollIntoViewIfNeeded();
    await expect(exactMatch).toContainText(PAYOUT_EXACT_MATCH_RATE);
    await dwell(page, 2500);

    // Discrepancy log — show that the system surfaces them for review.
    const flagged = page.getByRole('heading', {
      name: /flagged for human review/i,
      level: 3,
    });
    await flagged.scrollIntoViewIfNeeded();
    await expect(flagged).toBeVisible();
    await dwell(page, DEMO_TAIL_MS);
  });
});
