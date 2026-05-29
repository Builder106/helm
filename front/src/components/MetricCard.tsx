import type { ReactNode } from 'react';

type Props = {
  label: string;
  value: ReactNode;
  sublabel?: ReactNode;
  hint?: ReactNode;
  tone?: 'neutral' | 'good' | 'warn' | 'danger';
};

export function MetricCard({ label, value, sublabel, hint, tone = 'neutral' }: Props) {
  const accent =
    tone === 'good'
      ? 'text-helm-accent'
      : tone === 'warn'
        ? 'text-helm-warn'
        : tone === 'danger'
          ? 'text-helm-danger'
          : 'text-helm-text';

  return (
    <div className="flex flex-col gap-1.5 rounded-lg border border-helm-border bg-helm-panel p-4">
      <div className="text-[11px] font-bold uppercase tracking-[0.18em] text-helm-faint">
        {label}
      </div>
      <div className={`tabular text-3xl font-bold leading-none ${accent}`}>{value}</div>
      {sublabel ? <div className="text-xs text-helm-muted">{sublabel}</div> : null}
      {hint ? <div className="mt-1 text-[11px] text-helm-faint">{hint}</div> : null}
    </div>
  );
}
