import { useState } from "react";
import GlassCard from "../../components/GlassCard";
import { invoices, bills } from "../../data/store";
import { useAuth } from "../auth/AuthContext";

export default function PortalDashboard() {
  const { user, role } = useAuth();
  const isCustomer = role === "customer";

  // Only this person's documents — matched on their email.
  const source = isCustomer
    ? invoices.filter((i) => i.customerEmail.toLowerCase() === user.email.toLowerCase())
    : bills.filter((b) => b.vendorEmail.toLowerCase() === user.email.toLowerCase());

  const [rows, setRows] = useState(source);
  const [message, setMessage] = useState("");

  const totalDue = rows.reduce((s, r) => s + (r.amount - r.paid), 0);

  const pay = (id) => {
    setRows(rows.map((r) =>
      r.id === id ? { ...r, paid: r.amount, status: "Paid" } : r
    ));
    setMessage("Payment recorded successfully.");
  };

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <GlassCard className="p-5">
          <div className="text-sm text-slate-500">{isCustomer ? "Invoices" : "Bills"}</div>
          <div className="text-3xl font-semibold mt-1">{rows.length}</div>
        </GlassCard>
        <GlassCard className="p-5">
          <div className="text-sm text-slate-500">Amount Due</div>
          <div className="text-3xl font-semibold mt-1 text-rose-700">
            ₹{totalDue.toLocaleString()}
          </div>
        </GlassCard>
        <GlassCard className="p-5">
          <div className="text-sm text-slate-500">Fully Paid</div>
          <div className="text-3xl font-semibold mt-1 text-emerald-700">
            {rows.filter((r) => r.status === "Paid").length}
          </div>
        </GlassCard>
      </div>

      {message && (
        <div className="text-sm text-emerald-800 bg-emerald-50 border border-emerald-200 rounded-lg px-3 py-2">
          {message}
        </div>
      )}

      <GlassCard className="overflow-hidden">
        <div className="px-5 py-4 border-b border-white/60">
          <h2 className="font-semibold">{isCustomer ? "My Invoices" : "My Bills"}</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            You can only see documents issued to you.
          </p>
        </div>
        <table className="w-full text-sm">
          <thead className="bg-white/50 border-b border-white/60">
            <tr>
              <th className="text-left p-3 font-medium">Number</th>
              <th className="text-left p-3 font-medium">Date</th>
              <th className="text-right p-3 font-medium">Amount</th>
              <th className="text-right p-3 font-medium">Due</th>
              <th className="text-left p-3 font-medium">Status</th>
              <th className="p-3"></th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => {
              const due = r.amount - r.paid;
              return (
                <tr key={r.id} className="border-b border-white/50 last:border-0">
                  <td className="p-3 font-medium">{r.number}</td>
                  <td className="p-3 text-slate-500">{r.date}</td>
                  <td className="p-3 text-right">₹{r.amount.toLocaleString()}</td>
                  <td className="p-3 text-right">₹{due.toLocaleString()}</td>
                  <td className="p-3">
                    <span className={`px-2 py-0.5 rounded-full text-xs ${
                      r.status === "Paid" ? "bg-emerald-100 text-emerald-700"
                      : r.status === "Partial" ? "bg-amber-100 text-amber-700"
                      : "bg-rose-100 text-rose-700"}`}>
                      {r.status}
                    </span>
                  </td>
                  <td className="p-3 text-right">
                    {due > 0 && isCustomer && (
                      <button onClick={() => pay(r.id)}
                        className="px-3 py-1 text-xs rounded-lg bg-slate-900 text-white hover:bg-slate-800">
                        Pay Now
                      </button>
                    )}
                  </td>
                </tr>
              );
            })}
            {rows.length === 0 && (
              <tr><td colSpan={6} className="p-6 text-center text-slate-500">
                Nothing here yet.
              </td></tr>
            )}
          </tbody>
        </table>
      </GlassCard>
    </div>
  );
}