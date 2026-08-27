import { useEffect, useState } from "react";
import { useAuth } from "../../../auth/AuthContext";
import { createTeacher } from "../api/teachersSSApi";
import { TEACHER_TITLE_OPTIONS } from "../../../utils/teacherTitle";
import { CustomSelect } from "../../shared/components/CustomSelect";

const EMPLOYEE_NUMBER_REGEX = /^\d{4}\/\d{4}$/;
const JMBG_REGEX = /^\d{13}$/;
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function AddTeacherModal({ open, onClose, onCreated }) {
  const { token } = useAuth();

  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState("");
  const [form, setForm] = useState({
    jmbg: "",
    firstName: "",
    lastName: "",
    email: "",
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
      email: "",
      employeeNumber: "",
      title: "",
    });
  }, [open]);

  if (!open) return null;

  function close() {
    if (saving) return;
    onClose?.();
  }

  function validateForm() {
    const jmbg = form.jmbg.trim();
    const firstName = form.firstName.trim();
    const lastName = form.lastName.trim();
    const email = form.email.trim();
    const employeeNumber = form.employeeNumber.trim();
    const titleVal = Number(form.title);

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

    if (!EMPLOYEE_NUMBER_REGEX.test(employeeNumber)) {
      return "Employee number must be in format YYYY/NNNN.";
    }

    if (!Number.isInteger(titleVal) || !TEACHER_TITLE_OPTIONS.some((x) => x.value === titleVal)) {
      return "Title is required.";
    }

    return "";
  }

  async function onSubmit(e) {
    e.preventDefault();
    if (!token) {
      setFormError("You are not authenticated.");
      return;
    }

    setFormError("");

    const validationError = validateForm();
    if (validationError) {
      setFormError(validationError);
      return;
    }

    setSaving(true);

    try {
      await createTeacher(
        {
          jmbg: form.jmbg.trim(),
          firstName: form.firstName.trim(),
          lastName: form.lastName.trim(),
          email: form.email.trim(),
          employeeNumber: form.employeeNumber.trim(),
          title: Number(form.title),
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
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
            marginBottom: 10,
          }}
        >
          <div style={{ fontWeight: 900 }}>Add teacher</div>
          <div style={{ flex: 1 }} />
          <button type="button" className="btn" onClick={close} disabled={saving}>
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
            disabled={saving}
            inputMode="numeric"
            maxLength={13}
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
            type="email"
            placeholder="Email address"
            value={form.email}
            onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))}
            required
            maxLength={254}
            autoComplete="email"
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

          <CustomSelect
            value={form.title}
            onChange={(value) => setForm((p) => ({ ...p, title: value }))}
            disabled={saving}
            placeholder="Select title..."
            ariaLabel="Academic title"
            options={TEACHER_TITLE_OPTIONS.map((option) => ({
              key: option.value,
              value: String(option.value),
              label: option.label,
            }))}
          />

          <button className="btn btn-primary" disabled={saving}>
            {saving ? "Saving..." : "Create"}
          </button>

          {formError && <div className="alert-error">{formError}</div>}
        </form>
      </div>
    </div>
  );
}
