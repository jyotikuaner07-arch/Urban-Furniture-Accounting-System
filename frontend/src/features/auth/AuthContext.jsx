import { createContext, useContext, useState } from "react";

const AuthContext = createContext(null);
const USER_KEY = "uf_current_user";

// Backend role names differ from the ones the UI uses.
// invoicing_user -> accountant, everything else passes through.
const API_TO_UI_ROLE = {
  admin: "admin",
  invoicing_user: "accountant",
  contact: "contact",
};

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem(USER_KEY)) || null;
    } catch {
      return null;
    }
  });

  // Takes the raw /auth/login response:
  // { access_token, token_type, role, name, email }
  const login = (tokenResponse) => {
    // axiosClient's interceptor reads this exact key on every request.
    localStorage.setItem("access_token", tokenResponse.access_token);

    const u = {
      name: tokenResponse.name,
      email: tokenResponse.email,
      apiRole: tokenResponse.role,
      role: API_TO_UI_ROLE[tokenResponse.role] || tokenResponse.role,
      avatar: null,
    };

    localStorage.setItem(USER_KEY, JSON.stringify(u));
    setUser(u);
  };

  const logout = () => {
    localStorage.removeItem("access_token");
    localStorage.removeItem(USER_KEY);
    setUser(null);
  };

  const refreshUser = (u) => {
    localStorage.setItem(USER_KEY, JSON.stringify(u));
    setUser(u);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        name: user?.name || null,
        role: user?.role || null,
        // Backend has no customer/vendor split — contact is a single role.
        contactType: null,
        effectiveRole: user?.role || null,
        isAuthenticated: !!user,
        login,
        logout,
        refreshUser,
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