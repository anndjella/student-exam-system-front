import React, { createContext, useContext, useMemo, useState } from "react";
import { decodeJwtPayload } from "./jwt";

const AuthContext = createContext(null);
const TOKEN_KEY = "token";

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => {
    return sessionStorage.getItem(TOKEN_KEY);
  });

  function login(newToken) {
    sessionStorage.setItem(TOKEN_KEY, newToken);
    setToken(newToken);
  }

  function logout() {
    sessionStorage.removeItem(TOKEN_KEY);
    setToken(null);
  }

  const payload = token ? decodeJwtPayload(token) : null;

  const roleClaim =
    payload?.["http://schemas.microsoft.com/ws/2008/06/identity/claims/role"];

  const role = typeof roleClaim === "string" ? roleClaim : null;
  const mustChangePassword = payload?.mcp === "true";

  const value = useMemo(
    () => ({
      token,
      isLoggedIn: Boolean(token),
      role,
      payload,
      mustChangePassword,
      login,
      logout,
    }),
    [token, role, payload, mustChangePassword]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
}