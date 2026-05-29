import { describe, expect, test } from 'vitest';
import { reconcile } from './reconcile.js';
import type { ExtractedInvoice } from './schema.js';

function invoice(over: Partial<ExtractedInvoice> = {}): ExtractedInvoice {
  return {
    vendor_name: 'Acme Co.',
    vendor_address_street: '1 Main St',
    vendor_address_city_state_zip: 'Springfield, IL 62701',
    invoice_number: 'ACM-100001',
    invoice_date: '2026-04-15',
    due_date: '2026-05-15',
    line_items: [
      { description: 'Widget A', quantity: 2, unit_price: 10, line_total: 20 },
      { description: 'Widget B', quantity: 1, unit_price: 30, line_total: 30 },
    ],
    subtotal: 50,
    tax_rate: 0.08,
    tax_amount: 4,
    total: 54,
    ...over,
  };
}

describe('reconcile', () => {
  test('clean invoice has no flags', () => {
    const result = reconcile(invoice(), { seenInvoiceNumbers: new Set() });
    expect(result.status).toBe('clean');
    expect(result.flags).toEqual([]);
  });

  test('flags subtotal mismatch when line items do not sum to subtotal', () => {
    const i = invoice({
      line_items: [
        { description: 'X', quantity: 1, unit_price: 10, line_total: 10 },
        { description: 'Y', quantity: 1, unit_price: 30, line_total: 30 },
      ],
      subtotal: 45, // should be 40 — drift of 5
      tax_rate: 0.08,
      tax_amount: 3.6,
      total: 48.6,
    });
    const result = reconcile(i, { seenInvoiceNumbers: new Set() });
    expect(result.status).toBe('flagged');
    expect(result.flags).toContain('math_mismatch_subtotal');
    expect(result.computed.subtotal_drift).toBe(-5);
  });

  test('flags tax mismatch when stated tax does not match subtotal × tax_rate', () => {
    const i = invoice({
      subtotal: 50,
      tax_rate: 0.08, // expected tax = 4
      tax_amount: 7.5, // stated tax — drift of 3.5
      total: 57.5,
    });
    const result = reconcile(i, { seenInvoiceNumbers: new Set() });
    expect(result.flags).toContain('math_mismatch_tax');
  });

  test('flags missing due date', () => {
    const i = invoice({ due_date: null });
    const result = reconcile(i, { seenInvoiceNumbers: new Set() });
    expect(result.status).toBe('flagged');
    expect(result.flags).toContain('missing_due_date');
  });

  test('flags duplicate invoice number when the number has already been seen', () => {
    const seen = new Set(['ACM-100001']);
    const result = reconcile(invoice(), { seenInvoiceNumbers: seen });
    expect(result.flags).toContain('duplicate_invoice_number');
  });

  test('flags multi-page layout when pageCount > 1', () => {
    const result = reconcile(invoice(), { seenInvoiceNumbers: new Set(), pageCount: 2 });
    expect(result.flags).toContain('multi_page_layout');
  });

  test('tolerates cent-level rounding noise on a clean invoice', () => {
    const i = invoice({
      line_items: [
        { description: 'A', quantity: 3, unit_price: 0.333, line_total: 1.0 },
      ],
      subtotal: 1.0,
      tax_rate: 0.05,
      tax_amount: 0.05,
      total: 1.05,
    });
    const result = reconcile(i, { seenInvoiceNumbers: new Set() });
    expect(result.status).toBe('clean');
  });

  test('multiple flags can fire on the same invoice', () => {
    const i = invoice({
      subtotal: 60, // doesn't match line items (sum=50)
      due_date: null,
    });
    const result = reconcile(i, { seenInvoiceNumbers: new Set() });
    expect(result.flags).toContain('math_mismatch_subtotal');
    expect(result.flags).toContain('missing_due_date');
    expect(result.flags.length).toBeGreaterThanOrEqual(2);
  });
});
