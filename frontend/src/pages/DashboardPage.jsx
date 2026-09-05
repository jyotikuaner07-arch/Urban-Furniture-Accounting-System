import { useAuth } from "../features/auth/AuthContext";
import AdminDashboard from "../features/dashboards/AdminDashboard";
import AccountantDashboard from "../features/dashboards/AccountantDashboard";
import CustomerDashboard from "../features/dashboards/CustomerDashboard";
import VendorDashboard from "../features/dashboards/VendorDashboard";

export default function DashboardPage() {
  const { effectiveRole, name } = useAuth();

  const subtitle = {
    admin: "Full system overview and administration.",
    accountant: "Your books, transactions and reports.",
    customer: "Your orders, invoices and payments.",
    vendor: "Your purchase orders, bills and payments.",
  }[effectiveRole];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">
          Welcome back{name ? `, ${name.split(" ")[0]}` : ""}
        </h1>
        <p className="text-sm text-slate-500 mt-0.5">{subtitle}</p>
      </div>

      {effectiveRole === "admin" && <AdminDashboard />}
      {effectiveRole === "accountant" && <AccountantDashboard />}
      {effectiveRole === "customer" && <CustomerDashboard />}
      {effectiveRole === "vendor" && <VendorDashboard />}
    </div>
  );
}