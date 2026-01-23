import { Routes, Route, Link } from "react-router-dom";
import { useAuth } from "./auth/AuthContext";
import ProtectedRoute from "./auth/ProtectedRoute";
import LoginPage from "./pages/LoginPage";
import { apiFetch } from "./api/api";
import { useState } from "react";

function Dashboard() {
  const { token, roles, pid, logout } = useAuth();

  const [studentId, setStudentId] = useState("");
  const [student, setStudent] = useState(null);
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(false);

  async function searchStudent(e) {
    e?.preventDefault?.();
    setErr("");
    setStudent(null);

    const idNum = Number(studentId);
    if (!Number.isInteger(idNum) || idNum <= 0) {
      setErr("Unesi validan ID (npr 9016).");
      return;
    }

    setLoading(true);
    try {
      const data = await apiFetch(`/api/students/${idNum}`, { token });
      setStudent(data);
    } catch (ex) {
      setErr(ex.message || "Failed.");
    } finally {
      setLoading(false);
    }
  }

  async function loadMe() {
    setErr("");
    setStudent(null);

    try {
      if (!pid) throw new Error("PID is missing in token.");
      setStudentId(String(pid));
      const data = await apiFetch(`/api/students/${pid}`, { token });
      setStudent(data);
    } catch (e) {
      setErr(e.message || "Failed.");
    }
  }

  return (
    <div style={{ padding: 16 }}>
      <h2>Dashboard</h2>
      <div>Roles: {roles.join(", ") || "none"}</div>
      <div>pid: {pid ?? "null"}</div>

      <div style={{ display: "flex", gap: 8, marginTop: 12, flexWrap: "wrap" }}>
        <button onClick={loadMe}>Ucitaj mene (pid)</button>
        <button onClick={logout}>Logout</button>
      </div>

      <hr style={{ margin: "16px 0" }} />

      <form onSubmit={searchStudent} style={{ display: "flex", gap: 8, alignItems: "center" }}>
        <input
          placeholder="Student ID (npr 9016)"
          value={studentId}
          onChange={(e) => setStudentId(e.target.value)}
          inputMode="numeric"
        />
        <button disabled={loading}>
          {loading ? "Tražim..." : "Pretraži"}
        </button>
      </form>

      {err ? <div style={{ color: "crimson", marginTop: 10 }}>{err}</div> : null}

      {student ? (
        <pre style={{ marginTop: 10, background: "#f6f6f6", padding: 12, borderRadius: 8 }}>
          {JSON.stringify(student, null, 2)}
        </pre>
      ) : null}
    </div>
  );
}


function Unauthorized() {
  return (
    <div style={{ padding: 16 }}>
      <h2>Unauthorized</h2>
      <Link to="/">Back</Link>
    </div>
  );
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/unauthorized" element={<Unauthorized />} />

      <Route element={<ProtectedRoute />}>
        <Route path="/" element={<Dashboard />} />
      </Route>
    </Routes>
  );
}
