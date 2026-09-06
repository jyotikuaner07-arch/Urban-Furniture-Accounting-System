import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  ArrowLeft, Plus, Trash2, Loader2, AlertCircle, FileText, Receipt, CheckCircle2,
} from "lucide-react";
import axiosClient from "../api/axiosClient";
import GlassCard from "../components/GlassCard";

/* ============================================================
   API — verified against sales_routes.py + sales_service.py

   POST /sales-orders
     { customer_id, order_date?, lines:[{product_id, quantity,
       unit_price, tax_percent}], notes? }     lines min 1
   POST /sales-orders/{id}/generate-invoice    body { due_date } optional
   POST /customer-invoices/{id}/pay            { amount>0, method:"cash"|"bank" }
   ============================================================ */

async function fetchSalesOrders() {
  const { data } = await axiosClient.get("/sales-orders");
  return Array.isArray(data) ? data : [];
}

async function fetchInvoices() {
  const { data } = await axiosClient.get("/customer-invoices");
  return Array.isArray(data) ? data : [];
}

async function fetchCustomers() {
  // "both" contacts can buy too, so we merge two queries.
  const [customers, both] = await Promise.all([
    axiosClient.get("/contacts", { params: { type: "customer" } }),
    axiosClient.get("/contacts", { params: { type: "both" } }),
  ]);
  return [...(customers.data || []), ...(both.data || [])];
}

async function fetchProducts() {
  const { data } = await axiosClient.get("/products");
  return Array.isArray(data) ? data : [];
}

async function createSalesOrder(payload) {
  const { data } = await axiosClient.post("/sales-orders", payload);
  return data;
}

async function generateInvoice(soId) {
  // due_date is Body(None, embed=True) — omitting it lets the backend default.
  const { data } = await axiosClient.post(`/sales-orders/${soId}/generate-invoice`, {});
  return data;
}

async function payInvoice({ invoiceId, amount, method }) {
  const { data } = await axiosClient.post(`/customer-invoices/${invoiceId}/pay`, {
    amount, method,
  });
  return data;
}

function errorText(error) {
  if (!error) return "";
  if (!error.response) return "Cannot reach the server. Is the backend running on port 8000?";
  const detail = error.response.data?.detail;
  if (typeof detail === "string") return detail;
  if (Array.isArray(detail)) {
    return detail.map((d) => {
      const f = Array.isArray(d.loc) ? d.loc[d.loc.length - 1] : null;
      return f ? `${f}: ${d.msg}` : d.msg;
    }).join(" · ");
  }
  return `${error.response.status} — request failed`;
}

const money = (n) => `₹${Number(n || 0).toLocaleString("en-IN", { maximumFractionDigits: 2 })}`;
const fmtDate = (iso) => (iso ? String(iso).slice(0, 10) : "—");

/* ============================================================
   HOOKS
   ============================================================ */

const keys = { orders: ["sales-orders"], invoices: ["customer-invoices"] };

function useSalesOrders() {
  return useQuery({ queryKey: keys.orders, queryFn: fetchSalesOrders });
}
function useInvoices() {
  return useQuery({ queryKey: keys.invoices, queryFn: fetchInvoices });
}
function useCustomers() {
  return useQuery({ queryKey: ["contacts", "customers"], queryFn: fetchCustomers });
}
function useProducts() {
  return useQuery({ queryKey: ["products"], queryFn: fetchProducts });
}

function useCreateSalesOrder() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: createSalesOrder,
    onSuccess: () => qc.invalidateQueries({ queryKey: keys.orders }),
  });
}

function useGenerateInvoice() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: generateInvoice,
    onSuccess: () => {
      // The SO flips to "invoiced" and a new invoice appears — refresh both.
      qc.invalidateQueries({ queryKey: keys.orders });
      qc.invalidateQueries({ queryKey: keys.invoices });
    },
  });
}

function usePayInvoice() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: payInvoice,
    onSuccess: () => qc.invalidateQueries({ queryKey: keys.invoices }),
  });
}

/* ============================================================
   PAGE
   ============================================================ */

export default function SalesPage() {
  const [tab, setTab] = useState("orders");
  const [showForm, setShowForm] = useState(false);
  const [flash, setFlash] = useState(null);   // success message after an action

  const ordersQuery = useSalesOrders();
  const invoicesQuery = useInvoices();
  const customersQuery = useCustomers();
  const productsQuery = useProducts();

  const createMutation = useCreateSalesOrder();
  const invoiceMutation = useGenerateInvoice();
  const payMutation = usePayInvoice();

  if (showForm) {
    return (
      <SalesOrderForm
        customers={customersQuery.data || []}
        products={productsQuery.data || []}
        isSaving={createMutation.isPending}
        error={errorText(createMutation.error)}
        onCancel={() => { createMutation.reset(); setShowForm(false); }}
        onSave={(payload) =>
          createMutation.mutate(payload, {
            onSuccess: (so) => {
              setFlash(`Sales order ${so.so_number} created — ${money(so.total_amount)}`);
              setShowForm(false);
            },
          })
        }
      />
    );
  }

  const orders = ordersQuery.data || [];
  const invoices = invoicesQuery.data || [];

  return (
    <div className="space-y-4 max-w-6xl">
      <div className="flex items-center gap-3">
        <button onClick={() => { createMutation.reset(); setShowForm(true); }}
          className="flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-lg bg-slate-900 text-white hover:bg-slate-800">
          <Plus size={15} /> New Sales Order
        </button>

        <div className="ml-auto flex border rounded-lg overflow-hidden text-sm">
          <button onClick={() => setTab("orders")}
            className={`px-3 py-1.5 ${tab === "orders" ? "bg-slate-900 text-white" : "bg-white"}`}>
            Orders ({orders.length})
          </button>
          <button onClick={() => setTab("invoices")}
            className={`px-3 py-1.5 ${tab === "invoices" ? "bg-slate-900 text-white" : "bg-white"}`}>
            Invoices ({invoices.length})
          </button>
        </div>
      </div>

      <h1 className="text-xl font-semibold">
        Sales — {tab === "orders" ? "Orders" : "Invoices"}
      </h1>

      {flash && (
        <div className="flex items-start gap-2 text-sm text-emerald-800 bg-emerald-50 border border-emerald-200 rounded-lg px-3 py-2">
          <CheckCircle2 size={15} className="mt-0.5 shrink-0" />
          <span className="flex-1">{flash}</span>
          <button onClick={() => setFlash(null)} className="text-emerald-700">×</button>
        </div>
      )}

      {(invoiceMutation.isError || payMutation.isError) && (
        <div className="flex items-start gap-2 text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
          <AlertCircle size={15} className="mt-0.5 shrink-0" />
          {errorText(invoiceMutation.error || payMutation.error)}
        </div>
      )}

      {tab === "orders" ? (
        <OrdersTable
          query={ordersQuery}
          onGenerateInvoice={(so) =>
            invoiceMutation.mutate(so.id, {
              onSuccess: (inv) => {
                setFlash(
                  `Invoice ${inv.invoice_number} generated from ${so.so_number}. ` +
                  `A journal entry was posted: Debit Debtors ${money(inv.total_amount)}, ` +
                  `Credit Sales Income ${money(inv.total_amount)}.`
                );
                setTab("invoices");
              },
            })
          }
          pendingId={invoiceMutation.isPending ? invoiceMutation.variables : null}
        />
      ) : (
        <InvoicesTable
          query={invoicesQuery}
          onPay={(invoice, method) =>
            payMutation.mutate(
              { invoiceId: invoice.id, amount: invoice.amount_due, method },
              {
                onSuccess: (payment) =>
                  setFlash(
                    `Payment ${payment.payment_number} of ${money(payment.amount)} recorded ` +
                    `via ${payment.method}. Journal entry posted: Debit ${payment.method === "bank" ? "Bank" : "Cash"}, ` +
                    `Credit Debtors.`
                  ),
              }
            )
          }
          pendingId={payMutation.isPending ? payMutation.variables?.invoiceId : null}
        />
      )}
    </div>
  );
}

/* ============================================================
   ORDERS TABLE
   ============================================================ */

function OrdersTable({ query, onGenerateInvoice, pendingId }) {
  if (query.isLoading) return <Loading />;
  if (query.isError) return <QueryError query={query} />;

  const rows = query.data || [];

  return (
    <GlassCard className="overflow-hidden">
      <table className="w-full text-sm">
        <thead className="bg-white/50 border-b border-white/60">
          <tr>
            <th className="text-left p-3 font-medium">SO Number</th>
            <th className="text-left p-3 font-medium">Customer</th>
            <th className="text-left p-3 font-medium">Date</th>
            <th className="text-left p-3 font-medium">Lines</th>
            <th className="text-right p-3 font-medium">Total</th>
            <th className="text-left p-3 font-medium">Status</th>
            <th className="p-3"></th>
          </tr>
        </thead>
        <tbody>
          {rows.map((so) => (
            <tr key={so.id} className="border-b border-white/50 last:border-0 hover:bg-white/50">
              <td className="p-3 font-medium font-mono text-xs">{so.so_number}</td>
              <td className="p-3">{so.customer_name || "—"}</td>
              <td className="p-3 text-slate-500">{fmtDate(so.order_date)}</td>
              <td className="p-3 text-slate-500">
                {(so.lines || []).map((l) => `${l.product_name} × ${l.quantity}`).join(", ")}
              </td>
              <td className="p-3 text-right font-medium">{money(so.total_amount)}</td>
              <td className="p-3"><StatusPill status={so.status} /></td>
              <td className="p-3 text-right">
                {so.status !== "invoiced" ? (
                  <button
                    onClick={() => onGenerateInvoice(so)}
                    disabled={pendingId === so.id}
                    className="flex items-center gap-1 ml-auto px-3 py-1 text-xs rounded-lg bg-slate-900 text-white hover:bg-slate-800 disabled:opacity-50"
                  >
                    {pendingId === so.id
                      ? <Loader2 size={12} className="animate-spin" />
                      : <FileText size={12} />}
                    Generate Invoice
                  </button>
                ) : (
                  <span className="text-xs text-slate-400">Invoiced</span>
                )}
              </td>
            </tr>
          ))}
          {rows.length === 0 && (
            <tr><td colSpan={7} className="p-8 text-center text-slate-500">
              No sales orders yet. Create one to start the accounting flow.
            </td></tr>
          )}
        </tbody>
      </table>
    </GlassCard>
  );
}

/* ============================================================
   INVOICES TABLE
   ============================================================ */

function InvoicesTable({ query, onPay, pendingId }) {
  if (query.isLoading) return <Loading />;
  if (query.isError) return <QueryError query={query} />;

  const rows = query.data || [];

  return (
    <GlassCard className="overflow-hidden">
      <table className="w-full text-sm">
        <thead className="bg-white/50 border-b border-white/60">
          <tr>
            <th className="text-left p-3 font-medium">Invoice</th>
            <th className="text-left p-3 font-medium">Customer</th>
            <th className="text-left p-3 font-medium">Due</th>
            <th className="text-right p-3 font-medium">Total</th>
            <th className="text-right p-3 font-medium">Paid</th>
            <th className="text-right p-3 font-medium">Due Amt</th>
            <th className="text-left p-3 font-medium">Status</th>
            <th className="text-left p-3 font-medium">Journal</th>
            <th className="p-3"></th>
          </tr>
        </thead>
        <tbody>
          {rows.map((inv) => (
            <tr key={inv.id} className="border-b border-white/50 last:border-0 hover:bg-white/50">
              <td className="p-3 font-medium font-mono text-xs">{inv.invoice_number}</td>
              <td className="p-3">{inv.customer_name || "—"}</td>
              <td className="p-3 text-slate-500">{fmtDate(inv.due_date)}</td>
              <td className="p-3 text-right">{money(inv.total_amount)}</td>
              <td className="p-3 text-right text-slate-500">{money(inv.amount_paid)}</td>
              <td className="p-3 text-right font-medium text-rose-700">
                {money(inv.amount_due)}
              </td>
              <td className="p-3"><StatusPill status={inv.status} /></td>
              <td className="p-3">
                {/* Proof the accounting engine ran */}
                {inv.journal_entry_id ? (
                  <span className="text-[10px] font-mono text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded">
                    posted
                  </span>
                ) : (
                  <span className="text-xs text-slate-400">—</span>
                )}
              </td>
              <td className="p-3 text-right">
                {inv.amount_due > 0 ? (
                  <div className="flex gap-1 justify-end">
                    <button onClick={() => onPay(inv, "bank")}
                      disabled={pendingId === inv.id}
                      className="flex items-center gap-1 px-2.5 py-1 text-xs rounded-lg bg-slate-900 text-white hover:bg-slate-800 disabled:opacity-50">
                      {pendingId === inv.id
                        ? <Loader2 size={11} className="animate-spin" />
                        : <Receipt size={11} />}
                      Bank
                    </button>
                    <button onClick={() => onPay(inv, "cash")}
                      disabled={pendingId === inv.id}
                      className="px-2.5 py-1 text-xs rounded-lg border bg-white hover:bg-slate-50 disabled:opacity-50">
                      Cash
                    </button>
                  </div>
                ) : (
                  <span className="text-xs text-emerald-700">Settled</span>
                )}
              </td>
            </tr>
          ))}
          {rows.length === 0 && (
            <tr><td colSpan={9} className="p-8 text-center text-slate-500">
              No invoices yet. Generate one from a sales order.
            </td></tr>
          )}
        </tbody>
      </table>
    </GlassCard>
  );
}

/* ============================================================
   NEW SALES ORDER FORM
   ============================================================ */

function SalesOrderForm({ customers, products, onSave, onCancel, isSaving, error }) {
  const [customerId, setCustomerId] = useState(customers[0]?.id || "");
  const [orderDate, setOrderDate] = useState(new Date().toISOString().slice(0, 10));
  const [notes, setNotes] = useState("");

  const [lines, setLines] = useState([
    { product_id: products[0]?.id || "", quantity: 1,
      unit_price: products[0]?.sales_price || 0, tax_percent: 0 },
  ]);

  const changeLine = (idx, field, value) => {
    const next = [...lines];
    next[idx] = { ...next[idx], [field]: value };

    // Picking a product auto-fills its sales price.
    if (field === "product_id") {
      const p = products.find((x) => x.id === value);
      if (p) next[idx].unit_price = p.sales_price;
    }
    setLines(next);
  };

  const addLine = () =>
    setLines([...lines, {
      product_id: products[0]?.id || "", quantity: 1,
      unit_price: products[0]?.sales_price || 0, tax_percent: 0,
    }]);

  const removeLine = (idx) => setLines(lines.filter((_, i) => i !== idx));

  // Mirrors what the backend computes, so the user sees the total before saving.
  const subtotal = lines.reduce((s, l) => s + Number(l.quantity) * Number(l.unit_price), 0);
  const taxTotal = lines.reduce(
    (s, l) => s + (Number(l.quantity) * Number(l.unit_price) * Number(l.tax_percent)) / 100, 0
  );
  const total = subtotal + taxTotal;

  const submit = (e) => {
    e.preventDefault();
    onSave({
      customer_id: customerId,
      order_date: new Date(orderDate).toISOString(),
      notes: notes || null,
      lines: lines.map((l) => ({
        product_id: l.product_id,
        quantity: Number(l.quantity),
        unit_price: Number(l.unit_price),
        tax_percent: Number(l.tax_percent),
      })),
    });
  };

  return (
    <form onSubmit={submit} className="space-y-4 max-w-4xl">
      <div className="flex items-center gap-3">
        <button type="button" onClick={onCancel} className="p-2 border rounded-lg bg-white">
          <ArrowLeft size={16} />
        </button>
        <h1 className="text-xl font-semibold">New Sales Order</h1>
        <button type="submit" disabled={isSaving || !customerId}
          className="ml-auto flex items-center gap-1.5 px-4 py-1.5 text-sm rounded-lg bg-slate-900 text-white hover:bg-slate-800 disabled:opacity-50">
          {isSaving && <Loader2 size={14} className="animate-spin" />}
          {isSaving ? "Saving..." : "Confirm"}
        </button>
      </div>

      {error && (
        <div className="flex items-start gap-2 text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
          <AlertCircle size={15} className="mt-0.5 shrink-0" /> {error}
        </div>
      )}

      <GlassCard className="p-5 space-y-5">
        <div className="grid grid-cols-3 gap-4">
          <div className="col-span-2">
            <label className="block text-sm font-medium mb-1">Customer</label>
            <select value={customerId} onChange={(e) => setCustomerId(e.target.value)}
              required className="input bg-white">
              <option value="">Select a customer...</option>
              {customers.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Order Date</label>
            <input type="date" value={orderDate}
              onChange={(e) => setOrderDate(e.target.value)} required className="input" />
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
                <th className="text-left p-2 font-medium">Product</th>
                <th className="text-right p-2 font-medium w-20">Qty</th>
                <th className="text-right p-2 font-medium w-28">Unit Price</th>
                <th className="text-right p-2 font-medium w-20">Tax %</th>
                <th className="text-right p-2 font-medium w-28">Total</th>
                <th className="w-10"></th>
              </tr>
            </thead>
            <tbody>
              {lines.map((l, idx) => {
                const lineTotal =
                  Number(l.quantity) * Number(l.unit_price) *
                  (1 + Number(l.tax_percent) / 100);
                return (
                  <tr key={idx} className="border-b last:border-0">
                    <td className="p-2">
                      <select value={l.product_id}
                        onChange={(e) => changeLine(idx, "product_id", e.target.value)}
                        required className="w-full border rounded-md px-2 py-1 text-sm bg-white">
                        {products.map((p) => (
                          <option key={p.id} value={p.id}>
                            {p.name} — {money(p.sales_price)}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className="p-2">
                      <input type="number" min="0.01" step="0.01" value={l.quantity}
                        onChange={(e) => changeLine(idx, "quantity", e.target.value)}
                        required className="w-full border rounded-md px-2 py-1 text-sm text-right" />
                    </td>
                    <td className="p-2">
                      <input type="number" min="0" step="0.01" value={l.unit_price}
                        onChange={(e) => changeLine(idx, "unit_price", e.target.value)}
                        required className="w-full border rounded-md px-2 py-1 text-sm text-right" />
                    </td>
                    <td className="p-2">
                      <input type="number" min="0" max="100" step="0.1" value={l.tax_percent}
                        onChange={(e) => changeLine(idx, "tax_percent", e.target.value)}
                        className="w-full border rounded-md px-2 py-1 text-sm text-right" />
                    </td>
                    <td className="p-2 text-right font-medium">{money(lineTotal)}</td>
                    <td className="p-2 text-center">
                      {lines.length > 1 && (
                        <button type="button" onClick={() => removeLine(idx)}
                          className="text-red-600 hover:bg-red-50 rounded p-1">
                          <Trash2 size={14} />
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
            <tfoot className="bg-slate-50 border-t">
              <tr>
                <td colSpan={4} className="p-2 text-right text-slate-500">Subtotal</td>
                <td className="p-2 text-right">{money(subtotal)}</td>
                <td></td>
              </tr>
              <tr>
                <td colSpan={4} className="p-2 text-right text-slate-500">Tax</td>
                <td className="p-2 text-right">{money(taxTotal)}</td>
                <td></td>
              </tr>
              <tr className="border-t">
                <td colSpan={4} className="p-2 text-right font-medium">Total</td>
                <td className="p-2 text-right font-semibold">{money(total)}</td>
                <td></td>
              </tr>
            </tfoot>
          </table>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Notes</label>
          <input value={notes} onChange={(e) => setNotes(e.target.value)} className="input" />
        </div>
      </GlassCard>
    </form>
  );
}

/* ============================================================
   SHARED BITS
   ============================================================ */

function StatusPill({ status }) {
  const tone = {
    draft: "bg-slate-100 text-slate-600",
    confirmed: "bg-sky-100 text-sky-700",
    invoiced: "bg-violet-100 text-violet-700",
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

function QueryError({ query }) {
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