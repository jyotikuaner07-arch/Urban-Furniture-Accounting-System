import { Routes, Route, Navigate } from "react-router-dom";
import AppLayout from "../components/layout/AppLayout";
import ProtectedRoute from "./ProtectedRoute";
import { useAuth } from "../features/auth/AuthContext";
import PortalPage from "../pages/PortalPage";
import LoginPage from "../pages/LoginPage";
import SignupPage from "../pages/SignupPage";
import DashboardPage from "../pages/DashboardPage";
import ProfilePage from "../pages/ProfilePage";
import ShopPage from "../pages/ShopPage";
import ContactsPage from "../pages/ContactsPage";
import ProductsPage from "../pages/ProductsPage";
import AccountsPage from "../pages/AccountsPage";
import JournalsPage from "../pages/JournalsPage";
import PurchasesPage from "../pages/PurchasesPage";
import SalesPage from "../pages/SalesPage";
import AnalyticsPage from "../pages/AnalyticsPage";
import BudgetsPage from "../pages/BudgetsPage";
import ReportsPage from "../pages/ReportsPage";
import UsersPage from "../pages/UsersPage";

const STAFF = ["admin", "accountant"];

// Contacts have no dashboard, so send them to their portal instead.
function HomeRedirect() {
  const { role } = useAuth();
  return <Navigate to={role === "contact" ? "/portal" : "/dashboard"} replace />;
}

export default function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/signup" element={<SignupPage />} />

      {/* Any authenticated role */}
      <Route element={<ProtectedRoute />}>
        <Route path="/" element={<AppLayout />}>
          <Route index element={<HomeRedirect />} />
          <Route path="profile" element={<ProfilePage />} />
        </Route>
      </Route>

      {/* Contacts only — customers and vendors */}
      <Route element={<ProtectedRoute allowedRoles={["contact"]} />}>
        <Route path="/" element={<AppLayout />}>
          <Route path="portal" element={<PortalPage />} />
          <Route path="shop" element={<ShopPage />} />
        </Route>
      </Route>

      {/* Admin + Accountant */}
      <Route element={<ProtectedRoute allowedRoles={STAFF} />}>
        <Route path="/" element={<AppLayout />}>
          <Route path="dashboard" element={<DashboardPage />} />
          <Route path="contacts" element={<ContactsPage />} />
          <Route path="products" element={<ProductsPage />} />
          <Route path="accounts" element={<AccountsPage />} />
          <Route path="journals" element={<JournalsPage />} />
          <Route path="purchases" element={<PurchasesPage />} />
          <Route path="sales" element={<SalesPage />} />
          <Route path="analytics" element={<AnalyticsPage />} />
          <Route path="budgets" element={<BudgetsPage />} />
          <Route path="reports" element={<ReportsPage />} />
        </Route>
      </Route>

      {/* Admin only */}
      <Route element={<ProtectedRoute allowedRoles={["admin"]} />}>
        <Route path="/" element={<AppLayout />}>
          <Route path="users" element={<UsersPage />} />
        </Route>
      </Route>

      <Route path="*" element={<HomeRedirect />} />
    </Routes>
  );
}