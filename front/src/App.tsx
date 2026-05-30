import { Analytics } from '@vercel/analytics/react';
import { SpeedInsights } from '@vercel/speed-insights/react';
import { Sidebar } from './components/Sidebar.tsx';
import { TopBar } from './components/TopBar.tsx';
import { InvoiceOCRPanel } from './components/InvoiceOCRPanel.tsx';
import { SurfaceWaves } from './components/SurfaceWaves.tsx';
import { MarineSnow } from './components/MarineSnow.tsx';
import { DepthDecorations } from './components/DepthDecorations.tsx';

export default function App() {
  return (
    <div className="relative flex h-full flex-col text-helm-text">
      {/* Drifting particulates layer — fixed across the whole viewport. */}
      <MarineSnow />

      <TopBar />

      <div className="relative z-10 flex flex-1 overflow-hidden">
        <Sidebar />

        <main className="relative flex-1 overflow-y-auto">
          {/* Wave shapes break against the top of the content area, just
              below the top bar. This is the page's transition from sky
              into water. */}
          <SurfaceWaves />

          {/* Margin-zone silhouettes: submarine, anchor, whale,
              anglerfish — each placed at the depth it belongs to. */}
          <DepthDecorations />

          <div className="caustics relative z-10 mx-auto max-w-[1280px] px-10 pb-16 pt-32">
            <InvoiceOCRPanel />
            <PageFooter />
          </div>
        </main>
      </div>

      {/* Vercel Analytics + Core Web Vitals — surfaces in the Vercel
          project's Analytics + Speed Insights dashboards. No code in
          dev (the components no-op when not behind Vercel's edge). */}
      <Analytics />
      <SpeedInsights />
    </div>
  );
}

function PageFooter() {
  return (
    <footer className="mt-16 flex flex-col gap-2 border-t border-helm-cyan/15 pt-6 text-[11px] text-helm-cyan-dim">
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 font-mono uppercase tracking-[0.18em]">
        <span>helm</span>
        <span>·</span>
        <span>submersible · eval dive</span>
        <span>·</span>
        <span>builder106/helm</span>
        <span>·</span>
        <a
          className="brass-underline text-helm-vellum-muted hover:text-helm-cyan"
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
