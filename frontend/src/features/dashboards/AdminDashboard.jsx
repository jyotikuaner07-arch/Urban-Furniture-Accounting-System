import { useNavigate } from "react-router-dom";
import { Users, Package, BookOpen, UserCog, TrendingUp, ShoppingCart, ArrowUpRight } from "lucide-react";
import GlassCard from "../../components/GlassCard";
import { contacts, products, accounts, invoices, bills } from "../../data/store";
import { getUsers } from "../../data/users";

export default function AdminDashboard() {
  const navigate = useNavigate();
  const users = getUsers();

  const totalReceivable = invoices.reduce((s, i) => s + (i.amount - i.paid), 0);
  const totalPayable = bills.reduce((s, b) => s + (b.amount - b.paid), 0);

  return (
    <div className="space-y-6 max-w-6xl">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <GlassCard className="p-5">
          <div className="text-sm text-slate-500">Total Receivable</div>
          <div className="text-3xl font-semibold mt-1 text-emerald-700">
            ₹{totalReceivable.toLocaleString()}
          </div>
          <div className="text-xs text-slate-500 mt-1">Owed to you by customers</div>
        </GlassCard>
        <GlassCard className="p-5">
          <div className="text-sm text-slate-500">Total Payable</div>
          <div className="text-3xl font-semibold mt-1 text-rose-700">
            ₹{totalPayable.toLocaleString()}
          </div>
          <div className="text-xs text-slate-500 mt-1">Owed by you to vendors</div>
        </GlassCard>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <ModuleCard title="Sales" icon={TrendingUp} accent="bg-emerald-100 text-emerald-700"
          onAction={() => navigate("/sales")} actionLabel="Open"
          stats={[
            { label: "Invoices", value: invoices.length },
            { label: "Paid", value: invoices.filter(i => i.status === "Paid").length },
            { label: "Open", value: invoices.filter(i => i.status !== "Paid").length },
          ]} />
        <ModuleCard title="Purchase" icon={ShoppingCart} accent="bg-sky-100 text-sky-700"
          onAction={() => navigate("/purchases")} actionLabel="Open"
          stats={[
            { label: "Bills", value: bills.length },
            { label: "Paid", value: bills.filter(b => b.status === "Paid").length },
            { label: "Open", value: bills.filter(b => b.status !== "Paid").length },
          ]} />
      </div>

      <div>
        <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wide mb-3">
          Master Data & Administration
        </h2>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <MiniCard label="Contacts" value={contacts.length} icon={Users}
            accent="bg-amber-100 text-amber-700" onClick={() => navigate("/contacts")} />
          <MiniCard label="Products" value={products.length} icon={Package}
            accent="bg-rose-100 text-rose-700" onClick={() => navigate("/products")} />
          <MiniCard label="Accounts" value={accounts.length} icon={BookOpen}
            accent="bg-teal-100 text-teal-700" onClick={() => navigate("/accounts")} />
          <MiniCard label="System Users" value={users.length} icon={UserCog}
            accent="bg-violet-100 text-violet-700" onClick={() => navigate("/users")} />
        </div>
      </div>
    </div>
  );
}

function ModuleCard({ title, icon: Icon, accent, actionLabel, onAction, stats }) {
  return (
    <GlassCard className="p-5 hover:shadow-md transition-shadow">
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-2.5">
          <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${accent}`}>
            <Icon size={18} />
          </div>
          <h2 className="font-semibold">{title}</h2>
        </div>
        <button onClick={onAction}
          className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium rounded-lg bg-slate-900 text-white hover:bg-slate-800">
          {actionLabel} <ArrowUpRight size={13} />
        </button>
      </div>
      <div className="grid grid-cols-3 gap-2">
        {stats.map((s) => (
          <div key={s.label} className="bg-white/70 border border-white/80 rounded-xl p-3 text-center">
            <div className="text-[11px] text-slate-500 uppercase tracking-wide">{s.label}</div>
            <div className="text-2xl font-semibold mt-0.5">{s.value}</div>
          </div>
        ))}
      </div>
    </GlassCard>
  );
}

function MiniCard({ label, value, icon: Icon, accent, onClick }) {
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