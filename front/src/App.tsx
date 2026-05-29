import { Sidebar } from './components/Sidebar.tsx';
import { TopBar } from './components/TopBar.tsx';
import { InvoiceOCRPanel } from './components/InvoiceOCRPanel.tsx';

export default function App() {
  return (
    <div className="flex h-full flex-col bg-helm-bg text-helm-text">
      <TopBar />
      <div className="flex flex-1 overflow-hidden">
        <Sidebar />
        <main className="flex-1 overflow-y-auto px-8 py-7">
          <InvoiceOCRPanel />
        </main>
      </div>
    </div>
  );
}
