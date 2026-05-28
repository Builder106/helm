// Render invoice HTML fixtures to PDFs using Playwright. Run after
// `pnpm data:generate` and before any OCR pass that wants PDFs.
//
//   pnpm data:render-pdf --seed 1
//
// Each invoice HTML in data/fixtures/<seed>/invoices/inv-*.html gets
// a sibling .pdf written alongside it. Multi-page anomalies render
// across two pages automatically via Chromium's print-to-PDF rules.

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
  console.log(`[helm:render-pdf] seed=${seed} files=${entries.length} concurrency=${concurrency}`);

  const browser = await chromium.launch();
  const start = Date.now();

  let next = 0;
  let done = 0;

  async function worker(): Promise<void> {
    const context = await browser.newContext();
    const page = await context.newPage();
    try {
      while (true) {
        const idx = next++;
        if (idx >= entries.length) return;
        const file = entries[idx]!;
        const htmlPath = join(invoicesDir, file);
        const pdfPath = htmlPath.replace(/\.html$/, '.pdf');
        const html = await readFile(htmlPath, 'utf8');
        await page.setContent(html, { waitUntil: 'load' });
        await page.pdf({
          path: pdfPath,
          format: 'Letter',
          printBackground: true,
          margin: { top: '0.4in', bottom: '0.4in', left: '0.4in', right: '0.4in' },
        });
        done++;
        if (done % 25 === 0) {
          console.log(`[helm:render-pdf] ${done}/${entries.length}`);
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
  console.log(`[helm:render-pdf] done. ${entries.length} PDFs in ${elapsed}s`);
}

main().catch((err) => {
  console.error('[helm:render-pdf] failed:', err);
  process.exitCode = 1;
});
