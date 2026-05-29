import { report, isMock, formatPercent, formatUsd, formatMs } from '../lib/report.ts';
import { MetricCard } from './MetricCard.tsx';
import { LatencyHistogram } from './LatencyHistogram.tsx';
import { RecentActivity } from './RecentActivity.tsx';

export function InvoiceOCRPanel() {
  const h = report.headline;

  return (
    <div className="flex flex-col gap-6">
      <PanelHeader />

      <section className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          label="Parse rate"
          value={formatPercent(h.extraction.parse_rate)}
          sublabel={`${Math.round(h.extraction.parse_rate * h.invoices_processed)} of ${h.invoices_processed} invoices`}
          tone={h.extraction.parse_rate >= 0.95 ? 'good' : 'warn'}
        />
        <MetricCard
          label="Field accuracy"
          value={formatPercent(h.extraction.field_accuracy)}
          sublabel="Exact-match across vendor, dates, totals, line items"
          tone={h.extraction.field_accuracy >= 0.95 ? 'good' : 'warn'}
        />
        <MetricCard
          label="Cost / invoice"
          value={formatUsd(h.cost.mean_per_invoice_usd)}
          sublabel={`${formatUsd(h.cost.total_usd)} total across ${h.invoices_processed} invoices`}
          tone="neutral"
        />
        <MetricCard
          label="Labor recovered"
          value={`${h.labor.time_reduction_ratio}×`}
          sublabel={`${h.labor.minutes_saved} min saved at $25/hr loaded wage`}
          hint={`= ${formatUsd(h.labor.dollars_saved)} at this batch`}
          tone="good"
        />
      </section>

      <section className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        <LatencyHistogram />
        <ReconcilerCard />
      </section>

      <section>
        <RecentActivity />
      </section>
    </div>
  );
}

function PanelHeader() {
  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center gap-3">
        <h1 className="text-2xl font-bold tracking-tight text-helm-text">AP Invoice OCR</h1>
        <span className="rounded-full border border-helm-border bg-helm-panel-2 px-2.5 py-0.5 font-mono text-[10px] uppercase tracking-[0.14em] text-helm-muted">
          sub-feature 1 / 4
        </span>
      </div>
      <p className="max-w-3xl text-sm text-helm-muted">
        Invoice PNGs are extracted to structured JSON by Llama 4 Scout vision (via Groq),
        validated against a Zod schema, and reconciled for line-item math, missing
        due dates, duplicate invoice numbers, and layout overflow. Auto-approved
        invoices land in the AP ledger; flagged ones queue for human review.
      </p>
      {isMock ? <MockBanner /> : null}
    </div>
  );
}

function MockBanner() {
  return (
    <div className="mt-2 flex items-start gap-3 rounded-md border border-helm-warn/30 bg-helm-warn/10 px-4 py-3 text-sm">
      <div className="mt-0.5 size-2 shrink-0 rounded-full bg-helm-warn" />
      <div>
        <div className="font-semibold text-helm-warn">Mock extractor</div>
        <div className="text-helm-muted">
          Field accuracy, cost, and latency below come from a controlled-noise mock of
          the vision call, not real API output. Only the reconciler stats and labor
          model reflect actual pipeline logic. Run{' '}
          <code className="font-mono text-xs text-helm-text">pnpm measure:invoice-ocr --seed 1 --extractor groq</code>{' '}
          for measured numbers.
        </div>
      </div>
    </div>
  );
}

function ReconcilerCard() {
  const r = report.headline.reconciler;
  return (
    <div className="flex flex-col gap-4 rounded-lg border border-helm-border bg-helm-panel p-5">
      <div>
        <div className="text-xs font-bold uppercase tracking-[0.18em] text-helm-faint">
          Reconciler
        </div>
        <div className="text-sm text-helm-muted">
          Treats each invoice as one labeled example. Positive class = "has any anomaly".
          Predicted positive = "reconciler raised at least one flag".
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <ReconStat label="Precision" value={r.precision} digits={3} />
        <ReconStat label="Recall" value={r.recall} digits={3} />
        <ReconStat label="F1" value={r.f1} digits={3} />
      </div>

      <ConfusionGrid
        tp={r.true_positives}
        fp={r.false_positives}
        fn={r.false_negatives}
        tn={r.true_negatives}
      />

      <div className="text-xs text-helm-faint">
        Wall time: {formatMs(report.headline.wall_ms)} · seed {report.seed} · extractor{' '}
        <span className="font-mono text-helm-muted">{report.extractor}</span>
      </div>
    </div>
  );
}

function ReconStat({ label, value, digits }: { label: string; value: number; digits: number }) {
  return (
    <div className="flex flex-col">
      <div className="text-[10px] font-bold uppercase tracking-[0.14em] text-helm-faint">
        {label}
      </div>
      <div className="tabular text-xl font-bold text-helm-accent">{value.toFixed(digits)}</div>
    </div>
  );
}

function ConfusionGrid({
  tp,
  fp,
  fn,
  tn,
}: {
  tp: number;
  fp: number;
  fn: number;
  tn: number;
}) {
  return (
    <div className="grid grid-cols-[auto_1fr_1fr] gap-px overflow-hidden rounded border border-helm-border text-xs">
      <div className="bg-helm-panel-2 p-2 text-[10px] font-bold uppercase tracking-[0.12em] text-helm-faint" />
      <div className="bg-helm-panel-2 p-2 text-center text-[10px] font-bold uppercase tracking-[0.12em] text-helm-faint">
        Pred. Anomaly
      </div>
      <div className="bg-helm-panel-2 p-2 text-center text-[10px] font-bold uppercase tracking-[0.12em] text-helm-faint">
        Pred. Clean
      </div>

      <div className="bg-helm-panel-2 p-2 text-[10px] font-bold uppercase tracking-[0.12em] text-helm-faint">
        Truth Anomaly
      </div>
      <ConfusionCell value={tp} good />
      <ConfusionCell value={fn} bad />

      <div className="bg-helm-panel-2 p-2 text-[10px] font-bold uppercase tracking-[0.12em] text-helm-faint">
        Truth Clean
      </div>
      <ConfusionCell value={fp} bad />
      <ConfusionCell value={tn} good />
    </div>
  );
}

function ConfusionCell({ value, good, bad }: { value: number; good?: boolean; bad?: boolean }) {
  const tone = good ? 'text-helm-accent' : bad ? 'text-helm-warn' : 'text-helm-text';
  return (
    <div className={`flex items-center justify-center bg-helm-panel p-3 tabular text-lg font-bold ${tone}`}>
      {value}
    </div>
  );
}
