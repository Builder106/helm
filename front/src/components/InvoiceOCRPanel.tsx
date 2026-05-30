import { report, isMock, formatPercent, formatUsd, formatMs } from '../lib/report.ts';
import { MetricCard } from './MetricCard.tsx';
import { LatencyHistogram } from './LatencyHistogram.tsx';
import { RecentActivity } from './RecentActivity.tsx';

export function InvoiceOCRPanel() {
  const h = report.headline;

  return (
    <div className="flex flex-col gap-12">
      <PanelHeader />

      <DepthBand zone="sunlit" depth="~15m" tag="readings · surface light">
        <section
          className="rise grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-4"
          style={{ animationDelay: '120ms' }}
        >
          <MetricCard
            index="01"
            label="parse rate"
            value={formatPercent(h.extraction.parse_rate)}
            sublabel={
              <>
                <span className="tabular font-mono text-helm-vellum">
                  {Math.round(h.extraction.parse_rate * h.invoices_processed)}
                </span>{' '}
                of <span className="tabular font-mono text-helm-vellum">{h.invoices_processed}</span> invoices cleared validation.
              </>
            }
            tone={h.extraction.parse_rate >= 0.95 ? 'good' : 'warn'}
          />
          <MetricCard
            index="02"
            label="field accuracy"
            value={formatPercent(h.extraction.field_accuracy)}
            sublabel="Exact-match across vendor, dates, totals, and every line-item field."
            tone={h.extraction.field_accuracy >= 0.95 ? 'good' : 'warn'}
          />
          <MetricCard
            index="03"
            label="cost / invoice"
            value={formatUsd(h.cost.mean_per_invoice_usd)}
            sublabel={
              <>
                <span className="tabular font-mono text-helm-vellum">{formatUsd(h.cost.total_usd)}</span> total across the run.
              </>
            }
            tone="neutral"
          />
          <MetricCard
            index="04"
            label="labor recovered"
            value={`${h.labor.time_reduction_ratio}×`}
            sublabel={
              <>
                <span className="tabular font-mono text-helm-vellum">{h.labor.minutes_saved}</span> min saved at $25/hr loaded wage.
              </>
            }
            hint={`≈ ${formatUsd(h.labor.dollars_saved)} this batch`}
            tone="good"
          />
        </section>
      </DepthBand>

      <DepthBand zone="twilight" depth="~80m" tag="instruments · twilight zone">
        <section
          className="rise grid grid-cols-1 gap-5 xl:grid-cols-[1.35fr_1fr]"
          style={{ animationDelay: '220ms' }}
        >
          <LatencyHistogram />
          <ReconcilerPanel />
        </section>
      </DepthBand>

      <DepthBand zone="midnight" depth="~320m" tag="trial log · midnight zone">
        <section className="rise" style={{ animationDelay: '320ms' }}>
          <RecentActivity />
        </section>
      </DepthBand>
    </div>
  );
}

// Wraps a section with a depth annotation in the gutter — depth tag on
// the left, zone description in the eyebrow. Gives every section a
// labeled position in the water column.
function DepthBand({
  zone,
  depth,
  tag,
  children,
}: {
  zone: string;
  depth: string;
  tag: string;
  children: React.ReactNode;
}) {
  return (
    <div className="relative">
      <div className="mb-4 flex items-center gap-3">
        <span className="depth-tag">{depth}</span>
        <span className="h-px w-10 bg-helm-cyan/30" />
        <span className="eyebrow text-helm-cyan-dim">{tag}</span>
        <span className="font-mono text-[9.5px] uppercase tracking-[0.16em] text-helm-cyan-deep">
          · {zone} zone
        </span>
      </div>
      {children}
    </div>
  );
}

function PanelHeader() {
  return (
    <div className="rise flex flex-col gap-5" style={{ animationDelay: '20ms' }}>
      <div className="flex items-center gap-3">
        <span className="depth-tag">~15m</span>
        <span className="h-px w-10 bg-helm-cyan/40" />
        <span className="font-mono text-[10px] uppercase tracking-[0.22em] text-helm-cyan">
          trial 01 · sub-trial 1 of 4
        </span>
      </div>

      <div className="flex items-baseline gap-4 flex-wrap">
        <h1
          className="text-[58px] font-bold leading-[0.95] tracking-tight text-helm-vellum"
          style={{ fontFamily: 'var(--font-display)', letterSpacing: '-0.035em' }}
        >
          AP Invoice
        </h1>
        <span
          className="font-mono text-[42px] font-bold leading-none text-helm-brass-bright"
          style={{ letterSpacing: '-0.02em' }}
        >
          OCR
        </span>
      </div>

      <p className="max-w-3xl text-[15px] leading-relaxed text-helm-vellum-muted">
        Invoice PNGs are extracted to structured JSON by Gemini 2.5 Flash vision (constrained
        server-side by a JSON schema, then re-validated through Zod). Each invoice is then
        reconciled for line-item math, missing due dates, duplicate invoice numbers, and layout
        overflow. Auto-approved invoices land in the AP ledger; flagged ones queue for human review.
      </p>

      <MethodologyStrip />

      {isMock ? <MockBanner /> : null}
    </div>
  );
}

function MethodologyStrip() {
  const cells = [
    { label: 'model',     value: 'gemini-2.5-flash' },
    { label: 'provider',  value: 'google ai studio' },
    { label: 'fixture',   value: '200 png' },
    { label: 'seed',      value: report.seed },
    { label: 'extractor', value: report.extractor },
    { label: 'n',         value: String(report.headline.invoices_processed) },
  ];
  return (
    <div className="flex flex-wrap items-center gap-x-3 gap-y-2 border-y border-helm-cyan/15 py-3">
      {cells.map((c, i) => (
        <span key={c.label} className="inline-flex items-center gap-1.5 font-mono text-[11px]">
          <span className="uppercase tracking-[0.16em] text-helm-cyan-dim">{c.label}</span>
          <span className="tabular text-helm-vellum">{c.value}</span>
          {i < cells.length - 1 ? <span className="ml-2 text-helm-brass">▸</span> : null}
        </span>
      ))}
    </div>
  );
}

function MockBanner() {
  return (
    <div className="mt-2 flex items-start gap-4 border border-helm-warn/40 bg-helm-warn/[0.06] px-5 py-4 backdrop-blur">
      <span aria-hidden className="mt-1.5 size-2 shrink-0 rounded-full bg-helm-warn" />
      <div>
        <div className="font-mono text-[10px] uppercase tracking-[0.22em] text-helm-warn">
          mock extractor
        </div>
        <div className="mt-1.5 max-w-3xl text-[13.5px] leading-relaxed text-helm-vellum-muted">
          Field accuracy, cost, and latency below come from a controlled-noise mock of the vision
          call, not real API output. Only the reconciler stats and labor model reflect actual
          pipeline logic. Run{' '}
          <code className="border border-helm-cyan/20 bg-helm-twilight/60 px-1.5 py-0.5 font-mono text-[11.5px] text-helm-vellum">
            pnpm measure:invoice-ocr --seed 1 --extractor gemini
          </code>{' '}
          for measured numbers.
        </div>
      </div>
    </div>
  );
}

function ReconcilerPanel() {
  const r = report.headline.reconciler;
  return (
    <div
      className="relative flex flex-col gap-5 border border-helm-cyan/15 p-7 backdrop-blur-md"
      style={{
        background:
          'linear-gradient(180deg, rgba(125, 211, 224, 0.05) 0%, rgba(8, 42, 69, 0.55) 30%, rgba(4, 27, 50, 0.55) 100%)',
      }}
    >
      <CornerMarks />

      <div>
        <div className="eyebrow">reconciler · classifier</div>
        <h3
          className="mt-2 text-[22px] font-bold leading-tight tracking-tight text-helm-vellum"
          style={{ fontFamily: 'var(--font-display)', letterSpacing: '-0.02em' }}
        >
          Anomaly <span className="text-helm-cyan">detection</span>
        </h3>
        <p className="mt-1 max-w-md text-[12.5px] leading-snug text-helm-vellum-muted">
          Each invoice is one labeled example. Positive class = "has any anomaly".
          Predicted positive = "reconciler raised at least one flag".
        </p>
      </div>

      <div className="grid grid-cols-3 gap-x-4">
        <DialReading label="precision" value={r.precision} />
        <DialReading label="recall" value={r.recall} />
        <DialReading label="f1" value={r.f1} />
      </div>

      <ConfusionGrid
        tp={r.true_positives}
        fp={r.false_positives}
        fn={r.false_negatives}
        tn={r.true_negatives}
      />

      <div className="hairline" />
      <div className="font-mono text-[10px] uppercase tracking-[0.18em] text-helm-cyan-dim">
        wall {formatMs(report.headline.wall_ms)} · seed {report.seed} · extractor{' '}
        <span className="text-helm-vellum">{report.extractor}</span>
      </div>
    </div>
  );
}

function DialReading({ label, value }: { label: string; value: number }) {
  const tone =
    value >= 0.85
      ? 'text-helm-pass glow-pass'
      : value >= 0.7
        ? 'text-helm-warn'
        : 'text-helm-fail';
  return (
    <div className="flex flex-col items-start gap-1.5 border-l border-helm-cyan/15 pl-3 first:border-l-0 first:pl-0">
      <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-helm-cyan-dim">
        {label}
      </span>
      <span className={`readout text-[28px] leading-none ${tone}`}>{value.toFixed(3)}</span>
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
    <div className="grid grid-cols-[auto_1fr_1fr] gap-px overflow-hidden border border-helm-cyan/15 bg-helm-cyan/10">
      <CellLabel />
      <CellLabel>pred. anomaly</CellLabel>
      <CellLabel>pred. clean</CellLabel>

      <CellLabel>truth anomaly</CellLabel>
      <ConfCell value={tp} tone="pass" caption="tp" />
      <ConfCell value={fn} tone="warn" caption="fn" />

      <CellLabel>truth clean</CellLabel>
      <ConfCell value={fp} tone="warn" caption="fp" />
      <ConfCell value={tn} tone="pass" caption="tn" />
    </div>
  );
}

function CellLabel({ children }: { children?: React.ReactNode }) {
  return (
    <div className="bg-helm-twilight/70 px-3 py-2 font-mono text-[9.5px] uppercase tracking-[0.16em] text-helm-cyan-dim">
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
  tone: 'pass' | 'warn';
  caption: string;
}) {
  const color = tone === 'pass' ? 'text-helm-pass' : 'text-helm-warn';
  return (
    <div className="relative flex items-baseline justify-center gap-2 bg-helm-twilight/40 px-4 py-4">
      <span className="absolute left-2 top-1.5 font-mono text-[9px] uppercase tracking-[0.16em] text-helm-cyan-dim">
        {caption}
      </span>
      <span className={`readout text-[26px] leading-none ${color}`}>{value}</span>
    </div>
  );
}

function CornerMarks() {
  return (
    <>
      <span aria-hidden className="pointer-events-none absolute right-0 top-0 size-2.5 border-r border-t border-helm-brass/70" />
      <span aria-hidden className="pointer-events-none absolute bottom-0 left-0 size-2.5 border-b border-l border-helm-brass/70" />
    </>
  );
}
