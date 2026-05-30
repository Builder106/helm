// Payout-reasoning abstraction. Mirrors the OCR pipeline pattern:
// a Reconciler is a function from (creator, orders, policy.md) →
// a PayoutBreakdown. Two implementations ship today:
//
//   createMockReconciler — reads the ground-truth payout for the
//     creator and returns it with controlled cent-level noise.
//   createGeminiReconciler (in ./extraction-gemini.ts) — sends the
//     policy + orders to Gemini and parses the response.
//
// Both return ReconciliationResult with cost/latency tracking so the
// measurement script can produce a unified report.

import { createRng } from '../../../data/generators/rng.js';
import type { OrderRow, PayoutResult } from '../../../data/generators/orders/policy.js';
import type { Creator } from '../../../data/generators/corpus/creators.js';
import { PayoutBreakdownSchema } from './schema.js';
import type { PayoutBreakdown } from './schema.js';

export type ReconcilerUsage = {
  input_tokens: number;
  output_tokens: number;
  cost_usd: number;
};

export type ReconciliationResult = {
  creator_id: string;
  breakdown: PayoutBreakdown | null;
  raw_response: unknown;
  usage: ReconcilerUsage;
  latency_ms: number;
  parse_error: string | null;
};

export type Reconciler = (
  creator: Creator,
  orders: OrderRow[],
  policy: string,
) => Promise<ReconciliationResult>;

export type MockReconcilerOptions = {
  seed: number | string;
  /** Probability the LLM gets the commission rate wrong (off-by-one tier). */
  wrongRateRate?: number;
  /** Probability the LLM drifts the commissionable base by a few cents. */
  centDriftRate?: number;
  /** Probability the LLM misclassifies the payout_status. */
  statusFlipRate?: number;
  /** Simulated per-call latency floor / ceiling in ms. */
  latencyMinMs?: number;
  latencyMaxMs?: number;
};

// Pricing snapshot — Gemini 3.1 Flash Lite paid-tier rates. The mock
// charges these against a synthetic token count so the cost pipeline
// has something realistic to log.
const MOCK_PRICING = {
  inputTokensPerCreator: 1200, // policy + orders rows
  outputTokensPerCreator: 240, // structured payout JSON
  inputCostPerMillion: 0.1,
  outputCostPerMillion: 0.4,
};

export function createMockReconciler(
  groundTruth: Map<string, PayoutResult>,
  options: MockReconcilerOptions,
): Reconciler {
  const masterRng = createRng(options.seed);
  const wrongRate = options.wrongRateRate ?? 0.04;
  const centDrift = options.centDriftRate ?? 0.06;
  const statusFlip = options.statusFlipRate ?? 0.02;
  const latMin = options.latencyMinMs ?? 250;
  const latMax = options.latencyMaxMs ?? 900;

  return async (creator, _orders, _policy) => {
    const start = Date.now();
    const truth = groundTruth.get(creator.id);
    if (!truth) {
      return {
        creator_id: creator.id,
        breakdown: null,
        raw_response: { error: 'no ground truth for creator' },
        usage: emptyUsage(),
        latency_ms: 0,
        parse_error: `no ground-truth payout for ${creator.id}`,
      };
    }

    const rng = masterRng.fork(`mock:${creator.id}`);
    const noisy = applyNoise(truth, rng, { wrongRate, centDrift, statusFlip });
    const parsed = PayoutBreakdownSchema.safeParse(noisy);

    await delay(rng.range(latMin, latMax + 1));

    const usage = computeMockUsage();
    const latency = Date.now() - start;

    if (!parsed.success) {
      return {
        creator_id: creator.id,
        breakdown: null,
        raw_response: noisy,
        usage,
        latency_ms: latency,
        parse_error: parsed.error.message,
      };
    }

    return {
      creator_id: creator.id,
      breakdown: parsed.data,
      raw_response: noisy,
      usage,
      latency_ms: latency,
      parse_error: null,
    };
  };
}

type NoiseOptions = {
  wrongRate: number;
  centDrift: number;
  statusFlip: number;
};

function applyNoise(
  truth: PayoutResult,
  rng: ReturnType<typeof createRng>,
  opts: NoiseOptions,
): Record<string, unknown> {
  let rate = truth.commission_rate;
  if (rng.bool(opts.wrongRate)) {
    // Off-by-one tier: standard ↔ plus, plus ↔ elite.
    const rates = [0.08, 0.11, 0.14] as const;
    const cur = rates.indexOf(rate as typeof rates[number]);
    if (cur !== -1) {
      const alt = cur === 0 ? 1 : cur === rates.length - 1 ? cur - 1 : (rng.bool() ? cur + 1 : cur - 1);
      rate = rates[alt]!;
    }
  }

  let base = truth.commissionable_base;
  if (rng.bool(opts.centDrift)) {
    base = round2(base + (rng.bool() ? 1 : -1) * rng.float(0.01, 3.0));
  }

  const commission = round2(base * rate);
  const native = commission;
  const usd = round2(native * usdFx(truth.currency));
  let status: 'paid_out' | 'carry_forward' = usd >= 50 ? 'paid_out' : 'carry_forward';
  if (rng.bool(opts.statusFlip)) {
    status = status === 'paid_out' ? 'carry_forward' : 'paid_out';
  }

  return {
    creator_id: truth.creator_id,
    orders_counted: truth.orders_counted,
    orders_excluded: truth.orders_excluded,
    gross_revenue: truth.gross_revenue,
    total_refunds: truth.total_refunds,
    total_shipping: truth.total_shipping,
    total_platform_fees: truth.total_platform_fees,
    total_promo_credits: truth.total_promo_credits,
    commissionable_base: base,
    commission_rate: rate,
    gross_commission: commission,
    net_payout_native: native,
    net_payout_usd: usd,
    meets_minimum_threshold: usd >= 50,
    payout_status: status,
  };
}

function usdFx(currency: PayoutResult['currency']): number {
  const fx: Record<PayoutResult['currency'], number> = {
    USD: 1.0,
    EUR: 1.09,
    GBP: 1.28,
    CAD: 0.74,
  };
  return fx[currency];
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

function computeMockUsage(): ReconcilerUsage {
  const inputTokens = MOCK_PRICING.inputTokensPerCreator;
  const outputTokens = MOCK_PRICING.outputTokensPerCreator;
  const cost =
    (inputTokens / 1_000_000) * MOCK_PRICING.inputCostPerMillion +
    (outputTokens / 1_000_000) * MOCK_PRICING.outputCostPerMillion;
  return {
    input_tokens: inputTokens,
    output_tokens: outputTokens,
    cost_usd: Math.round(cost * 100000) / 100000,
  };
}

function emptyUsage(): ReconcilerUsage {
  return { input_tokens: 0, output_tokens: 0, cost_usd: 0 };
}

function delay(ms: number): Promise<void> {
  return new Promise((res) => setTimeout(res, ms));
}
