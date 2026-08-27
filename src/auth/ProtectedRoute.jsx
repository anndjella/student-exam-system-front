import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "./AuthContext";

export function ProtectedRoute({ children, allowWhenMustChangePassword = false }) {
  const { isLoggedIn, mustChangePassword } = useAuth();
  const location=useLocation();

  if (!isLoggedIn) {
    return <Navigate to="/login" replace />;
  }
   if (mustChangePassword && !allowWhenMustChangePassword) {
    return <Navigate to="/change-password" replace state={{ from: location }} />;
  }

  return children;
}