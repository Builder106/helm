// Margin-zone silhouettes — a submarine near the surface, an
// anchor + chain in mid-water, a whale silhouette in the deep, a
// deep-sea anglerfish near the bottom. All rendered as low-opacity
// inline SVG so the page tells a vertical-descent story without
// loading any photography.

export function DepthDecorations() {
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 z-0 overflow-hidden">
      {/* Submarine — near the surface, upper right. */}
      <svg
        className="absolute right-8 top-44 w-44 text-helm-cyan opacity-25"
        viewBox="0 0 220 80"
        fill="none"
      >
        {/* Hull */}
        <ellipse cx="110" cy="44" rx="80" ry="14" stroke="currentColor" strokeWidth="1.2" />
        {/* Conning tower */}
        <path
          d="M82 30 L82 22 Q82 18 86 18 L106 18 Q110 18 110 22 L110 30 Z"
          stroke="currentColor"
          strokeWidth="1.2"
        />
        {/* Portholes */}
        <circle cx="60" cy="44" r="2.5" stroke="currentColor" strokeWidth="0.8" />
        <circle cx="90" cy="44" r="2.5" stroke="currentColor" strokeWidth="0.8" />
        <circle cx="120" cy="44" r="2.5" stroke="currentColor" strokeWidth="0.8" />
        <circle cx="150" cy="44" r="2.5" stroke="currentColor" strokeWidth="0.8" />
        {/* Propeller hub */}
        <circle cx="194" cy="44" r="3" stroke="currentColor" strokeWidth="0.8" />
        <line x1="200" y1="44" x2="210" y2="44" stroke="currentColor" strokeWidth="0.8" />
        {/* Periscope */}
        <line x1="96" y1="18" x2="96" y2="6" stroke="currentColor" strokeWidth="1" />
        <circle cx="96" cy="6" r="1.5" fill="currentColor" />
        {/* Bubbles trailing from propeller */}
        <circle cx="218" cy="42" r="1.2" stroke="currentColor" strokeWidth="0.6" />
        <circle cx="222" cy="38" r="0.8" stroke="currentColor" strokeWidth="0.6" />
      </svg>

      {/* Anchor with chain — mid-page, left margin. */}
      <svg
        className="absolute left-6 top-[60%] h-60 w-24 text-helm-brass opacity-15"
        viewBox="0 0 100 240"
        fill="none"
      >
        {/* Chain */}
        {Array.from({ length: 18 }).map((_, i) => (
          <ellipse
            key={i}
            cx="50"
            cy={6 + i * 8}
            rx={i % 2 === 0 ? '5' : '3.5'}
            ry="3.5"
            stroke="currentColor"
            strokeWidth="0.8"
            transform={i % 2 === 0 ? '' : 'rotate(90 50 ' + (6 + i * 8) + ')'}
          />
        ))}
        {/* Anchor stock */}
        <line x1="30" y1="156" x2="70" y2="156" stroke="currentColor" strokeWidth="1.2" />
        {/* Anchor shank */}
        <line x1="50" y1="148" x2="50" y2="208" stroke="currentColor" strokeWidth="1.5" />
        {/* Anchor arms / flukes */}
        <path
          d="M50 208 Q30 208 24 192 L20 196 Q24 216 50 220 Q76 216 80 196 L76 192 Q70 208 50 208 Z"
          stroke="currentColor"
          strokeWidth="1.2"
        />
        {/* Anchor ring */}
        <circle cx="50" cy="144" r="5" stroke="currentColor" strokeWidth="1.2" />
      </svg>

      {/* Whale — deeper, upper-left of midnight zone. */}
      <svg
        className="absolute left-[28%] top-[140%] w-72 text-helm-cyan opacity-10"
        viewBox="0 0 300 120"
        fill="none"
      >
        <path
          d="M 12 60 Q 40 30 90 32 Q 150 30 210 50 Q 248 62 268 68 L 290 50 L 282 78 L 296 92 L 268 84 Q 220 100 160 96 Q 90 100 48 88 Q 18 78 12 60 Z"
          stroke="currentColor"
          strokeWidth="1.4"
        />
        {/* Eye */}
        <circle cx="42" cy="58" r="1.6" fill="currentColor" />
        {/* Pectoral fin hint */}
        <path d="M 90 80 Q 110 96 132 88" stroke="currentColor" strokeWidth="1" />
        {/* Mouth line */}
        <path d="M 16 64 Q 30 68 52 66" stroke="currentColor" strokeWidth="0.8" />
      </svg>

      {/* Deep-sea anglerfish — abyssal, lower-right. The bioluminescent
       * lure is its own tiny green dot — a quiet narrative beat. */}
      <svg
        className="absolute right-[22%] top-[210%] w-40 text-helm-cyan opacity-12"
        viewBox="0 0 200 140"
        fill="none"
      >
        {/* Body */}
        <path
          d="M 40 80 Q 60 40 120 50 Q 168 56 188 78 Q 168 100 130 110 Q 70 120 40 80 Z"
          stroke="currentColor"
          strokeWidth="1.4"
        />
        {/* Lure stalk */}
        <path d="M 80 56 Q 70 30 60 18" stroke="currentColor" strokeWidth="1" />
        {/* Lure tip — bioluminescent green dot */}
        <circle cx="60" cy="14" r="3" className="fill-helm-pass" opacity="0.7" />
        <circle cx="60" cy="14" r="6" className="fill-helm-pass" opacity="0.18" />
        {/* Teeth (tiny vertical lines at the mouth) */}
        <g stroke="currentColor" strokeWidth="0.8">
          <line x1="48" y1="76" x2="50" y2="80" />
          <line x1="54" y1="76" x2="56" y2="82" />
          <line x1="60" y1="74" x2="62" y2="84" />
          <line x1="66" y1="76" x2="68" y2="82" />
          <line x1="72" y1="78" x2="74" y2="84" />
        </g>
        {/* Eye */}
        <circle cx="100" cy="64" r="1.8" fill="currentColor" />
        {/* Tail */}
        <path d="M 40 80 L 28 70 L 32 80 L 28 92 Z" stroke="currentColor" strokeWidth="1" />
      </svg>
    </div>
  );
}
