// QA suite — exercises the dashboard against the dev build. Mirrors
// the natural-English scenarios in dashboard.feature one-to-one; the
// .feature file stays in the repo as documentation, and these are
// the actual runner-executable tests.
//
// Locator notes:
// - The brand "Helm" appears in three places (banner img alt, banner
//   wordmark text, body in footer). Each test narrows to one role/parent.
// - The text "measured" appears in many trial pins and headlines; narrow
//   to a stable accessible name where possible.
// - Use `state: 'attached'` (not 'visible') in beforeEach so the .rise
//   opacity animation doesn't race the assertion.

import { test, expect } from '@playwright/test';

test.describe('Helm dashboard renders both shipped trials', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/', { waitUntil: 'domcontentloaded', timeout: 20_000 });
    await page
      .getByRole('heading', { name: /AP Invoice/i, level: 1 })
      .waitFor({ state: 'attached', timeout: 15_000 });
    // The hero/panel/card .rise animations stagger up to ~240ms before
    // any element reaches opacity: 1. Without this settle wait, visibility
    // assertions fire while the staggered fade-in is still in flight.
    await page.waitForTimeout(800);
  });

  test('page loads with the Helm brand in the banner', async ({ page }) => {
    const banner = page.getByRole('banner');
    await expect(banner.getByText('submersible · eval dive')).toBeVisible();
    await expect(page).toHaveTitle(/Helm/);
  });

  test('trial 01 — AP Invoice OCR — title + headline parse rate', async ({ page }) => {
    await expect(page.getByRole('heading', { name: /AP Invoice/i, level: 1 })).toBeVisible();
    await expect(page.getByText('99.0%').first()).toBeVisible();
  });

  test('trial 02 — Creator Payout Reconciler — title + headline exact-match', async ({ page }) => {
    const trial02 = page.getByRole('heading', { name: /Creator Payout/i, level: 1 });
    await trial02.scrollIntoViewIfNeeded();
    await expect(trial02).toBeVisible();
    await expect(page.getByText('6.0%').first()).toBeVisible();
  });

  test('measurement metadata names gemini and the seed', async ({ page }) => {
    const banner = page.getByRole('banner');
    await expect(banner.getByText(/gemini 3\.1 flash lite/i)).toBeVisible();
    await expect(banner.getByText(/seed/i)).toBeVisible();
  });

  test('sidebar shows the depth gauge with both trials present', async ({ page }) => {
    const sidebar = page.getByRole('navigation');
    await expect(sidebar.getByRole('button', { name: /invoice-ocr/i })).toBeVisible();
    await expect(sidebar.getByRole('button', { name: /payout-reconciler/i })).toBeVisible();
    await expect(sidebar.getByText('measured · 2 pending descent')).toBeVisible();
  });

  test('discrepancy log on trial 02 surfaces flagged creators', async ({ page }) => {
    const flagged = page.getByRole('heading', {
      name: /flagged for human review/i,
      level: 3,
    });
    await flagged.scrollIntoViewIfNeeded();
    await expect(flagged).toBeVisible();
  });
});
