import { useEffect, useState } from "react";
import { useAuth } from "../../../auth/AuthContext";
import { createTeacher } from "../api/teachersSSApi";

const TITLE_OPTIONS = [
  { value: 1, label: "Assistant professor" },
  { value: 2, label: "Associate professor" },
  { value: 3, label: "Full professor" },
  { value: 4, label: "Professor emeritus" },
];

export function AddTeacherModal({ open, onClose, onCreated }) {
  const { token } = useAuth();

  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState("");
  const [form, setForm] = useState({
    jmbg: "",
    firstName: "",
    lastName: "",
    employeeNumber: "",
    title: "",
  });

  useEffect(() => {
    if (!open) return;

    setSaving(false);
    setFormError("");
    setForm({
      jmbg: "",
      firstName: "",
      lastName: "",
      employeeNumber: "",
      title: "",
    });
  }, [open]);

  if (!open) return null;

  function close() {
    if (saving) return;
    onClose?.();
  }

  async function onSubmit(e) {
    e.preventDefault();
    if (!token) return;

    setSaving(true);
    setFormError("");

    try {
      const titleVal = Number(form.title);
      if (!Number.isFinite(titleVal)) {
        throw new Error("Title is required.");
      }

      await createTeacher(
        {
          jmbg: form.jmbg,
          firstName: form.firstName,
          lastName: form.lastName,
          employeeNumber: form.employeeNumber,
          title: titleVal,
        },
        token
      );

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
          <div style={{ fontWeight: 900 }}>Add teacher</div>
          <div style={{ flex: 1 }} />
          <button className="btn" onClick={close} disabled={saving}>
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
            disabled={saving}
          />

          <input
            className="input"
            placeholder="First name"
            value={form.firstName}
            onChange={(e) => setForm((p) => ({ ...p, firstName: e.target.value }))}
            required
            disabled={saving}
          />

          <input
            className="input"
            placeholder="Last name"
            value={form.lastName}
            onChange={(e) => setForm((p) => ({ ...p, lastName: e.target.value }))}
            required
            disabled={saving}
          />

          <input
            className="input"
            placeholder="Employee number (e.g. 2023/0007)"
            value={form.employeeNumber}
            onChange={(e) => setForm((p) => ({ ...p, employeeNumber: e.target.value }))}
            required
            disabled={saving}
          />

          <select
            className="input"
            value={form.title}
            onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))}
            required
            disabled={saving}
          >
            <option value="" disabled>
              Select title...
            </option>
            {TITLE_OPTIONS.map((o) => (
              <option key={o.value} value={String(o.value)}>
                {o.label}
              </option>
            ))}
          </select>

          <button className="btn btn-primary" disabled={saving}>
            {saving ? "Saving..." : "Create"}
          </button>

          {formError && <div className="alert-error">{formError}</div>}
        </form>
      </div>
    </div>
  );
}