import { useNavigate } from "react-router-dom";
import { Users, Package, BookOpen, FileText, BarChart3, ArrowUpRight } from "lucide-react";
import GlassCard from "../../components/GlassCard";
import { contacts, products, accounts, invoices, bills } from "../../data/store";

export default function AccountantDashboard() {
  const navigate = useNavigate();

  const unpaidInvoices = invoices.filter((i) => i.status !== "Paid");
  const unpaidBills = bills.filter((b) => b.status !== "Paid");

  return (
    <div className="space-y-6 max-w-6xl">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Stat label="Open Invoices" value={unpaidInvoices.length} tone="text-emerald-700" />
        <Stat label="Open Bills" value={unpaidBills.length} tone="text-rose-700" />
        <Stat label="Ledger Accounts" value={accounts.length} tone="text-slate-900" />
      </div>

      <GlassCard className="p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold">Needs your attention</h2>
          <button onClick={() => navigate("/reports")}
            className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium rounded-lg bg-slate-900 text-white hover:bg-slate-800">
            Reports <ArrowUpRight size={13} />
          </button>
        </div>

        <div className="space-y-2">
          {[...unpaidInvoices, ...unpaidBills].length === 0 && (
            <p className="text-sm text-slate-500">Everything is settled.</p>
          )}
          {unpaidInvoices.map((i) => (
            <Row key={i.id} left={i.number} mid={i.customer}
              right={`₹${(i.amount - i.paid).toLocaleString()} due`} tag="Receivable" tone="bg-emerald-100 text-emerald-700" />
          ))}
          {unpaidBills.map((b) => (
            <Row key={b.id} left={b.number} mid={b.vendor}
              right={`₹${(b.amount - b.paid).toLocaleString()} due`} tag="Payable" tone="bg-rose-100 text-rose-700" />
          ))}
        </div>
      </GlassCard>

      <div>
        <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wide mb-3">
          Quick Access
        </h2>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <Tile label="Contacts" value={contacts.length} icon={Users}
            accent="bg-amber-100 text-amber-700" onClick={() => navigate("/contacts")} />
          <Tile label="Products" value={products.length} icon={Package}
            accent="bg-rose-100 text-rose-700" onClick={() => navigate("/products")} />
          <Tile label="Chart of Accounts" value={accounts.length} icon={BookOpen}
            accent="bg-teal-100 text-teal-700" onClick={() => navigate("/accounts")} />
          <Tile label="Journals" value="—" icon={FileText}
            accent="bg-violet-100 text-violet-700" onClick={() => navigate("/journals")} />
        </div>
      </div>
    </div>
  );
}

function Stat({ label, value, tone }) {
  return (
    <GlassCard className="p-5">
      <div className="text-sm text-slate-500">{label}</div>
      <div className={`text-3xl font-semibold mt-1 ${tone}`}>{value}</div>
    </GlassCard>
  );
}

function Row({ left, mid, right, tag, tone }) {
  return (
    <div className="flex items-center gap-3 bg-white/70 border border-white/80 rounded-xl px-3 py-2.5 text-sm">
      <span className="font-medium">{left}</span>
      <span className="text-slate-500">{mid}</span>
      <span className={`ml-auto px-2 py-0.5 rounded-full text-[11px] ${tone}`}>{tag}</span>
      <span className="font-medium w-28 text-right">{right}</span>
    </div>
  );
}

function Tile({ label, value, icon: Icon, accent, onClick }) {
  return (
    <button onClick={onClick}
      className="text-left w-full bg-white/60 backdrop-blur-xl border border-white/60 rounded-2xl p-4 hover:shadow-md hover:bg-white/80 transition-all">
      <div className={`w-9 h-9 rounded-xl flex items-center justify-center mb-3 ${accent}`}>
        <Icon size={18} />
      </div>
      <div className="text-2xl font-semibold">{value}</div>
      <div className="text-sm text-slate-500">{label}</div>
    </button>
  );
}