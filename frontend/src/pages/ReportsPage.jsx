import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import axiosClient from "../api/axiosClient";
import GlassCard from "../components/GlassCard";
import { Loader2, AlertCircle, TrendingUp, Scale, Clock, Download, Printer, Target } from "lucide-react";

const money = (n) =>
  `₹${Number(n || 0).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

const errorText = (e) =>
  e?.response?.data?.detail || e?.message || "Something went wrong";

const TABS = [
  { id: "balance", label: "Balance Sheet", icon: Scale },
  { id: "pl", label: "Profit & Loss", icon: TrendingUp },
  { id: "budget", label: "Budget", icon: Target },
  { id: "aging", label: "Aging", icon: Clock },
];
/* ---------- CSV download ---------- */

function downloadCSV(filename, rows) {
  const csv = rows
    .map((r) => r.map((cell) => {
      const s = String(cell ?? "");
      return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
    }).join(","))
    .join("\n");

  const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

function DownloadBar({ onCSV }) {
  return (
    <div className="flex gap-2 print:hidden">
      <button onClick={onCSV}
        className="flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-lg border bg-white hover:bg-slate-50">
        <Download size={14} /> CSV
      </button>
      <button onClick={() => window.print()}
        className="flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-lg border bg-white hover:bg-slate-50">
        <Printer size={14} /> Print / PDF
      </button>
    </div>
  );
}

export default function ReportsPage() {
  const [tab, setTab] = useState("balance");

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-semibold">Reports</h1>
        <p className="text-sm text-slate-500">
          Computed live from journal entries — nothing is cached.
        </p>
      </div>

      <div className="flex gap-2">
        {TABS.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setTab(id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm transition ${
              tab === id
                ? "bg-slate-900 text-white"
                : "bg-white/60 text-slate-600 hover:bg-white"
            }`}
          >
            <Icon size={15} />
            {label}
          </button>
        ))}
      </div>

      {tab === "balance" && <BalanceSheet />}
      {tab === "pl" && <ProfitAndLoss />}
      {tab === "aging" && <Aging />}
    </div>
  );
}

/* ---------------- Balance Sheet ---------------- */

function BalanceSheet() {
  const q = useQuery({
    queryKey: ["report", "balance-sheet"],
    queryFn: async () => (await axiosClient.get("/reports/balance-sheet")).data,
  });

  if (q.isLoading) return <Loading />;
  if (q.isError) return <QueryError query={q} />;

  const d = q.data;

  return (
    <div className="space-y-4">
      <GlassCard className="p-4">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-sm text-slate-500">Accounting equation</div>
            <div className="text-lg font-medium">
              Assets {money(d.total_assets)} = Liabilities{" "}
              {money(d.total_liabilities)} + Capital {money(d.total_capital)}
            </div>
          </div>
          <span
            className={`px-3 py-1 rounded-full text-sm ${
              d.is_balanced
                ? "bg-emerald-100 text-emerald-700"
                : "bg-red-100 text-red-700"
            }`}
          >
            {d.is_balanced ? "Balanced ✓" : "Out of balance"}
          </span>
        </div>
      </GlassCard>

      <div className="grid md:grid-cols-2 gap-4">
        <Section title="Assets" rows={d.assets} total={d.total_assets} />
        <div className="space-y-4">
          <Section
            title="Liabilities"
            rows={d.liabilities}
            total={d.total_liabilities}
          />
          <Section
            title="Capital"
            rows={d.capital}
            total={d.total_capital}
            extra={
              d.retained_earnings
                ? { account_name: "Retained Earnings (this period)", balance: d.retained_earnings }
                : null
            }
          />
        </div>
      </div>
    </div>
  );
}

function Section({ title, rows = [], total, extra }) {
  return (
    <GlassCard className="p-4">
      <h3 className="font-medium mb-3">{title}</h3>
      <table className="w-full text-sm">
        <tbody>
          {rows.length === 0 && !extra && (
            <tr>
              <td className="py-2 text-slate-400">No entries yet</td>
            </tr>
          )}
          {rows.map((r) => (
            <tr key={r.account_id} className="border-b last:border-0">
              <td className="py-2">
                {r.code && <span className="text-slate-400 mr-2">{r.code}</span>}
                {r.account_name}
              </td>
              <td className="py-2 text-right">{money(r.balance)}</td>
            </tr>
          ))}
          {extra && (
            <tr className="border-b last:border-0">
              <td className="py-2 italic text-slate-600">{extra.account_name}</td>
              <td className="py-2 text-right">{money(extra.balance)}</td>
            </tr>
          )}
        </tbody>
        <tfoot>
          <tr className="border-t-2">
            <td className="py-2 font-medium">Total {title}</td>
            <td className="py-2 text-right font-semibold">{money(total)}</td>
          </tr>
        </tfoot>
      </table>
    </GlassCard>
  );
}

/* ---------------- Profit & Loss ---------------- */

function ProfitAndLoss() {
  const [start, setStart] = useState("");
  const [end, setEnd] = useState("");

  const q = useQuery({
    queryKey: ["report", "pl", start, end],
    queryFn: async () => {
      const params = {};
      if (start) params.start_date = new Date(start).toISOString();
      if (end) params.end_date = new Date(end).toISOString();
      return (await axiosClient.get("/reports/profit-and-loss", { params })).data;
    },
  });

  return (
    <div className="space-y-4">
      <GlassCard className="p-4 flex flex-wrap items-end gap-3">
        <div>
          <label className="block text-xs text-slate-500 mb-1">From</label>
          <input
            type="date"
            value={start}
            onChange={(e) => setStart(e.target.value)}
            className="border rounded-md px-2 py-1.5 text-sm"
          />
        </div>
        <div>
          <label className="block text-xs text-slate-500 mb-1">To</label>
          <input
            type="date"
            value={end}
            onChange={(e) => setEnd(e.target.value)}
            className="border rounded-md px-2 py-1.5 text-sm"
          />
        </div>
        {(start || end) && (
          <button
            onClick={() => {
              setStart("");
              setEnd("");
            }}
            className="text-sm underline text-slate-600 pb-1.5"
          >
            Clear
          </button>
        )}
      </GlassCard>

      {q.isLoading && <Loading />}
      {q.isError && <QueryError query={q} />}

      {q.data && (
        <>
          <div className="grid sm:grid-cols-3 gap-4">
            <Kpi label="Total Income" value={q.data.total_income} tone="emerald" />
            <Kpi label="Total Expenses" value={q.data.total_expenses} tone="rose" />
            <Kpi
              label="Net Profit"
              value={q.data.net_profit}
              tone={q.data.net_profit >= 0 ? "emerald" : "rose"}
              big
            />
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <PlSection title="Income" rows={q.data.income} total={q.data.total_income} />
            <PlSection title="Expenses" rows={q.data.expenses} total={q.data.total_expenses} />
          </div>
        </>
      )}
    </div>
  );
}

function PlSection({ title, rows = [], total }) {
  return (
    <GlassCard className="p-4">
      <h3 className="font-medium mb-3">{title}</h3>
      <table className="w-full text-sm">
        <tbody>
          {rows.length === 0 && (
            <tr>
              <td className="py-2 text-slate-400">No entries in this period</td>
            </tr>
          )}
          {rows.map((r) => (
            <tr key={r.account_id} className="border-b last:border-0">
              <td className="py-2">{r.account_name}</td>
              <td className="py-2 text-right">{money(r.amount)}</td>
            </tr>
          ))}
        </tbody>
        <tfoot>
          <tr className="border-t-2">
            <td className="py-2 font-medium">Total {title}</td>
            <td className="py-2 text-right font-semibold">{money(total)}</td>
          </tr>
        </tfoot>
      </table>
    </GlassCard>
  );
}

function Kpi({ label, value, tone, big }) {
  const tones = {
    emerald: "text-emerald-600",
    rose: "text-rose-600",
  };
  return (
    <GlassCard className="p-4">
      <div className="text-sm text-slate-500">{label}</div>
      <div className={`${big ? "text-2xl" : "text-xl"} font-semibold ${tones[tone] || ""}`}>
        {money(value)}
      </div>
    </GlassCard>
  );
}

/* ---------------- Aging ---------------- */

const BUCKET_LABELS = {
  current: "Not yet due",
  "1_30": "1–30 days",
  "31_60": "31–60 days",
  "61_90": "61–90 days",
  over_90: "Over 90 days",
};

function Aging() {
  const [type, setType] = useState("receivable");

  const q = useQuery({
    queryKey: ["report", "aging", type],
    queryFn: async () =>
      (await axiosClient.get("/reports/aging", { params: { type } })).data,
  });

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        {["receivable", "payable"].map((t) => (
          <button
            key={t}
            onClick={() => setType(t)}
            className={`px-3 py-1.5 rounded-lg text-sm capitalize ${
              type === t ? "bg-slate-900 text-white" : "bg-white/60 text-slate-600"
            }`}
          >
            {t === "receivable" ? "Customers owe us" : "We owe vendors"}
          </button>
        ))}
      </div>

      {q.isLoading && <Loading />}
      {q.isError && <QueryError query={q} />}

      {q.data && (
        <>
          <div className="grid sm:grid-cols-2 gap-4">
            <Kpi label="Total Outstanding" value={q.data.total_outstanding} />
            <Kpi label="Overdue" value={q.data.total_overdue} tone="rose" />
          </div>

          <div className="grid sm:grid-cols-5 gap-3">
            {Object.entries(BUCKET_LABELS).map(([key, label]) => {
              const b = q.data.buckets[key] || { count: 0, amount: 0 };
              return (
                <GlassCard key={key} className="p-3">
                  <div className="text-xs text-slate-500">{label}</div>
                  <div className="text-lg font-semibold">{money(b.amount)}</div>
                  <div className="text-xs text-slate-400">
                    {b.count} {b.count === 1 ? "document" : "documents"}
                  </div>
                </GlassCard>
              );
            })}
          </div>

          <GlassCard className="p-0 overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 border-b text-left">
                <tr>
                  <th className="p-3">Number</th>
                  <th className="p-3">{type === "receivable" ? "Customer" : "Vendor"}</th>
                  <th className="p-3">Due date</th>
                  <th className="p-3 text-right">Days overdue</th>
                  <th className="p-3 text-right">Amount due</th>
                </tr>
              </thead>
              <tbody>
                {Object.entries(q.data.buckets).flatMap(([, b]) => b.items || []).length === 0 && (
                  <tr>
                    <td colSpan={5} className="p-6 text-center text-slate-400">
                      Nothing outstanding
                    </td>
                  </tr>
                )}
                {Object.entries(q.data.buckets).flatMap(([bucket, b]) =>
                  (b.items || []).map((item) => (
                    <tr key={item.id} className="border-b last:border-0">
                      <td className="p-3 font-medium">{item.number}</td>
                      <td className="p-3">{item.contact_name || "—"}</td>
                      <td className="p-3">
                        {item.due_date ? new Date(item.due_date).toLocaleDateString("en-IN") : "—"}
                      </td>
                      <td className="p-3 text-right">
                        {item.days_overdue > 0 ? (
                          <span className="text-rose-600">{item.days_overdue}</span>
                        ) : (
                          <span className="text-slate-400">—</span>
                        )}
                      </td>
                      <td className="p-3 text-right font-medium">{money(item.amount_due)}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </GlassCard>
        </>
      )}
    </div>
  );
}

/* ---------------- Shared ---------------- */

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