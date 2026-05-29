import { HelmMark } from './HelmMark.tsx';
import { report, isMock } from '../lib/report.ts';

export function TopBar() {
  return (
    <header className="flex items-center justify-between border-b border-helm-border bg-helm-panel/60 px-6 py-3 backdrop-blur">
      <div className="flex items-center gap-3">
        <HelmMark size={28} />
        <span className="text-lg font-bold tracking-tight text-helm-text">Helm</span>
        <span className="ml-2 hidden text-xs uppercase tracking-[0.18em] text-helm-faint sm:inline">
          ops dashboard
        </span>
      </div>

      <div className="flex items-center gap-3">
        <ExtractorBadge />
        <FixturePill />
      </div>
    </header>
  );
}

function ExtractorBadge() {
  if (isMock) {
    return (
      <span className="inline-flex items-center gap-2 rounded-full border border-helm-warn/40 bg-helm-warn/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.12em] text-helm-warn">
        <span className="size-1.5 rounded-full bg-helm-warn" /> Mock data
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-2 rounded-full border border-helm-accent/50 bg-helm-accent/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.12em] text-helm-accent">
      <span className="size-1.5 rounded-full bg-helm-accent" /> Measured · Llama 4 Scout
    </span>
  );
}

function FixturePill() {
  return (
    <span className="hidden items-center gap-2 rounded-md border border-helm-border bg-helm-panel-2 px-3 py-1 font-mono text-xs text-helm-muted md:inline-flex">
      <span className="text-helm-faint">seed</span>
      <span className="text-helm-text">{report.seed}</span>
      <span className="text-helm-faint">·</span>
      <span className="text-helm-faint">n</span>
      <span className="text-helm-text">{report.headline.invoices_processed}</span>
    </span>
  );
}
