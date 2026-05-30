// Sea-trial task list. Sub-features are "trials" — each one a sub-trial
// against a spec. Status glyph (✓ measured / — unstarted) carries the
// state; lowercased IDs match the eval-harness convention.

type NavItem = {
  id: string;
  index: string;
  label: string;
  status: string;
  active?: boolean;
  shipped: boolean;
};

const items: NavItem[] = [
  { id: 'invoice-ocr',       index: '01', label: 'invoice-ocr',       status: '200 png · seed 1', active: true, shipped: true },
  { id: 'payout-reconciler', index: '02', label: 'payout-reconciler', status: 'unstarted',                                shipped: false },
  { id: 'tier1-cs',          index: '03', label: 'tier1-cs',          status: 'unstarted',                                shipped: false },
  { id: 'kpi-qa',            index: '04', label: 'kpi-qa',            status: 'unstarted',                                shipped: false },
];

export function Sidebar() {
  const shipped = items.filter((i) => i.shipped).length;
  return (
    <nav className="relative flex h-full w-72 shrink-0 flex-col border-r border-helm-rule bg-helm-bg/40">
      <div className="px-7 pb-4 pt-7">
        <div className="eyebrow">trials</div>
        <div className="mt-1.5 font-mono text-[11px] text-helm-vellum-muted">
          <span className="tabular text-helm-pass">{shipped}</span> measured ·{' '}
          <span className="tabular text-helm-vellum">{items.length - shipped}</span> unstarted
        </div>
      </div>

      <ul className="flex flex-col gap-px px-3">
        {items.map((item) => (
          <li key={item.id}>
            <NavRow item={item} />
          </li>
        ))}
      </ul>

      <div className="mt-auto border-t border-helm-rule px-7 py-5">
        <div className="eyebrow">stack</div>
        <ul className="mt-2 space-y-1 font-mono text-[11px] text-helm-vellum-muted">
          <li>
            <span className="text-helm-vellum">llama-4-scout</span>
            <span className="text-helm-vellum-faint"> · groq</span>
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

function NavRow({ item }: { item: NavItem }) {
  const base =
    'group relative flex w-full items-baseline gap-3 px-4 py-3 text-left transition-colors duration-200';
  const inactive = item.shipped
    ? 'text-helm-vellum-muted hover:bg-helm-panel/40 hover:text-helm-vellum'
    : 'text-helm-vellum-faint';
  const active = 'text-helm-vellum';

  const glyph = item.shipped ? '✓' : '—';
  const glyphColor = item.active
    ? 'text-helm-pass'
    : item.shipped
      ? 'text-helm-vellum-muted'
      : 'text-helm-vellum-faint';

  return (
    <button type="button" disabled={!item.shipped} className={`${base} ${item.active ? active : inactive}`}>
      {item.active ? (
        <span aria-hidden className="absolute inset-y-2 left-0 w-px bg-helm-brass" />
      ) : null}

      <span
        className={`tabular shrink-0 font-mono text-[11px] leading-none ${
          item.active ? 'text-helm-brass-bright' : item.shipped ? 'text-helm-vellum-muted' : 'text-helm-vellum-faint'
        }`}
      >
        {item.index}
      </span>

      <span className={`shrink-0 font-mono text-[12px] leading-none ${glyphColor}`}>{glyph}</span>

      <span className="flex flex-1 flex-col gap-1 leading-tight">
        <span className="font-mono text-[13px] tracking-tight">{item.label}</span>
        <span className={`font-mono text-[10px] uppercase tracking-[0.14em] ${
          item.active ? 'text-helm-brass-bright' : item.shipped ? 'text-helm-vellum-faint' : 'text-helm-faint'
        }`}>
          {item.status}
        </span>
      </span>
    </button>
  );
}
