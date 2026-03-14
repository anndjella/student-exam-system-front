import { useEffect, useState } from "react";
import { useStudentsApi } from "../../shared/hooks/useStudentsApi";

export function AddStudentModal({ open, onClose, onCreated }) {
  const { create, actionLoading, error: actionError, clearError } = useStudentsApi();

  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState("");
  const [form, setForm] = useState({
    jmbg: "",
    firstName: "",
    lastName: "",
    indexNumber: "",
  });

  useEffect(() => {
    if (!open) return;

    clearError();
    setFormError("");
    setSaving(false);
    setForm({
      jmbg: "",
      firstName: "",
      lastName: "",
      indexNumber: "",
    });
  }, [open]);

  if (!open) return null;

  function close() {
    if (saving || actionLoading) return;
    onClose?.();
  }

  async function onSubmit(e) {
    e.preventDefault();

    setSaving(true);
    setFormError("");
    clearError();

    try {
      await create({
        jmbg: form.jmbg,
        firstName: form.firstName,
        lastName: form.lastName,
        indexNumber: form.indexNumber,
      });

      await onCreated?.();
      onClose?.();
    } catch (err) {
      setFormError(err?.message ?? "Create failed.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) close();
      }}
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.35)",
        display: "grid",
        placeItems: "center",
        padding: 16,
        zIndex: 1000,
      }}
    >
      <div className="card" style={{ width: "min(720px, 100%)", padding: 14 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
          <div style={{ fontWeight: 900 }}>Add student</div>
          <div style={{ flex: 1 }} />
          <button className="btn" onClick={close} disabled={saving || actionLoading}>
            Close
          </button>
        </div>

        <form onSubmit={onSubmit} style={{ display: "grid", gap: 10, maxWidth: 560 }}>
          <input
            className="input"
            placeholder="JMBG"
            value={form.jmbg}
            onChange={(e) => setForm((p) => ({ ...p, jmbg: e.target.value }))}
            required
            disabled={saving || actionLoading}
          />

          <input
            className="input"
            placeholder="First name"
            value={form.firstName}
            onChange={(e) => setForm((p) => ({ ...p, firstName: e.target.value }))}
            required
            disabled={saving || actionLoading}
          />

          <input
            className="input"
            placeholder="Last name"
            value={form.lastName}
            onChange={(e) => setForm((p) => ({ ...p, lastName: e.target.value }))}
            required
            disabled={saving || actionLoading}
          />

          <input
            className="input"
            placeholder="Index number (e.g. 2021/0123)"
            value={form.indexNumber}
            onChange={(e) => setForm((p) => ({ ...p, indexNumber: e.target.value }))}
            required
            disabled={saving || actionLoading}
          />

          <button className="btn btn-primary" disabled={saving || actionLoading}>
            {saving ? "Saving..." : "Create"}
          </button>

          {formError && <div className="alert-error">{formError}</div>}
          {!formError && actionError && <div className="alert-error">{actionError}</div>}
        </form>
      </div>
    </div>
  );
}