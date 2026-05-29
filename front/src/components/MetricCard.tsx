import type { ReactNode } from 'react';

type Props = {
  label: string;
  value: ReactNode;
  sublabel?: ReactNode;
  hint?: ReactNode;
  tone?: 'neutral' | 'good' | 'warn' | 'danger';
  /** Editorial chapter mark (e.g. "I"). */
  index?: string;
};

// Editorial pull-quote — the metric number reads like a magazine stat,
// not a SaaS card. Brass corner marks frame the cell; a hairline
// separates the value from the gloss.
export function MetricCard({ label, value, sublabel, hint, tone = 'neutral', index }: Props) {
  const accent =
    tone === 'good'
      ? 'text-helm-brass-bright'
      : tone === 'warn'
        ? 'text-helm-warn'
        : tone === 'danger'
          ? 'text-helm-danger'
          : 'text-helm-vellum';

  return (
    <div className="group relative flex flex-col gap-3 border border-helm-rule bg-helm-panel/60 p-6 backdrop-blur transition-colors duration-300 hover:border-helm-brass/50">
      {/* Brass corner marks (NE + SW). Editorial corner detail. */}
      <span aria-hidden className="pointer-events-none absolute right-0 top-0 size-3 border-r border-t border-helm-brass/70" />
      <span aria-hidden className="pointer-events-none absolute bottom-0 left-0 size-3 border-b border-l border-helm-brass/70" />

      <div className="flex items-center justify-between">
        <span className="eyebrow">{label}</span>
        {index ? (
          <span className="italic-display text-helm-brass-dim text-base leading-none">{index}</span>
        ) : null}
      </div>

      <div
        className={`display tabular text-[64px] leading-[0.95] ${accent}`}
        style={{ fontFamily: 'var(--font-display)' }}
      >
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
