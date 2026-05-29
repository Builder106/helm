import { HelmMark } from './HelmMark.tsx';
import { report, isMock } from '../lib/report.ts';

export function TopBar() {
  return (
    <header className="relative z-10 flex items-center justify-between border-b border-helm-rule bg-helm-bg/85 px-8 py-4 backdrop-blur">
      <div className="flex items-end gap-4">
        <HelmMark size={36} />
        <div className="flex flex-col leading-none">
          <span
            className="display text-[34px] text-helm-vellum"
            style={{ fontFamily: 'var(--font-display)' }}
          >
            Helm
          </span>
          <span className="mt-1 font-mono text-[10px] uppercase tracking-[0.3em] text-helm-vellum-faint">
            Bridge · Observation Deck
          </span>
        </div>
      </div>

      <div className="flex items-center gap-4">
        <ExtractorBadge />
        <FixturePill />
      </div>
    </header>
  );
}

function ExtractorBadge() {
  if (isMock) {
    return (
      <span className="inline-flex items-center gap-2 border border-helm-warn/40 bg-helm-warn/10 px-3 py-1.5 font-mono text-[10px] uppercase tracking-[0.22em] text-helm-warn">
        <SignalDot tone="warn" /> Mock data
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-2 border border-helm-brass/50 bg-helm-brass/10 px-3 py-1.5 font-mono text-[10px] uppercase tracking-[0.22em] text-helm-brass-bright">
      <SignalDot tone="brass" /> Measured · Llama 4 Scout
    </span>
  );
}

function SignalDot({ tone }: { tone: 'brass' | 'warn' }) {
  const fill = tone === 'brass' ? 'bg-helm-brass' : 'bg-helm-warn';
  return (
    <span className="relative flex size-2">
      <span className={`absolute inset-0 animate-ping rounded-full opacity-50 ${fill}`} />
      <span className={`relative inline-flex size-2 rounded-full ${fill}`} />
    </span>
  );
}

function FixturePill() {
  return (
    <span className="hidden items-center gap-3 border border-helm-rule bg-helm-panel/60 px-3 py-1.5 font-mono text-[10px] uppercase tracking-[0.18em] text-helm-vellum-muted md:inline-flex">
      <span className="text-helm-vellum-faint">seed</span>
      <span className="tabular text-helm-vellum">{report.seed}</span>
      <span className="text-helm-vellum-faint">·</span>
      <span className="text-helm-vellum-faint">n</span>
      <span className="tabular text-helm-vellum">{report.headline.invoices_processed}</span>
    </span>
  );
}
