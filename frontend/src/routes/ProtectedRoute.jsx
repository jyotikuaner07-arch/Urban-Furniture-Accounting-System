import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../features/auth/AuthContext";

export default function ProtectedRoute({ allowedRoles }) {
  const { isAuthenticated, role } = useAuth();

  if (!isAuthenticated) return <Navigate to="/login" replace />;

  if (allowedRoles && !allowedRoles.includes(role)) {
    // Send them somewhere they're actually allowed, rather than
    // bouncing to /dashboard which a contact can't see either.
    return <Navigate to={role === "contact" ? "/portal" : "/dashboard"} replace />;
  }

  return <Outlet />;
}