import { useState } from "react";
import { List, LayoutGrid, ArrowLeft } from "lucide-react";
import { contacts as contactStore, addContact } from "../data/store";
import SavedBanner from "../components/SavedBanner";

export default function ContactsPage() {
  // "list" | "kanban" | "form"  — which screen we're showing
  const [view, setView] = useState("list");
  // local copy of the data so the UI re-renders when we add a record
  const [rows, setRows] = useState([...contactStore]);
  const [search, setSearch] = useState("");
  const [saved, setSaved] = useState(null);
  const [formError, setFormError] = useState("");

  // filter rows by the search box (case-insensitive)
  const filtered = rows.filter((c) =>
    c.name.toLowerCase().includes(search.toLowerCase())
  );

  // ---------- FORM VIEW ----------
  if (view === "form") {
  return (
    <ContactForm
      error={formError}
      onCancel={() => { setFormError(""); setView("list"); }}
      onSave={(data) => {
        const result = addContact(data);
        if (!result.ok) {
          setFormError(result.message);   // duplicate blocked
          return;
        }
        setFormError("");
        setSaved(result.record);          // show what was saved
        setRows([...contactStore]);
        setView("list");
      }}
    />
  );
}

  // ---------- LIST / KANBAN VIEW ----------
  return (
    <div className="space-y-4">
      {/* toolbar */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => setView("form")}
          className="px-3 py-1.5 text-sm rounded-md bg-slate-900 text-white hover:bg-slate-700"
        >
          New
        </button>

        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search contacts..."
          className="flex-1 max-w-sm border rounded-md px-3 py-1.5 text-sm"
        />

        {/* view toggle */}
        <div className="ml-auto flex border rounded-md overflow-hidden">
          <button
            onClick={() => setView("list")}
            className={`p-2 ${view === "list" ? "bg-slate-900 text-white" : "bg-white"}`}
          >
            <List size={16} />
          </button>
          <button
            onClick={() => setView("kanban")}
            className={`p-2 ${view === "kanban" ? "bg-slate-900 text-white" : "bg-white"}`}
          >
            <LayoutGrid size={16} />
          </button>
        </div>
      </div>

      <h1 className="text-xl font-semibold">Contacts</h1>
      {saved && <SavedBanner record={saved} onClose={() => setSaved(null)} />}

      {view === "list" ? (
        <div className="bg-white border rounded-lg overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 border-b">
              <tr>
                <th className="text-left p-3 font-medium">Name</th>
                <th className="text-left p-3 font-medium">Type</th>
                <th className="text-left p-3 font-medium">Email</th>
                <th className="text-left p-3 font-medium">Phone</th>
                <th className="text-left p-3 font-medium">City</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((c) => (
                <tr key={c.id} className="border-b last:border-0 hover:bg-slate-50">
                  <td className="p-3 font-medium">{c.name}</td>
                  <td className="p-3">
                    <span className="px-2 py-0.5 rounded-full text-xs bg-slate-100 capitalize">
                      {c.type}
                    </span>
                  </td>
                  <td className="p-3 text-muted-foreground">{c.email}</td>
                  <td className="p-3 text-muted-foreground">{c.mobile}</td>
                  <td className="p-3 text-muted-foreground">{c.city}</td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={5} className="p-6 text-center text-muted-foreground">
                    No contacts found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {filtered.map((c) => (
            <div key={c.id} className="bg-white border rounded-lg p-4">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 rounded-full bg-slate-200 flex items-center justify-center font-semibold">
                  {c.name.charAt(0)}
                </div>
                <div>
                  <div className="font-medium">{c.name}</div>
                  <div className="text-xs text-muted-foreground capitalize">{c.type}</div>
                </div>
              </div>
              <div className="text-sm text-muted-foreground">{c.email}</div>
              <div className="text-sm text-muted-foreground">{c.mobile}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ---------- THE FORM ----------
function ContactForm({ onSave, onCancel, error }) {
  const [form, setForm] = useState({
    name: "", type: "customer", email: "", mobile: "",
    city: "", state: "", pincode: "",
  });

  // one handler for every field — uses the input's name attribute
  const change = (e) =>
    setForm({ ...form, [e.target.name]: e.target.value });

  const submit = (e) => {
    e.preventDefault();
    onSave(form);
  };

  return (
    <form onSubmit={submit} className="space-y-4 max-w-2xl">
      <div className="flex items-center gap-3">
        <button type="button" onClick={onCancel} className="p-2 border rounded-md">
          <ArrowLeft size={16} />
        </button>
        <h1 className="text-xl font-semibold">New Contact</h1>
        <button
          type="submit"
          className="ml-auto px-4 py-1.5 text-sm rounded-md bg-slate-900 text-white hover:bg-slate-700"
        >
          Confirm
        </button>
      </div>

      <div className="bg-white border rounded-lg p-5 grid grid-cols-2 gap-4">
        <Field label="Contact Name">
          <input name="name" value={form.name} onChange={change} required
            className="w-full border rounded-md px-3 py-1.5 text-sm" />
        </Field>

        <Field label="Type">
          <select name="type" value={form.type} onChange={change}
            className="w-full border rounded-md px-3 py-1.5 text-sm bg-white">
            <option value="customer">Customer</option>
            <option value="vendor">Vendor</option>
            <option value="both">Both</option>
          </select>
        </Field>

        <Field label="Email">
          <input name="email" type="email" value={form.email} onChange={change}
            className="w-full border rounded-md px-3 py-1.5 text-sm" />
        </Field>

        <Field label="Phone">
          <input name="mobile" value={form.mobile} onChange={change}
            className="w-full border rounded-md px-3 py-1.5 text-sm" />
        </Field>

        <Field label="City">
          <input name="city" value={form.city} onChange={change}
            className="w-full border rounded-md px-3 py-1.5 text-sm" />
        </Field>

        <Field label="State">
          <input name="state" value={form.state} onChange={change}
            className="w-full border rounded-md px-3 py-1.5 text-sm" />
        </Field>

        <Field label="Pincode">
          <input name="pincode" value={form.pincode} onChange={change}
            className="w-full border rounded-md px-3 py-1.5 text-sm" />
        </Field>

        {error && (
          <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
            {error}
          </div>
        )}
      </div>
    </form>
  );
}

// tiny wrapper so every field has the same label styling
function Field({ label, children }) {
  return (
    <div>
      <label className="block text-sm font-medium mb-1">{label}</label>
      {children}
    </div>
  );
}