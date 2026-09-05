import { createContext, useContext, useState } from "react";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => localStorage.getItem("access_token"));
  const [role, setRole] = useState(() => localStorage.getItem("role"));

  const login = (accessToken, userRole) => {
    localStorage.setItem("access_token", accessToken);
    localStorage.setItem("role", userRole);
    setToken(accessToken);
    setRole(userRole);
  };

  const logout = () => {
    localStorage.removeItem("access_token");
    localStorage.removeItem("role");
    setToken(null);
    setRole(null);
  };

  const isAuthenticated = !!token;

  return (
    <AuthContext.Provider value={{ token, role, isAuthenticated, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used inside AuthProvider");
  }
  return ctx;
}
