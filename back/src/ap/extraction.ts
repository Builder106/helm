// OCR extraction abstraction. Two implementations:
//
// - `mockExtract` reads the ground-truth label and returns it with
//   controlled noise. Used for end-to-end pipeline development without
//   spending API budget.
// - `claudeExtract` calls Claude vision on the PDF. Plug-in target —
//   lands when the user is ready to spend API for a real measurement.
//
// Both return the same shape: an `ExtractionResult` carrying the
// parsed invoice, the cost in USD, the latency, and any raw response
// payload for logging.

import { readFile } from 'node:fs/promises';
import { join, basename } from 'node:path';
import { createRng, type Rng } from '../../../data/generators/rng.js';
import type { InvoiceLabel } from '../../../data/generators/invoices/types.js';
import { ExtractedInvoiceSchema, type ExtractedInvoice } from './schema.js';

export type ExtractionUsage = {
  input_tokens: number;
  output_tokens: number;
  cache_read_tokens: number;
  cache_creation_tokens: number;
  cost_usd: number;
};

export type ExtractionResult = {
  pdf_path: string;
  invoice: ExtractedInvoice | null;
  raw_response: unknown;
  usage: ExtractionUsage;
  latency_ms: number;
  parse_error: string | null;
};

export type Extractor = (pdfPath: string) => Promise<ExtractionResult>;

export type MockExtractorOptions = {
  seed: number | string;
  /** Probability of dropping one line item from the result. */
  dropLineItemRate?: number;
  /** Probability of a one-digit transposition somewhere numeric. */
  digitNoiseRate?: number;
  /** Probability the vendor name comes back with the period stripped. */
  vendorPunctuationDropRate?: number;
  /** Probability the due date is omitted entirely. */
  dueDateDropRate?: number;
  /** Simulated per-call latency floor / ceiling in ms. */
  latencyMinMs?: number;
  latencyMaxMs?: number;
};

// Pricing snapshot — Claude Sonnet 4.6 vision at announcement-time
// rates. The mock charges these against a synthetic token count so
// the cost-tracking machinery has something realistic to log.
const MOCK_PRICING = {
  inputTokensPerInvoice: 1800, // pdf input
  outputTokensPerInvoice: 320, // structured JSON out
  inputCostPerMillion: 3.0,
  outputCostPerMillion: 15.0,
};

export function createMockExtractor(
  labelsByFileId: Map<string, InvoiceLabel>,
  options: MockExtractorOptions,
): Extractor {
  const masterRng = createRng(options.seed);
  const dropRate = options.dropLineItemRate ?? 0.04;
  const digitNoise = options.digitNoiseRate ?? 0.03;
  const vendorPunctDrop = options.vendorPunctuationDropRate ?? 0.12;
  const dueDateDrop = options.dueDateDropRate ?? 0.02;
  const latMin = options.latencyMinMs ?? 350;
  const latMax = options.latencyMaxMs ?? 1400;

  return async (pdfPath) => {
    const start = Date.now();
    const fileId = basename(pdfPath, '.pdf');
    const label = labelsByFileId.get(fileId);
    if (!label) {
      return {
        pdf_path: pdfPath,
        invoice: null,
        raw_response: { error: 'no label for fileId' },
        usage: emptyUsage(),
        latency_ms: 0,
        parse_error: `no ground-truth label found for ${fileId}`,
      };
    }

    const rng = masterRng.fork(`mock:${fileId}`);
    const noisy = applyNoise(label, rng, { dropRate, digitNoise, vendorPunctDrop, dueDateDrop });
    const parsed = ExtractedInvoiceSchema.safeParse(noisy);

    // Simulate latency.
    await delay(rng.range(latMin, latMax + 1));

    const usage = computeMockUsage();
    const latencyMs = Date.now() - start;

    if (!parsed.success) {
      return {
        pdf_path: pdfPath,
        invoice: null,
        raw_response: noisy,
        usage,
        latency_ms: latencyMs,
        parse_error: parsed.error.message,
      };
    }

    return {
      pdf_path: pdfPath,
      invoice: parsed.data,
      raw_response: noisy,
      usage,
      latency_ms: latencyMs,
      parse_error: null,
    };
  };
}

// Load all labels for a fixture into a lookup map.
export async function loadLabels(fixtureDir: string): Promise<Map<string, InvoiceLabel>> {
  const raw = await readFile(join(fixtureDir, 'labels.json'), 'utf8');
  const labels = JSON.parse(raw) as InvoiceLabel[];
  return new Map(labels.map((l) => [l.fileId, l]));
}

type NoiseOptions = {
  dropRate: number;
  digitNoise: number;
  vendorPunctDrop: number;
  dueDateDrop: number;
};

function applyNoise(label: InvoiceLabel, rng: Rng, opts: NoiseOptions): Record<string, unknown> {
  let lineItems = label.lineItems.map((li) => ({
    description: li.description,
    quantity: li.quantity,
    unit_price: li.unitPrice,
    line_total: li.lineTotal,
  }));

  // Maybe drop a line item.
  if (rng.bool(opts.dropRate) && lineItems.length > 1) {
    const idx = rng.int(lineItems.length);
    lineItems = lineItems.filter((_, i) => i !== idx);
  }

  // Maybe transpose a digit in some numeric field.
  if (rng.bool(opts.digitNoise) && lineItems.length > 0) {
    const idx = rng.int(lineItems.length);
    const target = lineItems[idx]!;
    lineItems[idx] = {
      ...target,
      unit_price: nudgeNumber(target.unit_price, rng),
      line_total: nudgeNumber(target.line_total, rng),
    };
  }

  let vendorName = label.vendor.name;
  if (rng.bool(opts.vendorPunctDrop)) {
    vendorName = vendorName.replace(/[\.,]/g, '');
  }

  const dueDate = rng.bool(opts.dueDateDrop) ? null : label.dueDate;

  return {
    vendor_name: vendorName,
    vendor_address_street: label.vendor.addressStreet,
    vendor_address_city_state_zip: label.vendor.addressCityStateZip,
    invoice_number: label.invoiceNumber,
    invoice_date: label.invoiceDate,
    due_date: dueDate,
    line_items: lineItems,
    subtotal: label.subtotal,
    tax_rate: label.taxRate,
    tax_amount: label.taxAmount,
    total: label.total,
  };
}

function nudgeNumber(n: number, rng: Rng): number {
  // Off-by-one in a single decimal digit. Round to cents.
  const drift = rng.pick([-1, 1]) * rng.pick([0.01, 0.1, 1.0]);
  return Math.round((n + drift) * 100) / 100;
}

function computeMockUsage(): ExtractionUsage {
  const inputTokens = MOCK_PRICING.inputTokensPerInvoice;
  const outputTokens = MOCK_PRICING.outputTokensPerInvoice;
  const cost =
    (inputTokens / 1_000_000) * MOCK_PRICING.inputCostPerMillion +
    (outputTokens / 1_000_000) * MOCK_PRICING.outputCostPerMillion;
  return {
    input_tokens: inputTokens,
    output_tokens: outputTokens,
    cache_read_tokens: 0,
    cache_creation_tokens: 0,
    cost_usd: Math.round(cost * 10000) / 10000,
  };
}

function emptyUsage(): ExtractionUsage {
  return {
    input_tokens: 0,
    output_tokens: 0,
    cache_read_tokens: 0,
    cache_creation_tokens: 0,
    cost_usd: 0,
  };
}

function delay(ms: number): Promise<void> {
  return new Promise((res) => setTimeout(res, ms));
}
