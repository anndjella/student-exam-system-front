import { useEffect, useState } from "react";
import { useStudentsApi } from "../../shared/hooks/useStudentsApi";

const INDEX_NUMBER_REGEX = /^\d{4}\/\d{4}$/;
const JMBG_REGEX = /^\d{13}$/;
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function AddStudentModal({ open, onClose, onCreated }) {
  const {
    create,
    actionLoading,
    error: actionError,
    clearError,
  } = useStudentsApi();

  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState("");
  const [form, setForm] = useState({
    jmbg: "",
    firstName: "",
    lastName: "",
    email: "",
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
      email: "",
      indexNumber: "",
    });
  }, [open]);

  if (!open) return null;

  function close() {
    if (saving || actionLoading) return;
    onClose?.();
  }

  function validateForm() {
    const jmbg = form.jmbg.trim();
    const firstName = form.firstName.trim();
    const lastName = form.lastName.trim();
    const email = form.email.trim();
    const indexNumber = form.indexNumber.trim();

    if (!JMBG_REGEX.test(jmbg)) {
      return "JMBG must contain exactly 13 digits.";
    }

    if (!firstName) {
      return "First name is required.";
    }

    if (!lastName) {
      return "Last name is required.";
    }

    if (!EMAIL_REGEX.test(email)) {
      return "Enter a valid email address.";
    }

    if (!INDEX_NUMBER_REGEX.test(indexNumber)) {
      return "Index number must be in format YYYY/NNNN.";
    }

    return "";
  }

  async function onSubmit(e) {
    e.preventDefault();

    setFormError("");
    clearError();

    const validationError = validateForm();
    if (validationError) {
      setFormError(validationError);
      return;
    }

    setSaving(true);

    try {
      await create({
        jmbg: form.jmbg.trim(),
        firstName: form.firstName.trim(),
        lastName: form.lastName.trim(),
        email: form.email.trim(),
        indexNumber: form.indexNumber.trim(),
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
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
            marginBottom: 10,
          }}
        >
          <div style={{ fontWeight: 900 }}>Add student</div>
          <div style={{ flex: 1 }} />
          <button
            type="button"
            className="btn"
            onClick={close}
            disabled={saving || actionLoading}
          >
            Close
          </button>
        </div>

        <form onSubmit={onSubmit} style={{ display: "grid", gap: 10, maxWidth: 560 }}>
          <input
            className="input"
            placeholder="JMBG"
            value={form.jmbg}
            onChange={(e) =>
              setForm((p) => ({
                ...p,
                jmbg: e.target.value.replace(/\D/g, "").slice(0, 13),
              }))
            }
            required
            disabled={saving || actionLoading}
            inputMode="numeric"
            maxLength={13}
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
            type="email"
            placeholder="Email address"
            value={form.email}
            onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))}
            required
            maxLength={254}
            autoComplete="email"
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
