import { Navigate } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";

export function HomeRedirect() {
const { mustChangePassword, role } = useAuth();

  if (mustChangePassword) return <Navigate to="/change-password" replace />;

  if (role === "Student") return <Navigate to="/student" replace />;
  if (role === "Teacher") return <Navigate to="/teacher" replace />;
  if (role === "StudentService") return <Navigate to="/ss" replace />;

   return <Navigate to="/login" replace />;
}
