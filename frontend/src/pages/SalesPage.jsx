import { useState } from "react";
import { ArrowLeft, Plus } from "lucide-react";
import GlassCard from "../components/GlassCard";
import SavedBanner from "../components/SavedBanner";
import {
  salesOrders as soStore, invoices as invoiceStore, payments as paymentStore,
  contacts, products, addSalesOrder, nextSoNumber,
} from "../data/store";
import { Pill } from "../features/dashboards/CustomerDashboard";
import { LineTable } from "./PurchasesPage";

export default function SalesPage() {
  const [tab, setTab] = useState("orders");   // orders | invoices | receipts
  const [view, setView] = useState("list");
  const [soRows, setSoRows] = useState([...soStore]);
  const [saved, setSaved] = useState(null);
  const [error, setError] = useState("");

  if (view === "form") {
    return (
      <SalesOrderForm error={error}
        onCancel={() => { setError(""); setView("list"); }}
        onSave={(data) => {
          const r = addSalesOrder(data);
          if (!r.ok) { setError(r.message); return; }
          setError("");
          setSaved({ number: r.record.number, customer: r.record.customer,
                     date: r.record.date, total: r.record.total, status: r.record.status });
          setSoRows([...soStore]); setView("list");
        }} />
    );
  }

  const receipts = paymentStore.filter((p) => p.kind === "receive");

  return (
    <div className="space-y-4 max-w-5xl">
      <div className="flex items-center gap-3">
        {tab === "orders" && (
          <button onClick={() => { setError(""); setView("form"); }}
            className="flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-lg bg-slate-900 text-white hover:bg-slate-800">
            <Plus size={15} /> New Sales Order
          </button>
        )}

        <div className="ml-auto flex border rounded-lg overflow-hidden text-sm">
          {["orders", "invoices", "receipts"].map((t) => (
            <button key={t} onClick={() => setTab(t)}
              className={`px-3 py-1.5 capitalize ${tab === t ? "bg-slate-900 text-white" : "bg-white"}`}>
              {t}
            </button>
          ))}
        </div>
      </div>

      <h1 className="text-xl font-semibold capitalize">Sales — {tab}</h1>
      {saved && <SavedBanner record={saved} onClose={() => setSaved(null)} />}

      {tab === "orders" && (
        <GlassCard className="overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-white/50 border-b border-white/60">
              <tr>
                <th className="text-left p-3 font-medium">SO No.</th>
                <th className="text-left p-3 font-medium">Customer</th>
                <th className="text-left p-3 font-medium">Date</th>
                <th className="text-left p-3 font-medium">Items</th>
                <th className="text-right p-3 font-medium">Total</th>
                <th className="text-left p-3 font-medium">Status</th>
              </tr>
            </thead>
            <tbody>
              {soRows.map((s) => (
                <tr key={s.id} className="border-b border-white/50 last:border-0 hover:bg-white/50">
                  <td className="p-3 font-medium">{s.number}</td>
                  <td className="p-3">{s.customer}</td>
                  <td className="p-3 text-slate-500">{s.date}</td>
                  <td className="p-3 text-slate-500">
                    {s.lines.map((l) => `${l.product} × ${l.qty}`).join(", ")}
                  </td>
                  <td className="p-3 text-right">₹{s.total.toLocaleString()}</td>
                  <td className="p-3"><Pill text={s.status} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </GlassCard>
      )}

      {tab === "invoices" && (
        <GlassCard className="overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-white/50 border-b border-white/60">
              <tr>
                <th className="text-left p-3 font-medium">Invoice No.</th>
                <th className="text-left p-3 font-medium">Customer</th>
                <th className="text-left p-3 font-medium">Due Date</th>
                <th className="text-right p-3 font-medium">Amount</th>
                <th className="text-right p-3 font-medium">Paid</th>
                <th className="text-left p-3 font-medium">Status</th>
              </tr>
            </thead>
            <tbody>
              {invoiceStore.map((i) => (
                <tr key={i.id} className="border-b border-white/50 last:border-0 hover:bg-white/50">
                  <td className="p-3 font-medium">{i.number}</td>
                  <td className="p-3">{i.customer}</td>
                  <td className="p-3 text-slate-500">{i.dueDate}</td>
                  <td className="p-3 text-right">₹{i.amount.toLocaleString()}</td>
                  <td className="p-3 text-right text-slate-500">₹{i.paid.toLocaleString()}</td>
                  <td className="p-3"><Pill text={i.status} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </GlassCard>
      )}

      {tab === "receipts" && (
        <GlassCard className="overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-white/50 border-b border-white/60">
              <tr>
                <th className="text-left p-3 font-medium">Reference</th>
                <th className="text-left p-3 font-medium">Customer</th>
                <th className="text-left p-3 font-medium">Date</th>
                <th className="text-left p-3 font-medium">Against</th>
                <th className="text-left p-3 font-medium">Method</th>
                <th className="text-right p-3 font-medium">Amount</th>
              </tr>
            </thead>
            <tbody>
              {receipts.map((p) => (
                <tr key={p.id} className="border-b border-white/50 last:border-0 hover:bg-white/50">
                  <td className="p-3 font-medium">{p.number}</td>
                  <td className="p-3">{p.partner}</td>
                  <td className="p-3 text-slate-500">{p.date}</td>
                  <td className="p-3 text-slate-500">{p.against}</td>
                  <td className="p-3">{p.method}</td>
                  <td className="p-3 text-right text-emerald-700 font-medium">
                    ₹{p.amount.toLocaleString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </GlassCard>
      )}
    </div>
  );
}

function SalesOrderForm({ onSave, onCancel, error }) {
  const customers = contacts.filter((c) => c.type === "customer" || c.type === "both");

  const [head, setHead] = useState({
    number: nextSoNumber(),
    customer: customers[0]?.name || "",
    date: new Date().toISOString().slice(0, 10),
  });
  const [lines, setLines] = useState([
    { product: products[0].name, qty: 1, unitPrice: products[0].salesPrice },
  ]);

  const changeHead = (e) => setHead({ ...head, [e.target.name]: e.target.value });

  const changeLine = (idx, field, value) => {
    const next = [...lines];
    next[idx] = { ...next[idx], [field]: value };
    // sales orders auto-fill the SALES price, not the cost
    if (field === "product") {
      const prod = products.find((p) => p.name === value);
      if (prod) next[idx].unitPrice = prod.salesPrice;
    }
    setLines(next);
  };

  const addLine = () =>
    setLines([...lines, { product: products[0].name, qty: 1, unitPrice: products[0].salesPrice }]);
  const removeLine = (idx) => setLines(lines.filter((_, i) => i !== idx));

  const total = lines.reduce((s, l) => s + Number(l.qty) * Number(l.unitPrice), 0);

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        const customerRecord = contacts.find((c) => c.name === head.customer);
        onSave({
          ...head,
          customerEmail: customerRecord?.email || "",
          status: "Confirmed",
          lines: lines.map((l) => ({
            product: l.product, qty: Number(l.qty), unitPrice: Number(l.unitPrice),
          })),
          total,
        });
      }}
      className="space-y-4 max-w-3xl"
    >
      <div className="flex items-center gap-3">
        <button type="button" onClick={onCancel} className="p-2 border rounded-lg bg-white">
          <ArrowLeft size={16} />
        </button>
        <h1 className="text-xl font-semibold">New Sales Order</h1>
        <button type="submit"
          className="ml-auto px-4 py-1.5 text-sm rounded-lg bg-slate-900 text-white hover:bg-slate-800">
          Confirm
        </button>
      </div>

      {error && (
        <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
          {error}
        </div>
      )}

      <GlassCard className="p-5 space-y-5">
        <div className="grid grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">SO Number</label>
            <input name="number" value={head.number} onChange={changeHead} required
              className="input font-mono" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Customer</label>
            <select name="customer" value={head.customer} onChange={changeHead} className="input bg-white">
              {customers.map((c) => <option key={c.id} value={c.name}>{c.name}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">SO Date</label>
            <input name="date" type="date" value={head.date} onChange={changeHead} required className="input" />
          </div>
        </div>

        <LineTable
          lines={lines} onChange={changeLine} onAdd={addLine}
          onRemove={removeLine} total={total} priceLabel="Unit Price (Sales)"
        />
      </GlassCard>
    </form>
  );
}