import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import axiosClient from "../api/axiosClient";
import GlassCard from "../components/GlassCard";
import { Loader2, AlertCircle, CheckCircle2, Wallet, Landmark, Clock } from "lucide-react";

const money = (n) =>
  `₹${Number(n || 0).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

const errorText = (e) => e?.response?.data?.detail || e?.message || "Something went wrong";

const fmtDate = (d) => (d ? new Date(d).toLocaleDateString("en-IN") : "—");

export default function PortalPage() {
  const qc = useQueryClient();
  const [flash, setFlash] = useState(null);
  const [payingId, setPayingId] = useState(null);

  const me = useQuery({
    queryKey: ["portal", "me"],
    queryFn: async () => (await axiosClient.get("/portal/me")).data,
  });

  const summary = useQuery({
    queryKey: ["portal", "summary"],
    queryFn: async () => (await axiosClient.get("/portal/summary")).data,
  });

  const invoices = useQuery({
    queryKey: ["portal", "invoices"],
    queryFn: async () => (await axiosClient.get("/portal/invoices")).data,
    enabled: !!me.data?.can_view_invoices,
  });

  const bills = useQuery({
    queryKey: ["portal", "bills"],
    queryFn: async () => (await axiosClient.get("/portal/bills")).data,
    enabled: !!me.data?.can_view_bills,
  });

  const pay = useMutation({
    mutationFn: async ({ id, amount, method }) =>
      (await axiosClient.post(`/portal/invoices/${id}/pay`, { amount, method })).data,
    onSuccess: (data) => {
      setFlash({
        type: "ok",
        text: `Payment ${data.payment_number} recorded — ${money(data.amount)} by ${data.method}. Ledger updated: Debit ${data.method === "bank" ? "Bank" : "Cash"}, Credit Debtors.`,
      });
      setPayingId(null);
      qc.invalidateQueries({ queryKey: ["portal"] });
    },
    onError: (e) => setFlash({ type: "err", text: errorText(e) }),
  });

  if (me.isLoading) return <Loading />;
  if (me.isError) return <QueryError query={me} />;

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-semibold">My Account</h1>
        <p className="text-sm text-slate-500">
          Welcome back, {me.data.name} — you're viewing only your own records.
        </p>
      </div>

      {flash && (
        <div
          className={`flex items-start gap-2 text-sm rounded-lg px-3 py-2 border ${
            flash.type === "ok"
              ? "bg-emerald-50 border-emerald-200 text-emerald-800"
              : "bg-red-50 border-red-200 text-red-700"
          }`}
        >
          {flash.type === "ok" ? (
            <CheckCircle2 size={15} className="mt-0.5 shrink-0" />
          ) : (
            <AlertCircle size={15} className="mt-0.5 shrink-0" />
          )}
          <span>{flash.text}</span>
          <button onClick={() => setFlash(null)} className="ml-auto text-xs underline">
            dismiss
          </button>
        </div>
      )}

      {/* Summary */}
      {summary.data && (
        <div className="grid sm:grid-cols-3 gap-4">
          {me.data.can_view_invoices && (
            <>
              <GlassCard className="p-4">
                <div className="text-sm text-slate-500">Amount you owe</div>
                <div className="text-2xl font-semibold">
                  {money(summary.data.amount_i_owe)}
                </div>
              </GlassCard>
              <GlassCard className="p-4">
                <div className="text-sm text-slate-500">Open invoices</div>
                <div className="text-2xl font-semibold">{summary.data.open_invoices}</div>
              </GlassCard>
              <GlassCard className="p-4">
                <div className="text-sm text-slate-500 flex items-center gap-1">
                  <Clock size={13} /> Overdue
                </div>
                <div
                  className={`text-2xl font-semibold ${
                    summary.data.overdue_invoices > 0 ? "text-rose-600" : ""
                  }`}
                >
                  {summary.data.overdue_invoices}
                </div>
              </GlassCard>
            </>
          )}
          {me.data.can_view_bills && (
            <>
              <GlassCard className="p-4">
                <div className="text-sm text-slate-500">Amount owed to you</div>
                <div className="text-2xl font-semibold">
                  {money(summary.data.amount_owed_to_me)}
                </div>
              </GlassCard>
              <GlassCard className="p-4">
                <div className="text-sm text-slate-500">Open bills</div>
                <div className="text-2xl font-semibold">{summary.data.open_bills}</div>
              </GlassCard>
            </>
          )}
        </div>
      )}

      {/* Invoices */}
      {me.data.can_view_invoices && (
        <GlassCard className="p-0 overflow-hidden">
          <div className="p-4 border-b">
            <h2 className="font-medium">My Invoices</h2>
          </div>

          {invoices.isLoading && <Loading />}
          {invoices.isError && (
            <div className="p-4">
              <QueryError query={invoices} />
            </div>
          )}

          {invoices.data && (
            <table className="w-full text-sm">
              <thead className="bg-slate-50 border-b text-left">
                <tr>
                  <th className="p-3">Invoice</th>
                  <th className="p-3">Date</th>
                  <th className="p-3">Due</th>
                  <th className="p-3 text-right">Total</th>
                  <th className="p-3 text-right">Due now</th>
                  <th className="p-3">Status</th>
                  <th className="p-3 text-center">Pay</th>
                </tr>
              </thead>
              <tbody>
                {invoices.data.length === 0 && (
                  <tr>
                    <td colSpan={7} className="p-6 text-center text-slate-400">
                      You have no invoices yet
                    </td>
                  </tr>
                )}
                {invoices.data.map((inv) => (
                  <tr key={inv.id} className="border-b last:border-0">
                    <td className="p-3 font-medium">{inv.invoice_number}</td>
                    <td className="p-3">{fmtDate(inv.invoice_date)}</td>
                    <td className="p-3">{fmtDate(inv.due_date)}</td>
                    <td className="p-3 text-right">{money(inv.total_amount)}</td>
                    <td className="p-3 text-right font-medium">{money(inv.amount_due)}</td>
                    <td className="p-3">
                      <StatusPill status={inv.status} />
                    </td>
                    <td className="p-3">
                      {inv.status === "paid" ? (
                        <span className="text-emerald-600 text-xs flex justify-center">
                          <CheckCircle2 size={16} />
                        </span>
                      ) : payingId === inv.id ? (
                        <PayButtons
                          amount={inv.amount_due}
                          pending={pay.isPending}
                          onPay={(method) =>
                            pay.mutate({ id: inv.id, amount: inv.amount_due, method })
                          }
                          onCancel={() => setPayingId(null)}
                        />
                      ) : (
                        <button
                          onClick={() => {
                            setFlash(null);
                            setPayingId(inv.id);
                          }}
                          className="w-full px-3 py-1 rounded-md bg-slate-900 text-white text-xs"
                        >
                          Pay now
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </GlassCard>
      )}

      {/* Bills (vendors) */}
      {me.data.can_view_bills && (
        <GlassCard className="p-0 overflow-hidden">
          <div className="p-4 border-b">
            <h2 className="font-medium">Bills I've Raised</h2>
          </div>

          {bills.isLoading && <Loading />}
          {bills.data && (
            <table className="w-full text-sm">
              <thead className="bg-slate-50 border-b text-left">
                <tr>
                  <th className="p-3">Bill</th>
                  <th className="p-3">Date</th>
                  <th className="p-3 text-right">Total</th>
                  <th className="p-3 text-right">Outstanding</th>
                  <th className="p-3">Status</th>
                </tr>
              </thead>
              <tbody>
                {bills.data.length === 0 && (
                  <tr>
                    <td colSpan={5} className="p-6 text-center text-slate-400">
                      No bills yet
                    </td>
                  </tr>
                )}
                {bills.data.map((b) => (
                  <tr key={b.id} className="border-b last:border-0">
                    <td className="p-3 font-medium">{b.bill_number}</td>
                    <td className="p-3">{fmtDate(b.bill_date)}</td>
                    <td className="p-3 text-right">{money(b.total_amount)}</td>
                    <td className="p-3 text-right font-medium">{money(b.amount_due)}</td>
                    <td className="p-3">
                      <StatusPill status={b.status} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </GlassCard>
      )}
    </div>
  );
}

function PayButtons({ amount, pending, onPay, onCancel }) {
  return (
    <div className="flex flex-col gap-1">
      <div className="text-[11px] text-slate-500 text-center">{money(amount)}</div>
      <div className="flex gap-1">
        <button
          disabled={pending}
          onClick={() => onPay("bank")}
          className="flex-1 flex items-center justify-center gap-1 px-2 py-1 rounded-md bg-sky-600 text-white text-xs disabled:opacity-50"
        >
          <Landmark size={12} /> Bank
        </button>
        <button
          disabled={pending}
          onClick={() => onPay("cash")}
          className="flex-1 flex items-center justify-center gap-1 px-2 py-1 rounded-md bg-emerald-600 text-white text-xs disabled:opacity-50"
        >
          <Wallet size={12} /> Cash
        </button>
      </div>
      <button onClick={onCancel} className="text-[11px] underline text-slate-500">
        cancel
      </button>
    </div>
  );
}

function StatusPill({ status }) {
  const tone =
    {
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
      <button
        onClick={() => query.refetch()}
        className="mt-2 text-sm underline text-slate-600 hover:text-slate-900"
      >
        Try again
      </button>
    </div>
  );
}