// Sidebar lists only sub-features that ship in the dashboard. Per
// CLAUDE.md "if a sub-feature isn't done, it's not in the dashboard."
// Disabled entries stay visible as `not yet shipped` placeholders so
// the contract is honest but doesn't fake progress.

type NavItem = {
  id: string;
  index: string;
  label: string;
  status: string;
  active?: boolean;
  shipped: boolean;
};

const items: NavItem[] = [
  { id: 'invoice-ocr', index: '01', label: 'AP Invoice OCR', status: '200 invoices · seed 1', active: true, shipped: true },
  { id: 'payout-reconciler', index: '02', label: 'Creator Payout Reconciler', status: 'not yet shipped', shipped: false },
  { id: 'tier1-cs', index: '03', label: 'Tier-1 CS Responder', status: 'not yet shipped', shipped: false },
  { id: 'kpi-qa', index: '04', label: 'KPI Q&A', status: 'not yet shipped', shipped: false },
];

export function Sidebar() {
  const shipped = items.filter((i) => i.shipped).length;
  return (
    <nav className="relative flex h-full w-72 shrink-0 flex-col border-r border-helm-rule bg-helm-bg/40">
      <div className="px-7 pb-4 pt-7">
        <div className="eyebrow">Sub-features</div>
        <div className="mt-1.5 font-mono text-[11px] text-helm-vellum-muted">
          <span className="tabular text-helm-vellum">{shipped}</span> shipped ·{' '}
          <span className="tabular text-helm-vellum">{items.length - shipped}</span> pending
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
        <div className="eyebrow">Stack</div>
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
    'group relative flex w-full items-baseline gap-4 px-4 py-3 text-left transition-colors duration-200';
  const inactive = item.shipped
    ? 'text-helm-vellum-muted hover:bg-helm-panel/40 hover:text-helm-vellum'
    : 'text-helm-vellum-faint';
  const active = 'text-helm-vellum';

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

      <span className="flex flex-1 flex-col gap-1 leading-tight">
        <span className="text-[14.5px] font-medium tracking-tight">
          {item.label}
        </span>
        <span className={`font-mono text-[10px] uppercase tracking-[0.16em] ${
          item.active ? 'text-helm-brass-bright' : item.shipped ? 'text-helm-vellum-faint' : 'text-helm-faint'
        }`}>
          {item.status}
        </span>
      </span>
    </button>
  );
}
