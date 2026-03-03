import React, {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { decodeJwtPayload } from "./jwt";

const AuthContext = createContext(null);

const TOKEN_KEY = "token";

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => {
    return localStorage.getItem(TOKEN_KEY);
  });

  useEffect(() => {
    function onStorage(e) {
      if (e.key !== TOKEN_KEY) return;
      setToken(e.newValue);
    }

    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  function login(newToken) {
    localStorage.setItem(TOKEN_KEY, newToken);
    setToken(newToken);
  }

  function logout() {
    localStorage.removeItem(TOKEN_KEY);
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

  return (
    <AuthContext.Provider value={value}>
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