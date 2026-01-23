import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "./AuthContext";
import { apiFetchJson } from "../api/client";
import "./auth.css";

function validateNewPassword(pw) {
  if (!pw || pw.length < 8) return "Password must be at least 8 characters long.";
  if (!/[0-9]/.test(pw)) return "Password must contain at least one number.";
  return null;
}

export function ChangePasswordPage() {
  const { token, logout } = useAuth();
  const navigate = useNavigate();

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");

  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");

    const v = validateNewPassword(newPassword);
    if (v) {
      setError(v);
      return;
    }

    setSaving(true);
    try {
      await apiFetchJson(
        "/api/auth/change-password",
        {
          method: "POST",
          body: JSON.stringify({ currentPassword, newPassword }),
        },
        token
      );

      logout();
      navigate("/login", {
        replace: true,
        state: { msg: "Password changed successfully. Please log in again." },
      });
    } catch (err) {
      setError(err?.message || "Failed to change password.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="auth-page">
      <form className="card auth-card auth-form" onSubmit={handleSubmit}>
        <h1 className="auth-title">Change password</h1>
        <p className="auth-subtitle">
          You must change your password before accessing the application.
        </p>

        {error ? <div className="alert-error">{error}</div> : null}

        <label className="auth-label">
          Current password
          <div className="auth-input-wrap">
            <input
              className="input auth-input"
              type={showCurrent ? "text" : "password"}
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              autoComplete="current-password"
            />
            <button
              type="button"
              className="auth-input-btn"
              onClick={() => setShowCurrent((s) => !s)}
              aria-label={showCurrent ? "Hide current password" : "Show current password"}
            >
              {showCurrent ? "Hide" : "Show"}
            </button>
          </div>
        </label>

        <label className="auth-label">
          New password
          <div className="auth-input-wrap">
            <input
              className="input auth-input"
              type={showNew ? "text" : "password"}
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              autoComplete="new-password"
            />
            <button
              type="button"
              className="auth-input-btn"
              onClick={() => setShowNew((s) => !s)}
              aria-label={showNew ? "Hide new password" : "Show new password"}
            >
              {showNew ? "Hide" : "Show"}
            </button>
          </div>
          <div className="auth-hint">Minimum 8 characters, at least one number.</div>
        </label>

        <button className="btn btn-primary auth-submit" disabled={saving}>
          {saving ? "Saving..." : "Change password"}
        </button>

        <div className="auth-footer">
          After changing your password, you will be signed out.
        </div>
      </form>
    </div>
  );
}
