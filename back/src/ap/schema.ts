import { z } from 'zod';

// Schema for invoice data extracted by Claude vision. Mirrors the
// ground-truth label schema in data/generators/invoices/types.ts, but
// is the I/O boundary on the OCR side — Claude responses are parsed
// through this, and downstream code only sees validated objects.

export const InvoiceLineItemSchema = z.object({
  description: z.string().min(1),
  quantity: z.number().positive(),
  unit_price: z.number().nonnegative(),
  line_total: z.number().nonnegative(),
});

export const ExtractedInvoiceSchema = z.object({
  vendor_name: z.string().min(1),
  vendor_address_street: z.string().min(1),
  vendor_address_city_state_zip: z.string().min(1),
  invoice_number: z.string().min(1),
  invoice_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'expected YYYY-MM-DD'),
  due_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'expected YYYY-MM-DD').nullable(),
  line_items: z.array(InvoiceLineItemSchema).min(1),
  subtotal: z.number().nonnegative(),
  tax_rate: z.number().min(0).max(1),
  tax_amount: z.number().nonnegative(),
  total: z.number().nonnegative(),
});

export type InvoiceLineItem = z.infer<typeof InvoiceLineItemSchema>;
export type ExtractedInvoice = z.infer<typeof ExtractedInvoiceSchema>;
