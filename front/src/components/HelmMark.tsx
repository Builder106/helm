// Compact ship's-wheel mark used in the top bar. Same geometry as the
// favicon — kept inline so it themes alongside the rest of the
// dashboard without a network fetch. Brass on midnight, matches the
// instrument-panel palette.

type Props = {
  size?: number;
  className?: string;
  tone?: 'brass' | 'vellum';
};

export function HelmMark({ size = 28, className, tone = 'brass' }: Props) {
  const stroke = tone === 'brass' ? 'stroke-helm-brass' : 'stroke-helm-vellum';
  const fill = tone === 'brass' ? 'fill-helm-brass' : 'fill-helm-vellum';

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      className={className}
      role="img"
      aria-label="Helm"
    >
      <rect width="32" height="32" rx="3" className="fill-helm-bg-2" />
      <g transform="translate(16, 16)">
        <circle cx="0" cy="0" r="10" fill="none" className={stroke} strokeWidth="1.4" />
        <circle cx="0" cy="0" r="7" fill="none" className={stroke} strokeWidth="0.8" opacity="0.5" />
        <g className={stroke} strokeWidth="1.2" strokeLinecap="round">
          <line x1="0" y1="-10" x2="0" y2="10" />
          <line x1="-10" y1="0" x2="10" y2="0" />
          <line x1="-7.07" y1="-7.07" x2="7.07" y2="7.07" opacity="0.55" />
          <line x1="-7.07" y1="7.07" x2="7.07" y2="-7.07" opacity="0.55" />
        </g>
        <circle cx="0" cy="0" r="2.4" className={fill} />
        <g className={stroke} strokeWidth="1.5" strokeLinecap="round">
          <line x1="0" y1="-11.6" x2="0" y2="-13.4" />
          <line x1="0" y1="11.6" x2="0" y2="13.4" />
          <line x1="-11.6" y1="0" x2="-13.4" y2="0" />
          <line x1="11.6" y1="0" x2="13.4" y2="0" />
        </g>
      </g>
    </svg>
  );
}
