// Typed view over the committed payout-reconciler measurement output.
// Mirrors `data/measurements/payout-reconciler.ts` exactly; if that
// script's output shape changes, this file breaks first via TypeScript.

import rawReport from '../../../data/measurements/output/seed-1/payout-reconciler/report.json';

export type PayoutRecord = {
  creator_id: string;
  handle: string;
  tier: 'standard' | 'plus' | 'elite';
  currency: 'USD' | 'EUR' | 'GBP' | 'CAD';
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

export type PayoutHeadline = {
  creators_processed: number;
  wall_ms: number;
  extraction: {
    parse_rate: number;
    field_accuracy: number;
  };
  exact_match_count: number;
  exact_match_rate: number;
  status_classification: {
    correct: number;
    total: number;
    accuracy: number;
  };
  dollars_reconciled: number;
  truth_dollars: number;
  total_payout_drift_usd: number;
  max_payout_drift_usd: number;
  cost: {
    total_usd: number;
    mean_per_creator_usd: number;
  };
  latency: {
    p50_ms: number;
    p95_ms: number;
    p99_ms: number;
  };
  labor: {
    manual_minutes: number;
    helm_minutes: number;
    minutes_saved: number;
    dollars_saved: number;
    time_reduction_ratio: number;
  };
};

export type PayoutReport = {
  seed: string;
  extractor: 'mock' | 'gemini';
  wallMs: number;
  headline: PayoutHeadline;
  records: PayoutRecord[];
};

export const payoutReport = rawReport as PayoutReport;
export const isPayoutMock = payoutReport.extractor === 'mock';
