// Sidebar lists only sub-features that are actually wired in the
// dashboard. Per CLAUDE.md "If a sub-feature isn't done, it's not in
// the dashboard." Slot 2-4 sit here as forward-looking labels with
// an explicit `not yet shipped` treatment — disabled, faded, not
// clickable. When a sub-feature lands, the relevant entry promotes
// to an active state with a real route.

type NavItem = {
  id: string;
  label: string;
  measurementCount?: string;
  active?: boolean;
  shipped: boolean;
};

const items: NavItem[] = [
  { id: 'invoice-ocr', label: 'AP Invoice OCR', measurementCount: '200 invoices', active: true, shipped: true },
  { id: 'payout-reconciler', label: 'Creator Payout Reconciler', shipped: false },
  { id: 'tier1-cs', label: 'Tier-1 CS Responder', shipped: false },
  { id: 'kpi-qa', label: 'KPI Q&A', shipped: false },
];

export function Sidebar() {
  return (
    <nav className="flex h-full w-64 shrink-0 flex-col border-r border-helm-border bg-helm-panel/40">
      <div className="px-5 pb-3 pt-6 text-xs font-bold uppercase tracking-[0.18em] text-helm-faint">
        Sub-features
      </div>
      <ul className="flex flex-col gap-px px-2">
        {items.map((item) => (
          <li key={item.id}>
            <button
              type="button"
              disabled={!item.shipped}
              className={
                item.active
                  ? 'flex w-full flex-col items-start gap-0.5 rounded-md border border-helm-accent/30 bg-helm-accent/10 px-3 py-2.5 text-left text-helm-accent'
                  : item.shipped
                    ? 'flex w-full flex-col items-start gap-0.5 rounded-md px-3 py-2.5 text-left text-helm-text hover:bg-helm-panel-2'
                    : 'flex w-full flex-col items-start gap-0.5 rounded-md px-3 py-2.5 text-left text-helm-faint opacity-60'
              }
            >
              <span className="text-sm font-semibold">{item.label}</span>
              <span className="text-[11px] uppercase tracking-[0.1em]">
                {item.shipped ? item.measurementCount : 'Not yet shipped'}
              </span>
            </button>
          </li>
        ))}
      </ul>

      <div className="mt-auto border-t border-helm-border px-5 py-4 text-[11px] leading-relaxed text-helm-faint">
        <div className="font-bold uppercase tracking-[0.16em] text-helm-muted">Stack</div>
        <div className="mt-1 text-helm-text">Llama 4 Scout · Groq</div>
        <div className="text-helm-text">libsql · MCP</div>
        <div className="text-helm-text">Node · React · Chart.js</div>
      </div>
    </nav>
  );
}
