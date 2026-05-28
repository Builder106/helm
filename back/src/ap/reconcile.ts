// Reconciliation logic: given an extracted invoice, decide whether the
// math is internally consistent and surface anomalies for human review.
//
// The set of flags here mirrors the anomaly types in
// data/generators/invoices/types.ts so the measurement script can
// score the reconciler the same way it scores extraction accuracy.

import type { ExtractedInvoice } from './schema.js';

export type ReconciliationFlag =
  | 'math_mismatch_subtotal'
  | 'math_mismatch_tax'
  | 'missing_due_date'
  | 'duplicate_invoice_number'
  | 'multi_page_layout'
  | 'extraction_failed';

export type ReconciliationResult = {
  status: 'clean' | 'flagged';
  flags: ReconciliationFlag[];
  computed: {
    line_items_sum: number;
    subtotal_drift: number;
    tax_drift: number;
    total_drift: number;
  };
};

const CENTS_TOLERANCE = 0.01;

export function reconcile(
  invoice: ExtractedInvoice,
  context: { seenInvoiceNumbers: ReadonlySet<string>; pageCount?: number },
): ReconciliationResult {
  const flags: ReconciliationFlag[] = [];

  const lineSum = round2(invoice.line_items.reduce((acc, li) => acc + li.line_total, 0));
  const expectedTax = round2(invoice.subtotal * invoice.tax_rate);
  const expectedTotal = round2(invoice.subtotal + invoice.tax_amount);

  const subtotalDrift = round2(lineSum - invoice.subtotal);
  const taxDrift = round2(expectedTax - invoice.tax_amount);
  const totalDrift = round2(expectedTotal - invoice.total);

  if (Math.abs(subtotalDrift) > CENTS_TOLERANCE) flags.push('math_mismatch_subtotal');
  if (Math.abs(taxDrift) > CENTS_TOLERANCE) flags.push('math_mismatch_tax');
  if (Math.abs(totalDrift) > CENTS_TOLERANCE && !flags.length) {
    // Subtotal+tax-derived total is also off but neither subtotal nor
    // tax individually drifted — rare, but worth flagging as a tax
    // mismatch since that's what the data implies.
    flags.push('math_mismatch_tax');
  }

  if (invoice.due_date === null) flags.push('missing_due_date');
  if (context.seenInvoiceNumbers.has(invoice.invoice_number)) flags.push('duplicate_invoice_number');
  if (context.pageCount !== undefined && context.pageCount > 1) flags.push('multi_page_layout');

  return {
    status: flags.length === 0 ? 'clean' : 'flagged',
    flags,
    computed: {
      line_items_sum: lineSum,
      subtotal_drift: subtotalDrift,
      tax_drift: taxDrift,
      total_drift: totalDrift,
    },
  };
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}
