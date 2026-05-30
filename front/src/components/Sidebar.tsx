// Depth gauge + trial roster. The sidebar IS the dive profile: trials
// are positioned at scaled depths along a vertical depth column.
// Completed (measured) trials sit in the sunlit zone with a brass
// pin; pending trials descend through twilight and midnight zones.
//
// Per CLAUDE.md "if a sub-feature isn't done, it's not in the dashboard"
// the pending trials stay visible as explicit `unstarted` stations so
// the contract is honest without faking progress.

type Trial = {
  id: string;
  index: string;
  label: string;
  depth: number;    // % of column from top (sunlit) to bottom (abyssal)
  depthM: number;   // displayed metric depth
  zone: string;
  active?: boolean;
  shipped: boolean;
};

const trials: Trial[] = [
  { id: 'invoice-ocr',       index: '01', label: 'invoice-ocr',       depth: 12, depthM: 15,   zone: 'sunlit',    active: true, shipped: true },
  { id: 'payout-reconciler', index: '02', label: 'payout-reconciler', depth: 38, depthM: 80,   zone: 'twilight',                shipped: false },
  { id: 'tier1-cs',          index: '03', label: 'tier1-cs',          depth: 64, depthM: 320,  zone: 'midnight',                shipped: false },
  { id: 'kpi-qa',            index: '04', label: 'kpi-qa',            depth: 88, depthM: 1100, zone: 'abyssal',                 shipped: false },
];

// Depth tick marks down the gauge — labeled in metres.
const DEPTH_TICKS = [
  { y: 0,   label: 'surface' },
  { y: 18,  label: '20m'     },
  { y: 32,  label: '50m'     },
  { y: 50,  label: '200m'    },
  { y: 68,  label: '500m'    },
  { y: 84,  label: '1000m'   },
  { y: 98,  label: 'hadal'   },
];

export function Sidebar() {
  const shipped = trials.filter((t) => t.shipped).length;

  return (
    <nav className="relative flex h-full w-80 shrink-0 flex-col border-r border-helm-rule-2 bg-gradient-to-b from-helm-surface/40 via-helm-twilight/30 to-helm-abyssal/60">
      <div className="px-7 pb-3 pt-7">
        <div className="eyebrow">dive profile</div>
        <div className="mt-1.5 font-mono text-[11px] text-helm-vellum-muted">
          <span className="tabular text-helm-pass">{shipped}</span> measured ·{' '}
          <span className="tabular text-helm-vellum">{trials.length - shipped}</span> pending descent
        </div>
      </div>

      {/* Depth column — trials positioned at scaled depths. */}
      <div className="relative flex-1 min-h-[520px] px-4 pb-4">
        <DepthColumn />
        {trials.map((t) => (
          <TrialPin key={t.id} trial={t} />
        ))}
      </div>

      <div className="border-t border-helm-rule-2 px-7 py-5">
        <div className="eyebrow">stack</div>
        <ul className="mt-2 space-y-1 font-mono text-[11px] text-helm-vellum-muted">
          <li>
            <span className="text-helm-vellum">gemini-2.5-flash</span>
            <span className="text-helm-vellum-faint"> · google ai studio</span>
          </li>
          <li>
            <span className="text-helm-vellum">libsql</span>
            <span className="text-helm-vellum-faint"> · mcp</span>
          </li>
          <li>
            <span className="text-helm-vellum">node · react · chart.js</span>
          </li>
        </ul>
      </div>
    </nav>
  );
}

function DepthColumn() {
  return (
    <div aria-hidden className="pointer-events-none absolute inset-y-3 left-9 w-px bg-gradient-to-b from-helm-cyan/40 via-helm-cyan/15 to-helm-cyan/5">
      {DEPTH_TICKS.map((t) => (
        <div
          key={t.label}
          className="absolute left-0 flex items-center gap-2"
          style={{ top: `${t.y}%`, transform: 'translate(-50%, -50%)' }}
        >
          <span className="block h-px w-2 bg-helm-cyan/40" />
          <span className="font-mono text-[9px] uppercase tracking-[0.16em] text-helm-cyan-dim">
            {t.label}
          </span>
        </div>
      ))}
    </div>
  );
}

function TrialPin({ trial }: { trial: Trial }) {
  const pinColor = trial.shipped
    ? 'bg-helm-pass border-helm-pass'
    : 'bg-transparent border-helm-cyan-dim';

  return (
    <button
      type="button"
      disabled={!trial.shipped}
      className={`absolute left-4 right-4 flex items-center gap-3 rounded-sm px-3 py-2 transition-colors duration-200 ${
        trial.active
          ? 'bg-helm-cyan/[0.06]'
          : trial.shipped
            ? 'hover:bg-helm-cyan/[0.04]'
            : ''
      }`}
      style={{ top: `${trial.depth}%`, transform: 'translateY(-50%)' }}
    >
      {/* Brass left-rule when active */}
      {trial.active ? (
        <span aria-hidden className="absolute inset-y-1.5 left-0 w-px bg-helm-brass" />
      ) : null}

      {/* Pin circle on the depth column */}
      <span
        aria-hidden
        className={`absolute -left-px size-2.5 rounded-full border ${pinColor} ${
          trial.shipped ? 'shadow-[0_0_10px_rgba(52,211,153,0.6)]' : ''
        }`}
        style={{ left: '20px', transform: 'translate(-50%, -50%)', top: '50%' }}
      />

      {/* Content offset to clear the pin + column */}
      <div className="ml-8 flex flex-1 items-baseline justify-between gap-2">
        <div className="flex flex-col items-start gap-0.5 leading-none">
          <div className="flex items-baseline gap-2">
            <span
              className={`font-mono text-[10.5px] tabular ${
                trial.active ? 'text-helm-brass-bright' : trial.shipped ? 'text-helm-vellum-muted' : 'text-helm-vellum-faint'
              }`}
            >
              {trial.index}
            </span>
            <span
              className={`font-mono text-[13px] tracking-tight ${
                trial.active ? 'text-helm-vellum' : trial.shipped ? 'text-helm-vellum-muted' : 'text-helm-vellum-faint'
              }`}
            >
              {trial.label}
            </span>
          </div>
          <span
            className={`font-mono text-[9.5px] uppercase tracking-[0.14em] ${
              trial.active ? 'text-helm-cyan' : trial.shipped ? 'text-helm-vellum-faint' : 'text-helm-faint'
            }`}
          >
            {trial.shipped ? `${trial.zone} · measured` : `${trial.zone} · unstarted`}
          </span>
        </div>
        <span
          className={`font-mono text-[10px] tabular ${
            trial.shipped ? 'text-helm-cyan' : 'text-helm-cyan-deep'
          }`}
        >
          ~{trial.depthM}m
        </span>
      </div>
    </button>
  );
}
