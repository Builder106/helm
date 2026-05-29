import { report, formatPercent, formatUsd, formatMs } from '../lib/report.ts';
import type { ReportRecord } from '../lib/report.ts';

// Most-recent 14 invoice records, sorted by file_id. The "real" log
// will be live-tailed when the back/ Express layer ships; for now
// this is a deterministic snapshot of the measurement output.
const VISIBLE = 14;
const recent = [...report.records].slice(-VISIBLE).reverse();

export function RecentActivity() {
  return (
    <div className="overflow-hidden rounded-lg border border-helm-border bg-helm-panel">
      <div className="flex items-center justify-between border-b border-helm-border px-5 py-3">
        <div>
          <div className="text-xs font-bold uppercase tracking-[0.18em] text-helm-faint">
            Recent activity
          </div>
          <div className="text-sm text-helm-muted">
            Last {VISIBLE} invoices through the pipeline.
          </div>
        </div>
        <div className="text-[11px] uppercase tracking-[0.14em] text-helm-faint">
          {report.records.length} total
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-helm-border text-left text-[10px] uppercase tracking-[0.14em] text-helm-faint">
              <th className="px-5 py-2 font-semibold">Invoice</th>
              <th className="px-3 py-2 font-semibold">Anomaly (truth)</th>
              <th className="px-3 py-2 font-semibold">Status</th>
              <th className="px-3 py-2 text-right font-semibold">Field acc.</th>
              <th className="px-3 py-2 text-right font-semibold">Latency</th>
              <th className="px-5 py-2 text-right font-semibold">Cost</th>
            </tr>
          </thead>
          <tbody>
            {recent.map((r) => (
              <Row key={r.file_id} r={r} />
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function Row({ r }: { r: ReportRecord }) {
  const isClean = r.reconciliation.status === 'clean';
  const anomalyLabel = r.ground_truth_anomaly === 'none' ? '—' : r.ground_truth_anomaly;

  return (
    <tr className="border-b border-helm-border/50 last:border-b-0 hover:bg-helm-panel-2/60">
      <td className="px-5 py-2 font-mono text-xs text-helm-text">{r.file_id}</td>
      <td className="px-3 py-2 text-xs text-helm-muted">{anomalyLabel}</td>
      <td className="px-3 py-2">
        <StatusBadge status={r.reconciliation.status} flags={r.reconciliation.flags} parsed={r.extraction.parsed} />
      </td>
      <td className="px-3 py-2 text-right tabular text-xs text-helm-text">
        {r.extraction.parsed ? formatPercent(r.extraction.field_accuracy) : '—'}
      </td>
      <td className="px-3 py-2 text-right tabular text-xs text-helm-muted">
        {formatMs(r.extraction.latency_ms)}
      </td>
      <td className="px-5 py-2 text-right tabular text-xs text-helm-muted">
        {formatUsd(r.extraction.cost_usd)}
      </td>
    </tr>
  );
}

function StatusBadge({
  status,
  flags,
  parsed,
}: {
  status: 'clean' | 'flagged';
  flags: string[];
  parsed: boolean;
}) {
  if (!parsed) {
    return (
      <span className="inline-flex items-center gap-1.5 rounded border border-helm-danger/40 bg-helm-danger/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.12em] text-helm-danger">
        <span className="size-1.5 rounded-full bg-helm-danger" /> Failed
      </span>
    );
  }
  if (status === 'clean') {
    return (
      <span className="inline-flex items-center gap-1.5 rounded border border-helm-accent/30 bg-helm-accent/5 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.12em] text-helm-accent">
        <span className="size-1.5 rounded-full bg-helm-accent" /> Auto-approved
      </span>
    );
  }
  return (
    <span
      className="inline-flex items-center gap-1.5 rounded border border-helm-warn/40 bg-helm-warn/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.12em] text-helm-warn"
      title={flags.join(', ')}
    >
      <span className="size-1.5 rounded-full bg-helm-warn" /> Needs review
    </span>
  );
}
