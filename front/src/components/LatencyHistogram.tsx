import {
  BarElement,
  CategoryScale,
  Chart as ChartJS,
  Legend,
  LinearScale,
  Tooltip,
} from 'chart.js';
import { Bar } from 'react-chartjs-2';
import { report } from '../lib/report.ts';

ChartJS.register(CategoryScale, LinearScale, BarElement, Tooltip, Legend);

// Bucket per-invoice latencies into 12 bins between min and max so the
// chart shape reflects the actual distribution.
const BIN_COUNT = 12;

function buildBins() {
  const latencies = report.records.map((r) => r.extraction.latency_ms);
  const min = Math.min(...latencies);
  const max = Math.max(...latencies);
  const width = Math.max(1, (max - min) / BIN_COUNT);
  const counts = Array(BIN_COUNT).fill(0) as number[];
  const labels: string[] = [];

  for (let i = 0; i < BIN_COUNT; i++) {
    const lo = min + i * width;
    labels.push(`${Math.round(lo)}`);
  }
  for (const ms of latencies) {
    const idx = Math.min(BIN_COUNT - 1, Math.floor((ms - min) / width));
    counts[idx]! += 1;
  }
  return { labels, counts };
}

export function LatencyHistogram() {
  const { labels, counts } = buildBins();

  return (
    <div className="relative border border-helm-rule bg-helm-panel/60 p-7 backdrop-blur">
      <CornerMarks />

      <div className="mb-5 flex items-end justify-between gap-6">
        <div>
          <div className="eyebrow">Reading · Latency</div>
          <h3
            className="italic-display mt-1 text-[26px] leading-tight text-helm-vellum"
            style={{ fontFamily: 'var(--font-display)' }}
          >
            Per-invoice <span className="text-helm-brass-bright">end-to-end</span>
          </h3>
          <p className="mt-1 max-w-md text-[12.5px] leading-snug text-helm-vellum-muted">
            Lower-left tail is fast invoices. Right tail is rate-limit and retry
            backoff under the Groq free-tier ceiling.
          </p>
        </div>

        <PercentileRail />
      </div>

      <div className="h-56">
        <Bar
          data={{
            labels,
            datasets: [
              {
                label: 'invoices',
                data: counts,
                backgroundColor: 'rgba(201, 147, 63, 0.45)',
                borderColor: 'rgba(232, 184, 113, 0.95)',
                borderWidth: 1,
                hoverBackgroundColor: 'rgba(232, 184, 113, 0.7)',
                borderRadius: 0,
              },
            ],
          }}
          options={{
            responsive: true,
            maintainAspectRatio: false,
            animation: { duration: 700 },
            plugins: {
              legend: { display: false },
              tooltip: {
                backgroundColor: '#10202F',
                borderColor: '#C9933F',
                borderWidth: 1,
                titleColor: '#F0E5CC',
                bodyColor: '#B5A98A',
                titleFont: { family: '"JetBrains Mono"', size: 10, weight: 'bold' },
                bodyFont: { family: '"JetBrains Mono"', size: 11 },
                padding: 10,
                cornerRadius: 0,
                displayColors: false,
                callbacks: {
                  title: (ctx) => `${ctx[0]?.label ?? ''} ms`,
                  label: (ctx) => ` ${ctx.parsed.y} invoices`,
                },
              },
            },
            scales: {
              x: {
                ticks: {
                  color: '#6E6754',
                  font: { family: '"JetBrains Mono"', size: 10 },
                  maxRotation: 0,
                  callback(this, _v, idx) {
                    // Show every other tick so labels don't crowd.
                    return idx % 2 === 0 ? `${labels[idx]} ms` : '';
                  },
                },
                grid: { display: false },
                border: { color: '#1B2E42' },
              },
              y: {
                beginAtZero: true,
                ticks: {
                  color: '#6E6754',
                  stepSize: 10,
                  font: { family: '"JetBrains Mono"', size: 10 },
                },
                grid: { color: 'rgba(27, 46, 66, 0.6)' },
                border: { color: '#1B2E42' },
              },
            },
          }}
        />
      </div>
    </div>
  );
}

function PercentileRail() {
  const rows = [
    { label: 'p50', value: report.headline.latency.p50_ms },
    { label: 'p95', value: report.headline.latency.p95_ms },
    { label: 'p99', value: report.headline.latency.p99_ms },
  ];
  return (
    <div className="flex flex-col gap-1 border-l border-helm-rule pl-5 text-right">
      {rows.map((r) => (
        <div key={r.label} className="flex items-baseline justify-end gap-2">
          <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-helm-vellum-faint">
            {r.label}
          </span>
          <span className="tabular text-[15px] font-medium text-helm-vellum">{r.value}</span>
          <span className="font-mono text-[9px] uppercase tracking-[0.18em] text-helm-vellum-faint">
            ms
          </span>
        </div>
      ))}
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
