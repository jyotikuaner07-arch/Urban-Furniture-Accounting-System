import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { LogOut, ChevronDown, User } from "lucide-react";
import { useAuth } from "../../features/auth/AuthContext";
import Avatar from "../Avatar";
import { ROLE_LABELS, CONTACT_TYPE_LABELS } from "../../data/users";

export default function Topbar() {
  const { user, role, contactType, logout } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);

  const displayName = user?.name || "Guest";
  const roleText =
    ROLE_LABELS[role] + (contactType ? ` · ${CONTACT_TYPE_LABELS[contactType]}` : "");

  return (
    // z-30 lifts the whole header above the scrolling <main> below it.
    // Without this, page cards paint over the dropdown.
    <header className="relative z-30 h-14 border-b border-white/40 bg-white/60 backdrop-blur-xl flex items-center justify-end px-6">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-3 hover:bg-white/70 rounded-lg px-2 py-1.5 transition-colors"
      >
        <Avatar name={displayName} src={user?.avatar} size={32} />
        <div className="text-left leading-tight">
          <div className="text-sm font-medium">{displayName}</div>
          <div className="text-xs text-slate-500">{roleText}</div>
        </div>
        <ChevronDown size={16} className="text-slate-400" />
      </button>

      {open && (
        <>
          {/* full-screen catcher so clicking anywhere closes the menu */}
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />

          <div className="absolute right-6 top-14 w-56 bg-white border rounded-xl shadow-lg py-1 z-50">
            <div className="px-3 py-3 border-b flex items-center gap-2.5">
              <Avatar name={displayName} src={user?.avatar} size={36} />
              <div className="min-w-0">
                <div className="text-sm font-medium truncate">{displayName}</div>
                <div className="text-xs text-slate-500 truncate">{user?.email}</div>
              </div>
            </div>

            <button
              onClick={() => { setOpen(false); navigate("/profile"); }}
              className="w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-slate-50"
            >
              <User size={15} /> My Profile
            </button>

            <button
              onClick={() => { logout(); navigate("/login"); }}
              className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-600 hover:bg-red-50"
            >
              <LogOut size={15} /> Log out
            </button>
          </div>
        </>
      )}
    </header>
  );
}