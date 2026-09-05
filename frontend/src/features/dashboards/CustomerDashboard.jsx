import { useState } from "react";
import { Link } from "react-router-dom";
import { Store } from "lucide-react";
import GlassCard from "../../components/GlassCard";
import { salesOrders, invoices, payments, payInvoice } from "../../data/store";
import { useAuth } from "../auth/AuthContext";

export default function CustomerDashboard() {
  const { user } = useAuth();
  const email = user.email.toLowerCase();

  const myOrders = salesOrders.filter((s) => s.customerEmail.toLowerCase() === email);
  const myPayments = payments.filter(
    (p) => p.kind === "receive" && p.partnerEmail.toLowerCase() === email
  );

  const [myInvoices, setMyInvoices] = useState(
    invoices.filter((i) => i.customerEmail.toLowerCase() === email)
  );
  const [message, setMessage] = useState("");

  const totalDue = myInvoices.reduce((s, i) => s + (i.amount - i.paid), 0);
  const totalBilled = myInvoices.reduce((s, i) => s + i.amount, 0);
  const outstanding = myInvoices.filter((i) => i.amount - i.paid > 0);

  const payNow = (id) => {
    const result = payInvoice(id, "Bank");   // records payment + journal entry
    if (!result.ok) { setMessage(result.message); return; }
    setMyInvoices(
      invoices.filter((i) => i.customerEmail.toLowerCase() === email)
    );
    setMessage(`Payment recorded against ${result.invoice.number}.`);
  };

  return (
    <div className="space-y-6 max-w-5xl">
              <Link to="/shop"
        className="flex items-center gap-2 text-sm font-medium bg-slate-900 text-white rounded-xl px-4 py-2.5 w-fit hover:bg-slate-800">
        <Store size={16} /> Browse Products & Place an Order
      </Link>
      {/* Overview cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Stat label="My Orders" value={myOrders.length} />
        <Stat label="Total Billed" value={`₹${totalBilled.toLocaleString()}`} />
        <Stat label="Outstanding" value={`₹${totalDue.toLocaleString()}`} tone="text-rose-700" />
        <Stat label="Payments Made" value={myPayments.length} tone="text-emerald-700" />
      </div>

      {message && (
        <div className="text-sm text-emerald-800 bg-emerald-50 border border-emerald-200 rounded-lg px-3 py-2">
          {message}
        </div>
      )}

      {/* Outstanding / due */}
      <Section title="Outstanding Payments" subtitle="Invoices still awaiting payment">
        {outstanding.length === 0 ? (
          <Empty text="Nothing outstanding. You're all settled." />
        ) : (
          <Table head={["Invoice", "Due Date", "Amount", "Paid", "Due", ""]}>
            {outstanding.map((i) => (
              <tr key={i.id} className="border-b border-white/50 last:border-0">
                <td className="p-3 font-medium">{i.number}</td>
                <td className="p-3 text-slate-500">{i.dueDate}</td>
                <td className="p-3 text-right">₹{i.amount.toLocaleString()}</td>
                <td className="p-3 text-right text-slate-500">₹{i.paid.toLocaleString()}</td>
                <td className="p-3 text-right font-medium text-rose-700">
                  ₹{(i.amount - i.paid).toLocaleString()}
                </td>
                <td className="p-3 text-right">
                  <button onClick={() => payNow(i.id)}
                    className="px-3 py-1 text-xs rounded-lg bg-slate-900 text-white hover:bg-slate-800">
                    Pay Now
                  </button>
                </td>
              </tr>
            ))}
          </Table>
        )}
      </Section>

      {/* Recent orders */}
      <Section title="Recent Orders" subtitle="Sales orders placed under your account">
        {myOrders.length === 0 ? <Empty text="No orders yet." /> : (
          <Table head={["Order", "Date", "Items", "Total", "Status"]}>
            {myOrders.map((o) => (
              <tr key={o.id} className="border-b border-white/50 last:border-0">
                <td className="p-3 font-medium">{o.number}</td>
                <td className="p-3 text-slate-500">{o.date}</td>
                <td className="p-3 text-slate-500">
                  {o.lines.map((l) => `${l.product} × ${l.qty}`).join(", ")}
                </td>
                <td className="p-3 text-right">₹{o.total.toLocaleString()}</td>
                <td className="p-3"><Pill text={o.status} /></td>
              </tr>
            ))}
          </Table>
        )}
      </Section>

      {/* All invoices */}
      <Section title="My Invoices" subtitle="Every invoice issued to you">
        <Table head={["Invoice", "Date", "Amount", "Paid", "Status"]}>
          {myInvoices.map((i) => (
            <tr key={i.id} className="border-b border-white/50 last:border-0">
              <td className="p-3 font-medium">{i.number}</td>
              <td className="p-3 text-slate-500">{i.date}</td>
              <td className="p-3 text-right">₹{i.amount.toLocaleString()}</td>
              <td className="p-3 text-right text-slate-500">₹{i.paid.toLocaleString()}</td>
              <td className="p-3"><Pill text={i.status} /></td>
            </tr>
          ))}
        </Table>
      </Section>

      {/* Payment history */}
      <Section title="Payments" subtitle="Money you have paid">
        {myPayments.length === 0 ? <Empty text="No payments recorded." /> : (
          <Table head={["Reference", "Date", "Against", "Method", "Amount"]}>
            {myPayments.map((p) => (
              <tr key={p.id} className="border-b border-white/50 last:border-0">
                <td className="p-3 font-medium">{p.number}</td>
                <td className="p-3 text-slate-500">{p.date}</td>
                <td className="p-3 text-slate-500">{p.against}</td>
                <td className="p-3">{p.method}</td>
                <td className="p-3 text-right text-emerald-700 font-medium">
                  ₹{p.amount.toLocaleString()}
                </td>
              </tr>
            ))}
          </Table>
        )}
      </Section>
    </div>
  );
}

/* ---- small shared pieces (also used by VendorDashboard) ---- */
export function Stat({ label, value, tone }) {
  return (
    <GlassCard className="p-4">
      <div className="text-xs text-slate-500">{label}</div>
      <div className={`text-2xl font-semibold mt-1 ${tone || ""}`}>{value}</div>
    </GlassCard>
  );
}

export function Section({ title, subtitle, children }) {
  return (
    <GlassCard className="overflow-hidden">
      <div className="px-5 py-4 border-b border-white/60">
        <h2 className="font-semibold">{title}</h2>
        {subtitle && <p className="text-xs text-slate-500 mt-0.5">{subtitle}</p>}
      </div>
      {children}
    </GlassCard>
  );
}

export function Table({ head, children }) {
  return (
    <table className="w-full text-sm">
      <thead className="bg-white/50 border-b border-white/60">
        <tr>
          {head.map((h, idx) => (
            <th key={idx}
              className={`p-3 font-medium ${idx >= 2 ? "text-right" : "text-left"}`}>
              {h}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>{children}</tbody>
    </table>
  );
}

export function Pill({ text }) {
  const tone =
    text === "Paid" ? "bg-emerald-100 text-emerald-700"
    : text === "Partial" ? "bg-amber-100 text-amber-700"
    : text === "Confirmed" || text === "Invoiced" || text === "Billed"
      ? "bg-sky-100 text-sky-700"
      : "bg-rose-100 text-rose-700";
  return <span className={`px-2 py-0.5 rounded-full text-xs ${tone}`}>{text}</span>;
}

export function Empty({ text }) {
  return <div className="p-6 text-center text-sm text-slate-500">{text}</div>;
}