import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Pencil, Archive, Loader2, AlertCircle, ArrowLeft } from "lucide-react";
import axiosClient from "../api/axiosClient";
import GlassCard from "../components/GlassCard";

const TYPES = [
  { value: "asset", label: "Asset", tone: "bg-sky-100 text-sky-700" },
  { value: "liability", label: "Liability", tone: "bg-rose-100 text-rose-700" },
  { value: "capital", label: "Capital", tone: "bg-violet-100 text-violet-700" },
  { value: "income", label: "Income", tone: "bg-emerald-100 text-emerald-700" },
  { value: "expense", label: "Expense", tone: "bg-amber-100 text-amber-700" },
];

const toneFor = (t) => TYPES.find((x) => x.value === t)?.tone || "bg-slate-100 text-slate-600";

function errorText(error) {
  if (!error) return "";
  if (!error.response) return "Cannot reach the server. Is the backend running?";
  const d = error.response.data?.detail;
  if (typeof d === "string") return d;
  if (Array.isArray(d)) return d.map((x) => x.msg).join(" · ");
  return `${error.response.status} — request failed`;
}

export default function AccountsPage() {
  const qc = useQueryClient();
  const [view, setView] = useState("list");
  const [editing, setEditing] = useState(null);
  const [typeFilter, setTypeFilter] = useState("");

  const query = useQuery({
    queryKey: ["accounts", typeFilter],
    queryFn: async () =>
      (await axiosClient.get("/accounts", {
        params: typeFilter ? { account_type: typeFilter } : {},
      })).data,
  });

  const create = useMutation({
    mutationFn: async (p) => (await axiosClient.post("/accounts", p)).data,
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["accounts"] }); setView("list"); },
  });

  const update = useMutation({
    mutationFn: async ({ id, payload }) => (await axiosClient.put(`/accounts/${id}`, payload)).data,
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["accounts"] }); setView("list"); },
  });

  const archive = useMutation({
    mutationFn: async (id) => axiosClient.delete(`/accounts/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["accounts"] }),
  });

  if (view === "form") {
    return (
      <AccountForm
        initial={editing}
        isSaving={create.isPending || update.isPending}
        error={errorText(create.error || update.error)}
        onCancel={() => { create.reset(); update.reset(); setView("list"); }}
        onSave={(payload) =>
          editing
            ? update.mutate({ id: editing.id, payload })
            : create.mutate(payload)
        }
      />
    );
  }

  const rows = query.data || [];

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <button onClick={() => { setEditing(null); create.reset(); setView("form"); }}
          className="flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-lg bg-slate-900 text-white hover:bg-slate-800">
          <Plus size={15} /> New
        </button>
        <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)}
          className="border rounded-lg px-3 py-1.5 text-sm bg-white">
          <option value="">All types</option>
          {TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
        </select>
        {query.isFetching && !query.isLoading && (
          <Loader2 size={14} className="animate-spin text-slate-400" />
        )}
      </div>

      <div>
        <h1 className="text-xl font-semibold">Chart of Accounts</h1>
        <p className="text-sm text-slate-500">
          Every ledger entry lands in one of these. Asset, liability and capital build the
          Balance Sheet; income and expense build the P&amp;L.
        </p>
      </div>

      {archive.isError && (
        <div className="flex items-start gap-2 text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
          <AlertCircle size={15} className="mt-0.5 shrink-0" />{errorText(archive.error)}
        </div>
      )}

      {query.isLoading && (
        <div className="flex items-center justify-center gap-2 text-sm text-slate-500 py-10">
          <Loader2 size={16} className="animate-spin" /> Loading accounts...
        </div>
      )}

      {query.isError && (
        <div className="py-4">
          <div className="flex items-start gap-2 text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
            <AlertCircle size={15} className="mt-0.5 shrink-0" />{errorText(query.error)}
          </div>
          <button onClick={() => query.refetch()} className="mt-2 text-sm underline text-slate-600">
            Try again
          </button>
        </div>
      )}

      {!query.isLoading && !query.isError && (
        <GlassCard className="overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-white/50 border-b border-white/60">
              <tr>
                <th className="text-left p-3 font-medium w-24">Code</th>
                <th className="text-left p-3 font-medium">Account Name</th>
                <th className="text-left p-3 font-medium">Type</th>
                <th className="p-3"></th>
              </tr>
            </thead>
            <tbody>
              {rows.map((a) => (
                <tr key={a.id} className="border-b border-white/50 last:border-0 hover:bg-white/50">
                  <td className="p-3 text-slate-400 font-mono text-xs">{a.code || "—"}</td>
                  <td className="p-3 font-medium">{a.account_name}</td>
                  <td className="p-3">
                    <span className={`px-2 py-0.5 rounded-full text-xs capitalize ${toneFor(a.account_type)}`}>
                      {a.account_type}
                    </span>
                  </td>
                  <td className="p-3">
                    <div className="flex justify-end gap-1">
                      <button onClick={() => { setEditing(a); update.reset(); setView("form"); }}
                        className="p-1.5 rounded-lg hover:bg-slate-100" title="Edit">
                        <Pencil size={14} />
                      </button>
                      <button
                        onClick={() => {
                          if (window.confirm(`Archive "${a.account_name}"?`)) archive.mutate(a.id);
                        }}
                        disabled={archive.isPending}
                        className="p-1.5 rounded-lg hover:bg-amber-50 text-amber-700 disabled:opacity-40"
                        title="Archive">
                        <Archive size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {rows.length === 0 && (
                <tr><td colSpan={4} className="p-6 text-center text-slate-500">No accounts found.</td></tr>
              )}
            </tbody>
          </table>
        </GlassCard>
      )}
    </div>
  );
}

function AccountForm({ initial, isSaving, error, onSave, onCancel }) {
  const [form, setForm] = useState({
    account_name: initial?.account_name || "",
    account_type: initial?.account_type || "asset",
    code: initial?.code || "",
  });

  const change = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  return (
    <form onSubmit={(e) => { e.preventDefault(); onSave({ ...form, code: form.code || null }); }}
      className="space-y-4 max-w-xl">
      <div className="flex items-center gap-3">
        <button type="button" onClick={onCancel} className="p-2 border rounded-lg bg-white">
          <ArrowLeft size={16} />
        </button>
        <h1 className="text-xl font-semibold">{initial ? "Edit Account" : "New Account"}</h1>
        <button type="submit" disabled={isSaving}
          className="ml-auto flex items-center gap-1.5 px-4 py-1.5 text-sm rounded-lg bg-slate-900 text-white disabled:opacity-50">
          {isSaving && <Loader2 size={14} className="animate-spin" />}
          {isSaving ? "Saving..." : "Confirm"}
        </button>
      </div>

      {error && (
        <div className="flex items-start gap-2 text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
          <AlertCircle size={15} className="mt-0.5 shrink-0" />{error}
        </div>
      )}

      <GlassCard className="p-5 space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1">Account Name</label>
          <input name="account_name" value={form.account_name} onChange={change} required className="input" />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">Type</label>
            <select name="account_type" value={form.account_type} onChange={change} className="input bg-white">
              {TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Code</label>
            <input name="code" value={form.code} onChange={change} placeholder="e.g. 1000" className="input font-mono" />
          </div>
        </div>
        <p className="text-xs text-slate-500">
          Codes are conventional: 1000s assets, 2000s liabilities, 3000s capital,
          4000s income, 5000s expenses. They control report ordering.
        </p>
      </GlassCard>
    </form>
  );
}