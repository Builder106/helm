// Warmup suite — mirrors 00-warmup.feature; the .feature stays as
// documentation. The demo config's testMatch only picks up *.spec.ts
// files, so without this file no warmups run and Playwright's 0-byte
// first-test-video bug lands on the narrative tour instead.
//
// These two scenarios exist only to absorb that bug: their videos are
// discarded, never embedded. Alphabetical ordering (00- prefix) plus
// workers:1 / fullyParallel:false guarantees they run before
// 01-helm-tour.spec.ts.

import { test, expect } from '@playwright/test';

test.describe('00 warmup — discard these videos', () => {
  test('warmup A', async ({ page }) => {
    await page.goto('/', { waitUntil: 'networkidle' });
    const brand = page.getByRole('banner').getByText('Helm', { exact: true });
    await expect(brand).toBeVisible();
  });

  test('warmup B', async ({ page }) => {
    await page.goto('/', { waitUntil: 'networkidle' });
    const brand = page.getByRole('banner').getByText('Helm', { exact: true });
    await expect(brand).toBeVisible();
  });
});
