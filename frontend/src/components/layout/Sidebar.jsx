import { NavLink } from "react-router-dom";
import {
  LayoutDashboard, Users, Package, BookOpen, FileText, ShoppingCart,
  Receipt, BarChart3, UserCog, User, Target, Tag, Store, Wallet,
} from "lucide-react";
import Logo from "../Logo";
import { useAuth } from "../../features/auth/AuthContext";

const navItems = [
  // --- Contact portal ---
  { to: "/portal",    label: "My Account",        icon: Wallet,          roles: ["contact"] },
  { to: "/shop",      label: "Shop",              icon: Store,           roles: ["contact"] },

  // --- Staff ---
  { to: "/dashboard", label: "Dashboard",         icon: LayoutDashboard, roles: ["admin","accountant"] },
  { to: "/contacts",  label: "Contacts",          icon: Users,           roles: ["admin","accountant"] },
  { to: "/products",  label: "Products",          icon: Package,         roles: ["admin","accountant"] },
  { to: "/accounts",  label: "Chart of Accounts", icon: BookOpen,        roles: ["admin","accountant"] },
  { to: "/journals",  label: "Journals",          icon: FileText,        roles: ["admin","accountant"] },
  { to: "/purchases", label: "Purchases",         icon: ShoppingCart,    roles: ["admin","accountant"] },
  { to: "/sales",     label: "Sales",             icon: Receipt,         roles: ["admin","accountant"] },
  { to: "/analytics", label: "Analytic Accounts", icon: Tag,             roles: ["admin","accountant"] },
  { to: "/budgets",   label: "Budgets",           icon: Target,          roles: ["admin","accountant"] },
  { to: "/reports",   label: "Reports",           icon: BarChart3,       roles: ["admin","accountant"] },
  { to: "/users",     label: "User Management",   icon: UserCog,         roles: ["admin"] },

  // --- Everyone ---
  { to: "/profile",   label: "My Profile",        icon: User,            roles: ["admin","accountant","contact"] },
];

export default function Sidebar() {
  const { role, name } = useAuth();
  const visible = navItems.filter((i) => i.roles.includes(role));

  return (
    <aside className="w-60 h-screen border-r border-white/40 bg-white/60 backdrop-blur-xl flex flex-col">
      <div className="p-4 border-b border-white/40">
        <Logo size={32} />
      </div>

      <nav className="flex-1 p-2 space-y-1 overflow-y-auto">
        {visible.map(({ to, label, icon: Icon }) => (
          <NavLink key={to} to={to}
            className={({ isActive }) =>
              `flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                isActive ? "bg-slate-900 text-white shadow-sm"
                         : "text-slate-600 hover:bg-white/70 hover:text-slate-900"}`}>
            <Icon size={17} />
            {label}
          </NavLink>
        ))}
      </nav>

      <div className="p-3 border-t border-white/40">
        <div className="text-[11px] text-slate-500 uppercase tracking-wide">Signed in as</div>
        <div className="text-sm font-medium">{name}</div>
        <div className="text-xs text-slate-500 capitalize">{role}</div>
      </div>
    </aside>
  );
}