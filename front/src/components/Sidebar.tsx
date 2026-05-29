// Chapter-style sidebar. Sub-features read like chapter entries in a
// captain's log — Roman numeral, italic display title, status line in
// mono. Per CLAUDE.md "if a sub-feature isn't done, it's not in the
// dashboard," shipped entries get active treatment; the others sit
// here as future chapters so the contract is visible without faking
// progress.

type NavItem = {
  id: string;
  roman: string;
  label: string;
  status: string;
  active?: boolean;
  shipped: boolean;
};

const items: NavItem[] = [
  { id: 'invoice-ocr', roman: 'I', label: 'AP Invoice OCR', status: '200 invoices · seed 1', active: true, shipped: true },
  { id: 'payout-reconciler', roman: 'II', label: 'Creator Payout Reconciler', status: 'Not yet shipped', shipped: false },
  { id: 'tier1-cs', roman: 'III', label: 'Tier-1 CS Responder', status: 'Not yet shipped', shipped: false },
  { id: 'kpi-qa', roman: 'IV', label: 'KPI Q&A', status: 'Not yet shipped', shipped: false },
];

export function Sidebar() {
  return (
    <nav className="relative flex h-full w-72 shrink-0 flex-col border-r border-helm-rule bg-helm-bg/40">
      <div className="px-7 pb-4 pt-7">
        <div className="eyebrow">Sub-features</div>
        <div className="mt-1 italic-display text-[15px] text-helm-vellum-muted">
          Four chapters in this voyage
        </div>
      </div>

      <ul className="flex flex-col gap-px px-3">
        {items.map((item) => (
          <li key={item.id}>
            <ChapterRow item={item} />
          </li>
        ))}
      </ul>

      <div className="mt-auto border-t border-helm-rule px-7 py-5">
        <div className="eyebrow">Stack</div>
        <ul className="mt-2 space-y-1 font-mono text-[11px] text-helm-vellum-muted">
          <li>
            <span className="text-helm-vellum">Llama 4 Scout</span>
            <span className="text-helm-vellum-faint"> · Groq</span>
          </li>
          <li>
            <span className="text-helm-vellum">libsql</span>
            <span className="text-helm-vellum-faint"> · MCP</span>
          </li>
          <li>
            <span className="text-helm-vellum">Node · React · Chart.js</span>
          </li>
        </ul>
      </div>
    </nav>
  );
}

function ChapterRow({ item }: { item: NavItem }) {
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
        className={`italic-display w-7 shrink-0 text-[22px] leading-none ${
          item.active ? 'text-helm-brass' : item.shipped ? 'text-helm-vellum-muted' : 'text-helm-vellum-faint'
        }`}
      >
        {item.roman}
      </span>

      <span className="flex flex-1 flex-col gap-0.5 leading-tight">
        <span className="display text-[18px] tracking-tight">
          {item.label}
        </span>
        <span className={`font-mono text-[10px] uppercase tracking-[0.18em] ${
          item.active ? 'text-helm-brass-bright' : item.shipped ? 'text-helm-vellum-faint' : 'text-helm-faint'
        }`}>
          {item.status}
        </span>
      </span>
    </button>
  );
}
