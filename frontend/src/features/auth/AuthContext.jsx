import { createContext, useContext, useState, useEffect } from "react";
import {
  seedUsers, saveCurrentUser, readCurrentUser, clearCurrentUser,
} from "../../data/users";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => readCurrentUser());

  useEffect(() => { seedUsers(); }, []);

  const login = (userObj) => {
    saveCurrentUser(userObj);
    setUser(userObj);
  };

  const logout = () => {
    clearCurrentUser();
    setUser(null);
  };

  // Keeps the session in sync after the user edits their own profile
  const refreshUser = (userObj) => {
    saveCurrentUser(userObj);
    setUser(userObj);
  };

  const role = user?.role || null;                 // admin | accountant | contact
  const contactType = user?.contactType || null;   // customer | vendor | null

  // Handy single value: "admin" | "accountant" | "customer" | "vendor"
  const effectiveRole = role === "contact" ? contactType : role;

  return (
    <AuthContext.Provider
      value={{
        user, role, contactType, effectiveRole,
        name: user?.name || null,
        isAuthenticated: !!user,
        login, logout, refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
}