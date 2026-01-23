import React, { createContext, useContext, useMemo, useState } from "react";
import { decodeJwtPayload } from "./jwt";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => localStorage.getItem("token"));

  function login(newToken) {
    setToken(newToken);
    localStorage.setItem("token", newToken);
  }

  function logout() {
    setToken(null);
    localStorage.removeItem("token");
  }

  const payload = token ? decodeJwtPayload(token) : null;

  const roleClaim =
    payload?.["http://schemas.microsoft.com/ws/2008/06/identity/claims/role"];

  const role = typeof roleClaim === "string" ? roleClaim : null;

  const mustChangePassword = payload?.mcp === "true";

  const value = useMemo(() => {
    return {
      token,
      isLoggedIn: Boolean(token),
      role,
      payload,
      mustChangePassword,
      login,
      logout,
    };
  }, [token, role, payload, mustChangePassword]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
}
