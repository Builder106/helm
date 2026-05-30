import type { ReactNode } from 'react';

type Props = {
  label: string;
  value: ReactNode;
  sublabel?: ReactNode;
  hint?: ReactNode;
  tone?: 'neutral' | 'good' | 'warn' | 'danger';
  /** Numeric index (e.g. "01"). Rendered as a mono cell stamp. */
  index?: string;
};

// Sextant-readout tile. Brass corner marks frame the cell; the value is
// JetBrains Mono Bold tabular — the eval-harness number style. Semantic
// color: green = clears threshold, amber = marginal / mock, red = failed.
export function MetricCard({ label, value, sublabel, hint, tone = 'neutral', index }: Props) {
  const accent =
    tone === 'good'
      ? 'text-helm-pass'
      : tone === 'warn'
        ? 'text-helm-warn'
        : tone === 'danger'
          ? 'text-helm-fail'
          : 'text-helm-vellum';

  return (
    <div className="group relative flex flex-col gap-3 border border-helm-rule bg-helm-panel/60 p-6 backdrop-blur transition-colors duration-300 hover:border-helm-brass/50">
      <span aria-hidden className="pointer-events-none absolute right-0 top-0 size-2.5 border-r border-t border-helm-brass/70" />
      <span aria-hidden className="pointer-events-none absolute bottom-0 left-0 size-2.5 border-b border-l border-helm-brass/70" />

      <div className="flex items-center justify-between">
        <span className="eyebrow">{label}</span>
        {index ? (
          <span className="tabular font-mono text-[10px] text-helm-brass-dim">{index}</span>
        ) : null}
      </div>

      <div className={`readout text-[44px] leading-[0.95] ${accent}`}>
        {value}
      </div>

      <div className="hairline" />

      {sublabel ? (
        <div className="text-[12.5px] leading-snug text-helm-vellum-muted">{sublabel}</div>
      ) : null}
      {hint ? (
        <div className="font-mono text-[10.5px] uppercase tracking-[0.16em] text-helm-vellum-faint">
          {hint}
        </div>
      ) : null}
    </div>
  );
}
