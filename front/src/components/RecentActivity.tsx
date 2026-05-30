// Navigator's logbook — one line per invoice processed. Each row reads
// as an eval-harness output line, with brass chevrons (▸) separating
// id-cluster ▸ metrics-cluster ▸ status-cluster. Tabular monospace
// throughout so columns align across rows even without a table grid.

import { report, formatPercent, formatUsd, formatMs } from '../lib/report.ts';
import type { ReportRecord } from '../lib/report.ts';

const VISIBLE = 14;
const recent = [...report.records].slice(-VISIBLE).reverse();

export function RecentActivity() {
  return (
    <div className="relative overflow-hidden border border-helm-rule bg-helm-panel/60 backdrop-blur">
      <CornerMarks />

      <div className="flex items-end justify-between gap-6 border-b border-helm-rule px-7 py-5">
        <div>
          <div className="eyebrow">log · trial run</div>
          <h3
            className="mt-2 text-[22px] font-bold leading-tight tracking-tight text-helm-vellum"
            style={{ fontFamily: 'var(--font-display)', letterSpacing: '-0.02em' }}
          >
            Last <span className="tabular text-helm-brass-bright">{VISIBLE}</span> entries
          </h3>
        </div>
        <div className="text-right font-mono text-[10.5px] uppercase tracking-[0.18em] text-helm-vellum-faint">
          {report.records.length} total · seed {report.seed}
        </div>
      </div>

      <ol className="divide-y divide-helm-rule/50">
        {recent.map((r, i) => (
          <LogLine key={r.file_id} r={r} ordinal={recent.length - i} />
        ))}
      </ol>
    </div>
  );
}

function LogLine({ r, ordinal }: { r: ReportRecord; ordinal: number }) {
  const fields = `${r.extraction.field_correct}/${r.extraction.field_total}`;
  const isFailed = !r.extraction.parsed;
  const status = !r.extraction.parsed
    ? 'failed'
    : r.reconciliation.status === 'clean'
      ? 'auto-approved'
      : 'needs-review';

  const statusColor = !r.extraction.parsed
    ? 'text-helm-fail'
    : r.reconciliation.status === 'clean'
      ? 'text-helm-pass'
      : 'text-helm-warn';

  return (
    <li
      className={`flex items-baseline gap-2 px-7 py-2 font-mono text-[12px] leading-snug transition-colors duration-150 hover:bg-helm-brass/5 ${
        isFailed ? 'bg-helm-fail/[0.03]' : ''
      }`}
    >
      <span className="tabular text-[10.5px] text-helm-vellum-faint">
        [{String(ordinal).padStart(3, '0')}]
      </span>
      <span className="tabular text-helm-vellum">{r.file_id}</span>
      <span className="text-helm-brass">▸</span>
      <span className="tabular text-helm-vellum-muted">
        parsed:<span className="text-helm-vellum">{r.extraction.parsed ? '1' : '0'}</span>{' '}
        fields:<span className="text-helm-vellum">{fields}</span>{' '}
        lat:<span className="text-helm-vellum">{formatMs(r.extraction.latency_ms)}</span>{' '}
        cost:<span className="text-helm-vellum">{formatUsd(r.extraction.cost_usd)}</span>
        {r.extraction.parsed ? (
          <>
            {' '}acc:<span className="text-helm-vellum">{formatPercent(r.extraction.field_accuracy)}</span>
          </>
        ) : null}
      </span>
      {r.ground_truth_anomaly !== 'none' ? (
        <>
          <span className="text-helm-brass">▸</span>
          <span className="tabular text-helm-vellum-faint">
            anomaly:<span className="text-helm-vellum-muted">{r.ground_truth_anomaly}</span>
          </span>
        </>
      ) : null}
      <span className="text-helm-brass">▸</span>
      <span className={`tabular uppercase tracking-[0.08em] ${statusColor}`}>{status}</span>
    </li>
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
