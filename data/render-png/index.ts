// Render invoice HTML fixtures to PNGs using Playwright. Run after
// `pnpm data:generate` and before any OCR pass that wants images.
//
//   pnpm data:render-png --seed 1
//
// Each invoice HTML in data/fixtures/<seed>/invoices/inv-*.html gets
// a sibling .png written alongside it. Long line-item lists (the
// multi-page-layout anomaly) render as a single tall PNG via
// `fullPage: true` — the vision model still has to find the totals
// at the bottom.

import { parseArgs } from 'node:util';
import { readdir, readFile } from 'node:fs/promises';
import { join, resolve } from 'node:path';
import { chromium } from '@playwright/test';

async function main(): Promise<void> {
  const { values } = parseArgs({
    options: {
      seed: { type: 'string', default: '1' },
      'fixtures-root': { type: 'string', default: 'data/fixtures' },
      concurrency: { type: 'string', default: '4' },
    },
    strict: true,
  });

  const seed = values.seed!;
  const invoicesDir = resolve(values['fixtures-root']!, seed, 'invoices');
  const concurrency = Math.max(1, Number(values.concurrency));

  const entries = (await readdir(invoicesDir)).filter((f) => f.endsWith('.html'));
  console.log(`[helm:render-png] seed=${seed} files=${entries.length} concurrency=${concurrency}`);

  const browser = await chromium.launch();
  const start = Date.now();

  let next = 0;
  let done = 0;

  async function worker(): Promise<void> {
    const context = await browser.newContext({
      viewport: { width: 1024, height: 1320 },
      deviceScaleFactor: 2,
    });
    const page = await context.newPage();
    try {
      while (true) {
        const idx = next++;
        if (idx >= entries.length) return;
        const file = entries[idx]!;
        const htmlPath = join(invoicesDir, file);
        const pngPath = htmlPath.replace(/\.html$/, '.png');
        const html = await readFile(htmlPath, 'utf8');
        await page.setContent(html, { waitUntil: 'load' });
        await page.screenshot({
          path: pngPath,
          fullPage: true,
          type: 'png',
        });
        done++;
        if (done % 25 === 0) {
          console.log(`[helm:render-png] ${done}/${entries.length}`);
        }
      }
    } finally {
      await page.close();
      await context.close();
    }
  }

  await Promise.all(Array.from({ length: concurrency }, () => worker()));
  await browser.close();

  const elapsed = ((Date.now() - start) / 1000).toFixed(1);
  console.log(`[helm:render-png] done. ${entries.length} PNGs in ${elapsed}s`);
}

main().catch((err) => {
  console.error('[helm:render-png] failed:', err);
  process.exitCode = 1;
});
