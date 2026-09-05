import { useState } from "react";
import { ArrowLeft, Plus, Trash2 } from "lucide-react";
import GlassCard from "../components/GlassCard";
import SavedBanner from "../components/SavedBanner";
import {
  journals as journalStore, journalEntries as entryStore, accounts, contacts,
  addJournal, addJournalEntry, entryTotal,
} from "../data/store";

export default function JournalsPage() {
  const [tab, setTab] = useState("journals");   // journals | entries
  const [view, setView] = useState("list");     // list | journalForm | entryForm
  const [journalRows, setJournalRows] = useState([...journalStore]);
  const [entryRows, setEntryRows] = useState([...entryStore]);
  const [saved, setSaved] = useState(null);
  const [error, setError] = useState("");

  if (view === "journalForm") {
    return (
      <JournalForm error={error}
        onCancel={() => { setError(""); setView("list"); }}
        onSave={(data) => {
          const r = addJournal(data);
          if (!r.ok) { setError(r.message); return; }
          setError(""); setSaved(r.record);
          setJournalRows([...journalStore]); setView("list");
        }} />
    );
  }

  if (view === "entryForm") {
    return (
      <EntryForm error={error}
        onCancel={() => { setError(""); setView("list"); }}
        onSave={(data) => {
          const r = addJournalEntry(data);
          if (!r.ok) { setError(r.message); return; }   // blocks unbalanced entries
          setError("");
          setSaved({ number: r.record.number, journal: r.record.journal,
                     date: r.record.date, partner: r.record.partner,
                     total: entryTotal(r.record), status: r.record.status });
          setEntryRows([...entryStore]); setView("list");
        }} />
    );
  }

  return (
    <div className="space-y-4 max-w-5xl">
      <div className="flex items-center gap-3">
        <button
          onClick={() => { setError(""); setView(tab === "journals" ? "journalForm" : "entryForm"); }}
          className="flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-lg bg-slate-900 text-white hover:bg-slate-800">
          <Plus size={15} /> New
        </button>

        <div className="ml-auto flex border rounded-lg overflow-hidden text-sm">
          <button onClick={() => setTab("journals")}
            className={`px-3 py-1.5 ${tab === "journals" ? "bg-slate-900 text-white" : "bg-white"}`}>
            Journals
          </button>
          <button onClick={() => setTab("entries")}
            className={`px-3 py-1.5 ${tab === "entries" ? "bg-slate-900 text-white" : "bg-white"}`}>
            Journal Entries
          </button>
        </div>
      </div>

      <h1 className="text-xl font-semibold">
        {tab === "journals" ? "Journals" : "Journal Entries"}
      </h1>

      {saved && <SavedBanner record={saved} onClose={() => setSaved(null)} />}

      {tab === "journals" ? (
        <GlassCard className="overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-white/50 border-b border-white/60">
              <tr>
                <th className="text-left p-3 font-medium">Journal Name</th>
                <th className="text-left p-3 font-medium">Type</th>
                <th className="text-left p-3 font-medium">Default Account</th>
              </tr>
            </thead>
            <tbody>
              {journalRows.map((j) => (
                <tr key={j.id} className="border-b border-white/50 last:border-0 hover:bg-white/50">
                  <td className="p-3 font-medium">{j.name}</td>
                  <td className="p-3">{j.type}</td>
                  <td className="p-3 text-slate-500">{j.defaultAccount}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </GlassCard>
      ) : (
        <GlassCard className="overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-white/50 border-b border-white/60">
              <tr>
                <th className="text-left p-3 font-medium">Date</th>
                <th className="text-left p-3 font-medium">Number</th>
                <th className="text-left p-3 font-medium">Partner</th>
                <th className="text-left p-3 font-medium">Journal</th>
                <th className="text-right p-3 font-medium">Total</th>
                <th className="text-left p-3 font-medium">Status</th>
              </tr>
            </thead>
            <tbody>
              {entryRows.map((e) => (
                <tr key={e.id} className="border-b border-white/50 last:border-0 hover:bg-white/50">
                  <td className="p-3 text-slate-500">{e.date}</td>
                  <td className="p-3 font-medium">{e.number}</td>
                  <td className="p-3">{e.partner}</td>
                  <td className="p-3 text-slate-500">{e.journal}</td>
                  <td className="p-3 text-right">₹{entryTotal(e).toLocaleString()}</td>
                  <td className="p-3">
                    <span className="px-2 py-0.5 rounded-full text-xs bg-emerald-100 text-emerald-700">
                      {e.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </GlassCard>
      )}
    </div>
  );
}

function JournalForm({ onSave, onCancel, error }) {
  const [form, setForm] = useState({
    name: "", type: "Sales", defaultAccount: accounts[0].name,
  });
  const change = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  return (
    <form onSubmit={(e) => { e.preventDefault(); onSave(form); }} className="space-y-4 max-w-lg">
      <Header title="New Journal" onCancel={onCancel} />
      {error && <ErrorBox text={error} />}

      <GlassCard className="p-5 space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1">Journal Name</label>
          <input name="name" value={form.name} onChange={change} required className="input" />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Journal Type</label>
          <select name="type" value={form.type} onChange={change} className="input bg-white">
            <option>Sales</option><option>Purchase</option>
            <option>Bank</option><option>Cash</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Default Account</label>
          <select name="defaultAccount" value={form.defaultAccount} onChange={change} className="input bg-white">
            {accounts.map((a) => <option key={a.id} value={a.name}>{a.name}</option>)}
          </select>
        </div>
      </GlassCard>
    </form>
  );
}

function EntryForm({ onSave, onCancel, error }) {
  const [head, setHead] = useState({
    date: new Date().toISOString().slice(0, 10),
    number: "", journal: "Sales", partner: contacts[0].name,
  });
  const [items, setItems] = useState([
    { account: accounts[0].name, debit: "", credit: "" },
    { account: accounts[1].name, debit: "", credit: "" },
  ]);

  const changeHead = (e) => setHead({ ...head, [e.target.name]: e.target.value });

  const changeItem = (idx, field, value) => {
    const next = [...items];
    next[idx] = { ...next[idx], [field]: value };
    setItems(next);
  };

  const addLine = () =>
    setItems([...items, { account: accounts[0].name, debit: "", credit: "" }]);
  const removeLine = (idx) =>
    setItems(items.filter((_, i) => i !== idx));

  // Live totals so the user sees the imbalance before submitting
  const totalDebit = items.reduce((s, i) => s + Number(i.debit || 0), 0);
  const totalCredit = items.reduce((s, i) => s + Number(i.credit || 0), 0);
  const balanced = totalDebit === totalCredit && totalDebit > 0;

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        onSave({
          ...head,
          items: items.map((i) => ({
            account: i.account,
            debit: Number(i.debit || 0),
            credit: Number(i.credit || 0),
          })),
        });
      }}
      className="space-y-4 max-w-3xl"
    >
      <Header title="New Journal Entry" onCancel={onCancel} submitLabel="Post" />
      {error && <ErrorBox text={error} />}

      <GlassCard className="p-5 space-y-5">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">Accounting Date</label>
            <input name="date" type="date" value={head.date} onChange={changeHead} required className="input" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Reference Number</label>
            <input name="number" value={head.number} onChange={changeHead} required
              placeholder="e.g. INV/2026/0004" className="input" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Journal</label>
            <select name="journal" value={head.journal} onChange={changeHead} className="input bg-white">
              {journalStore.map((j) => <option key={j.id} value={j.name}>{j.name}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Partner</label>
            <select name="partner" value={head.partner} onChange={changeHead} className="input bg-white">
              {contacts.map((c) => <option key={c.id} value={c.name}>{c.name}</option>)}
            </select>
          </div>
        </div>

        {/* line items */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="text-sm font-medium">Journal Items</label>
            <button type="button" onClick={addLine}
              className="text-xs flex items-center gap-1 border rounded-lg px-2 py-1 bg-white hover:bg-slate-50">
              <Plus size={12} /> Add line
            </button>
          </div>

          <table className="w-full text-sm border rounded-lg overflow-hidden bg-white">
            <thead className="bg-slate-50 border-b">
              <tr>
                <th className="text-left p-2 font-medium">Account</th>
                <th className="text-right p-2 font-medium w-32">Debit</th>
                <th className="text-right p-2 font-medium w-32">Credit</th>
                <th className="w-10"></th>
              </tr>
            </thead>
            <tbody>
              {items.map((it, idx) => (
                <tr key={idx} className="border-b last:border-0">
                  <td className="p-2">
                    <select value={it.account}
                      onChange={(e) => changeItem(idx, "account", e.target.value)}
                      className="w-full border rounded-md px-2 py-1 text-sm bg-white">
                      {accounts.map((a) => <option key={a.id} value={a.name}>{a.name}</option>)}
                    </select>
                  </td>
                  <td className="p-2">
                    <input type="number" min="0" value={it.debit}
                      onChange={(e) => changeItem(idx, "debit", e.target.value)}
                      className="w-full border rounded-md px-2 py-1 text-sm text-right" />
                  </td>
                  <td className="p-2">
                    <input type="number" min="0" value={it.credit}
                      onChange={(e) => changeItem(idx, "credit", e.target.value)}
                      className="w-full border rounded-md px-2 py-1 text-sm text-right" />
                  </td>
                  <td className="p-2 text-center">
                    {items.length > 2 && (
                      <button type="button" onClick={() => removeLine(idx)}
                        className="text-red-600 hover:bg-red-50 rounded p-1">
                        <Trash2 size={14} />
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot className="bg-slate-50 border-t font-medium">
              <tr>
                <td className="p-2 text-right">Totals</td>
                <td className="p-2 text-right">₹{totalDebit.toLocaleString()}</td>
                <td className="p-2 text-right">₹{totalCredit.toLocaleString()}</td>
                <td></td>
              </tr>
            </tfoot>
          </table>

          <div className={`mt-2 text-sm rounded-lg px-3 py-2 border ${
            balanced ? "bg-emerald-50 border-emerald-200 text-emerald-800"
                     : "bg-amber-50 border-amber-200 text-amber-800"}`}>
            {balanced
              ? "Entry is balanced — ready to post."
              : `Not balanced. Difference: ₹${Math.abs(totalDebit - totalCredit).toLocaleString()}`}
          </div>
        </div>
      </GlassCard>
    </form>
  );
}

function Header({ title, onCancel, submitLabel = "Confirm" }) {
  return (
    <div className="flex items-center gap-3">
      <button type="button" onClick={onCancel} className="p-2 border rounded-lg bg-white">
        <ArrowLeft size={16} />
      </button>
      <h1 className="text-xl font-semibold">{title}</h1>
      <button type="submit"
        className="ml-auto px-4 py-1.5 text-sm rounded-lg bg-slate-900 text-white hover:bg-slate-800">
        {submitLabel}
      </button>
    </div>
  );
}

function ErrorBox({ text }) {
  return (
    <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
      {text}
    </div>
  );
}