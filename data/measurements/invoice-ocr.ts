// End-to-end measurement for the AP Invoice OCR sub-feature.
//
//   pnpm measure:invoice-ocr --seed 1 [--extractor=mock|groq] [--limit=N]
//
// Walks the seed=N fixture's PNG renders, runs each through the OCR
// pipeline (mock by default, Llama 4 Scout via Groq when
// --extractor=groq), reconciles the extracted JSON, and writes a
// structured report under data/measurements/output/seed-N/invoice-ocr/.
//
// The report's `headline` block is what the README banner finding
// quotes — every number there must be reproducible by re-running this
// script. See CLAUDE.md "README headline finding — the bar".

import { parseArgs } from 'node:util';
import { mkdir, readdir, writeFile, stat } from 'node:fs/promises';
import { join, resolve, basename, relative } from 'node:path';
import {
  createMockExtractor,
  loadLabels,
  type Extractor,
} from '../../back/src/ap/extraction.js';
import { createGroqLlamaExtractor } from '../../back/src/ap/extraction-groq.js';
import { createGeminiExtractor } from '../../back/src/ap/extraction-gemini.js';
import { reconcile, type ReconciliationFlag, type ReconciliationResult } from '../../back/src/ap/reconcile.js';
import type { InvoiceLabel, InvoiceAnomaly } from '../generators/invoices/types.js';
import type { ExtractedInvoice } from '../../back/src/ap/schema.js';

type PerInvoiceRecord = {
  file_id: string;
  image_path: string;
  ground_truth_anomaly: InvoiceAnomaly;
  extraction: {
    parsed: boolean;
    parse_error: string | null;
    field_accuracy: number;
    field_correct: number;
    field_total: number;
    line_item_recall: number;
    line_item_correct: number;
    line_item_total: number;
    cost_usd: number;
    latency_ms: number;
  };
  reconciliation: {
    status: 'clean' | 'flagged';
    flags: ReconciliationFlag[];
    expected_flag: ReconciliationFlag | null;
  };
};

const ANOMALY_TO_FLAG: Record<InvoiceAnomaly, ReconciliationFlag | null> = {
  none: null,
  'math-mismatch-subtotal': 'math_mismatch_subtotal',
  'math-mismatch-tax': 'math_mismatch_tax',
  'missing-due-date': 'missing_due_date',
  'duplicate-invoice-number': 'duplicate_invoice_number',
  'multi-page-layout': 'multi_page_layout',
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
  const fixtureDir = resolve(values['fixtures-root']!, seed, 'invoices');
  const outDir = resolve(values['output-root']!, `seed-${seed}`, 'invoice-ocr');
  const limit = values.limit ? Number(values.limit) : null;

  const labels = await loadLabels(fixtureDir);
  const imageFiles = (await readdir(fixtureDir))
    .filter((f) => f.endsWith('.png'))
    .sort();
  const imagePaths = (limit ? imageFiles.slice(0, limit) : imageFiles).map((f) => join(fixtureDir, f));

  if (imagePaths.length === 0) {
    console.error(`[helm:measure] no PNGs found in ${fixtureDir} — run \`pnpm data:render-png --seed ${seed}\` first.`);
    process.exitCode = 1;
    return;
  }

  const extractor = await buildExtractor(values.extractor!, labels, seed);
  console.log(`[helm:measure] seed=${seed} extractor=${values.extractor} invoices=${imagePaths.length}`);

  const records: PerInvoiceRecord[] = [];
  const seenInvoiceNumbers = new Set<string>();
  const startWall = Date.now();

  for (const imagePath of imagePaths) {
    const fileId = basename(imagePath, '.png');
    const label = labels.get(fileId)!;
    const result = await extractor(imagePath);

    let recordRecon: ReconciliationResult;
    let fieldAccuracy = 0;
    let fieldCorrect = 0;
    let fieldTotal = 0;
    let lineItemCorrect = 0;
    const lineItemTotal = label.lineItems.length;

    if (result.invoice) {
      const isMultiPage = await isLikelyMultiPage(imagePath);
      recordRecon = reconcile(result.invoice, {
        seenInvoiceNumbers,
        pageCount: isMultiPage ? 2 : 1,
      });
      const scored = scoreExtraction(label, result.invoice);
      fieldAccuracy = scored.accuracy;
      fieldCorrect = scored.correct;
      fieldTotal = scored.total;
      lineItemCorrect = scored.lineItemsCorrect;
      seenInvoiceNumbers.add(result.invoice.invoice_number);
    } else {
      recordRecon = {
        status: 'flagged',
        flags: ['extraction_failed'],
        computed: { line_items_sum: 0, subtotal_drift: 0, tax_drift: 0, total_drift: 0 },
      };
    }

    records.push({
      file_id: fileId,
      image_path: relative(process.cwd(), imagePath),
      ground_truth_anomaly: label.anomaly,
      extraction: {
        parsed: result.invoice !== null,
        parse_error: result.parse_error,
        field_accuracy: fieldAccuracy,
        field_correct: fieldCorrect,
        field_total: fieldTotal,
        line_item_recall: lineItemTotal > 0 ? lineItemCorrect / lineItemTotal : 0,
        line_item_correct: lineItemCorrect,
        line_item_total: lineItemTotal,
        cost_usd: result.usage.cost_usd,
        latency_ms: result.latency_ms,
      },
      reconciliation: {
        status: recordRecon.status,
        flags: recordRecon.flags,
        expected_flag: ANOMALY_TO_FLAG[label.anomaly],
      },
    });
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

  console.log(`[helm:measure] done.`);
  console.log(`  extraction: parsed=${headline.extraction.parse_rate.toFixed(3)} field_acc=${headline.extraction.field_accuracy.toFixed(3)} line_acc=${headline.extraction.line_item_recall.toFixed(3)}`);
  console.log(`  cost:       $${headline.cost.total_usd.toFixed(4)} total · $${headline.cost.mean_per_invoice_usd.toFixed(6)} per invoice`);
  console.log(`  latency:    p50=${headline.latency.p50_ms}ms p95=${headline.latency.p95_ms}ms`);
  console.log(`  reconciler: precision=${headline.reconciler.precision.toFixed(3)} recall=${headline.reconciler.recall.toFixed(3)} f1=${headline.reconciler.f1.toFixed(3)}`);
  console.log(`  output → ${outDir}`);
}

async function buildExtractor(
  kind: string,
  labels: Map<string, InvoiceLabel>,
  seed: string,
): Promise<Extractor> {
  if (kind === 'mock') {
    return createMockExtractor(labels, { seed: `${seed}:mock-extract` });
  }
  if (kind === 'gemini') {
    return createGeminiExtractor();
  }
  if (kind === 'groq') {
    return createGroqLlamaExtractor();
  }
  throw new Error(`unknown extractor: ${kind}. Supported: mock, gemini, groq`);
}

function scoreExtraction(label: InvoiceLabel, extracted: ExtractedInvoice): {
  accuracy: number;
  correct: number;
  total: number;
  lineItemsCorrect: number;
} {
  let correct = 0;
  let total = 0;

  // Top-level fields
  const topComparisons: Array<[unknown, unknown]> = [
    [extracted.vendor_name, label.vendor.name],
    [extracted.vendor_address_street, label.vendor.addressStreet],
    [extracted.vendor_address_city_state_zip, label.vendor.addressCityStateZip],
    [extracted.invoice_number, label.invoiceNumber],
    [extracted.invoice_date, label.invoiceDate],
    [extracted.due_date, label.dueDate],
    [extracted.subtotal, label.subtotal],
    [extracted.tax_rate, label.taxRate],
    [extracted.tax_amount, label.taxAmount],
    [extracted.total, label.total],
  ];
  for (const [a, b] of topComparisons) {
    total++;
    if (a === b) correct++;
  }

  // Line items — match by description (best-effort).
  const truthLines = label.lineItems;
  const extractedByDesc = new Map(extracted.line_items.map((li) => [li.description, li]));
  let lineItemsCorrect = 0;
  for (const truth of truthLines) {
    const ext = extractedByDesc.get(truth.description);
    total += 3; // qty, unit_price, line_total
    if (ext) {
      let lineFieldsOk = 0;
      if (ext.quantity === truth.quantity) lineFieldsOk++;
      if (ext.unit_price === truth.unitPrice) lineFieldsOk++;
      if (ext.line_total === truth.lineTotal) lineFieldsOk++;
      correct += lineFieldsOk;
      if (lineFieldsOk === 3) lineItemsCorrect++;
    }
  }

  return {
    accuracy: total > 0 ? correct / total : 0,
    correct,
    total,
    lineItemsCorrect,
  };
}

function computeHeadline(records: readonly PerInvoiceRecord[], wallMs: number) {
  const parsedRecords = records.filter((r) => r.extraction.parsed);

  const parseRate = parsedRecords.length / records.length;
  const fieldAcc =
    parsedRecords.length > 0
      ? parsedRecords.reduce((s, r) => s + r.extraction.field_accuracy, 0) / parsedRecords.length
      : 0;
  const lineRecall =
    parsedRecords.length > 0
      ? parsedRecords.reduce((s, r) => s + r.extraction.line_item_recall, 0) / parsedRecords.length
      : 0;

  const totalCost = records.reduce((s, r) => s + r.extraction.cost_usd, 0);
  const meanCost = totalCost / records.length;

  const latencies = records.map((r) => r.extraction.latency_ms).sort((a, b) => a - b);
  const p50 = latencies[Math.floor(latencies.length * 0.5)] ?? 0;
  const p95 = latencies[Math.floor(latencies.length * 0.95)] ?? 0;
  const p99 = latencies[Math.floor(latencies.length * 0.99)] ?? 0;

  // Reconciler precision/recall — treats each invoice as one labeled example.
  // Positive class = "has any anomaly". Predicted positive = "flags non-empty".
  let tp = 0, fp = 0, fn = 0, tn = 0;
  for (const r of records) {
    const truthHasAnomaly = r.ground_truth_anomaly !== 'none';
    const predictedAnomaly = r.reconciliation.flags.length > 0;
    if (truthHasAnomaly && predictedAnomaly) tp++;
    else if (!truthHasAnomaly && predictedAnomaly) fp++;
    else if (truthHasAnomaly && !predictedAnomaly) fn++;
    else tn++;
  }

  const precision = tp + fp > 0 ? tp / (tp + fp) : 0;
  const recall = tp + fn > 0 ? tp / (tp + fn) : 0;
  const f1 = precision + recall > 0 ? (2 * precision * recall) / (precision + recall) : 0;

  // Recovered-labor-hours model: ground truth assumes 6 min per invoice
  // handled manually at $25/hr loaded wage. Helm-handled means
  // auto-approved (clean status) OR human-touched only on flagged
  // ones, where flagged ones cost 2 min of review instead of 6.
  const MANUAL_MIN_PER_INVOICE = 6;
  const REVIEW_MIN_PER_FLAGGED = 2;
  const LOADED_WAGE_PER_HR = 25;
  const cleanCount = records.filter((r) => r.reconciliation.status === 'clean').length;
  const flaggedCount = records.length - cleanCount;
  const manualMinutes = records.length * MANUAL_MIN_PER_INVOICE;
  const helmMinutes = flaggedCount * REVIEW_MIN_PER_FLAGGED;
  const minutesSaved = manualMinutes - helmMinutes;
  const dollarsSaved = (minutesSaved / 60) * LOADED_WAGE_PER_HR;
  const ratio = manualMinutes > 0 ? manualMinutes / Math.max(helmMinutes, 1) : 0;

  return {
    invoices_processed: records.length,
    wall_ms: wallMs,
    extraction: {
      parse_rate: round4(parseRate),
      field_accuracy: round4(fieldAcc),
      line_item_recall: round4(lineRecall),
    },
    cost: {
      total_usd: round6(totalCost),
      mean_per_invoice_usd: round6(meanCost),
    },
    latency: {
      p50_ms: p50,
      p95_ms: p95,
      p99_ms: p99,
    },
    reconciler: {
      true_positives: tp,
      false_positives: fp,
      false_negatives: fn,
      true_negatives: tn,
      precision: round4(precision),
      recall: round4(recall),
      f1: round4(f1),
    },
    labor: {
      manual_minutes: manualMinutes,
      helm_minutes: helmMinutes,
      minutes_saved: minutesSaved,
      dollars_saved: round4(dollarsSaved),
      time_reduction_ratio: round2(ratio),
    },
  };
}

function renderSummary(headline: ReturnType<typeof computeHeadline>, seed: string, extractor: string): string {
  const mockBanner =
    extractor === 'mock'
      ? `> ⚠️ **Mock extractor.** Field accuracy, cost, and latency numbers below are derived from a controlled-noise mock of the vision call, not real API output. Only the reconciler stats and labor model reflect actual pipeline logic. Run with \`--extractor groq\` for measured numbers.\n\n`
      : '';
  const modelLine = extractor === 'groq'
    ? '_Model: Llama 4 Scout via Groq (meta-llama/llama-4-scout-17b-16e-instruct)._\n\n'
    : '';
  return `# Invoice OCR — measurement (seed=${seed}, extractor=${extractor})

${mockBanner}${modelLine}> ${headline.invoices_processed} invoices processed. Field accuracy ${(headline.extraction.field_accuracy * 100).toFixed(1)}%, line-item recall ${(headline.extraction.line_item_recall * 100).toFixed(1)}%. Mean cost $${headline.cost.mean_per_invoice_usd.toFixed(6)}/invoice. Reconciler F1 ${headline.reconciler.f1.toFixed(3)} (precision ${headline.reconciler.precision.toFixed(3)}, recall ${headline.reconciler.recall.toFixed(3)}).

## Labor model

At 6 minutes/invoice manual handling × $25/hr loaded wage, this batch would cost $${((headline.labor.manual_minutes / 60) * 25).toFixed(2)} in labor. Helm-routed (review only on the ${headline.reconciler.true_positives + headline.reconciler.false_positives} flagged invoices, 2 min each) costs $${((headline.labor.helm_minutes / 60) * 25).toFixed(2)} — a ${headline.labor.time_reduction_ratio}× reduction.

## Extraction

| metric | value |
| --- | --- |
| parse rate | ${(headline.extraction.parse_rate * 100).toFixed(1)}% |
| field accuracy | ${(headline.extraction.field_accuracy * 100).toFixed(1)}% |
| line-item recall | ${(headline.extraction.line_item_recall * 100).toFixed(1)}% |

## Cost

| metric | value |
| --- | --- |
| mean per invoice | $${headline.cost.mean_per_invoice_usd.toFixed(6)} |
| total | $${headline.cost.total_usd.toFixed(4)} |

## Latency (per-invoice end-to-end)

| metric | value |
| --- | --- |
| p50 | ${headline.latency.p50_ms} ms |
| p95 | ${headline.latency.p95_ms} ms |
| p99 | ${headline.latency.p99_ms} ms |

## Reconciler (anomaly-detection classifier)

| metric | value |
| --- | --- |
| true positives | ${headline.reconciler.true_positives} |
| false positives | ${headline.reconciler.false_positives} |
| false negatives | ${headline.reconciler.false_negatives} |
| true negatives | ${headline.reconciler.true_negatives} |
| precision | ${headline.reconciler.precision.toFixed(3)} |
| recall | ${headline.reconciler.recall.toFixed(3)} |
| F1 | ${headline.reconciler.f1.toFixed(3)} |

---

_Reproduced by_ \`pnpm measure:invoice-ocr --seed ${seed} --extractor ${extractor}\`. _The full per-invoice trace is in_ \`report.json\`.
`;
}

async function isLikelyMultiPage(imagePath: string): Promise<boolean> {
  // The multi-page-layout anomaly produces a noticeably taller PNG
  // because Playwright captures fullPage. Tall files (> 200 KB at our
  // viewport + DSR) almost always correspond to that anomaly.
  const s = await stat(imagePath);
  return s.size > 200_000;
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
  console.error('[helm:measure] failed:', err);
  process.exitCode = 1;
});
