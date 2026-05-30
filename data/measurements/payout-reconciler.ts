// End-to-end measurement for the Creator Payout Reconciler sub-feature.
//
//   pnpm measure:payout-reconciler --seed 1 [--extractor=mock|gemini]
//
// Walks the seed=N fixture's orders.csv + policy.md, computes a
// per-creator payout via the chosen Reconciler, and scores each
// breakdown against the deterministic ground truth in
// ground-truth-payouts.json. Writes a structured report under
// data/measurements/output/seed-N/payout-reconciler/.

import { parseArgs } from 'node:util';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { join, resolve } from 'node:path';
import {
  createMockReconciler,
  type Reconciler,
} from '../../back/src/payouts/extraction.js';
import { createGeminiReconciler } from '../../back/src/payouts/extraction-gemini.js';
import type { OrderRow, PayoutResult } from '../generators/orders/policy.js';
import { CREATORS } from '../generators/corpus/creators.js';
import type { Creator } from '../generators/corpus/creators.js';
import type { PayoutBreakdown } from '../../back/src/payouts/schema.js';

const CENTS_TOLERANCE = 0.01;
const FIELDS_PER_CREATOR = 14; // count of fields compared per creator

type PerCreatorRecord = {
  creator_id: string;
  handle: string;
  tier: Creator['tier'];
  currency: Creator['currency'];
  parsed: boolean;
  parse_error: string | null;
  fields_correct: number;
  fields_total: number;
  field_accuracy: number;
  exact_match: boolean;
  truth_payout_usd: number;
  predicted_payout_usd: number;
  payout_drift_usd: number;
  status_correct: boolean;
  cost_usd: number;
  latency_ms: number;
};

async function main(): Promise<void> {
  const { values } = parseArgs({
    options: {
      seed: { type: 'string', default: '1' },
      'fixtures-root': { type: 'string', default: 'data/fixtures' },
      'output-root': { type: 'string', default: 'data/measurements/output' },
      extractor: { type: 'string', default: 'mock' },
      limit: { type: 'string' },
    },
    strict: true,
  });

  const seed = values.seed!;
  const fixtureDir = resolve(values['fixtures-root']!, seed, 'orders');
  const outDir = resolve(values['output-root']!, `seed-${seed}`, 'payout-reconciler');
  const limit = values.limit ? Number(values.limit) : null;

  const [policy, orders, groundTruth] = await Promise.all([
    readFile(join(fixtureDir, 'policy.md'), 'utf8'),
    loadOrders(join(fixtureDir, 'orders.csv')),
    loadGroundTruth(join(fixtureDir, 'ground-truth-payouts.json')),
  ]);

  const groundTruthByCreator = new Map(groundTruth.map((p) => [p.creator_id, p]));
  const ordersByCreator = groupByCreator(orders);

  const creatorList = limit ? CREATORS.slice(0, limit) : CREATORS;

  const reconciler = await buildReconciler(values.extractor!, groundTruthByCreator, seed);
  console.log(`[helm:measure-payouts] seed=${seed} extractor=${values.extractor} creators=${creatorList.length}`);

  const records: PerCreatorRecord[] = [];
  const startWall = Date.now();

  for (const creator of creatorList) {
    const creatorOrders = ordersByCreator.get(creator.id) ?? [];
    const truth = groundTruthByCreator.get(creator.id)!;
    const result = await reconciler(creator, creatorOrders, policy);

    const record = scoreOne(creator, truth, result);
    records.push(record);
  }

  const wallMs = Date.now() - startWall;
  const headline = computeHeadline(records, wallMs);

  await mkdir(outDir, { recursive: true });
  await writeFile(
    join(outDir, 'report.json'),
    JSON.stringify({ seed, extractor: values.extractor, wallMs, headline, records }, null, 2),
    'utf8',
  );
  await writeFile(join(outDir, 'summary.md'), renderSummary(headline, seed, values.extractor!), 'utf8');

  console.log(`[helm:measure-payouts] done.`);
  console.log(`  exact match: ${headline.exact_match_count}/${headline.creators_processed} (${(headline.exact_match_rate * 100).toFixed(1)}%)`);
  console.log(`  field acc:   ${(headline.extraction.field_accuracy * 100).toFixed(1)}%`);
  console.log(`  reconciled:  $${headline.dollars_reconciled.toFixed(2)} ($${headline.max_payout_drift_usd.toFixed(2)} max drift)`);
  console.log(`  cost:        $${headline.cost.total_usd.toFixed(4)} total · $${headline.cost.mean_per_creator_usd.toFixed(6)}/creator`);
  console.log(`  latency:     p50=${headline.latency.p50_ms}ms p95=${headline.latency.p95_ms}ms`);
  console.log(`  output → ${outDir}`);
}

async function buildReconciler(
  kind: string,
  groundTruth: Map<string, PayoutResult>,
  seed: string,
): Promise<Reconciler> {
  if (kind === 'mock') {
    return createMockReconciler(groundTruth, { seed: `${seed}:mock-payouts` });
  }
  if (kind === 'gemini') {
    return createGeminiReconciler();
  }
  throw new Error(`unknown extractor: ${kind}. Supported: mock, gemini`);
}

async function loadOrders(path: string): Promise<OrderRow[]> {
  const raw = await readFile(path, 'utf8');
  const lines = raw.trim().split('\n');
  const header = lines[0]!.split(',');
  const rows: OrderRow[] = [];
  for (let i = 1; i < lines.length; i++) {
    const cells = lines[i]!.split(',');
    const obj: Record<string, string> = {};
    header.forEach((h, j) => {
      obj[h] = cells[j] ?? '';
    });
    rows.push({
      order_id: obj.order_id!,
      creator_id: obj.creator_id!,
      order_date: obj.order_date!,
      gross_revenue: Number(obj.gross_revenue),
      refunds: Number(obj.refunds),
      shipping_cost: Number(obj.shipping_cost),
      platform_fee: Number(obj.platform_fee),
      promo_credit: Number(obj.promo_credit),
      currency: obj.currency as OrderRow['currency'],
      status: obj.status as OrderRow['status'],
    });
  }
  return rows;
}

async function loadGroundTruth(path: string): Promise<PayoutResult[]> {
  const raw = await readFile(path, 'utf8');
  return JSON.parse(raw) as PayoutResult[];
}

function groupByCreator(orders: readonly OrderRow[]): Map<string, OrderRow[]> {
  const m = new Map<string, OrderRow[]>();
  for (const o of orders) {
    const arr = m.get(o.creator_id);
    if (arr) arr.push(o);
    else m.set(o.creator_id, [o]);
  }
  return m;
}

function scoreOne(
  creator: Creator,
  truth: PayoutResult,
  result: { breakdown: PayoutBreakdown | null; parse_error: string | null; usage: { cost_usd: number }; latency_ms: number },
): PerCreatorRecord {
  if (!result.breakdown) {
    return {
      creator_id: creator.id,
      handle: creator.handle,
      tier: creator.tier,
      currency: creator.currency,
      parsed: false,
      parse_error: result.parse_error,
      fields_correct: 0,
      fields_total: FIELDS_PER_CREATOR,
      field_accuracy: 0,
      exact_match: false,
      truth_payout_usd: truth.net_payout_usd,
      predicted_payout_usd: 0,
      payout_drift_usd: truth.net_payout_usd,
      status_correct: false,
      cost_usd: result.usage.cost_usd,
      latency_ms: result.latency_ms,
    };
  }

  const b = result.breakdown;
  const comparisons: Array<[unknown, unknown]> = [
    [b.orders_counted, truth.orders_counted],
    [b.orders_excluded, truth.orders_excluded],
    [closeEnough(b.gross_revenue, truth.gross_revenue), true],
    [closeEnough(b.total_refunds, truth.total_refunds), true],
    [closeEnough(b.total_shipping, truth.total_shipping), true],
    [closeEnough(b.total_platform_fees, truth.total_platform_fees), true],
    [closeEnough(b.total_promo_credits, truth.total_promo_credits), true],
    [closeEnough(b.commissionable_base, truth.commissionable_base), true],
    [closeEnough(b.commission_rate, truth.commission_rate, 0.0001), true],
    [closeEnough(b.gross_commission, truth.gross_commission), true],
    [closeEnough(b.net_payout_native, truth.net_payout_native), true],
    [closeEnough(b.net_payout_usd, truth.net_payout_usd), true],
    [b.meets_minimum_threshold, truth.meets_minimum_threshold],
    [b.payout_status, truth.payout_status],
  ];

  const correct = comparisons.filter(([a, exp]) => a === exp).length;
  const total = comparisons.length;

  return {
    creator_id: creator.id,
    handle: creator.handle,
    tier: creator.tier,
    currency: creator.currency,
    parsed: true,
    parse_error: null,
    fields_correct: correct,
    fields_total: total,
    field_accuracy: correct / total,
    exact_match: correct === total,
    truth_payout_usd: truth.net_payout_usd,
    predicted_payout_usd: b.net_payout_usd,
    payout_drift_usd: Math.abs(b.net_payout_usd - truth.net_payout_usd),
    status_correct: b.payout_status === truth.payout_status,
    cost_usd: result.usage.cost_usd,
    latency_ms: result.latency_ms,
  };
}

function closeEnough(a: number, b: number, tol = CENTS_TOLERANCE): boolean {
  return Math.abs(a - b) <= tol;
}

function computeHeadline(records: readonly PerCreatorRecord[], wallMs: number) {
  const parsed = records.filter((r) => r.parsed);
  const parseRate = parsed.length / records.length;
  const exactMatchCount = records.filter((r) => r.exact_match).length;
  const exactMatchRate = exactMatchCount / records.length;
  const fieldAccuracy =
    parsed.length > 0
      ? parsed.reduce((s, r) => s + r.field_accuracy, 0) / parsed.length
      : 0;
  const statusCorrect = records.filter((r) => r.status_correct).length;

  const dollarsReconciled = records.reduce((s, r) => s + r.predicted_payout_usd, 0);
  const truthDollars = records.reduce((s, r) => s + r.truth_payout_usd, 0);
  const drifts = records.map((r) => r.payout_drift_usd);
  const maxDrift = Math.max(...drifts);
  const totalDrift = drifts.reduce((a, b) => a + b, 0);

  const totalCost = records.reduce((s, r) => s + r.cost_usd, 0);
  const meanCost = totalCost / records.length;

  const lats = records.map((r) => r.latency_ms).sort((a, b) => a - b);
  const p50 = lats[Math.floor(lats.length * 0.5)] ?? 0;
  const p95 = lats[Math.floor(lats.length * 0.95)] ?? 0;
  const p99 = lats[Math.floor(lats.length * 0.99)] ?? 0;

  // Labor model: hand-reconciling a creator's payout from a CSV +
  // policy takes ~3 min at $25/hr. Helm-handled = auto-approved for
  // exact-match cases, ~1 min review for discrepancies.
  const MANUAL_MIN_PER_CREATOR = 3;
  const REVIEW_MIN_PER_DISCREPANCY = 1;
  const LOADED_WAGE_PER_HR = 25;
  const manualMinutes = records.length * MANUAL_MIN_PER_CREATOR;
  const helmMinutes = (records.length - exactMatchCount) * REVIEW_MIN_PER_DISCREPANCY;
  const minutesSaved = manualMinutes - helmMinutes;
  const dollarsSaved = (minutesSaved / 60) * LOADED_WAGE_PER_HR;
  const reductionRatio = manualMinutes / Math.max(helmMinutes, 1);

  return {
    creators_processed: records.length,
    wall_ms: wallMs,
    extraction: {
      parse_rate: round4(parseRate),
      field_accuracy: round4(fieldAccuracy),
    },
    exact_match_count: exactMatchCount,
    exact_match_rate: round4(exactMatchRate),
    status_classification: {
      correct: statusCorrect,
      total: records.length,
      accuracy: round4(statusCorrect / records.length),
    },
    dollars_reconciled: round2(dollarsReconciled),
    truth_dollars: round2(truthDollars),
    total_payout_drift_usd: round2(totalDrift),
    max_payout_drift_usd: round2(maxDrift),
    cost: {
      total_usd: round6(totalCost),
      mean_per_creator_usd: round6(meanCost),
    },
    latency: { p50_ms: p50, p95_ms: p95, p99_ms: p99 },
    labor: {
      manual_minutes: manualMinutes,
      helm_minutes: helmMinutes,
      minutes_saved: minutesSaved,
      dollars_saved: round4(dollarsSaved),
      time_reduction_ratio: round2(reductionRatio),
    },
  };
}

function renderSummary(headline: ReturnType<typeof computeHeadline>, seed: string, extractor: string): string {
  const mockBanner =
    extractor === 'mock'
      ? `> ⚠️ **Mock reconciler.** Field accuracy and per-creator drift below come from a controlled-noise mock of the policy-reasoning call, not real API output. Run with \`--extractor gemini\` for measured numbers.\n\n`
      : '';
  const modelLine =
    extractor === 'gemini' ? '_Model: Gemini 3.1 Flash Lite via Google AI Studio._\n\n' : '';
  return `# Creator Payout Reconciler — measurement (seed=${seed}, extractor=${extractor})

${mockBanner}${modelLine}> ${headline.creators_processed} creators reconciled. Exact-match rate **${(headline.exact_match_rate * 100).toFixed(1)}%**, field accuracy **${(headline.extraction.field_accuracy * 100).toFixed(1)}%**, status classification **${(headline.status_classification.accuracy * 100).toFixed(1)}%**. Total payouts reconciled: $${headline.dollars_reconciled.toFixed(2)} (ground truth: $${headline.truth_dollars.toFixed(2)}; max single-creator drift $${headline.max_payout_drift_usd.toFixed(2)}). Mean cost $${headline.cost.mean_per_creator_usd.toFixed(6)}/creator.

## Labor model

Hand-reconciling each creator's payout from CSV + policy takes ~3 min at $25/hr; Helm reduces that to ~1 min review on discrepancies only. Manual baseline cost: $${((headline.labor.manual_minutes / 60) * 25).toFixed(2)}; Helm-routed: $${((headline.labor.helm_minutes / 60) * 25).toFixed(2)} — a ${headline.labor.time_reduction_ratio}× reduction.

## Reconciliation quality

| metric | value |
| --- | --- |
| parse rate | ${(headline.extraction.parse_rate * 100).toFixed(1)}% |
| exact-match rate | ${(headline.exact_match_rate * 100).toFixed(1)}% (${headline.exact_match_count} / ${headline.creators_processed}) |
| field accuracy | ${(headline.extraction.field_accuracy * 100).toFixed(1)}% |
| payout_status correct | ${(headline.status_classification.accuracy * 100).toFixed(1)}% (${headline.status_classification.correct} / ${headline.status_classification.total}) |
| total $ reconciled | $${headline.dollars_reconciled.toFixed(2)} |
| max creator drift | $${headline.max_payout_drift_usd.toFixed(2)} |

## Cost & latency

| metric | value |
| --- | --- |
| mean cost / creator | $${headline.cost.mean_per_creator_usd.toFixed(6)} |
| total cost | $${headline.cost.total_usd.toFixed(4)} |
| p50 latency | ${headline.latency.p50_ms} ms |
| p95 latency | ${headline.latency.p95_ms} ms |

---

_Reproduced by_ \`pnpm measure:payout-reconciler --seed ${seed} --extractor ${extractor}\`. _Per-creator trace is in_ \`report.json\`.
`;
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}
function round4(n: number): number {
  return Math.round(n * 10000) / 10000;
}
function round6(n: number): number {
  return Math.round(n * 1_000_000) / 1_000_000;
}

main().catch((err) => {
  console.error('[helm:measure-payouts] failed:', err);
  process.exitCode = 1;
});
