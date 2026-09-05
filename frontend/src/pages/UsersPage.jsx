import { useState } from "react";
import { Plus, Pencil, Trash2, X } from "lucide-react";
import GlassCard from "../components/GlassCard";
import Avatar from "../components/Avatar";
import SavedBanner from "../components/SavedBanner";
import {
  getUsers, registerUser, updateUser, deleteUser,
  ROLE_LABELS, CONTACT_TYPE_LABELS,
} from "../data/users";

const EMPTY = {
  name: "", loginId: "", email: "", mobile: "", city: "", state: "",
  role: "accountant", contactType: "customer", password: "", avatar: null,
};

export default function UsersPage() {
  const [rows, setRows] = useState(getUsers());
  const [editing, setEditing] = useState(null); // null | "new" | user object
  const [form, setForm] = useState(EMPTY);
  const [error, setError] = useState("");
  const [saved, setSaved] = useState(null);

  const openNew = () => { setForm(EMPTY); setEditing("new"); setError(""); };
  const openEdit = (u) => { setForm({ ...u }); setEditing(u); setError(""); };
  const close = () => { setEditing(null); setError(""); };

  const change = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const submit = (e) => {
    e.preventDefault();

    const result =
      editing === "new" ? registerUser(form) : updateUser(editing.id, form);

    if (!result.ok) { setError(result.message); return; }

    setRows(getUsers());
    // eslint-disable-next-line no-unused-vars
    const { password, avatar, ...display } = result.user;
    setSaved(display);
    close();
  };

  const remove = (u) => {
    if (!window.confirm(`Delete "${u.name}"? This cannot be undone.`)) return;
    const result = deleteUser(u.id);
    if (!result.ok) { alert(result.message); return; }
    setRows(getUsers());
  };

  return (
    <div className="space-y-4 max-w-5xl">
      <div className="flex items-center gap-3">
        <button onClick={openNew}
          className="flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-lg bg-slate-900 text-white hover:bg-slate-800">
          <Plus size={15} /> New User
        </button>
      </div>

      <div>
        <h1 className="text-xl font-semibold">User Management</h1>
        <p className="text-sm text-slate-500">Create, edit and remove system accounts.</p>
      </div>

      {saved && <SavedBanner record={saved} onClose={() => setSaved(null)} />}

      <GlassCard className="overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-white/50 border-b border-white/60">
            <tr>
              <th className="text-left p-3 font-medium">User</th>
              <th className="text-left p-3 font-medium">Login ID</th>
              <th className="text-left p-3 font-medium">Role</th>
              <th className="text-left p-3 font-medium">Joined</th>
              <th className="p-3"></th>
            </tr>
          </thead>
          <tbody>
            {rows.map((u) => (
              <tr key={u.id} className="border-b border-white/50 last:border-0 hover:bg-white/50">
                <td className="p-3">
                  <div className="flex items-center gap-2.5">
                    <Avatar name={u.name} src={u.avatar} size={32} />
                    <div>
                      <div className="font-medium">{u.name}</div>
                      <div className="text-xs text-slate-500">{u.email}</div>
                    </div>
                  </div>
                </td>
                <td className="p-3 font-mono text-xs">{u.loginId}</td>
                <td className="p-3">
                  <span className="px-2 py-0.5 rounded-full text-xs bg-slate-100">
                    {ROLE_LABELS[u.role]}
                    {u.contactType && ` · ${CONTACT_TYPE_LABELS[u.contactType]}`}
                  </span>
                </td>
                <td className="p-3 text-slate-500">{u.joinedOn}</td>
                <td className="p-3">
                  <div className="flex justify-end gap-1">
                    <button onClick={() => openEdit(u)}
                      className="p-1.5 rounded-lg hover:bg-slate-100" title="Edit">
                      <Pencil size={15} />
                    </button>
                    <button onClick={() => remove(u)}
                      className="p-1.5 rounded-lg hover:bg-red-50 text-red-600" title="Delete">
                      <Trash2 size={15} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </GlassCard>

      {/* modal form */}
      {editing && (
        <div className="fixed inset-0 z-30 flex items-center justify-center bg-slate-900/30 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between px-5 py-4 border-b">
              <h2 className="font-semibold">
                {editing === "new" ? "New User" : `Edit ${editing.name}`}
              </h2>
              <button onClick={close} className="p-1 hover:bg-slate-100 rounded-lg">
                <X size={16} />
              </button>
            </div>

            <form onSubmit={submit} className="p-5 space-y-4">
              {error && (
                <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
                  {error}
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="block text-sm font-medium mb-1">Name</label>
                  <input name="name" value={form.name} onChange={change} required className="input" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Login ID</label>
                  <input name="loginId" value={form.loginId} onChange={change} required className="input" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Email</label>
                  <input name="email" type="email" value={form.email} onChange={change} required className="input" />
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
                  <label className="block text-sm font-medium mb-1">Role</label>
                  <select name="role" value={form.role} onChange={change} className="input bg-white">
                    <option value="admin">Admin</option>
                    <option value="accountant">Accountant</option>
                    <option value="contact">Contact</option>
                  </select>
                </div>

                {form.role === "contact" && (
                  <div>
                    <label className="block text-sm font-medium mb-1">Contact Type</label>
                    <select name="contactType" value={form.contactType} onChange={change} className="input bg-white">
                      <option value="customer">Customer</option>
                      <option value="vendor">Vendor</option>
                    </select>
                  </div>
                )}

                <div className="col-span-2">
                  <label className="block text-sm font-medium mb-1">
                    Password {editing !== "new" && <span className="text-slate-400">(leave to keep current)</span>}
                  </label>
                  <input name="password" type="text" value={form.password}
                    onChange={change} required={editing === "new"} className="input" />
                </div>
              </div>

              <div className="flex gap-2 pt-2">
                <button type="submit"
                  className="px-4 py-2 text-sm rounded-lg bg-slate-900 text-white hover:bg-slate-800">
                  {editing === "new" ? "Create User" : "Save Changes"}
                </button>
                <button type="button" onClick={close}
                  className="px-4 py-2 text-sm rounded-lg border hover:bg-slate-50">
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}