import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  List, LayoutGrid, ArrowLeft, Plus, Pencil, Archive, Loader2, AlertCircle,
} from "lucide-react";
import axiosClient from "../api/axiosClient";
import GlassCard from "../components/GlassCard";
import SavedBanner from "../components/SavedBanner";

/* ============================================================
   API LAYER
   Verified against backend/app/routes/contact_routes.py:
   { id, name, type, email, mobile, address:{city,state,pincode}, is_archived }
   ============================================================ */

async function fetchContacts(filters = {}) {
  const params = {};
  if (filters.type) params.type = filters.type;
  const { data } = await axiosClient.get("/contacts", { params });
  return Array.isArray(data) ? data : [];
}

async function createContact(payload) {
  const { data } = await axiosClient.post("/contacts", payload);
  return data;
}

async function updateContact({ id, payload }) {
  const { data } = await axiosClient.put(`/contacts/${id}`, payload);
  return data;
}

// Soft archive — backend sets is_archived: true and returns { message }.
async function archiveContact(id) {
  await axiosClient.delete(`/contacts/${id}`);
  return id;
}

// Flat form fields -> nested API shape
function toPayload(form) {
  return {
    name: form.name.trim(),
    type: form.type,
    email: form.email?.trim() || null,
    mobile: form.mobile?.trim() || null,
    address: {
      city: form.city?.trim() || null,
      state: form.state?.trim() || null,
      pincode: form.pincode?.trim() || null,
    },
  };
}

// API record -> flat form fields
function toForm(contact) {
  return {
    name: contact.name || "",
    type: contact.type || "customer",
    email: contact.email || "",
    mobile: contact.mobile || "",
    city: contact.address?.city || "",
    state: contact.address?.state || "",
    pincode: contact.address?.pincode || "",
  };
}

// FastAPI error -> readable string
function errorText(error) {
  if (!error) return "";
  if (!error.response) return "Cannot reach the server. Is the backend running on port 8000?";
  const detail = error.response.data?.detail;
  if (typeof detail === "string") return detail;
  if (Array.isArray(detail)) {
    return detail
      .map((d) => {
        const field = Array.isArray(d.loc) ? d.loc[d.loc.length - 1] : null;
        return field ? `${field}: ${d.msg}` : d.msg;
      })
      .join(" · ");
  }
  return `${error.response.status} — request failed`;
}

/* ============================================================
   HOOKS
   ============================================================ */

const contactKeys = {
  all: ["contacts"],
  list: (filters = {}) => ["contacts", "list", filters],
};

function useContacts(filters = {}) {
  return useQuery({
    queryKey: contactKeys.list(filters),
    queryFn: () => fetchContacts(filters),
  });
}

function useCreateContact() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: createContact,
    // Prefix match: refreshes every ["contacts", ...] query at once.
    onSuccess: () => qc.invalidateQueries({ queryKey: contactKeys.all }),
  });
}

function useUpdateContact() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: updateContact,
    onSuccess: () => qc.invalidateQueries({ queryKey: contactKeys.all }),
  });
}

function useArchiveContact() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: archiveContact,
    onSuccess: () => qc.invalidateQueries({ queryKey: contactKeys.all }),
  });
}

/* ============================================================
   PAGE
   ============================================================ */

const TYPE_LABELS = { customer: "Customer", vendor: "Vendor", both: "Both" };

export default function ContactsPage() {
  const [view, setView] = useState("list");     // list | kanban | form
  const [editing, setEditing] = useState(null);  // null = creating
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [saved, setSaved] = useState(null);

  // type filter hits the server; search filters the result locally
  const contactsQuery = useContacts(typeFilter ? { type: typeFilter } : {});
  const createMutation = useCreateContact();
  const updateMutation = useUpdateContact();
  const archiveMutation = useArchiveContact();

  const rows = (contactsQuery.data || []).filter((c) =>
    c.name?.toLowerCase().includes(search.toLowerCase())
  );

  // Mutation errors persist after settling; clear them when reopening
  // the form so a past failure doesn't show on a fresh one.
  const resetMutations = () => {
    createMutation.reset();
    updateMutation.reset();
  };

  const openNew = () => { setEditing(null); resetMutations(); setView("form"); };
  const openEdit = (c) => { setEditing(c); resetMutations(); setView("form"); };

  const handleSave = (form) => {
    const payload = toPayload(form);
    const onSuccess = (record) => {
      setSaved({
        name: record.name,
        type: record.type,
        email: record.email || "—",
        mobile: record.mobile || "—",
        city: record.address?.city || "—",
        state: record.address?.state || "—",
        pincode: record.address?.pincode || "—",
      });
      setView("list");
    };

    if (editing) {
      updateMutation.mutate({ id: editing.id, payload }, { onSuccess });
    } else {
      createMutation.mutate(payload, { onSuccess });
    }
  };

  const handleArchive = (contact) => {
    if (!window.confirm(`Archive "${contact.name}"? It will be hidden from lists.`)) return;
    archiveMutation.mutate(contact.id);
  };

  if (view === "form") {
    return (
      <ContactForm
        initial={editing ? toForm(editing) : null}
        isEditing={!!editing}
        isSaving={createMutation.isPending || updateMutation.isPending}
        error={errorText(createMutation.error || updateMutation.error)}
        onCancel={() => setView("list")}
        onSave={handleSave}
      />
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <button onClick={openNew}
          className="flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-lg bg-slate-900 text-white hover:bg-slate-800">
          <Plus size={15} /> New
        </button>

        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search contacts..."
          className="flex-1 max-w-xs border rounded-lg px-3 py-1.5 text-sm bg-white/70"
        />

        <select
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value)}
          className="border rounded-lg px-3 py-1.5 text-sm bg-white"
        >
          <option value="">All types</option>
          <option value="customer">Customer</option>
          <option value="vendor">Vendor</option>
          <option value="both">Both</option>
        </select>

        <div className="ml-auto flex items-center gap-2">
          {/* background refetch — distinct from the first load */}
          {contactsQuery.isFetching && !contactsQuery.isLoading && (
            <Loader2 size={14} className="animate-spin text-slate-400" />
          )}
          <div className="flex border rounded-lg overflow-hidden">
            <button onClick={() => setView("list")}
              className={`p-2 ${view === "list" ? "bg-slate-900 text-white" : "bg-white"}`}>
              <List size={16} />
            </button>
            <button onClick={() => setView("kanban")}
              className={`p-2 ${view === "kanban" ? "bg-slate-900 text-white" : "bg-white"}`}>
              <LayoutGrid size={16} />
            </button>
          </div>
        </div>
      </div>

      <h1 className="text-xl font-semibold">Contacts</h1>

      {saved && <SavedBanner record={saved} onClose={() => setSaved(null)} />}

      {archiveMutation.isError && (
        <div className="flex items-start gap-2 text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
          <AlertCircle size={15} className="mt-0.5 shrink-0" />
          {errorText(archiveMutation.error)}
        </div>
      )}

      {contactsQuery.isLoading && (
        <div className="flex items-center justify-center gap-2 text-sm text-slate-500 py-10">
          <Loader2 size={16} className="animate-spin" /> Loading contacts...
        </div>
      )}

      {contactsQuery.isError && (
        <div className="py-4">
          <div className="flex items-start gap-2 text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
            <AlertCircle size={15} className="mt-0.5 shrink-0" />
            {errorText(contactsQuery.error)}
          </div>
          <button onClick={() => contactsQuery.refetch()}
            className="mt-2 text-sm underline text-slate-600 hover:text-slate-900">
            Try again
          </button>
        </div>
      )}

      {!contactsQuery.isLoading && !contactsQuery.isError && (
        view === "list" ? (
          <GlassCard className="overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-white/50 border-b border-white/60">
                <tr>
                  <th className="text-left p-3 font-medium">Name</th>
                  <th className="text-left p-3 font-medium">Type</th>
                  <th className="text-left p-3 font-medium">Email</th>
                  <th className="text-left p-3 font-medium">Mobile</th>
                  <th className="text-left p-3 font-medium">City</th>
                  <th className="p-3"></th>
                </tr>
              </thead>
              <tbody>
                {rows.map((c) => (
                  <tr key={c.id} className="border-b border-white/50 last:border-0 hover:bg-white/50">
                    <td className="p-3 font-medium">{c.name}</td>
                    <td className="p-3">
                      <span className="px-2 py-0.5 rounded-full text-xs bg-slate-100">
                        {TYPE_LABELS[c.type] || c.type}
                      </span>
                    </td>
                    <td className="p-3 text-slate-500">{c.email || "—"}</td>
                    <td className="p-3 text-slate-500">{c.mobile || "—"}</td>
                    <td className="p-3 text-slate-500">{c.address?.city || "—"}</td>
                    <td className="p-3">
                      <div className="flex justify-end gap-1">
                        <button onClick={() => openEdit(c)}
                          className="p-1.5 rounded-lg hover:bg-slate-100" title="Edit">
                          <Pencil size={14} />
                        </button>
                        <button onClick={() => handleArchive(c)}
                          disabled={archiveMutation.isPending}
                          className="p-1.5 rounded-lg hover:bg-amber-50 text-amber-700 disabled:opacity-40"
                          title="Archive">
                          <Archive size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {rows.length === 0 && (
                  <tr>
                    <td colSpan={6} className="p-6 text-center text-slate-500">
                      No contacts found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </GlassCard>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {rows.map((c) => (
              <GlassCard key={c.id} className="p-4">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-10 h-10 rounded-full bg-slate-900 text-white flex items-center justify-center font-semibold">
                    {c.name?.charAt(0)?.toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <div className="font-medium truncate">{c.name}</div>
                    <div className="text-xs text-slate-500">
                      {TYPE_LABELS[c.type] || c.type}
                    </div>
                  </div>
                  <button onClick={() => openEdit(c)}
                    className="ml-auto p-1.5 rounded-lg hover:bg-slate-100">
                    <Pencil size={14} />
                  </button>
                </div>
                <div className="text-sm text-slate-500 truncate">{c.email || "—"}</div>
                <div className="text-sm text-slate-500">{c.mobile || "—"}</div>
                <div className="text-sm text-slate-500">{c.address?.city || "—"}</div>
              </GlassCard>
            ))}
            {rows.length === 0 && (
              <div className="col-span-3 text-center text-slate-500 py-10">
                No contacts found.
              </div>
            )}
          </div>
        )
      )}
    </div>
  );
}

/* ============================================================
   FORM
   ============================================================ */

const EMPTY_FORM = {
  name: "", type: "customer", email: "", mobile: "",
  city: "", state: "", pincode: "",
};

function ContactForm({ initial, isEditing, isSaving, error, onSave, onCancel }) {
  const [form, setForm] = useState(initial || EMPTY_FORM);
  const change = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  return (
    <form onSubmit={(e) => { e.preventDefault(); onSave(form); }}
      className="space-y-4 max-w-2xl">
      <div className="flex items-center gap-3">
        <button type="button" onClick={onCancel} className="p-2 border rounded-lg bg-white">
          <ArrowLeft size={16} />
        </button>
        <h1 className="text-xl font-semibold">
          {isEditing ? "Edit Contact" : "New Contact"}
        </h1>
        <button type="submit" disabled={isSaving}
          className="ml-auto flex items-center gap-1.5 px-4 py-1.5 text-sm rounded-lg bg-slate-900 text-white hover:bg-slate-800 disabled:opacity-50">
          {isSaving && <Loader2 size={14} className="animate-spin" />}
          {isSaving ? "Saving..." : "Confirm"}
        </button>
      </div>

      {error && (
        <div className="flex items-start gap-2 text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
          <AlertCircle size={15} className="mt-0.5 shrink-0" />
          {error}
        </div>
      )}

      <GlassCard className="p-5 grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium mb-1">Contact Name</label>
          <input name="name" value={form.name} onChange={change} required className="input" />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Type</label>
          <select name="type" value={form.type} onChange={change} className="input bg-white">
            <option value="customer">Customer</option>
            <option value="vendor">Vendor</option>
            <option value="both">Both</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Email</label>
          <input name="email" type="email" value={form.email} onChange={change} className="input" />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Mobile</label>
          <input name="mobile" value={form.mobile} onChange={change} className="input" />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">City</label>
          <input name="city" value={form.city} onChange={change} className="input" />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">State</label>
          <input name="state" value={form.state} onChange={change} className="input" />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Pincode</label>
          <input name="pincode" value={form.pincode} onChange={change} className="input" />
        </div>
      </GlassCard>
    </form>
  );
}