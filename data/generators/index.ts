// CLI entry point for all three generators. Reads seed and count flags,
// writes outputs under data/fixtures/<seed>/. Run via `pnpm data:generate`
// or directly: `tsx data/generators/index.ts --seed 1 --invoices 200`.

import { parseArgs } from 'node:util';
import { join, resolve } from 'node:path';
import { generateInvoices } from './invoices/generate.js';
import { generateOrders } from './orders/generate.js';
import { generateMessages } from './messages/generate.js';

async function main(): Promise<void> {
  const { values } = parseArgs({
    options: {
      seed: { type: 'string', default: '1' },
      invoices: { type: 'string', default: '200' },
      messages: { type: 'string', default: '300' },
      'output-root': { type: 'string', default: 'data/fixtures' },
      'only': { type: 'string' },
    },
    strict: true,
  });

  const seed = Number.isNaN(Number(values.seed)) ? values.seed! : Number(values.seed);
  const invoiceCount = Number(values.invoices);
  const messageCount = Number(values.messages);
  const outputRoot = resolve(values['output-root']!);
  const seedDir = join(outputRoot, String(seed));
  const only = values.only ? new Set(values.only.split(',')) : null;

  const wantsInvoices = !only || only.has('invoices');
  const wantsOrders = !only || only.has('orders');
  const wantsMessages = !only || only.has('messages');

  console.log(`[helm:gen] seed=${seed} output=${seedDir}`);

  if (wantsInvoices) {
    const result = await generateInvoices({
      seed: `${seed}:invoices`,
      count: invoiceCount,
      outputDir: join(seedDir, 'invoices'),
    });
    console.log(
      `[helm:gen] invoices: ${result.count} files (${result.cleanCount} clean, ${result.anomalyCount} with anomalies) → ${result.outputDir}`,
    );
  }

  if (wantsOrders) {
    const result = await generateOrders({
      seed: `${seed}:orders`,
      outputDir: join(seedDir, 'orders'),
    });
    const paid = result.payouts.filter((p) => p.payout_status === 'paid_out').length;
    const totalUsd = result.payouts.reduce((acc, p) => acc + p.net_payout_usd, 0);
    console.log(
      `[helm:gen] orders: ${result.creatorCount} creators, ${result.orderCount} orders, ${paid} payouts cleared threshold ($${totalUsd.toFixed(2)} USD total) → ${result.outputDir}`,
    );
  }

  if (wantsMessages) {
    const result = await generateMessages({
      seed: `${seed}:messages`,
      count: messageCount,
      outputDir: join(seedDir, 'messages'),
    });
    const intentSummary = Object.entries(result.intentCounts)
      .map(([k, v]) => `${k}=${v}`)
      .join(' ');
    console.log(`[helm:gen] messages: ${result.count} (${intentSummary}) → ${result.outputDir}`);
  }

  console.log(`[helm:gen] done.`);
}

main().catch((err) => {
  console.error('[helm:gen] failed:', err);
  process.exitCode = 1;
});
