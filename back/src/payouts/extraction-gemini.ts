// Gemini payout reasoner. Reads policy.md as the system instruction
// and each creator's orders as the user message; returns a structured
// PayoutBreakdown. Same pacing + responseSchema discipline as the
// invoice-OCR Gemini extractor.

import { GoogleGenAI, Type } from '@google/genai';
import { PayoutBreakdownSchema } from './schema.js';
import type {
  Reconciler,
  ReconciliationResult,
  ReconcilerUsage,
} from './extraction.js';
import type { OrderRow } from '../../../data/generators/orders/policy.js';
import type { Creator } from '../../../data/generators/corpus/creators.js';

export type GeminiReconcilerOptions = {
  apiKey?: string;
  model?: string;
  maxOutputTokens?: number;
  temperature?: number;
  minIntervalMs?: number;
  maxParseRetries?: number;
};

const DEFAULT_MODEL = process.env.GEMINI_MODEL ?? 'gemini-3.1-flash-lite';

const PRICING = {
  inputCostPerMillion: 0.1,
  outputCostPerMillion: 0.4,
};

const RESPONSE_SCHEMA = {
  type: Type.OBJECT,
  properties: {
    creator_id: { type: Type.STRING },
    orders_counted: { type: Type.INTEGER },
    orders_excluded: { type: Type.INTEGER },
    gross_revenue: { type: Type.NUMBER },
    total_refunds: { type: Type.NUMBER },
    total_shipping: { type: Type.NUMBER },
    total_platform_fees: { type: Type.NUMBER },
    total_promo_credits: { type: Type.NUMBER },
    commissionable_base: { type: Type.NUMBER },
    commission_rate: { type: Type.NUMBER },
    gross_commission: { type: Type.NUMBER },
    net_payout_native: { type: Type.NUMBER },
    net_payout_usd: { type: Type.NUMBER },
    meets_minimum_threshold: { type: Type.BOOLEAN },
    payout_status: { type: Type.STRING, enum: ['paid_out', 'carry_forward'] },
  },
  required: [
    'creator_id',
    'orders_counted',
    'orders_excluded',
    'gross_revenue',
    'total_refunds',
    'total_shipping',
    'total_platform_fees',
    'total_promo_credits',
    'commissionable_base',
    'commission_rate',
    'gross_commission',
    'net_payout_native',
    'net_payout_usd',
    'meets_minimum_threshold',
    'payout_status',
  ],
};

export function createGeminiReconciler(options: GeminiReconcilerOptions = {}): Reconciler {
  const apiKey = options.apiKey ?? process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error(
      '[helm:gemini-payouts] GEMINI_API_KEY is not set. Get a free key at https://aistudio.google.com/app/apikey then add it to your .env.',
    );
  }
  const ai = new GoogleGenAI({ apiKey });
  const model = options.model ?? DEFAULT_MODEL;
  const maxOutputTokens = options.maxOutputTokens ?? 1024;
  const temperature = options.temperature ?? 0;
  const minIntervalMs =
    options.minIntervalMs ?? Number(process.env.GEMINI_MIN_INTERVAL_MS ?? 4000);
  const maxParseRetries = options.maxParseRetries ?? 1;

  let lastCallStartedAt = 0;

  return async (creator, orders, policy): Promise<ReconciliationResult> => {
    const sinceLast = Date.now() - lastCallStartedAt;
    if (sinceLast < minIntervalMs && lastCallStartedAt > 0) {
      await delay(minIntervalMs - sinceLast);
    }
    lastCallStartedAt = Date.now();

    const start = Date.now();
    const userMessage = buildUserMessage(creator, orders);

    let lastError: string | null = null;
    let lastRaw: unknown = null;
    let totalUsage: ReconcilerUsage = { input_tokens: 0, output_tokens: 0, cost_usd: 0 };

    for (let attempt = 0; attempt <= maxParseRetries; attempt++) {
      try {
        const response = await ai.models.generateContent({
          model,
          contents: [{ role: 'user', parts: [{ text: attempt === 0 ? userMessage : userMessage + '\n\nYour previous response did not validate against the schema. Retry.' }] }],
          config: {
            systemInstruction: policy,
            responseMimeType: 'application/json',
            responseSchema: RESPONSE_SCHEMA,
            temperature,
            maxOutputTokens,
          },
        });

        const usage = response.usageMetadata;
        if (usage) {
          totalUsage = accumulate(totalUsage, {
            input_tokens: usage.promptTokenCount ?? 0,
            output_tokens: usage.candidatesTokenCount ?? 0,
            cost_usd: computeCost(usage.promptTokenCount ?? 0, usage.candidatesTokenCount ?? 0),
          });
        }

        const text = response.text ?? '';
        lastRaw = { text, finishReason: response.candidates?.[0]?.finishReason };

        let parsedJson: unknown;
        try {
          parsedJson = JSON.parse(text);
        } catch (err) {
          lastError = `JSON.parse failed: ${(err as Error).message}`;
          continue;
        }

        const validated = PayoutBreakdownSchema.safeParse(parsedJson);
        if (!validated.success) {
          lastError = validated.error.message;
          continue;
        }

        return {
          creator_id: creator.id,
          breakdown: validated.data,
          raw_response: lastRaw,
          usage: totalUsage,
          latency_ms: Date.now() - start,
          parse_error: null,
        };
      } catch (err) {
        return {
          creator_id: creator.id,
          breakdown: null,
          raw_response: { error: (err as Error).message },
          usage: totalUsage,
          latency_ms: Date.now() - start,
          parse_error: (err as Error).message,
        };
      }
    }

    return {
      creator_id: creator.id,
      breakdown: null,
      raw_response: lastRaw,
      usage: totalUsage,
      latency_ms: Date.now() - start,
      parse_error: lastError ?? 'unknown parse failure',
    };
  };
}

function buildUserMessage(creator: Creator, orders: readonly OrderRow[]): string {
  const header = `Compute the payout for creator ${creator.id} (handle ${creator.handle}, tier ${creator.tier}, currency ${creator.currency}).

Orders for this creator (CSV):
order_id,order_date,gross_revenue,refunds,shipping_cost,platform_fee,promo_credit,status`;

  const rows = orders.map((o) =>
    [
      o.order_id,
      o.order_date,
      o.gross_revenue.toFixed(2),
      o.refunds.toFixed(2),
      o.shipping_cost.toFixed(2),
      o.platform_fee.toFixed(2),
      o.promo_credit.toFixed(2),
      o.status,
    ].join(','),
  );

  return `${header}\n${rows.join('\n')}\n\nApply the policy and emit the JSON payout breakdown for this creator.`;
}

function computeCost(inputTokens: number, outputTokens: number): number {
  const cost =
    (inputTokens / 1_000_000) * PRICING.inputCostPerMillion +
    (outputTokens / 1_000_000) * PRICING.outputCostPerMillion;
  return Math.round(cost * 1_000_000) / 1_000_000;
}

function accumulate(acc: ReconcilerUsage, next: ReconcilerUsage): ReconcilerUsage {
  return {
    input_tokens: acc.input_tokens + next.input_tokens,
    output_tokens: acc.output_tokens + next.output_tokens,
    cost_usd: Math.round((acc.cost_usd + next.cost_usd) * 1_000_000) / 1_000_000,
  };
}

function delay(ms: number): Promise<void> {
  return new Promise((res) => setTimeout(res, ms));
}
