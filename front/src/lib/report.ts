// Typed view over the committed measurement output.
//
// The shape mirrors `data/measurements/invoice-ocr.ts` exactly; if the
// measurement script changes its output shape, this file is the
// canary that breaks first via TypeScript. The path is resolved at
// build time by Vite — see vite.config.ts `server.fs.allow`.

import rawReport from '../../../data/measurements/output/seed-1/invoice-ocr/report.json';

export type ReconciliationFlag =
  | 'math_mismatch_subtotal'
  | 'math_mismatch_tax'
  | 'missing_due_date'
  | 'duplicate_invoice_number'
  | 'multi_page_layout'
  | 'extraction_failed';

export type InvoiceAnomaly =
  | 'none'
  | 'math-mismatch-subtotal'
  | 'math-mismatch-tax'
  | 'missing-due-date'
  | 'duplicate-invoice-number'
  | 'multi-page-layout';

export type ReportRecord = {
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

export type ReportHeadline = {
  invoices_processed: number;
  wall_ms: number;
  extraction: {
    parse_rate: number;
    field_accuracy: number;
    line_item_recall: number;
  };
  cost: {
    total_usd: number;
    mean_per_invoice_usd: number;
  };
  latency: {
    p50_ms: number;
    p95_ms: number;
    p99_ms: number;
  };
  reconciler: {
    true_positives: number;
    false_positives: number;
    false_negatives: number;
    true_negatives: number;
    precision: number;
    recall: number;
    f1: number;
  };
  labor: {
    manual_minutes: number;
    helm_minutes: number;
    minutes_saved: number;
    dollars_saved: number;
    time_reduction_ratio: number;
  };
};

export type Report = {
  seed: string;
  extractor: 'mock' | 'groq';
  wallMs: number;
  headline: ReportHeadline;
  records: ReportRecord[];
};

export const report = rawReport as Report;

export const isMock = report.extractor === 'mock';

export function formatPercent(v: number, digits = 1): string {
  return `${(v * 100).toFixed(digits)}%`;
}

export function formatUsd(v: number, digits = 6): string {
  const small = Math.abs(v) < 0.01;
  return small
    ? `$${v.toFixed(digits)}`
    : `$${v.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 4 })}`;
}

export function formatMs(v: number): string {
  if (v < 1000) return `${Math.round(v)} ms`;
  return `${(v / 1000).toFixed(2)} s`;
}
