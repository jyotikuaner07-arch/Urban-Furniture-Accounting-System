import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Loader2, AlertCircle, ShieldCheck } from "lucide-react";
import axiosClient from "../api/axiosClient";
import GlassCard from "../components/GlassCard";
import Avatar from "../components/Avatar";
import { useAuth } from "../features/auth/AuthContext";

const money = (n) => `₹${Number(n || 0).toLocaleString("en-IN")}`;

const ROLE_CAPABILITIES = {
  admin: [
    "Full access to all master data and transactions",
    "Create and manage user accounts",
    "View and export all reports",
  ],
  accountant: [
    "Create master data (contacts, products, accounts)",
    "Record transactions (orders, bills, invoices, payments)",
    "View and export all reports",
    "No user management access",
  ],
  contact: [
    "View only your own documents",
    "No access to master data, other contacts, or company reports",
  ],
};

export default function ProfilePage() {
  const { user, role, name } = useAuth();

  return (
    <div className="space-y-4 max-w-4xl">
      <h1 className="text-xl font-semibold">My Profile</h1>

      <GlassCard className="p-6">
        <div className="flex items-center gap-4">
          <Avatar name={name} size={72} />
          <div>
            <div className="text-lg font-semibold">{name}</div>
            <div className="text-sm text-slate-500">{user?.email}</div>
            <span className="inline-block mt-1 px-2.5 py-0.5 rounded-full text-xs bg-slate-900 text-white capitalize">
              {role}
            </span>
          </div>
        </div>
      </GlassCard>

      {role === "contact" ? <ContactSummary /> : null}

      <GlassCard className="p-5">
        <div className="flex items-center gap-2 mb-3">
          <ShieldCheck size={17} />
          <h2 className="font-medium">What this role can do</h2>
        </div>
        <ul className="space-y-1.5 text-sm text-slate-600">
          {(ROLE_CAPABILITIES[role] || []).map((c, i) => (
            <li key={i} className="flex gap-2">
              <span className="text-slate-400">·</span> {c}
            </li>
          ))}
        </ul>
      </GlassCard>
    </div>
  );
}

/**
 * Figures for a contact user only, from /portal/summary — which is
 * scoped server-side to their own contact record. A customer sees what
 * they owe; a vendor sees what they're owed. Never both, and never the
 * company's own position.
 */
function ContactSummary() {
  const query = useQuery({
    queryKey: ["portal", "summary"],
    queryFn: async () => (await axiosClient.get("/portal/summary")).data,
  });

  if (query.isLoading) {
    return (
      <div className="flex items-center justify-center gap-2 text-sm text-slate-500 py-8">
        <Loader2 size={16} className="animate-spin" /> Loading your summary...
      </div>
    );
  }

  if (query.isError) {
    return (
      <div className="flex items-start gap-2 text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
        <AlertCircle size={15} className="mt-0.5 shrink-0" />
        Could not load your summary.
      </div>
    );
  }

  const d = query.data;
  const isCustomer = d.contact_type === "customer" || d.contact_type === "both";
  const isVendor = d.contact_type === "vendor" || d.contact_type === "both";

  return (
    <div className="grid sm:grid-cols-3 gap-4">
      {isCustomer && (
        <>
          <Stat label="Open invoices" value={d.open_invoices} />
          <Stat label="Amount you owe" value={money(d.amount_i_owe)} />
          <Stat label="Overdue" value={d.overdue_invoices}
            tone={d.overdue_invoices > 0 ? "text-rose-600" : ""} />
        </>
      )}
      {isVendor && (
        <>
          <Stat label="Open bills" value={d.open_bills} />
          <Stat label="Amount owed to you" value={money(d.amount_owed_to_me)} />
        </>
      )}
    </div>
  );
}

function Stat({ label, value, tone = "" }) {
  return (
    <GlassCard className="p-4">
      <div className="text-sm text-slate-500">{label}</div>
      <div className={`text-2xl font-semibold ${tone}`}>{value}</div>
    </GlassCard>
  );
}