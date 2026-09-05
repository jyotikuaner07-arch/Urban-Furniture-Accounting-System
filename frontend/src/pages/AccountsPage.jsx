import { useState } from "react";
import { ArrowLeft } from "lucide-react";
import { accounts as accountStore, addAccount } from "../data/store";
import SavedBanner from "../components/SavedBanner";

// Grouped exactly as the mockup specifies — the group decides which
// report the account appears on later.
const ACCOUNT_TYPES = [
  { group: "Balance Sheet", values: ["Asset", "Liability", "Bank", "Capital", "Cash"] },
  { group: "Profit & Loss", values: ["Income", "Expense", "Other Expense"] },
];

export default function AccountsPage() {
  const [view, setView] = useState("list");
  const [rows, setRows] = useState([...accountStore]);
  const [saved, setSaved] = useState(null);
  const [formError, setFormError] = useState("");

  if (view === "form") {
    return (
      <AccountForm
        error={formError}
        onCancel={() => {
          setFormError("");
          setView("list");
        }}
        onSave={(data) => {
          const result = addAccount(data);

          if (!result.ok) {
            setFormError(result.message);
            return;
          }

          setFormError("");
          setSaved(result.record);
          setRows([...accountStore]);
          setView("list");
        }}
      />
    );
  }

  return (
    <div className="space-y-4 max-w-3xl">
      <div className="flex items-center gap-3">
        <button
          onClick={() => setView("form")}
          className="px-3 py-1.5 text-sm rounded-lg bg-slate-900 text-white hover:bg-slate-800"
        >
          New
        </button>
      </div>

      <h1 className="text-xl font-semibold">Chart of Accounts</h1>

      {saved && <SavedBanner record={saved} onClose={() => setSaved(null)} />}

      <div className="bg-white/60 backdrop-blur-xl border border-white/60 rounded-2xl overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-white/50 border-b border-white/60">
            <tr>
              <th className="text-left p-3 font-medium">Account Name</th>
              <th className="text-left p-3 font-medium">Type</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((a) => (
              <tr key={a.id} className="border-b border-white/50 last:border-0 hover:bg-white/50">
                <td className="p-3 font-medium">{a.name}</td>
                <td className="p-3">
                  <span className="px-2 py-0.5 rounded-full text-xs bg-slate-100">{a.type}</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function AccountForm({ onSave, onCancel, error }) {
  const [form, setForm] = useState({ name: "", type: "Asset" });

  const change = (e) => setForm({ ...form, [e.target.name]: e.target.value });
  const submit = (e) => {
    e.preventDefault();
    onSave(form);
  };

  return (
    <form onSubmit={submit} className="space-y-4 max-w-lg">
      <div className="flex items-center gap-3">
        <button type="button" onClick={onCancel} className="p-2 border rounded-lg bg-white">
          <ArrowLeft size={16} />
        </button>
        <h1 className="text-xl font-semibold">New Account</h1>
        <button
          type="submit"
          className="ml-auto px-4 py-1.5 text-sm rounded-lg bg-slate-900 text-white hover:bg-slate-800"
        >
          Confirm
        </button>
      </div>

      {error && (
        <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
          {error}
        </div>
      )}

      <div className="bg-white/60 backdrop-blur-xl border border-white/60 rounded-2xl p-5 space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1">Account Name</label>
          <input name="name" value={form.name} onChange={change} required className="input" />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Type</label>
          <select name="type" value={form.type} onChange={change} className="input bg-white">
            {ACCOUNT_TYPES.map((g) => (
              <optgroup key={g.group} label={g.group}>
                {g.values.map((v) => (
                  <option key={v} value={v}>
                    {v}
                  </option>
                ))}
              </optgroup>
            ))}
          </select>
        </div>
      </div>
    </form>
  );
}