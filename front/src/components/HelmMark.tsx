// Compact ship's-wheel mark used in the top bar. Same geometry as the
// favicon — kept inline so it animates / themes alongside the rest of
// the dashboard without a network fetch.

type Props = {
  size?: number;
  className?: string;
};

export function HelmMark({ size = 28, className }: Props) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      className={className}
      role="img"
      aria-label="Helm"
    >
      <rect width="32" height="32" rx="6" className="fill-helm-panel-2" />
      <g transform="translate(16, 16)">
        <circle cx="0" cy="0" r="10" fill="none" className="stroke-helm-accent" strokeWidth="1.6" />
        <g className="stroke-helm-accent" strokeWidth="1.4" strokeLinecap="round">
          <line x1="0" y1="-10" x2="0" y2="10" />
          <line x1="-10" y1="0" x2="10" y2="0" />
        </g>
        <circle cx="0" cy="0" r="2.4" className="fill-helm-accent" />
        <g className="stroke-helm-accent" strokeWidth="1.6" strokeLinecap="round">
          <line x1="0" y1="-11.6" x2="0" y2="-13.4" />
          <line x1="0" y1="11.6" x2="0" y2="13.4" />
          <line x1="-11.6" y1="0" x2="-13.4" y2="0" />
          <line x1="11.6" y1="0" x2="13.4" y2="0" />
        </g>
      </g>
    </svg>
  );
}
