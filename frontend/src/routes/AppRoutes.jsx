import { Routes, Route, Navigate } from "react-router-dom";
import AppLayout from "../components/layout/AppLayout";
import ProtectedRoute from "./ProtectedRoute";
import ShopPage from "../pages/ShopPage";

import LoginPage from "../pages/LoginPage";
import SignupPage from "../pages/SignupPage";
import DashboardPage from "../pages/DashboardPage";
import ProfilePage from "../pages/ProfilePage";
import ContactsPage from "../pages/ContactsPage";
import ProductsPage from "../pages/ProductsPage";
import AccountsPage from "../pages/AccountsPage";
import JournalsPage from "../pages/JournalsPage";
import PurchasesPage from "../pages/PurchasesPage";
import SalesPage from "../pages/SalesPage";
import ReportsPage from "../pages/ReportsPage";
import UsersPage from "../pages/UsersPage";

const STAFF = ["admin", "accountant"];

export default function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/signup" element={<SignupPage />} />

      {/* Any logged-in role */}
      <Route element={<ProtectedRoute />}>
        <Route path="/" element={<AppLayout />}>
          <Route index element={<Navigate to="/dashboard" replace />} />
          <Route path="dashboard" element={<DashboardPage />} />
          <Route path="profile" element={<ProfilePage />} />
          <Route path="shop" element={<ShopPage />} />
        </Route>
      </Route>

      {/* Admin + Accountant */}
      <Route element={<ProtectedRoute allowedRoles={STAFF} />}>
        <Route path="/" element={<AppLayout />}>
          <Route path="contacts" element={<ContactsPage />} />
          <Route path="products" element={<ProductsPage />} />
          <Route path="accounts" element={<AccountsPage />} />
          <Route path="journals" element={<JournalsPage />} />
          <Route path="purchases" element={<PurchasesPage />} />
          <Route path="sales" element={<SalesPage />} />
          <Route path="reports" element={<ReportsPage />} />
        </Route>
      </Route>

      {/* Admin only */}
      <Route element={<ProtectedRoute allowedRoles={["admin"]} />}>
        <Route path="/" element={<AppLayout />}>
          <Route path="users" element={<UsersPage />} />
        </Route>
      </Route>

      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}