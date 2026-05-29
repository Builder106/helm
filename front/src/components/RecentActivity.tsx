import { report, formatPercent, formatUsd, formatMs } from '../lib/report.ts';
import type { ReportRecord } from '../lib/report.ts';

// Ledger-style activity log — monospace, alternating row tints, signal
// flags for status. Last 14 invoice records, sorted by file_id. When
// the back/ Express layer ships this becomes a live tail; for now it's
// a deterministic snapshot of the committed measurement.
const VISIBLE = 14;
const recent = [...report.records].slice(-VISIBLE).reverse();

export function RecentActivity() {
  return (
    <div className="relative overflow-hidden border border-helm-rule bg-helm-panel/60 backdrop-blur">
      <CornerMarks />

      <div className="flex items-end justify-between gap-6 border-b border-helm-rule px-7 py-5">
        <div>
          <div className="eyebrow">activity · recent</div>
          <h3
            className="mt-2 text-[22px] font-bold leading-tight tracking-tight text-helm-vellum"
            style={{ fontFamily: 'var(--font-display)', letterSpacing: '-0.02em' }}
          >
            Last <span className="tabular text-helm-brass-bright">{VISIBLE}</span> invoices
          </h3>
        </div>
        <div className="text-right font-mono text-[10.5px] uppercase tracking-[0.18em] text-helm-vellum-faint">
          {report.records.length} total · seed {report.seed}
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-helm-rule">
              <Th>invoice</Th>
              <Th>anomaly · truth</Th>
              <Th>status</Th>
              <Th align="right">field acc.</Th>
              <Th align="right">latency</Th>
              <Th align="right" className="pr-7">cost</Th>
            </tr>
          </thead>
          <tbody>
            {recent.map((r, i) => (
              <Row key={r.file_id} r={r} striped={i % 2 === 0} />
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function Th({
  children,
  align,
  className = '',
}: {
  children: React.ReactNode;
  align?: 'right';
  className?: string;
}) {
  return (
    <th
      className={`px-3 py-3 font-mono text-[10px] uppercase tracking-[0.18em] text-helm-vellum-faint first:pl-7 ${
        align === 'right' ? 'text-right' : 'text-left'
      } ${className}`}
    >
      {children}
    </th>
  );
}

function Row({ r, striped }: { r: ReportRecord; striped: boolean }) {
  const anomalyLabel =
    r.ground_truth_anomaly === 'none' ? '—' : r.ground_truth_anomaly.replace(/-/g, ' ');

  return (
    <tr
      className={`group border-b border-helm-rule/40 last:border-b-0 transition-colors duration-200 hover:bg-helm-brass/5 ${
        striped ? 'bg-helm-bg-2/30' : ''
      }`}
    >
      <td className="px-3 py-2.5 font-mono text-[12px] text-helm-vellum first:pl-7">{r.file_id}</td>
      <td className="px-3 py-2.5 font-mono text-[11px] text-helm-vellum-muted">{anomalyLabel}</td>
      <td className="px-3 py-2.5">
        <StatusFlag status={r.reconciliation.status} flags={r.reconciliation.flags} parsed={r.extraction.parsed} />
      </td>
      <td className="px-3 py-2.5 text-right tabular font-mono text-[12px] text-helm-vellum">
        {r.extraction.parsed ? formatPercent(r.extraction.field_accuracy) : '—'}
      </td>
      <td className="px-3 py-2.5 text-right tabular font-mono text-[12px] text-helm-vellum-muted">
        {formatMs(r.extraction.latency_ms)}
      </td>
      <td className="px-3 py-2.5 pr-7 text-right tabular font-mono text-[12px] text-helm-vellum-muted">
        {formatUsd(r.extraction.cost_usd)}
      </td>
    </tr>
  );
}

function StatusFlag({
  status,
  flags,
  parsed,
}: {
  status: 'clean' | 'flagged';
  flags: string[];
  parsed: boolean;
}) {
  if (!parsed) {
    return <FlagPill tone="danger" label="failed" />;
  }
  if (status === 'clean') {
    return <FlagPill tone="brass" label="auto-approved" />;
  }
  return <FlagPill tone="warn" label="needs review" title={flags.join(', ')} />;
}

function FlagPill({
  tone,
  label,
  title,
}: {
  tone: 'brass' | 'warn' | 'danger';
  label: string;
  title?: string;
}) {
  const palette =
    tone === 'brass'
      ? 'border-helm-brass/40 text-helm-brass-bright'
      : tone === 'warn'
        ? 'border-helm-warn/40 text-helm-warn'
        : 'border-helm-danger/40 text-helm-danger';
  const dot =
    tone === 'brass' ? 'bg-helm-brass' : tone === 'warn' ? 'bg-helm-warn' : 'bg-helm-danger';
  return (
    <span
      className={`inline-flex items-center gap-1.5 border ${palette} px-2 py-0.5 font-mono text-[10px] uppercase tracking-[0.16em]`}
      title={title}
    >
      <span className={`size-1.5 ${dot}`} />
      {label}
    </span>
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
