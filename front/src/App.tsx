import { Sidebar } from './components/Sidebar.tsx';
import { TopBar } from './components/TopBar.tsx';
import { InvoiceOCRPanel } from './components/InvoiceOCRPanel.tsx';

export default function App() {
  return (
    <div className="relative flex h-full flex-col bg-helm-bg text-helm-text">
      <BathymetricBackdrop />
      <TopBar />
      <div className="relative z-10 flex flex-1 overflow-hidden">
        <Sidebar />
        <main className="flex-1 overflow-y-auto">
          <div className="mx-auto max-w-[1280px] px-10 py-12">
            <InvoiceOCRPanel />
            <PageFooter />
          </div>
        </main>
      </div>
    </div>
  );
}

// Decorative backdrop — admiralty-chart elements that are load-bearing
// for the eval-harness framing: bathymetric contour rings (a depth
// chart is a measurement record), compass rose (orientation), and
// scattered depth soundings (per-point measurements in mono). All
// rendered at low opacity so they don't compete with data.
function BathymetricBackdrop() {
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
      {/* Contour rings — the chart's depth structure. */}
      <svg
        className="absolute -right-32 -bottom-40 size-[900px] text-helm-brass opacity-[0.18]"
        viewBox="0 0 800 800"
        fill="none"
      >
        {[120, 200, 280, 360, 440, 520, 600, 680].map((r, i) => (
          <circle
            key={r}
            cx="400"
            cy="400"
            r={r}
            stroke="currentColor"
            strokeWidth={i % 2 === 0 ? 0.6 : 0.3}
            strokeDasharray={i === 0 ? '' : '2 8'}
            opacity={0.6 - i * 0.06}
          />
        ))}
      </svg>

      {/* Compass rose — orientation reference, top-right of main area. */}
      <svg
        className="absolute right-12 top-32 size-32 text-helm-brass opacity-[0.16]"
        viewBox="-50 -50 100 100"
        fill="none"
      >
        <circle cx="0" cy="0" r="40" stroke="currentColor" strokeWidth="0.6" opacity="0.5" />
        <circle cx="0" cy="0" r="30" stroke="currentColor" strokeWidth="0.4" opacity="0.4" />
        <g stroke="currentColor" strokeWidth="0.5" opacity="0.55">
          <line x1="0" y1="-45" x2="0" y2="45" />
          <line x1="-45" y1="0" x2="45" y2="0" />
          <line x1="-32" y1="-32" x2="32" y2="32" opacity="0.5" />
          <line x1="-32" y1="32" x2="32" y2="-32" opacity="0.5" />
        </g>
        <polygon points="0,-40 4,0 0,40 -4,0" fill="currentColor" opacity="0.6" />
      </svg>

      {/* Depth-sounding notation — scattered measured-depth numbers in mono,
       * the way an admiralty chart marks individual soundings across water.
       * Positioned around the margins so they don't compete with data. */}
      <DepthSoundings />
    </div>
  );
}

// Each sounding is {x%, y%, depth}. The decimal middle-dot (·) is the
// standard chart notation. Numbers stay in the margins and corners so
// they read as background measurement, not active data.
const SOUNDINGS: ReadonlyArray<{ x: string; y: string; d: string }> = [
  { x: '4%',  y: '14%', d: '12·8' },
  { x: '2%',  y: '46%', d: '24' },
  { x: '3%',  y: '78%', d: '31·2' },
  { x: '14%', y: '94%', d: '47' },
  { x: '28%', y: '6%',  d: '8·4' },
  { x: '46%', y: '3%',  d: '15·6' },
  { x: '68%', y: '5%',  d: '22' },
  { x: '82%', y: '8%',  d: '38·4' },
  { x: '94%', y: '22%', d: '56' },
  { x: '97%', y: '54%', d: '74·8' },
  { x: '95%', y: '80%', d: '91' },
  { x: '86%', y: '95%', d: '108' },
  { x: '62%', y: '97%', d: '83·4' },
  { x: '40%', y: '96%', d: '64' },
  { x: '22%', y: '92%', d: '52·6' },
  { x: '8%',  y: '30%', d: '19' },
];

function DepthSoundings() {
  return (
    <div className="absolute inset-0">
      {SOUNDINGS.map((s) => (
        <span
          key={`${s.x}-${s.y}`}
          className="absolute font-mono text-[10px] tabular text-helm-brass/40 select-none"
          style={{ left: s.x, top: s.y, transform: 'translate(-50%, -50%)' }}
        >
          {s.d}
        </span>
      ))}
    </div>
  );
}

function PageFooter() {
  return (
    <footer className="mt-16 flex flex-col gap-2 border-t border-helm-rule pt-6 text-[11px] text-helm-vellum-faint">
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 font-mono uppercase tracking-[0.18em]">
        <span>helm</span>
        <span>·</span>
        <span>sea trial · eval log</span>
        <span>·</span>
        <span>builder106/helm</span>
        <span>·</span>
        <a
          className="brass-underline text-helm-vellum-muted hover:text-helm-brass-bright"
          href="https://github.com/Builder106/Helm"
        >
          source
        </a>
      </div>
      <div className="font-mono">
        A portfolio sketch of an AI/automation team's first quarter of work.
        Every README number traces to a measurement script.
      </div>
    </footer>
  );
}
