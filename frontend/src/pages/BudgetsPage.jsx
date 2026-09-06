import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Plus, Archive, Loader2, AlertCircle } from "lucide-react";
import axiosClient from "../api/axiosClient";
import GlassCard from "../components/GlassCard";
import SavedBanner from "../components/SavedBanner";
import { useAnalyticAccounts } from "./AnalyticsPage";

/* ---------------- API ----------------
   GET/POST /budgets
   { id, name, analytic_account_id, analytic_account_name,
     period_start, period_end, planned_amount, responsible_person, is_archived }
   Backend rules: planned_amount > 0, period_end > period_start,
   analytic_account_id must exist.
   ------------------------------------ */

async function fetchBudgets() {
  const { data } = await axiosClient.get("/budgets");
  return Array.isArray(data) ? data : [];
}

async function createBudget(payload) {
  const { data } = await axiosClient.post("/budgets", payload);
  return data;
}

async function archiveBudget(id) {
  await axiosClient.delete(`/budgets/${id}`);
  return id;
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

const fmtDate = (iso) => (iso ? String(iso).slice(0, 10) : "—");

/* ---------------- HOOKS ---------------- */

const keys = { all: ["budgets"] };

function useBudgets() {
  return useQuery({ queryKey: keys.all, queryFn: fetchBudgets });
}

function useCreateBudget() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: createBudget,
    onSuccess: () => qc.invalidateQueries({ queryKey: keys.all }),
  });
}

function useArchiveBudget() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: archiveBudget,
    onSuccess: () => qc.invalidateQueries({ queryKey: keys.all }),
  });
}

/* ---------------- PAGE ---------------- */

export default function BudgetsPage() {
  const [showForm, setShowForm] = useState(false);
  const [saved, setSaved] = useState(null);

  const query = useBudgets();
  const analyticsQuery = useAnalyticAccounts();   // reused from AnalyticsPage
  const createMutation = useCreateBudget();
  const archiveMutation = useArchiveBudget();

  const rows = query.data || [];
  const totalPlanned = rows.reduce((s, b) => s + (b.planned_amount || 0), 0);

  if (showForm) {
    return (
      <BudgetForm
        analytics={analyticsQuery.data || []}
        isSaving={createMutation.isPending}
        error={errorText(createMutation.error)}
        onCancel={() => { createMutation.reset(); setShowForm(false); }}
        onSave={(form) =>
          createMutation.mutate(form, {
            onSuccess: (record) => {
              setSaved({
                name: record.name,
                analytic: record.analytic_account_name || "—",
                period: `${fmtDate(record.period_start)} → ${fmtDate(record.period_end)}`,
                planned: `₹${record.planned_amount.toLocaleString()}`,
                responsible: record.responsible_person || "—",
              });
              setShowForm(false);
            },
          })
        }
      />
    );
  }

  return (
    <div className="space-y-4 max-w-5xl">
      <div className="flex items-center gap-3">
        <button
          onClick={() => { createMutation.reset(); setShowForm(true); }}
          disabled={(analyticsQuery.data || []).length === 0}
          className="flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-lg bg-slate-900 text-white hover:bg-slate-800 disabled:opacity-40"
          title={(analyticsQuery.data || []).length === 0
            ? "Create an analytic account first"
            : ""}>
          <Plus size={15} /> New
        </button>
        {query.isFetching && !query.isLoading && (
          <Loader2 size={14} className="animate-spin text-slate-400" />
        )}
      </div>

      <div>
        <h1 className="text-xl font-semibold">Budgets</h1>
        <p className="text-sm text-slate-500">
          Planned spend or income per analytic account, over a date range.
        </p>
      </div>

      {/* Budgets can't exist without an analytic account — say so plainly */}
      {!analyticsQuery.isLoading && (analyticsQuery.data || []).length === 0 && (
        <div className="text-sm text-amber-800 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
          Create an Analytic Account first — every budget must be linked to one.
        </div>
      )}

      {saved && <SavedBanner record={saved} onClose={() => setSaved(null)} />}

      {rows.length > 0 && (
        <GlassCard className="p-4 inline-block">
          <div className="text-xs text-slate-500">Total Planned</div>
          <div className="text-2xl font-semibold">₹{totalPlanned.toLocaleString()}</div>
        </GlassCard>
      )}

      {query.isLoading && (
        <div className="flex items-center justify-center gap-2 text-sm text-slate-500 py-10">
          <Loader2 size={16} className="animate-spin" /> Loading...
        </div>
      )}

      {query.isError && (
        <div className="flex items-start gap-2 text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
          <AlertCircle size={15} className="mt-0.5 shrink-0" /> {errorText(query.error)}
        </div>
      )}

      {!query.isLoading && !query.isError && (
        <GlassCard className="overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-white/50 border-b border-white/60">
              <tr>
                <th className="text-left p-3 font-medium">Budget</th>
                <th className="text-left p-3 font-medium">Analytic Account</th>
                <th className="text-left p-3 font-medium">Period</th>
                <th className="text-left p-3 font-medium">Responsible</th>
                <th className="text-right p-3 font-medium">Planned</th>
                <th className="p-3"></th>
              </tr>
            </thead>
            <tbody>
              {rows.map((b) => (
                <tr key={b.id} className="border-b border-white/50 last:border-0 hover:bg-white/50">
                  <td className="p-3 font-medium">{b.name}</td>
                  <td className="p-3 text-slate-500">{b.analytic_account_name || "—"}</td>
                  <td className="p-3 text-slate-500">
                    {fmtDate(b.period_start)} → {fmtDate(b.period_end)}
                  </td>
                  <td className="p-3 text-slate-500">{b.responsible_person || "—"}</td>
                  <td className="p-3 text-right font-medium">
                    ₹{b.planned_amount.toLocaleString()}
                  </td>
                  <td className="p-3 text-right">
                    <button
                      onClick={() => {
                        if (window.confirm(`Archive "${b.name}"?`)) archiveMutation.mutate(b.id);
                      }}
                      className="p-1.5 rounded-lg hover:bg-amber-50 text-amber-700">
                      <Archive size={14} />
                    </button>
                  </td>
                </tr>
              ))}
              {rows.length === 0 && (
                <tr><td colSpan={6} className="p-6 text-center text-slate-500">
                  No budgets yet.
                </td></tr>
              )}
            </tbody>
          </table>
        </GlassCard>
      )}
    </div>
  );
}

function BudgetForm({ analytics, onSave, onCancel, isSaving, error }) {
  const [form, setForm] = useState({
    name: "",
    analytic_account_id: analytics[0]?.id || "",
    period_start: "",
    period_end: "",
    planned_amount: "",
    responsible_person: "",
  });

  const change = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const submit = (e) => {
    e.preventDefault();
    // planned_amount must be a number > 0; dates go as ISO strings.
    onSave({
      ...form,
      planned_amount: Number(form.planned_amount),
      responsible_person: form.responsible_person || null,
    });
  };

  return (
    <form onSubmit={submit} className="space-y-4 max-w-2xl">
      <div className="flex items-center gap-3">
        <button type="button" onClick={onCancel} className="p-2 border rounded-lg bg-white">
          <ArrowLeft size={16} />
        </button>
        <h1 className="text-xl font-semibold">New Budget</h1>
        <button type="submit" disabled={isSaving}
          className="ml-auto flex items-center gap-1.5 px-4 py-1.5 text-sm rounded-lg bg-slate-900 text-white hover:bg-slate-800 disabled:opacity-50">
          {isSaving && <Loader2 size={14} className="animate-spin" />}
          {isSaving ? "Saving..." : "Confirm"}
        </button>
      </div>

      {/* Surfaces the backend's own rules, e.g.
          "period_end must be after period_start" */}
      {error && (
        <div className="flex items-start gap-2 text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
          <AlertCircle size={15} className="mt-0.5 shrink-0" /> {error}
        </div>
      )}

      <GlassCard className="p-5 grid grid-cols-2 gap-4">
        <div className="col-span-2">
          <label className="block text-sm font-medium mb-1">Budget Name</label>
          <input name="name" value={form.name} onChange={change} required
            placeholder="e.g. January 2026" className="input" />
        </div>

        <div className="col-span-2">
          <label className="block text-sm font-medium mb-1">Analytic Account</label>
          <select name="analytic_account_id" value={form.analytic_account_id}
            onChange={change} required className="input bg-white">
            {analytics.map((a) => (
              <option key={a.id} value={a.id}>{a.name} ({a.type})</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Period Start</label>
          <input name="period_start" type="date" value={form.period_start}
            onChange={change} required className="input" />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Period End</label>
          <input name="period_end" type="date" value={form.period_end}
            onChange={change} required className="input" />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Planned Amount</label>
          <input name="planned_amount" type="number" min="1" value={form.planned_amount}
            onChange={change} required className="input" />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Responsible Person</label>
          <input name="responsible_person" value={form.responsible_person}
            onChange={change} className="input" />
        </div>
      </GlassCard>
    </form>
  );
}