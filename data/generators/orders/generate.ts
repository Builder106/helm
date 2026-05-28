import { mkdir, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { createRng } from '../rng.js';
import { CREATORS } from '../corpus/creators.js';
import { computePayout, type OrderRow, type PayoutResult } from './policy.js';

export type GenerateOrdersOptions = {
  seed: number | string;
  outputDir: string;
};

export type GenerateOrdersResult = {
  creatorCount: number;
  orderCount: number;
  payouts: PayoutResult[];
  outputDir: string;
};

export async function generateOrders(options: GenerateOrdersOptions): Promise<GenerateOrdersResult> {
  const rng = createRng(options.seed);
  await mkdir(options.outputDir, { recursive: true });

  const allOrders: OrderRow[] = [];
  const payouts: PayoutResult[] = [];

  for (const creator of CREATORS) {
    const creatorRng = rng.fork(`creator:${creator.id}`);
    const orderCount = creatorRng.range(8, 32);
    const orders: OrderRow[] = [];

    for (let i = 0; i < orderCount; i++) {
      orders.push(buildOrder(creatorRng.fork(`order:${i}`), creator.id, creator.currency, i));
    }

    allOrders.push(...orders);
    payouts.push(computePayout(creator, orders));
  }

  await writeFile(join(options.outputDir, 'orders.csv'), toCsv(allOrders), 'utf8');
  await writeFile(
    join(options.outputDir, 'ground-truth-payouts.json'),
    JSON.stringify(payouts, null, 2),
    'utf8',
  );
  await writeFile(join(options.outputDir, 'policy.md'), POLICY_MD, 'utf8');
  await writeFile(
    join(options.outputDir, 'manifest.json'),
    JSON.stringify(
      {
        seed: options.seed,
        creatorCount: CREATORS.length,
        orderCount: allOrders.length,
        generatedAt: new Date().toISOString(),
      },
      null,
      2,
    ),
    'utf8',
  );

  return {
    creatorCount: CREATORS.length,
    orderCount: allOrders.length,
    payouts,
    outputDir: options.outputDir,
  };
}

function buildOrder(
  rng: ReturnType<typeof createRng>,
  creatorId: string,
  currency: OrderRow['currency'],
  index: number,
): OrderRow {
  const status: OrderRow['status'] = rng.next() < 0.92
    ? 'fulfilled'
    : rng.next() < 0.6
      ? 'cancelled'
      : 'pending';

  const gross = round2(rng.float(18.0, 420.0));
  const refunds = rng.next() < 0.07 ? round2(gross * rng.float(0.2, 1.0)) : 0;
  const shipping = round2(rng.float(0, 12.5));
  const platformFee = round2(gross * 0.02);
  const promoCredit = rng.next() < 0.18 ? round2(gross * rng.float(0.05, 0.15)) : 0;
  const date = randomDateInRange(rng, '2026-04-01', '2026-04-30');

  return {
    order_id: `o-${creatorId}-${String(index + 1).padStart(4, '0')}`,
    creator_id: creatorId,
    order_date: date,
    gross_revenue: gross,
    refunds,
    shipping_cost: shipping,
    platform_fee: platformFee,
    promo_credit: promoCredit,
    currency,
    status,
  };
}

function toCsv(rows: readonly OrderRow[]): string {
  const header = [
    'order_id',
    'creator_id',
    'order_date',
    'gross_revenue',
    'refunds',
    'shipping_cost',
    'platform_fee',
    'promo_credit',
    'currency',
    'status',
  ];
  const lines = [header.join(',')];
  for (const r of rows) {
    lines.push(
      [
        r.order_id,
        r.creator_id,
        r.order_date,
        r.gross_revenue.toFixed(2),
        r.refunds.toFixed(2),
        r.shipping_cost.toFixed(2),
        r.platform_fee.toFixed(2),
        r.promo_credit.toFixed(2),
        r.currency,
        r.status,
      ].join(','),
    );
  }
  return lines.join('\n') + '\n';
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

function randomDateInRange(rng: ReturnType<typeof createRng>, startIso: string, endIso: string): string {
  const start = Date.parse(startIso);
  const end = Date.parse(endIso);
  const t = start + Math.floor(rng.next() * (end - start));
  return new Date(t).toISOString().slice(0, 10);
}

// Natural-language policy. Claude reads this with prompt caching; the
// programmatic mirror in policy.ts produces ground-truth payouts for
// evaluation. Keep the two in sync.
const POLICY_MD = `# Creator Payout Policy — April 2026

This is the policy the Helm reconciler applies to monthly creator orders. The platform pays creators based on the rules below.

## Eligibility

Only orders with status \`fulfilled\` count toward the monthly payout. Orders that are \`cancelled\` or \`pending\` are excluded entirely — they do not contribute to gross revenue, refunds, shipping, fees, or promo credits.

## Commission tiers

Creators are placed in one of three tiers based on their contract:

- **Standard** — 8% commission on commissionable base.
- **Plus** — 11% commission on commissionable base.
- **Elite** — 14% commission on commissionable base.

## Commissionable base

The commissionable base is computed per creator across all eligible orders for the period:

\`\`\`
commissionable_base =
    sum(gross_revenue)
  - sum(refunds)
  - sum(shipping_cost)
  - sum(platform_fee)
  - promo_credit_deduction
\`\`\`

The \`promo_credit_deduction\` depends on tier:

- **Standard and Plus**: \`promo_credit_deduction = sum(promo_credit)\`.
- **Elite**: \`promo_credit_deduction = 0\` (Elite-tier perk — promo credits do not reduce their base).

If the commissionable base would be negative, it is clamped to zero.

## Gross commission and net payout

\`gross_commission = commissionable_base × commission_rate\`. \`net_payout_native\` equals \`gross_commission\` (no further deductions apply in the current policy).

## Currency conversion

Net payout is also reported in USD using these fixed FX rates for the period:

| Currency | USD per 1 unit |
| --- | --- |
| USD | 1.00 |
| EUR | 1.09 |
| GBP | 1.28 |
| CAD | 0.74 |

\`net_payout_usd = net_payout_native × fx_to_usd[currency]\`.

## Minimum payout threshold

If \`net_payout_usd < $50.00\`, the creator's balance is **not paid out this period** — it carries forward to next month. The payout status is \`carry_forward\`. Otherwise the status is \`paid_out\`.

## Rounding

All monetary values are rounded to the nearest cent (two decimal places) at each step.
`;
