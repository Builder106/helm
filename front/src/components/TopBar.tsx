import { HelmMark } from './HelmMark.tsx';
import { report, isMock } from '../lib/report.ts';

const EXTRACTOR_LABELS: Record<string, string> = {
  gemini: 'gemini 3.1 flash lite',
  groq: 'llama 4 scout',
  mock: 'mock data',
};

// Top bar = sky / surface band. The surface wave layer (see SurfaceWaves
// component) sits directly below this and visually transitions from
// sky to water as the user begins reading.
export function TopBar() {
  return (
    <header className="relative z-20 flex items-center justify-between border-b border-helm-cyan/15 bg-helm-surface/85 px-8 py-4 backdrop-blur">
      <div className="flex items-center gap-3.5">
        <HelmMark size={32} />
        <div className="flex flex-col leading-none">
          <span
            className="text-[22px] font-semibold tracking-tight text-helm-vellum"
            style={{ fontFamily: 'var(--font-display)', letterSpacing: '-0.02em' }}
          >
            Helm
          </span>
          <span className="mt-1.5 font-mono text-[10px] uppercase tracking-[0.22em] text-helm-cyan">
            submersible · eval dive
          </span>
        </div>
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
      <span className="inline-flex items-center gap-2 border border-helm-warn/40 bg-helm-warn/10 px-3 py-1.5 font-mono text-[10px] uppercase tracking-[0.2em] text-helm-warn">
        <SignalDot tone="warn" /> mock data
      </span>
    );
  }
  const label = EXTRACTOR_LABELS[report.extractor] ?? report.extractor;
  return (
    <span className="inline-flex items-center gap-2 border border-helm-pass/40 bg-helm-pass/10 px-3 py-1.5 font-mono text-[10px] uppercase tracking-[0.2em] text-helm-pass">
      <SignalDot tone="pass" /> measured · {label}
    </span>
  );
}

function SignalDot({ tone }: { tone: 'pass' | 'warn' }) {
  const fill = tone === 'pass' ? 'bg-helm-pass' : 'bg-helm-warn';
  return (
    <span className="relative flex size-2">
      <span className={`absolute inset-0 animate-ping rounded-full opacity-50 ${fill}`} />
      <span className={`relative inline-flex size-2 rounded-full ${fill}`} />
    </span>
  );
}

function FixturePill() {
  return (
    <span className="hidden items-center gap-2.5 border border-helm-cyan/20 bg-helm-twilight/50 px-3 py-1.5 font-mono text-[10.5px] text-helm-vellum-muted md:inline-flex">
      <span className="text-helm-cyan-dim">seed</span>
      <span className="tabular text-helm-vellum">{report.seed}</span>
      <span className="text-helm-cyan-dim">·</span>
      <span className="text-helm-cyan-dim">n</span>
      <span className="tabular text-helm-vellum">{report.headline.invoices_processed}</span>
    </span>
  );
}
