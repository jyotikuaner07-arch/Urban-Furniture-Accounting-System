import { useState } from "react";
import { ArrowLeft, Plus, Trash2 } from "lucide-react";
import GlassCard from "../components/GlassCard";
import SavedBanner from "../components/SavedBanner";
import {
  purchaseOrders as poStore, bills as billStore, payments as paymentStore,
  contacts, products, addPurchaseOrder, nextPoNumber,
} from "../data/store";
import { Pill } from "../features/dashboards/CustomerDashboard";

export default function PurchasesPage() {
  const [tab, setTab] = useState("orders");  // orders | bills | payments
  const [view, setView] = useState("list");
  const [poRows, setPoRows] = useState([...poStore]);
  const [saved, setSaved] = useState(null);
  const [error, setError] = useState("");

  if (view === "form") {
    return (
      <PurchaseOrderForm error={error}
        onCancel={() => { setError(""); setView("list"); }}
        onSave={(data) => {
          const r = addPurchaseOrder(data);
          if (!r.ok) { setError(r.message); return; }
          setError("");
          setSaved({ number: r.record.number, vendor: r.record.vendor,
                     date: r.record.date, total: r.record.total, status: r.record.status });
          setPoRows([...poStore]); setView("list");
        }} />
    );
  }

  const vendorBills = billStore;
  const vendorPayments = paymentStore.filter((p) => p.kind === "send");

  return (
    <div className="space-y-4 max-w-5xl">
      <div className="flex items-center gap-3">
        {tab === "orders" && (
          <button onClick={() => { setError(""); setView("form"); }}
            className="flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-lg bg-slate-900 text-white hover:bg-slate-800">
            <Plus size={15} /> New Purchase Order
          </button>
        )}

        <div className="ml-auto flex border rounded-lg overflow-hidden text-sm">
          {["orders", "bills", "payments"].map((t) => (
            <button key={t} onClick={() => setTab(t)}
              className={`px-3 py-1.5 capitalize ${tab === t ? "bg-slate-900 text-white" : "bg-white"}`}>
              {t}
            </button>
          ))}
        </div>
      </div>

      <h1 className="text-xl font-semibold capitalize">Purchase — {tab}</h1>
      {saved && <SavedBanner record={saved} onClose={() => setSaved(null)} />}

      {tab === "orders" && (
        <GlassCard className="overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-white/50 border-b border-white/60">
              <tr>
                <th className="text-left p-3 font-medium">PO No.</th>
                <th className="text-left p-3 font-medium">Vendor</th>
                <th className="text-left p-3 font-medium">Date</th>
                <th className="text-left p-3 font-medium">Items</th>
                <th className="text-right p-3 font-medium">Total</th>
                <th className="text-left p-3 font-medium">Status</th>
              </tr>
            </thead>
            <tbody>
              {poRows.map((p) => (
                <tr key={p.id} className="border-b border-white/50 last:border-0 hover:bg-white/50">
                  <td className="p-3 font-medium">{p.number}</td>
                  <td className="p-3">{p.vendor}</td>
                  <td className="p-3 text-slate-500">{p.date}</td>
                  <td className="p-3 text-slate-500">
                    {p.lines.map((l) => `${l.product} × ${l.qty}`).join(", ")}
                  </td>
                  <td className="p-3 text-right">₹{p.total.toLocaleString()}</td>
                  <td className="p-3"><Pill text={p.status} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </GlassCard>
      )}

      {tab === "bills" && (
        <GlassCard className="overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-white/50 border-b border-white/60">
              <tr>
                <th className="text-left p-3 font-medium">Bill No.</th>
                <th className="text-left p-3 font-medium">Vendor</th>
                <th className="text-left p-3 font-medium">Due Date</th>
                <th className="text-right p-3 font-medium">Amount</th>
                <th className="text-right p-3 font-medium">Paid</th>
                <th className="text-left p-3 font-medium">Status</th>
              </tr>
            </thead>
            <tbody>
              {vendorBills.map((b) => (
                <tr key={b.id} className="border-b border-white/50 last:border-0 hover:bg-white/50">
                  <td className="p-3 font-medium">{b.number}</td>
                  <td className="p-3">{b.vendor}</td>
                  <td className="p-3 text-slate-500">{b.dueDate}</td>
                  <td className="p-3 text-right">₹{b.amount.toLocaleString()}</td>
                  <td className="p-3 text-right text-slate-500">₹{b.paid.toLocaleString()}</td>
                  <td className="p-3"><Pill text={b.status} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </GlassCard>
      )}

      {tab === "payments" && (
        <GlassCard className="overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-white/50 border-b border-white/60">
              <tr>
                <th className="text-left p-3 font-medium">Reference</th>
                <th className="text-left p-3 font-medium">Vendor</th>
                <th className="text-left p-3 font-medium">Date</th>
                <th className="text-left p-3 font-medium">Against</th>
                <th className="text-left p-3 font-medium">Method</th>
                <th className="text-right p-3 font-medium">Amount</th>
              </tr>
            </thead>
            <tbody>
              {vendorPayments.map((p) => (
                <tr key={p.id} className="border-b border-white/50 last:border-0 hover:bg-white/50">
                  <td className="p-3 font-medium">{p.number}</td>
                  <td className="p-3">{p.partner}</td>
                  <td className="p-3 text-slate-500">{p.date}</td>
                  <td className="p-3 text-slate-500">{p.against}</td>
                  <td className="p-3">{p.method}</td>
                  <td className="p-3 text-right text-rose-700 font-medium">
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

function PurchaseOrderForm({ onSave, onCancel, error }) {
  const vendors = contacts.filter((c) => c.type === "vendor" || c.type === "both");

  const [head, setHead] = useState({
    number: nextPoNumber(),
    vendor: vendors[0]?.name || "",
    date: new Date().toISOString().slice(0, 10),
  });
  const [lines, setLines] = useState([
    { product: products[0].name, qty: 1, unitPrice: products[0].cost },
  ]);

  const changeHead = (e) => setHead({ ...head, [e.target.name]: e.target.value });

  const changeLine = (idx, field, value) => {
    const next = [...lines];
    next[idx] = { ...next[idx], [field]: value };
    // auto-fill the cost price when the product changes
    if (field === "product") {
      const prod = products.find((p) => p.name === value);
      if (prod) next[idx].unitPrice = prod.cost;
    }
    setLines(next);
  };

  const addLine = () =>
    setLines([...lines, { product: products[0].name, qty: 1, unitPrice: products[0].cost }]);
  const removeLine = (idx) => setLines(lines.filter((_, i) => i !== idx));

  const total = lines.reduce((s, l) => s + Number(l.qty) * Number(l.unitPrice), 0);

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        const vendorRecord = contacts.find((c) => c.name === head.vendor);
        onSave({
          ...head,
          vendorEmail: vendorRecord?.email || "",
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
        <h1 className="text-xl font-semibold">New Purchase Order</h1>
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
            <label className="block text-sm font-medium mb-1">PO Number</label>
            <input name="number" value={head.number} onChange={changeHead} required
              className="input font-mono" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Vendor</label>
            <select name="vendor" value={head.vendor} onChange={changeHead} className="input bg-white">
              {vendors.map((v) => <option key={v.id} value={v.name}>{v.name}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">PO Date</label>
            <input name="date" type="date" value={head.date} onChange={changeHead} required className="input" />
          </div>
        </div>

        <LineTable
          lines={lines} onChange={changeLine} onAdd={addLine}
          onRemove={removeLine} total={total} priceLabel="Unit Price (Cost)"
        />
      </GlassCard>
    </form>
  );
}

// Shared by Purchases and Sales
export function LineTable({ lines, onChange, onAdd, onRemove, total, priceLabel }) {
  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <label className="text-sm font-medium">Order Lines</label>
        <button type="button" onClick={onAdd}
          className="text-xs flex items-center gap-1 border rounded-lg px-2 py-1 bg-white hover:bg-slate-50">
          <Plus size={12} /> Add line
        </button>
      </div>

      <table className="w-full text-sm border rounded-lg overflow-hidden bg-white">
        <thead className="bg-slate-50 border-b">
          <tr>
            <th className="text-left p-2 font-medium w-10">#</th>
            <th className="text-left p-2 font-medium">Product</th>
            <th className="text-right p-2 font-medium w-20">Qty</th>
            <th className="text-right p-2 font-medium w-32">{priceLabel}</th>
            <th className="text-right p-2 font-medium w-28">Total</th>
            <th className="w-10"></th>
          </tr>
        </thead>
        <tbody>
          {lines.map((l, idx) => (
            <tr key={idx} className="border-b last:border-0">
              <td className="p-2 text-slate-400">{idx + 1}</td>
              <td className="p-2">
                <select value={l.product}
                  onChange={(e) => onChange(idx, "product", e.target.value)}
                  className="w-full border rounded-md px-2 py-1 text-sm bg-white">
                  {products.map((p) => <option key={p.id} value={p.name}>{p.name}</option>)}
                </select>
              </td>
              <td className="p-2">
                <input type="number" min="1" value={l.qty}
                  onChange={(e) => onChange(idx, "qty", e.target.value)}
                  className="w-full border rounded-md px-2 py-1 text-sm text-right" />
              </td>
              <td className="p-2">
                <input type="number" min="0" value={l.unitPrice}
                  onChange={(e) => onChange(idx, "unitPrice", e.target.value)}
                  className="w-full border rounded-md px-2 py-1 text-sm text-right" />
              </td>
              <td className="p-2 text-right font-medium">
                ₹{(Number(l.qty) * Number(l.unitPrice)).toLocaleString()}
              </td>
              <td className="p-2 text-center">
                {lines.length > 1 && (
                  <button type="button" onClick={() => onRemove(idx)}
                    className="text-red-600 hover:bg-red-50 rounded p-1">
                    <Trash2 size={14} />
                  </button>
                )}
              </td>
            </tr>
          ))}
        </tbody>
        <tfoot className="bg-slate-50 border-t">
          <tr>
            <td colSpan={4} className="p-2 text-right font-medium">Total</td>
            <td className="p-2 text-right font-semibold">₹{total.toLocaleString()}</td>
            <td></td>
          </tr>
        </tfoot>
      </table>
    </div>
  );
}