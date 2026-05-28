import { mkdir, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import type { Rng } from '../rng.js';
import { createRng } from '../rng.js';
import { VENDORS } from '../corpus/vendors.js';
import { LINE_ITEMS } from '../corpus/line-items.js';
import { renderInvoiceHtml, type LayoutVariant } from './template.js';
import type { InvoiceAnomaly, InvoiceLabel, InvoiceLineItem } from './types.js';

const LAYOUTS: readonly LayoutVariant[] = ['classic', 'compact', 'two-column', 'minimal', 'accent-bar'];

// 10% of invoices carry a deliberate anomaly so the reconciler logic
// has something to flag during measurement.
const ANOMALY_RATE = 0.1;

const ANOMALIES: readonly Exclude<InvoiceAnomaly, 'none'>[] = [
  'math-mismatch-subtotal',
  'math-mismatch-tax',
  'missing-due-date',
  'duplicate-invoice-number',
  'multi-page-layout',
];

export type GenerateInvoicesOptions = {
  seed: number | string;
  count: number;
  outputDir: string;
};

export type GenerateInvoicesResult = {
  count: number;
  cleanCount: number;
  anomalyCount: number;
  outputDir: string;
};

export async function generateInvoices(options: GenerateInvoicesOptions): Promise<GenerateInvoicesResult> {
  const rng = createRng(options.seed);
  const labels: InvoiceLabel[] = [];

  const issuedInvoiceNumbers = new Set<string>();

  await mkdir(options.outputDir, { recursive: true });

  // Track distinct invoice numbers we've issued so a duplicate-anomaly
  // can collide with a randomly chosen prior one (not always the first).
  const issuedList: string[] = [];

  for (let i = 0; i < options.count; i++) {
    const fileId = `inv-${String(i + 1).padStart(4, '0')}`;
    const anomaly: InvoiceAnomaly = rng.next() < ANOMALY_RATE ? rng.pick(ANOMALIES) : 'none';

    const label = buildInvoiceLabel({
      rng: rng.fork(`invoice:${i}`),
      fileId,
      anomaly,
      issuedInvoiceNumbers,
      issuedList,
    });

    if (!issuedInvoiceNumbers.has(label.invoiceNumber)) {
      issuedList.push(label.invoiceNumber);
    }
    issuedInvoiceNumbers.add(label.invoiceNumber);
    labels.push(label);

    const layout = pickLayout(rng.fork(`layout:${i}`), anomaly);
    const html = renderInvoiceHtml(label, layout);
    await writeFile(join(options.outputDir, `${fileId}.html`), html, 'utf8');
  }

  await writeFile(
    join(options.outputDir, 'labels.json'),
    JSON.stringify(labels, null, 2),
    'utf8',
  );

  await writeFile(
    join(options.outputDir, 'manifest.json'),
    JSON.stringify(
      {
        seed: options.seed,
        count: options.count,
        anomalyRate: ANOMALY_RATE,
        generatedAt: new Date().toISOString(),
        files: labels.map((l) => `${l.fileId}.html`),
      },
      null,
      2,
    ),
    'utf8',
  );

  const anomalyCount = labels.filter((l) => l.anomaly !== 'none').length;
  return {
    count: labels.length,
    cleanCount: labels.length - anomalyCount,
    anomalyCount,
    outputDir: options.outputDir,
  };
}

function pickLayout(rng: Rng, anomaly: InvoiceAnomaly): LayoutVariant {
  if (anomaly === 'multi-page-layout') return 'two-column';
  return rng.pick(LAYOUTS);
}

type BuildArgs = {
  rng: Rng;
  fileId: string;
  anomaly: InvoiceAnomaly;
  issuedInvoiceNumbers: Set<string>;
  issuedList: readonly string[];
};

function buildInvoiceLabel(args: BuildArgs): InvoiceLabel {
  const { rng, anomaly, issuedInvoiceNumbers, issuedList } = args;
  const vendor = rng.pick(VENDORS);
  const catalog = LINE_ITEMS[vendor.category];

  const lineCount = rng.range(1, 8);
  const picked = rng
    .shuffle(catalog)
    .slice(0, Math.min(lineCount, catalog.length))
    .map((item): InvoiceLineItem => {
      const quantity = vendor.category === 'saas' || vendor.category === 'utilities'
        ? rng.pick([1, 1, 1, 5, 10, 25])
        : rng.range(1, 12);
      const lineTotal = round2(item.unitPrice * quantity);
      return {
        description: item.description,
        quantity,
        unitPrice: item.unitPrice,
        lineTotal,
      };
    });

  const computedSubtotal = round2(picked.reduce((acc, li) => acc + li.lineTotal, 0));
  const computedTax = round2(computedSubtotal * vendor.taxRate);
  const computedTotal = round2(computedSubtotal + computedTax);

  let subtotal = computedSubtotal;
  let taxAmount = computedTax;
  let total = computedTotal;
  let dueDate: string | null;

  const invoiceDate = randomDateInRange(rng, '2026-01-01', '2026-05-15');
  dueDate = addDays(invoiceDate, vendor.paymentTermsDays);

  let invoiceNumber = generateInvoiceNumber(rng, vendor.name, issuedInvoiceNumbers);

  switch (anomaly) {
    case 'math-mismatch-subtotal': {
      // Off-by-a-few-cents on subtotal so the reconciler flags it.
      const drift = (rng.bool() ? 1 : -1) * round2(rng.float(0.37, 4.21));
      subtotal = round2(subtotal + drift);
      total = round2(subtotal + taxAmount);
      break;
    }
    case 'math-mismatch-tax': {
      taxAmount = round2(taxAmount + (rng.bool() ? 1 : -1) * round2(rng.float(0.5, 6.0)));
      total = round2(subtotal + taxAmount);
      break;
    }
    case 'missing-due-date':
      dueDate = null;
      break;
    case 'duplicate-invoice-number':
      if (issuedList.length > 0) {
        invoiceNumber = rng.pick(issuedList);
      }
      break;
    case 'multi-page-layout':
      // Force a long line-item list so the rendered HTML wraps onto a
      // second page when printed to PDF — measured separately as a
      // layout-resilience case.
      while (picked.length < 14) {
        const extra = rng.pick(catalog);
        const quantity = rng.range(1, 6);
        picked.push({
          description: extra.description,
          quantity,
          unitPrice: extra.unitPrice,
          lineTotal: round2(extra.unitPrice * quantity),
        });
      }
      subtotal = round2(picked.reduce((acc, li) => acc + li.lineTotal, 0));
      taxAmount = round2(subtotal * vendor.taxRate);
      total = round2(subtotal + taxAmount);
      break;
    case 'none':
    default:
      break;
  }

  return {
    fileId: args.fileId,
    vendor: {
      name: vendor.name,
      addressStreet: vendor.address.street,
      addressCityStateZip: `${vendor.address.city}, ${vendor.address.state} ${vendor.address.zip}`,
    },
    invoiceNumber,
    invoiceDate,
    dueDate,
    lineItems: picked,
    subtotal,
    taxRate: vendor.taxRate,
    taxAmount,
    total,
    anomaly,
  };
}

function generateInvoiceNumber(rng: Rng, vendorName: string, issued: Set<string>): string {
  const prefix = vendorName
    .split(/\s+/)
    .map((w) => w[0])
    .filter((c) => /[A-Za-z]/.test(c ?? ''))
    .slice(0, 3)
    .join('')
    .toUpperCase();
  for (let attempt = 0; attempt < 20; attempt++) {
    const candidate = `${prefix}-${String(rng.range(10000, 999999)).padStart(6, '0')}`;
    if (!issued.has(candidate)) return candidate;
  }
  return `${prefix}-${Date.now().toString().slice(-6)}`;
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

function randomDateInRange(rng: Rng, startIso: string, endIso: string): string {
  const start = Date.parse(startIso);
  const end = Date.parse(endIso);
  const t = start + Math.floor(rng.next() * (end - start));
  return new Date(t).toISOString().slice(0, 10);
}

function addDays(isoDate: string, days: number): string {
  const d = new Date(isoDate);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}
