// Gemini Flash vision extractor. Helm's locked-default OCR path.
//
// Why Gemini over Groq Llama 4 Scout: image tokens cost a flat
// per-tile rate (~258 tokens for a typical invoice PNG) versus
// Groq's per-pixel-patch counting (~6,400 tokens for the same
// image). The Groq free tier's 500K-tokens-per-day cap blocks the
// full 200-invoice corpus at ~70 invoices; on Gemini's free tier,
// 200 invoices fit comfortably under the daily allotment.
//
// Model: gemini-2.5-flash by default (override via GEMINI_MODEL env).
// gemini-2.0-flash was pulled from Google's free tier in 2026 — the
// lesson is to keep the model overridable rather than hard-coded.
// For maximum free-tier headroom use GEMINI_MODEL=gemini-2.5-flash-lite.
//
// Pacing: the extractor self-paces — it tracks the timestamp of the
// last call and sleeps to maintain a minimum interval. Default 6.5s
// (10 RPM, comfortable under Gemini 2.5 Flash's free tier). For
// 200 invoices that's ~22 minutes end-to-end.
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
   * GEMINI_MIN_INTERVAL_MS env, else 6500ms (10 RPM = 6000ms ideal
   * for gemini-2.5-flash free tier; +500ms safety margin). Drop to
   * 4500ms for gemini-2.5-flash-lite (15 RPM). */
  minIntervalMs?: number;
  /** Retry budget on schema-validation failures. */
  maxParseRetries?: number;
};

// Gemini model — overridable via GEMINI_MODEL env var so a shift in
// Google's free-tier coverage (2.0 Flash got pulled from the free
// tier in 2026; the lesson is to not hard-code) can be answered
// without a code change. Default: gemini-2.5-flash. For more
// free-tier headroom, set GEMINI_MODEL=gemini-2.5-flash-lite.
const DEFAULT_MODEL = process.env.GEMINI_MODEL ?? 'gemini-2.5-flash';

// Public Gemini 2.5 Flash rates (paid-tier). The free tier is $0,
// but the dashboard reports cost as if paid so the per-invoice
// number is meaningful at scale. Image tokens count as input.
// (2.5-flash-lite is roughly 1/4 the price; not auto-detected here —
// override the pricing constants if you swap to lite for production.)
const PRICING = {
  inputCostPerMillion: 0.30,
  outputCostPerMillion: 2.50,
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
    options.minIntervalMs ?? Number(process.env.GEMINI_MIN_INTERVAL_MS ?? 6500);
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
