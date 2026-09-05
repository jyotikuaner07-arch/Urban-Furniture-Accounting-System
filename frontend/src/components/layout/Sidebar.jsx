import { NavLink } from "react-router-dom";
import {
  Users, Package, BookOpen, FileText,
  ShoppingCart, Receipt, BarChart3
} from "lucide-react";

const navItems = [
  { to: "/contacts", label: "Contacts", icon: Users },
  { to: "/products", label: "Products", icon: Package },
  { to: "/accounts", label: "Chart of Accounts", icon: BookOpen },
  { to: "/journals", label: "Journals", icon: FileText },
  { to: "/purchases", label: "Purchases", icon: ShoppingCart },
  { to: "/sales", label: "Sales", icon: Receipt },
  { to: "/reports", label: "Reports", icon: BarChart3 },
];

export default function Sidebar() {
  return (
    <aside className="w-60 h-screen border-r bg-white flex flex-col">
      <div className="p-4 text-lg font-bold border-b">
        Urban Furniture
      </div>
      <nav className="flex-1 p-2 space-y-1">
        {navItems.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              `flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                isActive
                  ? "bg-slate-900 text-white"
                  : "text-slate-700 hover:bg-slate-100"
              }`
            }
          >
            <Icon size={18} />
            {label}
          </NavLink>
        ))}
      </nav>
    </aside>
  );
}
