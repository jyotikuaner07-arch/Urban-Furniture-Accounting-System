import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  ArrowLeft, Plus, Trash2, Loader2, AlertCircle, CheckCircle2, Landmark, Wallet, FileText,
} from "lucide-react";
import axiosClient from "../api/axiosClient";
import GlassCard from "../components/GlassCard";

/* ============================================================
   API LAYER — snake_case, matches backend exactly
   ============================================================ */

const api = {
  purchaseOrders: async (params = {}) =>
    (await axiosClient.get("/purchase-orders", { params })).data,
  vendorBills: async (params = {}) =>
    (await axiosClient.get("/vendor-bills", { params })).data,
  payments: async () =>
    (await axiosClient.get("/payments", { params: { type: "vendor_payment" } })).data,
  contacts: async () =>
    (await axiosClient.get("/contacts", { params: { type: "vendor" } })).data,
  products: async () => (await axiosClient.get("/products")).data,
  createPO: async (payload) =>
    (await axiosClient.post("/purchase-orders", payload)).data,
  convertToBill: async (id) =>
    (await axiosClient.post(`/purchase-orders/${id}/convert-to-bill`, {})).data,
  payBill: async ({ id, amount, method }) =>
    (await axiosClient.post(`/vendor-bills/${id}/pay`, { amount, method })).data,
};

function errorText(error) {
  if (!error) return "";
  if (!error.response) return "Cannot reach the server. Is the backend running on port 8000?";
  const detail = error.response.data?.detail;
  if (typeof detail === "string") return detail;
  if (Array.isArray(detail)) {
    return detail
      .map((d) => {
        const field = Array.isArray(d.loc) ? d.loc[d.loc.length - 1] : null;
        return field ? `${field}: ${d.msg}` : d.msg;
      })
      .join(" · ");
  }
  return `${error.response.status} — request failed`;
}

const money = (n) =>
  `₹${Number(n || 0).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

const fmtDate = (d) => (d ? new Date(d).toLocaleDateString("en-IN") : "—");

/* ============================================================
   PAGE
   ============================================================ */

export default function PurchasesPage() {
  const qc = useQueryClient();
  const [tab, setTab] = useState("orders");
  const [view, setView] = useState("list");
  const [flash, setFlash] = useState(null);
  const [payingId, setPayingId] = useState(null);

  const ordersQuery = useQuery({
    queryKey: ["purchase-orders"],
    queryFn: () => api.purchaseOrders(),
    enabled: tab === "orders",
  });

  const billsQuery = useQuery({
    queryKey: ["vendor-bills"],
    queryFn: () => api.vendorBills(),
    enabled: tab === "bills",
  });

  const paymentsQuery = useQuery({
    queryKey: ["payments", "vendor"],
    queryFn: api.payments,
    enabled: tab === "payments",
  });

  const createPO = useMutation({
    mutationFn: api.createPO,
    onSuccess: (po) => {
      setFlash({ type: "ok", text: `Purchase order ${po.po_number} created for ${money(po.total_amount)}.` });
      qc.invalidateQueries({ queryKey: ["purchase-orders"] });
      setView("list");
    },
  });

  const convert = useMutation({
    mutationFn: api.convertToBill,
    onSuccess: (bill) => {
      setFlash({
        type: "ok",
        text: `Bill ${bill.bill_number} created. Journal entry posted: Debit Purchase Expense ${money(bill.total_amount)}, Credit Creditors ${money(bill.total_amount)}.`,
      });
      qc.invalidateQueries({ queryKey: ["purchase-orders"] });
      qc.invalidateQueries({ queryKey: ["vendor-bills"] });
      setTab("bills");
    },
    onError: (e) => setFlash({ type: "err", text: errorText(e) }),
  });

  const pay = useMutation({
    mutationFn: api.payBill,
    onSuccess: (p) => {
      setFlash({
        type: "ok",
        text: `Payment ${p.payment_number} recorded — ${money(p.amount)} by ${p.method}. Ledger: Debit Creditors, Credit ${p.method === "bank" ? "Bank" : "Cash"}.`,
      });
      setPayingId(null);
      qc.invalidateQueries({ queryKey: ["vendor-bills"] });
      qc.invalidateQueries({ queryKey: ["payments"] });
    },
    onError: (e) => setFlash({ type: "err", text: errorText(e) }),
  });

  if (view === "form") {
    return (
      <PurchaseOrderForm
        isSaving={createPO.isPending}
        error={errorText(createPO.error)}
        onCancel={() => { createPO.reset(); setView("list"); }}
        onSave={(payload) => createPO.mutate(payload)}
      />
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        {tab === "orders" && (
          <button onClick={() => { setFlash(null); createPO.reset(); setView("form"); }}
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

      <h1 className="text-xl font-semibold capitalize">Purchases — {tab}</h1>

      {flash && (
        <div className={`flex items-start gap-2 text-sm rounded-lg px-3 py-2 border ${
          flash.type === "ok"
            ? "bg-emerald-50 border-emerald-200 text-emerald-800"
            : "bg-red-50 border-red-200 text-red-700"
        }`}>
          {flash.type === "ok"
            ? <CheckCircle2 size={15} className="mt-0.5 shrink-0" />
            : <AlertCircle size={15} className="mt-0.5 shrink-0" />}
          <span>{flash.text}</span>
          <button onClick={() => setFlash(null)} className="ml-auto text-xs underline">dismiss</button>
        </div>
      )}

      {/* ---------- ORDERS ---------- */}
      {tab === "orders" && (
        <QueryBlock query={ordersQuery}>
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
                  <th className="p-3"></th>
                </tr>
              </thead>
              <tbody>
                {(ordersQuery.data || []).map((p) => (
                  <tr key={p.id} className="border-b border-white/50 last:border-0 hover:bg-white/50">
                    <td className="p-3 font-medium">{p.po_number}</td>
                    <td className="p-3">{p.vendor_name}</td>
                    <td className="p-3 text-slate-500">{fmtDate(p.order_date)}</td>
                    <td className="p-3 text-slate-500 max-w-xs truncate">
                      {p.lines.map((l) => `${l.product_name} × ${l.quantity}`).join(", ")}
                    </td>
                    <td className="p-3 text-right">{money(p.total_amount)}</td>
                    <td className="p-3"><StatusPill status={p.status} /></td>
                    <td className="p-3 text-right">
                      {p.status === "billed" ? (
                        <span className="text-xs text-slate-400 flex items-center gap-1 justify-end">
                          <FileText size={12} /> billed
                        </span>
                      ) : (
                        <button
                          disabled={convert.isPending}
                          onClick={() => { setFlash(null); convert.mutate(p.id); }}
                          className="px-3 py-1 rounded-md bg-slate-900 text-white text-xs disabled:opacity-40">
                          {convert.isPending && convert.variables === p.id ? "..." : "Create Bill"}
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
                {(ordersQuery.data || []).length === 0 && (
                  <tr><td colSpan={7} className="p-6 text-center text-slate-500">No purchase orders yet.</td></tr>
                )}
              </tbody>
            </table>
          </GlassCard>
        </QueryBlock>
      )}

      {/* ---------- BILLS ---------- */}
      {tab === "bills" && (
        <QueryBlock query={billsQuery}>
          <GlassCard className="overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-white/50 border-b border-white/60">
                <tr>
                  <th className="text-left p-3 font-medium">Bill No.</th>
                  <th className="text-left p-3 font-medium">Vendor</th>
                  <th className="text-left p-3 font-medium">Date</th>
                  <th className="text-right p-3 font-medium">Total</th>
                  <th className="text-right p-3 font-medium">Paid</th>
                  <th className="text-right p-3 font-medium">Due</th>
                  <th className="text-left p-3 font-medium">Status</th>
                  <th className="p-3 text-center">Pay</th>
                </tr>
              </thead>
              <tbody>
                {(billsQuery.data || []).map((b) => (
                  <tr key={b.id} className="border-b border-white/50 last:border-0 hover:bg-white/50">
                    <td className="p-3 font-medium">{b.bill_number}</td>
                    <td className="p-3">{b.vendor_name}</td>
                    <td className="p-3 text-slate-500">{fmtDate(b.bill_date)}</td>
                    <td className="p-3 text-right">{money(b.total_amount)}</td>
                    <td className="p-3 text-right text-slate-500">{money(b.amount_paid)}</td>
                    <td className="p-3 text-right font-medium">{money(b.amount_due)}</td>
                    <td className="p-3"><StatusPill status={b.status} /></td>
                    <td className="p-3">
                      {b.status === "paid" ? (
                        <span className="text-emerald-600 flex justify-center"><CheckCircle2 size={16} /></span>
                      ) : payingId === b.id ? (
                        <PayButtons
                          amount={b.amount_due}
                          pending={pay.isPending}
                          onPay={(method) => pay.mutate({ id: b.id, amount: b.amount_due, method })}
                          onCancel={() => setPayingId(null)}
                        />
                      ) : (
                        <button onClick={() => { setFlash(null); setPayingId(b.id); }}
                          className="w-full px-3 py-1 rounded-md bg-slate-900 text-white text-xs">
                          Pay
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
                {(billsQuery.data || []).length === 0 && (
                  <tr><td colSpan={8} className="p-6 text-center text-slate-500">No vendor bills yet.</td></tr>
                )}
              </tbody>
            </table>
          </GlassCard>
        </QueryBlock>
      )}

      {/* ---------- PAYMENTS ---------- */}
      {tab === "payments" && (
        <QueryBlock query={paymentsQuery}>
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
                {(paymentsQuery.data || []).map((p) => (
                  <tr key={p.id} className="border-b border-white/50 last:border-0 hover:bg-white/50">
                    <td className="p-3 font-medium">{p.payment_number}</td>
                    <td className="p-3">{p.contact_name}</td>
                    <td className="p-3 text-slate-500">{fmtDate(p.payment_date)}</td>
                    <td className="p-3 text-slate-500">{p.against_number}</td>
                    <td className="p-3 capitalize">{p.method}</td>
                    <td className="p-3 text-right text-rose-700 font-medium">{money(p.amount)}</td>
                  </tr>
                ))}
                {(paymentsQuery.data || []).length === 0 && (
                  <tr><td colSpan={6} className="p-6 text-center text-slate-500">No payments recorded yet.</td></tr>
                )}
              </tbody>
            </table>
          </GlassCard>
        </QueryBlock>
      )}
    </div>
  );
}

/* ============================================================
   FORM
   ============================================================ */

function PurchaseOrderForm({ isSaving, error, onSave, onCancel }) {
  const vendorsQuery = useQuery({ queryKey: ["contacts", "vendors"], queryFn: api.contacts });
  const productsQuery = useQuery({ queryKey: ["products", "all"], queryFn: api.products });

  const vendors = vendorsQuery.data || [];
  const products = productsQuery.data || [];

  const [vendorId, setVendorId] = useState("");
  const [notes, setNotes] = useState("");
  const [lines, setLines] = useState([{ product_id: "", quantity: 1, unit_price: 0 }]);

  const changeLine = (idx, field, value) => {
    const next = [...lines];
    next[idx] = { ...next[idx], [field]: value };
    // auto-fill the vendor's cost price when the product changes
    if (field === "product_id") {
      const prod = products.find((p) => p.id === value);
      if (prod) next[idx].unit_price = prod.cost_price;
    }
    setLines(next);
  };

  const addLine = () => setLines([...lines, { product_id: "", quantity: 1, unit_price: 0 }]);
  const removeLine = (idx) => setLines(lines.filter((_, i) => i !== idx));

  const total = lines.reduce((s, l) => s + Number(l.quantity || 0) * Number(l.unit_price || 0), 0);

  const submit = (e) => {
    e.preventDefault();
    onSave({
      vendor_id: vendorId,
      notes: notes || null,
      lines: lines.map((l) => ({
        product_id: l.product_id,
        quantity: Number(l.quantity),
        unit_price: Number(l.unit_price),
      })),
    });
  };

  if (vendorsQuery.isLoading || productsQuery.isLoading) return <Loading />;

  return (
    <form onSubmit={submit} className="space-y-4 max-w-3xl">
      <div className="flex items-center gap-3">
        <button type="button" onClick={onCancel} className="p-2 border rounded-lg bg-white">
          <ArrowLeft size={16} />
        </button>
        <h1 className="text-xl font-semibold">New Purchase Order</h1>
        <button type="submit" disabled={isSaving || !vendorId}
          className="ml-auto flex items-center gap-1.5 px-4 py-1.5 text-sm rounded-lg bg-slate-900 text-white hover:bg-slate-800 disabled:opacity-50">
          {isSaving && <Loader2 size={14} className="animate-spin" />}
          {isSaving ? "Saving..." : "Confirm"}
        </button>
      </div>

      {error && (
        <div className="flex items-start gap-2 text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
          <AlertCircle size={15} className="mt-0.5 shrink-0" />
          {error}
        </div>
      )}

      <GlassCard className="p-5 space-y-5">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">Vendor</label>
            <select value={vendorId} onChange={(e) => setVendorId(e.target.value)} required
              className="input bg-white">
              <option value="">Select a vendor...</option>
              {vendors.map((v) => <option key={v.id} value={v.id}>{v.name}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Notes</label>
            <input value={notes} onChange={(e) => setNotes(e.target.value)} className="input" />
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="text-sm font-medium">Order Lines</label>
            <button type="button" onClick={addLine}
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
                <th className="text-right p-2 font-medium w-32">Unit Price (Cost)</th>
                <th className="text-right p-2 font-medium w-28">Total</th>
                <th className="w-10"></th>
              </tr>
            </thead>
            <tbody>
              {lines.map((l, idx) => (
                <tr key={idx} className="border-b last:border-0">
                  <td className="p-2 text-slate-400">{idx + 1}</td>
                  <td className="p-2">
                    <select value={l.product_id} required
                      onChange={(e) => changeLine(idx, "product_id", e.target.value)}
                      className="w-full border rounded-md px-2 py-1 text-sm bg-white">
                      <option value="">Select...</option>
                      {products.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
                    </select>
                  </td>
                  <td className="p-2">
                    <input type="number" min="1" step="1" value={l.quantity} required
                      onChange={(e) => changeLine(idx, "quantity", e.target.value)}
                      className="w-full border rounded-md px-2 py-1 text-sm text-right" />
                  </td>
                  <td className="p-2">
                    <input type="number" min="0" step="0.01" value={l.unit_price} required
                      onChange={(e) => changeLine(idx, "unit_price", e.target.value)}
                      className="w-full border rounded-md px-2 py-1 text-sm text-right" />
                  </td>
                  <td className="p-2 text-right font-medium">
                    {money(Number(l.quantity || 0) * Number(l.unit_price || 0))}
                  </td>
                  <td className="p-2 text-center">
                    {lines.length > 1 && (
                      <button type="button" onClick={() => removeLine(idx)}
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
                <td className="p-2 text-right font-semibold">{money(total)}</td>
                <td></td>
              </tr>
            </tfoot>
          </table>
        </div>
      </GlassCard>
    </form>
  );
}

/* ============================================================
   SHARED
   ============================================================ */

function PayButtons({ amount, pending, onPay, onCancel }) {
  return (
    <div className="flex flex-col gap-1">
      <div className="text-[11px] text-slate-500 text-center">{money(amount)}</div>
      <div className="flex gap-1">
        <button disabled={pending} onClick={() => onPay("bank")}
          className="flex-1 flex items-center justify-center gap-1 px-2 py-1 rounded-md bg-sky-600 text-white text-xs disabled:opacity-50">
          <Landmark size={12} /> Bank
        </button>
        <button disabled={pending} onClick={() => onPay("cash")}
          className="flex-1 flex items-center justify-center gap-1 px-2 py-1 rounded-md bg-emerald-600 text-white text-xs disabled:opacity-50">
          <Wallet size={12} /> Cash
        </button>
      </div>
      <button onClick={onCancel} className="text-[11px] underline text-slate-500">cancel</button>
    </div>
  );
}

function StatusPill({ status }) {
  const tone = {
    draft: "bg-slate-100 text-slate-600",
    confirmed: "bg-sky-100 text-sky-700",
    billed: "bg-violet-100 text-violet-700",
    unpaid: "bg-rose-100 text-rose-700",
    partially_paid: "bg-amber-100 text-amber-700",
    paid: "bg-emerald-100 text-emerald-700",
  }[status] || "bg-slate-100 text-slate-600";

  return (
    <span className={`px-2 py-0.5 rounded-full text-xs ${tone}`}>
      {String(status).replace("_", " ")}
    </span>
  );
}

function Loading() {
  return (
    <div className="flex items-center justify-center gap-2 text-sm text-slate-500 py-10">
      <Loader2 size={16} className="animate-spin" /> Loading...
    </div>
  );
}

function QueryBlock({ query, children }) {
  if (query.isLoading) return <Loading />;
  if (query.isError) {
    return (
      <div className="py-4">
        <div className="flex items-start gap-2 text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
          <AlertCircle size={15} className="mt-0.5 shrink-0" />
          {errorText(query.error)}
        </div>
        <button onClick={() => query.refetch()}
          className="mt-2 text-sm underline text-slate-600 hover:text-slate-900">
          Try again
        </button>
      </div>
    );
  }
  return children;
}