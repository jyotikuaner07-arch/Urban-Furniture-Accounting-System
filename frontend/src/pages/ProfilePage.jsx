import { useState } from "react";
import { Upload, Save, ShieldCheck } from "lucide-react";
import GlassCard from "../components/GlassCard";
import Avatar from "../components/Avatar";
import { useAuth } from "../features/auth/AuthContext";
import {
  updateUser, ROLE_LABELS, CONTACT_TYPE_LABELS, ROLE_ACCESS,
} from "../data/users";
import { invoices, bills, salesOrders, purchaseOrders } from "../data/store";

export default function ProfilePage() {
  const { user, role, contactType, refreshUser } = useAuth();

  const [form, setForm] = useState({
    name: user.name, email: user.email, mobile: user.mobile || "",
    city: user.city || "", state: user.state || "", avatar: user.avatar,
  });
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const change = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const pickAvatar = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 300 * 1024) { setError("Image must be under 300 KB."); return; }
    const reader = new FileReader();
    reader.onload = () => { setForm((f) => ({ ...f, avatar: reader.result })); setError(""); };
    reader.readAsDataURL(file);
  };

  const save = (e) => {
    e.preventDefault();
    const result = updateUser(user.id, form);
    if (!result.ok) { setError(result.message); setMessage(""); return; }
    refreshUser(result.user);   // keeps topbar/sidebar in sync
    setError("");
    setMessage("Profile updated successfully.");
  };

  // Role-specific figures shown on the profile
  const stats = buildStats(role, contactType, user.email);

  return (
    <div className="space-y-5 max-w-4xl">
      <h1 className="text-xl font-semibold">My Profile</h1>

      <GlassCard className="p-6">
        <div className="flex items-center gap-5">
          <Avatar name={form.name} src={form.avatar} size={80} />
          <div>
            <div className="text-lg font-semibold">{user.name}</div>
            <div className="text-sm text-slate-500">{user.email}</div>
            <div className="mt-2 flex gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-xs bg-slate-900 text-white">
                {ROLE_LABELS[role]}
              </span>
              {contactType && (
                <span className="px-2.5 py-0.5 rounded-full text-xs bg-slate-100">
                  {CONTACT_TYPE_LABELS[contactType]}
                </span>
              )}
            </div>
          </div>
          <div className="ml-auto text-right text-sm text-slate-500">
            <div>Login ID</div>
            <div className="font-mono text-slate-900">{user.loginId}</div>
            <div className="mt-2">Joined</div>
            <div className="text-slate-900">{user.joinedOn}</div>
          </div>
        </div>
      </GlassCard>

      {/* role-specific numbers */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {stats.map((s) => (
          <GlassCard key={s.label} className="p-4">
            <div className="text-xs text-slate-500">{s.label}</div>
            <div className={`text-xl font-semibold mt-1 ${s.tone || ""}`}>{s.value}</div>
          </GlassCard>
        ))}
      </div>

      <GlassCard className="p-5">
        <div className="flex items-center gap-2 mb-3">
          <ShieldCheck size={16} className="text-slate-500" />
          <h2 className="font-semibold text-sm">What this role can do</h2>
        </div>
        <ul className="space-y-1.5 text-sm text-slate-600">
          {ROLE_ACCESS[role].map((line) => (
            <li key={line} className="flex gap-2">
              <span className="text-slate-400">•</span> {line}
            </li>
          ))}
        </ul>
      </GlassCard>

      <GlassCard className="p-5">
        <h2 className="font-semibold mb-4">Edit details</h2>

        {message && (
          <div className="text-sm text-emerald-800 bg-emerald-50 border border-emerald-200 rounded-lg px-3 py-2 mb-3">
            {message}
          </div>
        )}
        {error && (
          <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2 mb-3">
            {error}
          </div>
        )}

        <form onSubmit={save} className="space-y-4">
          <div className="flex items-center gap-4">
            <Avatar name={form.name} src={form.avatar} size={52} />
            <label className="inline-flex items-center gap-1.5 text-sm border rounded-lg px-3 py-1.5 cursor-pointer hover:bg-slate-50 bg-white">
              <Upload size={14} /> Change photo
              <input type="file" accept="image/*" onChange={pickAvatar} className="hidden" />
            </label>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Name</label>
              <input name="name" value={form.name} onChange={change} required className="input" />
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
              <label className="block text-sm font-medium mb-1">State</label>
              <input name="state" value={form.state} onChange={change} className="input" />
            </div>
          </div>

          <button type="submit"
            className="flex items-center gap-1.5 px-4 py-2 text-sm rounded-lg bg-slate-900 text-white hover:bg-slate-800">
            <Save size={15} /> Save Changes
          </button>
        </form>
      </GlassCard>
    </div>
  );
}

// Picks which numbers matter for each role
function buildStats(role, contactType, email) {
  if (role === "contact" && contactType === "customer") {
    const mine = invoices.filter((i) => i.customerEmail === email);
    const orders = salesOrders.filter((s) => s.customerEmail === email);
    const due = mine.reduce((s, i) => s + (i.amount - i.paid), 0);
    return [
      { label: "My Orders", value: orders.length },
      { label: "My Invoices", value: mine.length },
      { label: "Fully Paid", value: mine.filter((i) => i.status === "Paid").length, tone: "text-emerald-700" },
      { label: "Outstanding", value: `₹${due.toLocaleString()}`, tone: "text-rose-700" },
    ];
  }

  if (role === "contact" && contactType === "vendor") {
    const mine = bills.filter((b) => b.vendorEmail === email);
    const pos = purchaseOrders.filter((p) => p.vendorEmail === email);
    const due = mine.reduce((s, b) => s + (b.amount - b.paid), 0);
    return [
      { label: "Purchase Orders", value: pos.length },
      { label: "My Bills", value: mine.length },
      { label: "Settled", value: mine.filter((b) => b.status === "Paid").length, tone: "text-emerald-700" },
      { label: "Awaiting Payment", value: `₹${due.toLocaleString()}`, tone: "text-amber-700" },
    ];
  }

  const receivable = invoices.reduce((s, i) => s + (i.amount - i.paid), 0);
  const payable = bills.reduce((s, b) => s + (b.amount - b.paid), 0);
  return [
    { label: "Invoices", value: invoices.length },
    { label: "Bills", value: bills.length },
    { label: "Receivable", value: `₹${receivable.toLocaleString()}`, tone: "text-emerald-700" },
    { label: "Payable", value: `₹${payable.toLocaleString()}`, tone: "text-rose-700" },
  ];
}