// auth/RequireRole.jsx
import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "./AuthContext";

function homeByRole(role) {
  if (role === "Student") return "/student/home";
  if (role === "Teacher") return "/teacher/home";
  if (role === "StudentService") return "/ss/home";
  return "/login";
}

export function RequireRole({ allowed }) {
  const { role, token } = useAuth();
  const loc = useLocation();

  if (!token) return <Navigate to="/login" replace state={{ from: loc }} />;

  if (!allowed.includes(role)) {
    return <Navigate to={homeByRole(role)} replace />;
  }

  return <Outlet />;
}
