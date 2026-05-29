import { report, isMock, formatPercent, formatUsd, formatMs } from '../lib/report.ts';
import { MetricCard } from './MetricCard.tsx';
import { LatencyHistogram } from './LatencyHistogram.tsx';
import { RecentActivity } from './RecentActivity.tsx';

export function InvoiceOCRPanel() {
  const h = report.headline;

  return (
    <div className="flex flex-col gap-10">
      <PanelHeader />

      <section
        className="rise grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-4"
        style={{ animationDelay: '120ms' }}
      >
        <MetricCard
          index="i"
          label="Parse rate"
          value={formatPercent(h.extraction.parse_rate)}
          sublabel={
            <>
              <span className="tabular text-helm-vellum">
                {Math.round(h.extraction.parse_rate * h.invoices_processed)}
              </span>{' '}
              of <span className="tabular text-helm-vellum">{h.invoices_processed}</span> invoices cleared validation.
            </>
          }
          tone={h.extraction.parse_rate >= 0.95 ? 'good' : 'warn'}
        />
        <MetricCard
          index="ii"
          label="Field accuracy"
          value={formatPercent(h.extraction.field_accuracy)}
          sublabel="Exact-match across vendor, dates, totals, and every line-item field, micro-averaged."
          tone={h.extraction.field_accuracy >= 0.95 ? 'good' : 'warn'}
        />
        <MetricCard
          index="iii"
          label="Cost / invoice"
          value={formatUsd(h.cost.mean_per_invoice_usd)}
          sublabel={
            <>
              <span className="tabular text-helm-vellum">{formatUsd(h.cost.total_usd)}</span> total across the run.
            </>
          }
          tone="neutral"
        />
        <MetricCard
          index="iv"
          label="Labor recovered"
          value={`${h.labor.time_reduction_ratio}×`}
          sublabel={
            <>
              <span className="tabular text-helm-vellum">{h.labor.minutes_saved}</span> minutes saved at $25/hr loaded wage.
            </>
          }
          hint={`≈ ${formatUsd(h.labor.dollars_saved)} this batch`}
          tone="good"
        />
      </section>

      <section
        className="rise grid grid-cols-1 gap-5 xl:grid-cols-[1.35fr_1fr]"
        style={{ animationDelay: '220ms' }}
      >
        <LatencyHistogram />
        <ReconcilerInstrument />
      </section>

      <section className="rise" style={{ animationDelay: '320ms' }}>
        <RecentActivity />
      </section>
    </div>
  );
}

function PanelHeader() {
  return (
    <div className="rise flex flex-col gap-4" style={{ animationDelay: '20ms' }}>
      <div className="flex items-center gap-3">
        <span className="font-mono text-[10px] uppercase tracking-[0.32em] text-helm-brass">
          Chapter I
        </span>
        <span className="h-px w-12 bg-helm-brass/60" />
        <span className="font-mono text-[10px] uppercase tracking-[0.28em] text-helm-vellum-faint">
          Sub-feature 1 / 4
        </span>
      </div>

      <h1
        className="display text-[88px] leading-[0.92] tracking-tight text-helm-vellum"
        style={{ fontFamily: 'var(--font-display)' }}
      >
        AP Invoice <span className="italic text-helm-brass-bright">OCR</span>
      </h1>

      <p className="max-w-3xl text-[15.5px] leading-relaxed text-helm-vellum-muted">
        Invoice PNGs are extracted to structured JSON by Llama 4 Scout vision, served via Groq,
        and validated against a Zod schema. Each invoice is then reconciled for line-item math,
        missing due dates, duplicate invoice numbers, and layout overflow. Auto-approved invoices
        land in the AP ledger; flagged ones queue for human review.
      </p>

      {isMock ? <MockBanner /> : null}
    </div>
  );
}

function MockBanner() {
  return (
    <div className="mt-2 flex items-start gap-4 border border-helm-warn/40 bg-helm-warn/5 px-5 py-4">
      <span aria-hidden className="mt-1.5 size-2.5 shrink-0 rounded-full bg-helm-warn" />
      <div>
        <div className="font-mono text-[10px] uppercase tracking-[0.24em] text-helm-warn">
          Mock extractor
        </div>
        <div className="mt-1.5 max-w-3xl text-[13.5px] leading-relaxed text-helm-vellum-muted">
          Field accuracy, cost, and latency below come from a controlled-noise mock of the vision
          call, not real API output. Only the reconciler stats and labor model reflect actual
          pipeline logic. Run{' '}
          <code className="border border-helm-rule bg-helm-bg-2 px-1.5 py-0.5 font-mono text-[11.5px] text-helm-vellum">
            pnpm measure:invoice-ocr --seed 1 --extractor groq
          </code>{' '}
          for measured numbers.
        </div>
      </div>
    </div>
  );
}

function ReconcilerInstrument() {
  const r = report.headline.reconciler;
  return (
    <div className="relative flex flex-col gap-5 border border-helm-rule bg-helm-panel/60 p-7 backdrop-blur">
      <CornerMarks />

      <div>
        <div className="eyebrow">Instrument · Reconciler</div>
        <h3
          className="italic-display mt-1 text-[26px] leading-tight text-helm-vellum"
          style={{ fontFamily: 'var(--font-display)' }}
        >
          Anomaly <span className="text-helm-brass-bright">classifier</span>
        </h3>
        <p className="mt-1 max-w-md text-[12.5px] leading-snug text-helm-vellum-muted">
          Each invoice is one labeled example. Positive class = "has any anomaly".
          Predicted positive = "reconciler raised at least one flag".
        </p>
      </div>

      <div className="grid grid-cols-3 gap-x-4">
        <DialReading label="Precision" value={r.precision} />
        <DialReading label="Recall" value={r.recall} />
        <DialReading label="F1" value={r.f1} />
      </div>

      <ConfusionGrid
        tp={r.true_positives}
        fp={r.false_positives}
        fn={r.false_negatives}
        tn={r.true_negatives}
      />

      <div className="hairline" />
      <div className="font-mono text-[10px] uppercase tracking-[0.18em] text-helm-vellum-faint">
        Wall time {formatMs(report.headline.wall_ms)} · seed {report.seed} · extractor{' '}
        <span className="text-helm-vellum">{report.extractor}</span>
      </div>
    </div>
  );
}

function DialReading({ label, value }: { label: string; value: number }) {
  return (
    <div className="flex flex-col items-start gap-1.5 border-l border-helm-rule pl-3 first:border-l-0 first:pl-0">
      <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-helm-vellum-faint">
        {label}
      </span>
      <span
        className="display tabular text-[36px] leading-none text-helm-brass-bright"
        style={{ fontFamily: 'var(--font-display)' }}
      >
        {value.toFixed(3)}
      </span>
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
    <div className="grid grid-cols-[auto_1fr_1fr] gap-px overflow-hidden border border-helm-rule bg-helm-rule">
      <CellLabel />
      <CellLabel>Predicted Anomaly</CellLabel>
      <CellLabel>Predicted Clean</CellLabel>

      <CellLabel>Truth Anomaly</CellLabel>
      <ConfCell value={tp} tone="good" caption="TP" />
      <ConfCell value={fn} tone="warn" caption="FN" />

      <CellLabel>Truth Clean</CellLabel>
      <ConfCell value={fp} tone="warn" caption="FP" />
      <ConfCell value={tn} tone="good" caption="TN" />
    </div>
  );
}

function CellLabel({ children }: { children?: React.ReactNode }) {
  return (
    <div className="bg-helm-panel-2/80 px-3 py-2 font-mono text-[9.5px] uppercase tracking-[0.18em] text-helm-vellum-faint">
      {children ?? ''}
    </div>
  );
}

function ConfCell({
  value,
  tone,
  caption,
}: {
  value: number;
  tone: 'good' | 'warn';
  caption: string;
}) {
  const color = tone === 'good' ? 'text-helm-brass-bright' : 'text-helm-warn';
  return (
    <div className="relative flex items-baseline justify-center gap-2 bg-helm-panel px-4 py-4">
      <span className="absolute left-2 top-1.5 font-mono text-[9px] uppercase tracking-[0.16em] text-helm-vellum-faint">
        {caption}
      </span>
      <span className={`display tabular text-[34px] leading-none ${color}`}>{value}</span>
    </div>
  );
}

function CornerMarks() {
  return (
    <>
      <span aria-hidden className="pointer-events-none absolute right-0 top-0 size-3 border-r border-t border-helm-brass/70" />
      <span aria-hidden className="pointer-events-none absolute bottom-0 left-0 size-3 border-b border-l border-helm-brass/70" />
    </>
  );
}
