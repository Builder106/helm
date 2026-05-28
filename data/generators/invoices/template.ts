import type { InvoiceLabel } from './types.js';

const USD = (n: number) => `$${n.toFixed(2)}`;

// Five layout variants. The OCR pipeline must extract identically from
// all of them — that's the point of having variants.
export type LayoutVariant = 'classic' | 'compact' | 'two-column' | 'minimal' | 'accent-bar';

const STYLES: Record<LayoutVariant, string> = {
  classic: `
    body { font-family: Georgia, 'Times New Roman', serif; color: #1a1a1a; padding: 48px; max-width: 760px; }
    h1 { font-size: 32px; letter-spacing: -0.01em; margin: 0 0 24px; }
    .meta-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 32px; }
    .label { font-size: 11px; text-transform: uppercase; letter-spacing: 0.08em; color: #666; }
    table { width: 100%; border-collapse: collapse; margin: 24px 0; }
    th { text-align: left; border-bottom: 2px solid #1a1a1a; padding: 8px 4px; font-size: 12px; }
    td { padding: 10px 4px; border-bottom: 1px solid #ddd; font-size: 14px; }
    .totals { margin-left: auto; width: 280px; }
    .totals .row { display: flex; justify-content: space-between; padding: 6px 0; }
    .totals .grand { font-weight: bold; border-top: 2px solid #1a1a1a; margin-top: 8px; padding-top: 12px; font-size: 18px; }
  `,
  compact: `
    body { font-family: -apple-system, 'Segoe UI', Roboto, sans-serif; color: #222; padding: 32px; max-width: 680px; font-size: 13px; }
    h1 { font-size: 20px; margin: 0 0 16px; font-weight: 600; }
    .header-row { display: flex; justify-content: space-between; margin-bottom: 24px; }
    .label { font-size: 10px; text-transform: uppercase; color: #888; }
    table { width: 100%; border-collapse: collapse; margin: 16px 0; }
    th { text-align: left; background: #f5f5f5; padding: 6px 8px; font-size: 11px; }
    td { padding: 6px 8px; border-bottom: 1px solid #eee; }
    .totals { margin-left: auto; width: 240px; }
    .totals .row { display: flex; justify-content: space-between; padding: 4px 0; }
    .totals .grand { font-weight: 600; border-top: 1px solid #222; margin-top: 4px; padding-top: 8px; }
  `,
  'two-column': `
    body { font-family: 'Helvetica Neue', Arial, sans-serif; color: #1a1a1a; padding: 40px; max-width: 800px; }
    .top { display: flex; gap: 48px; margin-bottom: 40px; }
    .top > div { flex: 1; }
    h1 { font-size: 28px; margin: 0 0 8px; font-weight: 300; letter-spacing: 0.02em; }
    .label { font-size: 11px; text-transform: uppercase; color: #777; letter-spacing: 0.1em; }
    table { width: 100%; border-collapse: collapse; }
    th { text-align: left; padding: 12px 8px 8px; font-size: 11px; text-transform: uppercase; color: #555; border-bottom: 1px solid #ccc; }
    td { padding: 10px 8px; border-bottom: 1px solid #eee; font-size: 14px; }
    .totals { margin-top: 24px; margin-left: auto; width: 300px; }
    .totals .row { display: flex; justify-content: space-between; padding: 6px 0; font-size: 14px; }
    .totals .grand { font-size: 20px; font-weight: 600; border-top: 2px solid #1a1a1a; margin-top: 12px; padding-top: 14px; }
  `,
  minimal: `
    body { font-family: 'Inter', -apple-system, sans-serif; color: #111; padding: 56px; max-width: 720px; font-weight: 400; }
    h1 { font-size: 36px; margin: 0 0 40px; font-weight: 200; letter-spacing: -0.02em; }
    .meta-grid { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 24px; margin-bottom: 48px; font-size: 13px; }
    .label { font-size: 10px; text-transform: uppercase; color: #999; letter-spacing: 0.12em; margin-bottom: 4px; }
    table { width: 100%; border-collapse: collapse; margin-bottom: 32px; }
    th { text-align: left; padding: 12px 0; border-bottom: 1px solid #111; font-size: 11px; text-transform: uppercase; letter-spacing: 0.08em; }
    td { padding: 12px 0; border-bottom: 1px solid #eee; font-size: 14px; }
    .totals { margin-left: auto; width: 260px; }
    .totals .row { display: flex; justify-content: space-between; padding: 8px 0; font-size: 14px; }
    .totals .grand { font-size: 22px; font-weight: 500; border-top: 1px solid #111; margin-top: 12px; padding-top: 16px; }
  `,
  'accent-bar': `
    body { font-family: Verdana, sans-serif; color: #2a2a2a; padding: 0; margin: 0; max-width: 780px; }
    .accent { background: #1a3a5c; color: white; padding: 32px 48px; }
    .accent h1 { margin: 0; font-size: 28px; font-weight: bold; }
    .body { padding: 32px 48px; }
    .meta-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 32px; }
    .label { font-size: 11px; text-transform: uppercase; color: #1a3a5c; font-weight: bold; }
    table { width: 100%; border-collapse: collapse; margin: 24px 0; }
    th { text-align: left; background: #1a3a5c; color: white; padding: 10px 8px; font-size: 12px; }
    td { padding: 10px 8px; border-bottom: 1px solid #ddd; font-size: 13px; }
    .totals { margin-left: auto; width: 280px; }
    .totals .row { display: flex; justify-content: space-between; padding: 6px 0; }
    .totals .grand { font-weight: bold; background: #1a3a5c; color: white; margin-top: 8px; padding: 10px 12px; font-size: 16px; }
  `,
};

export function renderInvoiceHtml(label: InvoiceLabel, layout: LayoutVariant): string {
  const lineRows = label.lineItems
    .map(
      (li) => `
      <tr>
        <td>${escapeHtml(li.description)}</td>
        <td style="text-align: right;">${li.quantity}</td>
        <td style="text-align: right;">${USD(li.unitPrice)}</td>
        <td style="text-align: right;">${USD(li.lineTotal)}</td>
      </tr>`,
    )
    .join('');

  const dueDateLine =
    label.dueDate === null
      ? ''
      : `<div><div class="label">Due Date</div><div>${label.dueDate}</div></div>`;

  const inner = `
    <div class="meta-grid">
      <div>
        <div class="label">Bill From</div>
        <div><strong>${escapeHtml(label.vendor.name)}</strong></div>
        <div>${escapeHtml(label.vendor.addressStreet)}</div>
        <div>${escapeHtml(label.vendor.addressCityStateZip)}</div>
      </div>
      <div>
        <div class="label">Invoice Number</div>
        <div>${escapeHtml(label.invoiceNumber)}</div>
        <div class="label" style="margin-top: 12px;">Invoice Date</div>
        <div>${label.invoiceDate}</div>
        ${dueDateLine}
      </div>
    </div>
    <table>
      <thead>
        <tr><th>Description</th><th style="text-align: right;">Qty</th><th style="text-align: right;">Unit Price</th><th style="text-align: right;">Line Total</th></tr>
      </thead>
      <tbody>${lineRows}</tbody>
    </table>
    <div class="totals">
      <div class="row"><span>Subtotal</span><span>${USD(label.subtotal)}</span></div>
      <div class="row"><span>Tax (${(label.taxRate * 100).toFixed(2)}%)</span><span>${USD(label.taxAmount)}</span></div>
      <div class="row grand"><span>Total Due</span><span>${USD(label.total)}</span></div>
    </div>
  `;

  if (layout === 'accent-bar') {
    return wrap(
      STYLES[layout],
      `<div class="accent"><h1>Invoice</h1></div><div class="body">${inner}</div>`,
    );
  }

  return wrap(STYLES[layout], `<h1>Invoice</h1>${inner}`);
}

function wrap(styles: string, body: string): string {
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<title>Invoice</title>
<style>${styles}</style>
</head>
<body>${body}</body>
</html>`;
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}
