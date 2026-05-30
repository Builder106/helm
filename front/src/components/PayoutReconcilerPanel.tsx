import { payoutReport, isPayoutMock } from '../lib/payouts.ts';
import { formatPercent, formatUsd, formatMs } from '../lib/report.ts';
import { MetricCard } from './MetricCard.tsx';

// Trial 02 — Creator Payout Reconciler. Lives at twilight zone (~80m)
// in the depth metaphor. Same structural moves as TrialPanel 01: hero
// with chapter mark + methodology strip, four metric cards, a per-
// creator discrepancy table.

export function PayoutReconcilerPanel() {
  const h = payoutReport.headline;
  return (
    <div className="flex flex-col gap-10" id="trial-02">
      <PanelHeader />

      <section
        className="rise grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-4"
        style={{ animationDelay: '120ms' }}
      >
        <MetricCard
          index="01"
          label="exact match"
          value={formatPercent(h.exact_match_rate)}
          sublabel={
            <>
              <span className="tabular font-mono text-helm-vellum">{h.exact_match_count}</span> of{' '}
              <span className="tabular font-mono text-helm-vellum">{h.creators_processed}</span>{' '}
              creators perfectly matched the deterministic ground truth.
            </>
          }
          tone={h.exact_match_rate >= 0.85 ? 'good' : 'warn'}
        />
        <MetricCard
          index="02"
          label="field accuracy"
          value={formatPercent(h.extraction.field_accuracy)}
          sublabel="14 fields per creator (totals, base, rate, commission, USD payout, status). Cent-level tolerance on monetary fields."
          tone={h.extraction.field_accuracy >= 0.95 ? 'good' : 'warn'}
        />
        <MetricCard
          index="03"
          label="cost / creator"
          value={formatUsd(h.cost.mean_per_creator_usd)}
          sublabel={
            <>
              <span className="tabular font-mono text-helm-vellum">{formatUsd(h.cost.total_usd)}</span>{' '}
              total across the run.
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
              <span className="tabular font-mono text-helm-vellum">{h.labor.minutes_saved}</span>{' '}
              minutes saved at $25/hr loaded wage.
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
        <DiscrepancyTable />
        <ReconciliationStats />
      </section>
    </div>
  );
}

function PanelHeader() {
  return (
    <div className="rise flex flex-col gap-5" style={{ animationDelay: '20ms' }}>
      <div className="flex items-center gap-3">
        <span className="font-mono text-[11px] uppercase tracking-[0.2em] text-helm-brass">trial 02</span>
        <span className="h-px w-10 bg-helm-brass/60" />
        <span className="font-mono text-[10px] uppercase tracking-[0.22em] text-helm-vellum-faint">
          sub-trial · 2 of 4
        </span>
      </div>

      <div className="flex items-baseline gap-4 flex-wrap">
        <h1
          className="text-[52px] font-bold leading-[0.95] tracking-tight text-helm-vellum"
          style={{ fontFamily: 'var(--font-display)', letterSpacing: '-0.035em' }}
        >
          Creator Payout
        </h1>
        <span
          className="font-mono text-[36px] font-bold leading-none text-helm-cyan"
          style={{ letterSpacing: '-0.02em' }}
        >
          RECONCILER
        </span>
      </div>

      <p className="max-w-3xl text-[15px] leading-relaxed text-helm-vellum-muted">
        Each creator's monthly orders are paired with a natural-language payout policy
        (commission tiers, refund rules, currency FX, minimum-payout threshold) and sent to
        Gemini as a single system prompt. The model emits a structured payout breakdown,
        which is scored field-by-field against a deterministic ground-truth computer that
        mirrors the same policy in code.
      </p>

      <MethodologyStrip />

      {isPayoutMock ? <MockBanner /> : null}
    </div>
  );
}

function MethodologyStrip() {
  const cells = [
    { label: 'model',     value: 'gemini-3.1-flash-lite' },
    { label: 'provider',  value: 'google ai studio' },
    { label: 'fixture',   value: '50 creators · 863 orders' },
    { label: 'seed',      value: payoutReport.seed },
    { label: 'extractor', value: payoutReport.extractor },
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
          mock reconciler
        </div>
        <div className="mt-1.5 max-w-3xl text-[13.5px] leading-relaxed text-helm-vellum-muted">
          Field accuracy and per-creator drift below come from a controlled-noise mock of
          the policy-reasoning call, not real API output. Run{' '}
          <code className="border border-helm-cyan/20 bg-helm-twilight/60 px-1.5 py-0.5 font-mono text-[11.5px] text-helm-vellum">
            pnpm measure:payout-reconciler --seed 1 --extractor gemini
          </code>{' '}
          for measured numbers.
        </div>
      </div>
    </div>
  );
}

function DiscrepancyTable() {
  // Show only creators where the LLM payout differed from ground truth.
  const discrepancies = payoutReport.records
    .filter((r) => !r.exact_match)
    .sort((a, b) => b.payout_drift_usd - a.payout_drift_usd);

  return (
    <div
      className="relative flex flex-col border border-helm-cyan/15 backdrop-blur-md"
      style={{
        background:
          'linear-gradient(180deg, rgba(125, 211, 224, 0.05) 0%, rgba(8, 42, 69, 0.55) 30%, rgba(4, 27, 50, 0.55) 100%)',
      }}
    >
      <CornerMarks />

      <div className="border-b border-helm-cyan/15 px-7 py-5">
        <div className="eyebrow">discrepancies · per creator</div>
        <h3
          className="mt-2 text-[22px] font-bold leading-tight tracking-tight text-helm-vellum"
          style={{ fontFamily: 'var(--font-display)', letterSpacing: '-0.02em' }}
        >
          Creators flagged for{' '}
          <span className="text-helm-cyan">human review</span>
        </h3>
        <p className="mt-1 max-w-md text-[12.5px] leading-snug text-helm-vellum-muted">
          {discrepancies.length} of {payoutReport.headline.creators_processed} creators
          diverged from the deterministic ground truth. Showing largest dollar drift first.
        </p>
      </div>

      {discrepancies.length === 0 ? (
        <div className="px-7 py-10 text-center font-mono text-[12px] text-helm-vellum-faint">
          No discrepancies — all {payoutReport.headline.creators_processed} creators exact-match.
        </div>
      ) : (
        <ol className="max-h-[400px] overflow-y-auto divide-y divide-helm-cyan/[0.07]">
          {discrepancies.slice(0, 20).map((r) => (
            <DiscrepancyRow key={r.creator_id} r={r} />
          ))}
        </ol>
      )}
    </div>
  );
}

function DiscrepancyRow({ r }: { r: { creator_id: string; handle: string; tier: string; field_accuracy: number; payout_drift_usd: number; truth_payout_usd: number; predicted_payout_usd: number; status_correct: boolean } }) {
  return (
    <li className="flex items-baseline gap-2 px-7 py-2 font-mono text-[12px] leading-snug hover:bg-helm-cyan/[0.05]">
      <span className="tabular text-helm-vellum">{r.creator_id}</span>
      <span className="text-helm-cyan-dim">·</span>
      <span className="text-helm-vellum-muted">{r.handle}</span>
      <span className="text-helm-brass">▸</span>
      <span className="tabular text-helm-vellum-muted">
        truth:<span className="text-helm-vellum">{formatUsd(r.truth_payout_usd)}</span>{' '}
        pred:<span className="text-helm-vellum">{formatUsd(r.predicted_payout_usd)}</span>{' '}
        drift:
        <span className={r.payout_drift_usd > 1 ? 'text-helm-warn' : 'text-helm-vellum'}>
          {formatUsd(r.payout_drift_usd)}
        </span>{' '}
        field-acc:<span className="text-helm-vellum">{formatPercent(r.field_accuracy)}</span>
      </span>
      <span className="text-helm-brass">▸</span>
      <span
        className={`tabular uppercase tracking-[0.08em] ${
          r.status_correct ? 'text-helm-pass' : 'text-helm-fail'
        }`}
      >
        status:{r.status_correct ? 'ok' : 'flip'}
      </span>
    </li>
  );
}

function ReconciliationStats() {
  const h = payoutReport.headline;
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
        <div className="eyebrow">reconciliation · dollars</div>
        <h3
          className="mt-2 text-[22px] font-bold leading-tight tracking-tight text-helm-vellum"
          style={{ fontFamily: 'var(--font-display)', letterSpacing: '-0.02em' }}
        >
          Money <span className="text-helm-cyan">routed</span>
        </h3>
      </div>

      <div className="grid grid-cols-2 gap-x-4 gap-y-5">
        <DollarReading label="ground truth $" value={h.truth_dollars} />
        <DollarReading label="reconciled $" value={h.dollars_reconciled} />
        <DollarReading
          label="max single drift"
          value={h.max_payout_drift_usd}
          tone={h.max_payout_drift_usd <= 0.5 ? 'pass' : h.max_payout_drift_usd <= 2 ? 'warn' : 'fail'}
        />
        <DollarReading
          label="total drift"
          value={h.total_payout_drift_usd}
          tone={h.total_payout_drift_usd <= 5 ? 'pass' : 'warn'}
        />
      </div>

      <div className="hairline" />

      <div className="grid grid-cols-2 gap-4">
        <DialReading label="status accuracy" value={h.status_classification.accuracy} suffix="" digits={3} />
        <DialReading label="parse rate" value={h.extraction.parse_rate} suffix="" digits={3} />
      </div>

      <div className="hairline" />
      <div className="font-mono text-[10px] uppercase tracking-[0.18em] text-helm-cyan-dim">
        wall {formatMs(h.wall_ms)} · seed {payoutReport.seed} · extractor{' '}
        <span className="text-helm-vellum">{payoutReport.extractor}</span>
      </div>
    </div>
  );
}

function DollarReading({
  label,
  value,
  tone,
}: {
  label: string;
  value: number;
  tone?: 'pass' | 'warn' | 'fail';
}) {
  const color =
    tone === 'pass'
      ? 'text-helm-pass'
      : tone === 'warn'
        ? 'text-helm-warn'
        : tone === 'fail'
          ? 'text-helm-fail'
          : 'text-helm-vellum';
  return (
    <div className="flex flex-col gap-1.5">
      <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-helm-cyan-dim">
        {label}
      </span>
      <span className={`readout text-[24px] leading-none ${color}`}>{formatUsd(value, 2)}</span>
    </div>
  );
}

function DialReading({
  label,
  value,
  suffix,
  digits,
}: {
  label: string;
  value: number;
  suffix: string;
  digits: number;
}) {
  const tone =
    value >= 0.95 ? 'text-helm-pass glow-pass' : value >= 0.85 ? 'text-helm-warn' : 'text-helm-fail';
  return (
    <div className="flex flex-col items-start gap-1.5">
      <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-helm-cyan-dim">
        {label}
      </span>
      <span className={`readout text-[24px] leading-none ${tone}`}>
        {value.toFixed(digits)}{suffix}
      </span>
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
