// Single source of truth for measurement-derived assertions.
//
// The dashboard renders these from the SAME committed JSON the front bundles
// (front/src/lib/report.ts imports invoice-ocr/report.json; payouts.ts imports
// payout-reconciler/report.json). Reading them here — and formatting with the
// same rule as front/src/lib/report.ts `formatPercent` — keeps the E2E
// assertions tracking the data instead of a hardcoded literal that silently
// rots when the measurements are regenerated against a new model or seed.

import invoiceReport from '../../data/measurements/output/seed-1/invoice-ocr/report.json';
import payoutReport from '../../data/measurements/output/seed-1/payout-reconciler/report.json';

// Mirror of front/src/lib/report.ts formatPercent.
export function formatPercent(v: number, digits = 1): string {
  return `${(v * 100).toFixed(digits)}%`;
}

// Trial 01 headline metric — "parse rate" card.
export const INVOICE_PARSE_RATE = formatPercent(
  invoiceReport.headline.extraction.parse_rate,
);

// Trial 02 headline metric — "exact match" card.
export const PAYOUT_EXACT_MATCH_RATE = formatPercent(
  payoutReport.headline.exact_match_rate,
);
