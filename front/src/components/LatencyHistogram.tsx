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

// Bucket per-invoice latencies into 12 bins between min and max, so
// the chart shape reflects the actual distribution rather than the
// fixed Mock-vs-Groq tail behavior.
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
    labels.push(`${Math.round(lo)} ms`);
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
    <div className="rounded-lg border border-helm-border bg-helm-panel p-5">
      <div className="mb-1 flex items-center justify-between">
        <div>
          <div className="text-xs font-bold uppercase tracking-[0.18em] text-helm-faint">
            Latency distribution
          </div>
          <div className="text-sm text-helm-muted">
            Per-invoice end-to-end, ms. Lower-left tail is fast invoices; right tail is rate-limit / retry backoff.
          </div>
        </div>
        <div className="text-right text-[11px] text-helm-faint">
          <div>
            p50 <span className="tabular text-helm-text">{report.headline.latency.p50_ms} ms</span>
          </div>
          <div>
            p95 <span className="tabular text-helm-text">{report.headline.latency.p95_ms} ms</span>
          </div>
          <div>
            p99 <span className="tabular text-helm-text">{report.headline.latency.p99_ms} ms</span>
          </div>
        </div>
      </div>

      <div className="h-56">
        <Bar
          data={{
            labels,
            datasets: [
              {
                label: 'invoices',
                data: counts,
                backgroundColor: 'rgba(79, 248, 210, 0.55)',
                borderColor: 'rgba(79, 248, 210, 1)',
                borderWidth: 1,
                hoverBackgroundColor: 'rgba(79, 248, 210, 0.85)',
              },
            ],
          }}
          options={{
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
              legend: { display: false },
              tooltip: {
                backgroundColor: '#161D33',
                borderColor: '#1F2840',
                borderWidth: 1,
                titleColor: '#E5E7EB',
                bodyColor: '#9CA3AF',
                callbacks: {
                  label: (ctx) => ` ${ctx.parsed.y} invoices`,
                },
              },
            },
            scales: {
              x: {
                ticks: { color: '#6B7280', font: { size: 10 }, maxRotation: 0 },
                grid: { color: 'rgba(31, 40, 64, 0.5)' },
              },
              y: {
                beginAtZero: true,
                ticks: { color: '#6B7280', stepSize: 10, font: { size: 10 } },
                grid: { color: 'rgba(31, 40, 64, 0.5)' },
              },
            },
          }}
        />
      </div>
    </div>
  );
}
