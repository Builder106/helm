// Groq + Llama 4 Scout vision extractor. The real OCR path.
//
// Llama 4 Scout is multimodal (17B activated / 16-expert mixture) and
// hosts on Groq's OpenAI-compatible chat-completions API. We send the
// invoice PNG as a base64 data URL, ask for JSON-mode output matching
// the ExtractedInvoice schema, and validate the response through Zod.
//
// Pricing snapshot (2026 announcement-time public rates): $0.11/M
// input, $0.34/M output. Real cost is computed from the API's
// `usage` field on each response.

import { readFile } from 'node:fs/promises';
import Groq from 'groq-sdk';
import { ExtractedInvoiceSchema } from './schema.js';
import type { Extractor, ExtractionResult, ExtractionUsage } from './extraction.js';

export type GroqExtractorOptions = {
  apiKey?: string;
  model?: string;
  /** Maximum tokens to emit. The schema fits comfortably under 800. */
  maxOutputTokens?: number;
  /** Temperature — 0 for deterministic structured extraction. */
  temperature?: number;
  /** Retry attempts on parse failure. */
  maxParseRetries?: number;
};

const DEFAULT_MODEL = 'meta-llama/llama-4-scout-17b-16e-instruct';

// Public Groq rates for Llama 4 Scout at the time of writing. Update
// here if the published pricing moves — the rest of the cost math
// reads from these constants.
const PRICING = {
  inputCostPerMillion: 0.11,
  outputCostPerMillion: 0.34,
};

const SYSTEM_PROMPT = `You are an invoice OCR assistant. Given a single invoice image, extract its structured fields and respond with JSON only — no prose, no markdown fences.

Output a JSON object with exactly these keys:
- vendor_name: string
- vendor_address_street: string
- vendor_address_city_state_zip: string  (formatted as "City, ST 12345")
- invoice_number: string
- invoice_date: string  (YYYY-MM-DD)
- due_date: string or null  (YYYY-MM-DD, or null if not present on the invoice)
- line_items: array of objects, each with:
    - description: string
    - quantity: number
    - unit_price: number  (US dollars, no currency symbol)
    - line_total: number  (US dollars, no currency symbol)
- subtotal: number
- tax_rate: number  (decimal, e.g. 0.0825 for 8.25%)
- tax_amount: number
- total: number

If the tax rate is shown only as a percentage, divide by 100 to give the decimal form. If a field is genuinely absent from the invoice, omit it for due_date (set to null) — but for any other field, do your best to extract what is there. Do not fabricate values you cannot read.`;

export function createGroqLlamaExtractor(options: GroqExtractorOptions = {}): Extractor {
  const apiKey = options.apiKey ?? process.env.GROQ_API_KEY;
  if (!apiKey) {
    throw new Error(
      '[helm:groq] GROQ_API_KEY is not set. Add it to your .env (see .env.example) before running with --extractor=groq.',
    );
  }
  const client = new Groq({ apiKey });
  const model = options.model ?? DEFAULT_MODEL;
  const maxOutputTokens = options.maxOutputTokens ?? 1024;
  const temperature = options.temperature ?? 0;
  const maxParseRetries = options.maxParseRetries ?? 1;

  return async (imagePath): Promise<ExtractionResult> => {
    const start = Date.now();
    const buf = await readFile(imagePath);
    const dataUrl = `data:image/png;base64,${buf.toString('base64')}`;

    let lastRaw: unknown = null;
    let lastError: string | null = null;
    let totalUsage: ExtractionUsage = { input_tokens: 0, output_tokens: 0, cost_usd: 0 };

    for (let attempt = 0; attempt <= maxParseRetries; attempt++) {
      try {
        const response = await client.chat.completions.create({
          model,
          messages: [
            { role: 'system', content: SYSTEM_PROMPT },
            {
              role: 'user',
              content: [
                {
                  type: 'text',
                  text:
                    attempt === 0
                      ? 'Extract the fields from this invoice.'
                      : 'Your previous response did not parse cleanly as the required JSON schema. Try again — JSON object only.',
                },
                { type: 'image_url', image_url: { url: dataUrl } },
              ],
            },
          ],
          response_format: { type: 'json_object' },
          max_completion_tokens: maxOutputTokens,
          temperature,
        });

        const usage = response.usage;
        if (usage) {
          totalUsage = accumulateUsage(totalUsage, {
            input_tokens: usage.prompt_tokens ?? 0,
            output_tokens: usage.completion_tokens ?? 0,
            cost_usd: computeCost(usage.prompt_tokens ?? 0, usage.completion_tokens ?? 0),
          });
        }

        const content = response.choices[0]?.message?.content ?? '';
        lastRaw = { content, finish_reason: response.choices[0]?.finish_reason };

        let parsedJson: unknown;
        try {
          parsedJson = JSON.parse(content);
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
        // Network / API errors. Don't retry beyond the loop.
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
