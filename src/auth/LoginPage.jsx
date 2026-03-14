import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { apiFetchText } from "../api/client";
import { useAuth } from "./AuthContext";

function prettyErrorMessage(message) {
  if (!message) return "Login failed.";

  try {
    const obj = JSON.parse(message);
    return obj.detail || obj.Detail || obj.title || obj.Title || "Login failed.";
  } catch {
    return message;
  }
}

export function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const infoMessage = location.state?.msg;

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");

    if (!username.trim() || !password.trim()) {
      setError("Please enter username and password.");
      return;
    }

    try {
      setLoading(true);

      const token = await apiFetchText("/api/auth/login", {
        method: "POST",
        body: JSON.stringify({ username, password }),
      });

      login(token);
      navigate("/", { replace: true });
    } catch (err) {
      setError(prettyErrorMessage(err?.message));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="auth-page">
      <form className="card auth-card auth-form" onSubmit={handleSubmit}>
        <h1 className="auth-title">Sign in</h1>
        <p className="auth-subtitle">Use your account credentials.</p>

        {infoMessage && <div className="auth-info">{infoMessage}</div>}
        {error && <div className="alert-error">{error}</div>}

        <label className="auth-label">
          Username
          <input
            className="input"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            autoComplete="username"
          />
        </label>

        <label className="auth-label">
          Password
          <div className="auth-input-wrap">
            <input
              className="input auth-input"
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
            />
            <button
              type="button"
              className="auth-input-btn"
              onClick={() => setShowPassword((s) => !s)}
            >
              {showPassword ? "Hide" : "Show"}
            </button>
          </div>
        </label>

        <button className="btn btn-primary" disabled={loading}>
          {loading ? "Signing in..." : "Sign in"}
        </button>
      </form>
    </div>
  );
}
