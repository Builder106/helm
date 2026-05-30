// Gemini Flash vision extractor. Helm's locked-default OCR path.
//
// Why Gemini: image tokens are flat-rated per tile (~258 per typical
// PNG) versus Groq's per-pixel-patch counting (~6,400 per image).
// Lower image-token cost = more invoices per daily quota.
//
// Model: gemini-3.1-flash-lite by default (override via GEMINI_MODEL).
// Lesson learned the hard way: don't hard-code a vendor model name.
// gemini-2.0-flash was pulled from the free tier in 2026; 2.5-flash
// then carried a ~25 RPD free-tier cap that blocked the corpus.
// 3.1-flash-lite is the current best-fit for high RPD + low cost.
// Reach options: gemini-3.1-pro for KPI Q&A reasoning depth; fall
// back to gemini-2.5-flash if 3.1 ever ships breaking changes.
//
// Pacing: the extractor self-paces by tracking the last-call
// timestamp and sleeping to maintain a minimum interval. Default
// 4s (15 RPM, the typical Lite-tier ceiling). Override via
// GEMINI_MIN_INTERVAL_MS.
//
// The Groq extractor in ./extraction-groq.ts stays in the repo as an
// alternative provider; the Extractor interface is provider-agnostic
// by design. Default is Gemini.

import { readFile } from 'node:fs/promises';
import { GoogleGenAI, Type } from '@google/genai';
import { ExtractedInvoiceSchema } from './schema.js';
import type { Extractor, ExtractionResult, ExtractionUsage } from './extraction.js';

export type GeminiExtractorOptions = {
  apiKey?: string;
  model?: string;
  /** Maximum tokens to emit. The schema fits comfortably under 1024. */
  maxOutputTokens?: number;
  /** 0 for deterministic structured extraction. */
  temperature?: number;
  /** Minimum interval between API calls in ms. Defaults from
   * GEMINI_MIN_INTERVAL_MS env, else 4000ms (15 RPM ideal for the
   * Flash-Lite tier). Raise to 6500ms for non-Lite Flash variants. */
  minIntervalMs?: number;
  /** Retry budget on schema-validation failures. */
  maxParseRetries?: number;
};

// Gemini model — overridable via GEMINI_MODEL env var. Default
// rotates with whatever Google's current best-fit free-tier option
// is for this workload. Never hard-code a specific model in
// component code; consume DEFAULT_MODEL or the env override.
const DEFAULT_MODEL = process.env.GEMINI_MODEL ?? 'gemini-3.1-flash-lite';

// Public Gemini 3.1 Flash-Lite rates (paid-tier). The free tier is
// $0, but the dashboard reports cost as if paid so the per-invoice
// number is meaningful at scale. Image tokens count as input. If you
// swap to a non-Lite variant via GEMINI_MODEL, also update these
// constants — the math doesn't auto-rescale.
const PRICING = {
  inputCostPerMillion: 0.10,
  outputCostPerMillion: 0.40,
};

const SYSTEM_PROMPT = `You are an invoice OCR assistant. Given a single invoice image, extract its structured fields and respond with JSON that matches the schema provided in the response config.

Field rules:
- vendor_name, vendor_address_street, vendor_address_city_state_zip: extract as printed on the invoice; city/state/zip combined as "City, ST 12345"
- invoice_number: as printed
- invoice_date, due_date: ISO YYYY-MM-DD; due_date is null if not present on the invoice
- line_items: array of {description, quantity, unit_price, line_total}; numeric fields as numbers (no currency symbol)
- subtotal, tax_amount, total: numbers (no currency symbol)
- tax_rate: decimal, e.g. 0.0825 for 8.25%; if shown as a percentage on the invoice, divide by 100

Do not fabricate values you cannot read.`;

// Gemini response schema — constrains output to match ExtractedInvoiceSchema.
// Gemini enforces this server-side; combined with Zod parsing on the client,
// schema drift becomes effectively impossible.
const RESPONSE_SCHEMA = {
  type: Type.OBJECT,
  properties: {
    vendor_name: { type: Type.STRING },
    vendor_address_street: { type: Type.STRING },
    vendor_address_city_state_zip: { type: Type.STRING },
    invoice_number: { type: Type.STRING },
    invoice_date: { type: Type.STRING },
    due_date: { type: Type.STRING, nullable: true },
    line_items: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          description: { type: Type.STRING },
          quantity: { type: Type.NUMBER },
          unit_price: { type: Type.NUMBER },
          line_total: { type: Type.NUMBER },
        },
        required: ['description', 'quantity', 'unit_price', 'line_total'],
      },
    },
    subtotal: { type: Type.NUMBER },
    tax_rate: { type: Type.NUMBER },
    tax_amount: { type: Type.NUMBER },
    total: { type: Type.NUMBER },
  },
  required: [
    'vendor_name',
    'vendor_address_street',
    'vendor_address_city_state_zip',
    'invoice_number',
    'invoice_date',
    'due_date',
    'line_items',
    'subtotal',
    'tax_rate',
    'tax_amount',
    'total',
  ],
};

export function createGeminiExtractor(options: GeminiExtractorOptions = {}): Extractor {
  const apiKey = options.apiKey ?? process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error(
      '[helm:gemini] GEMINI_API_KEY is not set. Get a free key at https://aistudio.google.com/app/apikey then add it to your .env (see .env.example).',
    );
  }

  const ai = new GoogleGenAI({ apiKey });
  const model = options.model ?? DEFAULT_MODEL;
  const maxOutputTokens = options.maxOutputTokens ?? 1024;
  const temperature = options.temperature ?? 0;
  const minIntervalMs =
    options.minIntervalMs ?? Number(process.env.GEMINI_MIN_INTERVAL_MS ?? 4000);
  const maxParseRetries = options.maxParseRetries ?? 1;

  // Pace requests to stay under the 15 RPM free-tier limit. Tracks the
  // timestamp of the most-recent call (across invocations of the
  // returned extractor) and sleeps if the next call would arrive too
  // soon. Idempotent under concurrent callers because the extractor is
  // used serially in the measurement script.
  let lastCallStartedAt = 0;

  return async (imagePath): Promise<ExtractionResult> => {
    // Pace.
    const sinceLast = Date.now() - lastCallStartedAt;
    if (sinceLast < minIntervalMs && lastCallStartedAt > 0) {
      await delay(minIntervalMs - sinceLast);
    }
    lastCallStartedAt = Date.now();

    const start = Date.now();
    const buf = await readFile(imagePath);
    const base64 = buf.toString('base64');

    let lastRaw: unknown = null;
    let lastError: string | null = null;
    let totalUsage: ExtractionUsage = { input_tokens: 0, output_tokens: 0, cost_usd: 0 };

    for (let attempt = 0; attempt <= maxParseRetries; attempt++) {
      try {
        const response = await ai.models.generateContent({
          model,
          contents: [
            {
              role: 'user',
              parts: [
                { text: attempt === 0 ? 'Extract the fields from this invoice.' : 'Your previous response did not match the schema. Try again.' },
                { inlineData: { mimeType: 'image/png', data: base64 } },
              ],
            },
          ],
          config: {
            systemInstruction: SYSTEM_PROMPT,
            responseMimeType: 'application/json',
            responseSchema: RESPONSE_SCHEMA,
            temperature,
            maxOutputTokens,
          },
        });

        const usage = response.usageMetadata;
        if (usage) {
          totalUsage = accumulateUsage(totalUsage, {
            input_tokens: usage.promptTokenCount ?? 0,
            output_tokens: usage.candidatesTokenCount ?? 0,
            cost_usd: computeCost(
              usage.promptTokenCount ?? 0,
              usage.candidatesTokenCount ?? 0,
            ),
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

        const validated = ExtractedInvoiceSchema.safeParse(parsedJson);
        if (!validated.success) {
          lastError = validated.error.message;
          continue;
        }

        return {
          image_path: imagePath,
          invoice: validated.data,
          raw_response: lastRaw,
          usage: totalUsage,
          latency_ms: Date.now() - start,
          parse_error: null,
        };
      } catch (err) {
        return {
          image_path: imagePath,
          invoice: null,
          raw_response: { error: (err as Error).message },
          usage: totalUsage,
          latency_ms: Date.now() - start,
          parse_error: (err as Error).message,
        };
      }
    }

    return {
      image_path: imagePath,
      invoice: null,
      raw_response: lastRaw,
      usage: totalUsage,
      latency_ms: Date.now() - start,
      parse_error: lastError ?? 'unknown parse failure',
    };
  };
}

function computeCost(inputTokens: number, outputTokens: number): number {
  const cost =
    (inputTokens / 1_000_000) * PRICING.inputCostPerMillion +
    (outputTokens / 1_000_000) * PRICING.outputCostPerMillion;
  return Math.round(cost * 1_000_000) / 1_000_000;
}

function accumulateUsage(acc: ExtractionUsage, next: ExtractionUsage): ExtractionUsage {
  return {
    input_tokens: acc.input_tokens + next.input_tokens,
    output_tokens: acc.output_tokens + next.output_tokens,
    cost_usd: Math.round((acc.cost_usd + next.cost_usd) * 1_000_000) / 1_000_000,
  };
}

function delay(ms: number): Promise<void> {
  return new Promise((res) => setTimeout(res, ms));
}
