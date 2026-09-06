import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Plus, Archive, Loader2, AlertCircle } from "lucide-react";
import axiosClient from "../api/axiosClient";
import GlassCard from "../components/GlassCard";
import SavedBanner from "../components/SavedBanner";

/* ---------------- API ----------------
   GET/POST /analytic-accounts
   { id, name, type: "income"|"expenses", description, is_archived }
   POST rejects duplicate names with a 400.
   ------------------------------------ */

async function fetchAnalytics() {
  const { data } = await axiosClient.get("/analytic-accounts");
  return Array.isArray(data) ? data : [];
}

async function createAnalytic(payload) {
  const { data } = await axiosClient.post("/analytic-accounts", payload);
  return data;
}

async function archiveAnalytic(id) {
  await axiosClient.delete(`/analytic-accounts/${id}`);
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

/* ---------------- HOOKS ---------------- */

const keys = { all: ["analytic-accounts"] };

export function useAnalyticAccounts() {
  return useQuery({ queryKey: keys.all, queryFn: fetchAnalytics });
}

function useCreateAnalytic() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: createAnalytic,
    onSuccess: () => qc.invalidateQueries({ queryKey: keys.all }),
  });
}

function useArchiveAnalytic() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: archiveAnalytic,
    onSuccess: () => qc.invalidateQueries({ queryKey: keys.all }),
  });
}

/* ---------------- PAGE ---------------- */

export default function AnalyticsPage() {
  const [showForm, setShowForm] = useState(false);
  const [saved, setSaved] = useState(null);

  const query = useAnalyticAccounts();
  const createMutation = useCreateAnalytic();
  const archiveMutation = useArchiveAnalytic();

  const rows = query.data || [];

  if (showForm) {
    return (
      <AnalyticForm
        isSaving={createMutation.isPending}
        error={errorText(createMutation.error)}
        onCancel={() => { createMutation.reset(); setShowForm(false); }}
        onSave={(form) =>
          createMutation.mutate(form, {
            onSuccess: (record) => {
              setSaved({ name: record.name, type: record.type,
                         description: record.description || "—" });
              setShowForm(false);
            },
          })
        }
      />
    );
  }

  return (
    <div className="space-y-4 max-w-4xl">
      <div className="flex items-center gap-3">
        <button onClick={() => { createMutation.reset(); setShowForm(true); }}
          className="flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-lg bg-slate-900 text-white hover:bg-slate-800">
          <Plus size={15} /> New
        </button>
        {query.isFetching && !query.isLoading && (
          <Loader2 size={14} className="animate-spin text-slate-400" />
        )}
      </div>

      <div>
        <h1 className="text-xl font-semibold">Analytic Accounts</h1>
        <p className="text-sm text-slate-500">
          Tags that group income or expenses by project, department or business unit.
        </p>
      </div>

      {saved && <SavedBanner record={saved} onClose={() => setSaved(null)} />}

      {query.isLoading && (
        <div className="flex items-center justify-center gap-2 text-sm text-slate-500 py-10">
          <Loader2 size={16} className="animate-spin" /> Loading...
        </div>
      )}

      {query.isError && (
        <div className="flex items-start gap-2 text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
          <AlertCircle size={15} className="mt-0.5 shrink-0" />
          {errorText(query.error)}
        </div>
      )}

      {!query.isLoading && !query.isError && (
        <GlassCard className="overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-white/50 border-b border-white/60">
              <tr>
                <th className="text-left p-3 font-medium">Name</th>
                <th className="text-left p-3 font-medium">Type</th>
                <th className="text-left p-3 font-medium">Description</th>
                <th className="p-3"></th>
              </tr>
            </thead>
            <tbody>
              {rows.map((a) => (
                <tr key={a.id} className="border-b border-white/50 last:border-0 hover:bg-white/50">
                  <td className="p-3 font-medium">{a.name}</td>
                  <td className="p-3">
                    <span className={`px-2 py-0.5 rounded-full text-xs capitalize ${
                      a.type === "income" ? "bg-emerald-100 text-emerald-700"
                                          : "bg-rose-100 text-rose-700"}`}>
                      {a.type}
                    </span>
                  </td>
                  <td className="p-3 text-slate-500">{a.description || "—"}</td>
                  <td className="p-3 text-right">
                    <button
                      onClick={() => {
                        if (window.confirm(`Archive "${a.name}"?`)) archiveMutation.mutate(a.id);
                      }}
                      className="p-1.5 rounded-lg hover:bg-amber-50 text-amber-700">
                      <Archive size={14} />
                    </button>
                  </td>
                </tr>
              ))}
              {rows.length === 0 && (
                <tr><td colSpan={4} className="p-6 text-center text-slate-500">
                  No analytic accounts yet. Create one to start budgeting.
                </td></tr>
              )}
            </tbody>
          </table>
        </GlassCard>
      )}
    </div>
  );
}

function AnalyticForm({ onSave, onCancel, isSaving, error }) {
  const [form, setForm] = useState({ name: "", type: "expenses", description: "" });
  const change = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  return (
    <form onSubmit={(e) => { e.preventDefault(); onSave(form); }}
      className="space-y-4 max-w-lg">
      <div className="flex items-center gap-3">
        <button type="button" onClick={onCancel} className="p-2 border rounded-lg bg-white">
          <ArrowLeft size={16} />
        </button>
        <h1 className="text-xl font-semibold">New Analytic Account</h1>
        <button type="submit" disabled={isSaving}
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

      <GlassCard className="p-5 space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1">Name</label>
          <input name="name" value={form.name} onChange={change} required
            placeholder="e.g. Project A" className="input" />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Type</label>
          {/* Backend enum is exactly income | expenses (plural) */}
          <select name="type" value={form.type} onChange={change} className="input bg-white">
            <option value="income">Income</option>
            <option value="expenses">Expenses</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Description</label>
          <input name="description" value={form.description} onChange={change} className="input" />
        </div>
      </GlassCard>
    </form>
  );
}