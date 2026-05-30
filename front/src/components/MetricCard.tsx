import type { ReactNode } from 'react';

type Props = {
  label: string;
  value: ReactNode;
  sublabel?: ReactNode;
  hint?: ReactNode;
  tone?: 'neutral' | 'good' | 'warn' | 'danger';
  index?: string;
};

// Porthole-tile readout. Lit-from-above gradient (slightly brighter at
// the top edge, fading down) gives each card the look of a submarine
// porthole facing the surface. Brass corner marks at NE+SW; the value
// is JetBrains Mono Bold tabular in a semantic color, with a gentle
// bioluminescent glow when it passes threshold.
export function MetricCard({ label, value, sublabel, hint, tone = 'neutral', index }: Props) {
  const accent =
    tone === 'good'
      ? 'text-helm-pass glow-pass'
      : tone === 'warn'
        ? 'text-helm-warn'
        : tone === 'danger'
          ? 'text-helm-fail'
          : 'text-helm-vellum';

  return (
    <div
      className="group relative flex flex-col gap-3 border border-helm-cyan/15 p-6 backdrop-blur-md transition-colors duration-300 hover:border-helm-cyan/35"
      style={{
        background:
          'linear-gradient(180deg, rgba(125, 211, 224, 0.07) 0%, rgba(8, 42, 69, 0.55) 30%, rgba(4, 27, 50, 0.55) 100%)',
      }}
    >
      {/* Brass corner marks — instrument chrome. */}
      <span aria-hidden className="pointer-events-none absolute right-0 top-0 size-2.5 border-r border-t border-helm-brass/70" />
      <span aria-hidden className="pointer-events-none absolute bottom-0 left-0 size-2.5 border-b border-l border-helm-brass/70" />

      <div className="flex items-center justify-between">
        <span className="eyebrow">{label}</span>
        {index ? (
          <span className="tabular font-mono text-[10px] text-helm-cyan-dim">{index}</span>
        ) : null}
      </div>

      <div className={`readout text-[44px] leading-[0.95] ${accent}`}>{value}</div>

      <div className="hairline" />

      {sublabel ? (
        <div className="text-[12.5px] leading-snug text-helm-vellum-muted">{sublabel}</div>
      ) : null}
      {hint ? (
        <div className="font-mono text-[10.5px] uppercase tracking-[0.16em] text-helm-cyan-dim">
          {hint}
        </div>
      ) : null}
    </div>
  );
}
