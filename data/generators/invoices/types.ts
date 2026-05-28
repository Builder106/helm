// Ground-truth schema for a synthetic invoice. The OCR pipeline's
// extracted JSON is scored against this; the anomaly field marks
// invoices that are intentionally malformed so the reconciler logic
// can be measured separately from extraction accuracy.

export type InvoiceLineItem = {
  description: string;
  quantity: number;
  unitPrice: number;
  lineTotal: number;
};

export type InvoiceAnomaly =
  | 'none'
  | 'math-mismatch-subtotal'
  | 'math-mismatch-tax'
  | 'missing-due-date'
  | 'duplicate-invoice-number'
  | 'multi-page-layout';

export type InvoiceLabel = {
  fileId: string;
  vendor: {
    name: string;
    addressStreet: string;
    addressCityStateZip: string;
  };
  invoiceNumber: string;
  invoiceDate: string;
  dueDate: string | null;
  lineItems: InvoiceLineItem[];
  subtotal: number;
  taxRate: number;
  taxAmount: number;
  total: number;
  anomaly: InvoiceAnomaly;
};
