// Layered wave shapes that sit between the top bar and the main
// content. The lightest band is the surface; lower bands are
// deepening shelf. Three stacked SVG paths with slight x-offsets
// give the impression of looking at the underside of waves from
// below — light rays pierce the gaps.

export function SurfaceWaves() {
  return (
    <div className="pointer-events-none absolute left-0 right-0 top-0 -mt-1 h-40 overflow-hidden">
      {/* Topmost wave — pale surface light. */}
      <svg
        className="absolute left-0 top-0 w-[200%] -translate-x-[8%]"
        viewBox="0 0 2400 160"
        preserveAspectRatio="none"
      >
        <path
          d="M0,40 C200,10 400,70 600,40 C800,10 1000,80 1200,50 C1400,20 1600,80 1800,40 C2000,0 2200,60 2400,30 L2400,0 L0,0 Z"
          fill="#1B4A6D"
          opacity="0.85"
        />
      </svg>

      {/* Mid wave — surface chop. */}
      <svg
        className="absolute left-0 top-3 w-[200%] -translate-x-[14%]"
        viewBox="0 0 2400 160"
        preserveAspectRatio="none"
      >
        <path
          d="M0,70 C220,40 440,100 660,75 C880,50 1100,110 1320,80 C1540,50 1760,105 1980,70 C2200,35 2300,80 2400,60 L2400,0 L0,0 Z"
          fill="#143A5A"
          opacity="0.85"
        />
      </svg>

      {/* Deeper wave — the body of water; this is where the page proper begins. */}
      <svg
        className="absolute left-0 top-6 w-[200%] -translate-x-[5%]"
        viewBox="0 0 2400 160"
        preserveAspectRatio="none"
      >
        <path
          d="M0,110 C240,80 480,140 720,115 C960,90 1200,150 1440,120 C1680,90 1920,140 2160,108 C2280,90 2340,118 2400,100 L2400,0 L0,0 Z"
          fill="#0E3A5C"
          opacity="0.9"
        />
      </svg>

      {/* Caustic light ray — a single subtle diagonal beam from upper-right. */}
      <div
        aria-hidden
        className="absolute right-0 top-0 h-40 w-[60%] origin-top-right opacity-40"
        style={{
          background:
            'linear-gradient(110deg, transparent 50%, rgba(125, 211, 224, 0.12) 56%, transparent 62%)',
        }}
      />
    </div>
  );
}
