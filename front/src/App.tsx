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

// Decorative backdrop: faint bathymetric contour rings emanating from
// the lower-right, plus a horizon hairline below the top bar. Adds
// atmosphere without competing with data.
function BathymetricBackdrop() {
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden opacity-[0.18]">
      <svg
        className="absolute -right-32 -bottom-40 size-[900px] text-helm-brass"
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
      {/* Compass rose mark, top-right of main area. */}
      <svg
        className="absolute right-12 top-32 size-32 text-helm-brass"
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
    </div>
  );
}

function PageFooter() {
  return (
    <footer className="mt-16 flex flex-col gap-2 border-t border-helm-rule pt-6 text-[11px] text-helm-vellum-faint">
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 font-mono uppercase tracking-[0.18em]">
        <span>Helm</span>
        <span>·</span>
        <span>bridge dashboard</span>
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
