import { useCallback, useState } from "react";
import { useAuth } from "../../../auth/AuthContext";
import { Modal } from "../../shared/components/Modal";
import { usePagedQuery } from "../../shared/hooks/usePagedQuery";
import {
  listTeachers,
  createTeacher,
  updateTeacher,
  deleteTeacher,
} from "../api/teachersSSApi";

const TITLE_OPTIONS = [
  { value: 1, label: "Assistant professor" },
  { value: 2, label: "Associate professor" },
  { value: 3, label: "Full professor" },
  { value: 4, label: "Professor emeritus" },
];

/* helpers */
function idOf(x) {
  return x?.id ?? x?.ID;
}
function firstNameOf(x) {
  return x?.firstName ?? x?.FirstName ?? "";
}
function lastNameOf(x) {
  return x?.lastName ?? x?.LastName ?? "";
}
function fullNameOf(x) {
  return `${firstNameOf(x)} ${lastNameOf(x)}`.trim();
}
function employeeNumOf(x) {
  return x?.employeeNumber ?? x?.EmployeeNumber ?? "";
}
function rawTitleOf(x) {
  return x?.title ?? x?.Title ?? null;
}
function titleNumberOf(x) {
  const t = rawTitleOf(x);
  if (t === null || t === undefined || t === "") return null;
  const n = Number(t);
  return Number.isNaN(n) ? null : n;
}
function titleLabelOf(x) {
  const n = titleNumberOf(x);
  return TITLE_OPTIONS.find((o) => o.value === n)?.label ?? "-";
}
function dobOf(x) {
  return x?.dateOfBirth ?? x?.DateOfBirth ?? null;
}
function fmtDate(v) {
  if (!v) return "-";
  return String(v).substring(0, 10); // YYYY-MM-DD
}

export function TeachersPage() {
  const { token, role } = useAuth();
  const isStudentService = role === "StudentService";

  const fetcher = useCallback((args) => listTeachers(args, token), [token]);
  const {
    items,
    total,
    query,
    setQuery,
    loading,
    error,
    reload,
    loadMore,
    canLoadMore,
    take,
  } = usePagedQuery(fetcher, { take: 20 });

  const [modalOpen, setModalOpen] = useState(false);
  const [mode, setMode] = useState("create"); // create | edit
  const [editing, setEditing] = useState(null);

  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState("");

  const [form, setForm] = useState({
    jmbg: "",
    firstName: "",
    lastName: "",
    employeeNumber: "",
    title: "", // required
  });

  function openCreate() {
    setMode("create");
    setEditing(null);
    setFormError("");
    setForm({
      jmbg: "",
      firstName: "",
      lastName: "",
      employeeNumber: "",
      title: "",
    });
    setModalOpen(true);
  }

  function openEdit(t) {
    setMode("edit");
    setEditing(t);
    setFormError("");
    setForm({
      jmbg: "", // do not edit JMBG
      firstName: firstNameOf(t),
      lastName: lastNameOf(t),
      employeeNumber: employeeNumOf(t),
      title: String(titleNumberOf(t) ?? ""),
    });
    setModalOpen(true);
  }

  function closeModal() {
    setModalOpen(false);
    setSaving(false);
    setFormError("");
    setEditing(null);
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

      if (mode === "create") {
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
      } else {
        const id = idOf(editing);
        if (!id) throw new Error("Missing teacher ID.");

        await updateTeacher(
          id,
          {
            firstName: form.firstName || null,
            lastName: form.lastName || null,
            employeeNumber: form.employeeNumber || null,
            title: titleVal,
          },
          token
        );
      }

      await reload();
      closeModal();
    } catch (err) {
      setFormError(err?.message ?? "Save failed.");
    } finally {
      setSaving(false);
    }
  }

  async function onDelete(t) {
    if (!token) return;
    if (!window.confirm("Soft delete this teacher?")) return;

    try {
      await deleteTeacher(idOf(t), token);
      await reload();
    } catch (err) {
      alert(err?.message ?? "Delete failed.");
    }
  }

  if (!isStudentService) {
    return (
      <div className="container">
        <div className="alert-error">Forbidden</div>
      </div>
    );
  }

  return (
    <div className="container">
      <div className="page-header">
        <div>
          <h1 className="page-title">Teachers</h1>
          <div className="page-subtitle">Batch loading and search.</div>
        </div>
        <button className="btn" onClick={reload} disabled={loading}>
          Refresh
        </button>
      </div>

      {error && (
        <div className="alert-error" style={{ marginBottom: 12 }}>
          {error}
        </div>
      )}

      <div className="card" style={{ padding: 12, marginBottom: 12 }}>
        <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
          <input
            className="input"
            style={{ width: 340 }}
            placeholder="Search by name or employee number..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          <div style={{ flex: 1 }} />
          <button className="btn btn-primary" onClick={openCreate}>
            Add teacher
          </button>
        </div>

        <div className="page-subtitle" style={{ marginTop: 8 }}>
          Showing <span className="mono">{items.length}</span> of{" "}
          <span className="mono">{total}</span>
        </div>
      </div>

      <div className="card" style={{ padding: 12 }}>
        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th style={{ width: 70, textAlign: "center" }}>No.</th>
                <th>Name</th>
                <th style={{ width: 160 }}>Date of birth</th>
                <th style={{ width: 220 }}>Employee number</th>
                <th style={{ width: 220 }}>Title</th>
                <th style={{ width: 190 }}>Actions</th>
              </tr>
            </thead>

            <tbody>
              {loading && items.length === 0 ? (
                <tr>
                  <td colSpan={6} style={{ padding: 10 }}>
                    Loading...
                  </td>
                </tr>
              ) : items.length === 0 ? (
                <tr>
                  <td colSpan={6} style={{ padding: 10 }}>
                    No results.
                  </td>
                </tr>
              ) : (
                items.map((t, i) => (
                  <tr key={idOf(t) ?? `${employeeNumOf(t)}-${i}`}>
                    <td className="mono" style={{ textAlign: "center" }}>
                      {i + 1}
                    </td>
                    <td>{fullNameOf(t) || "-"}</td>
                    <td className="mono">{fmtDate(dobOf(t))}</td>
                    <td className="mono">{employeeNumOf(t) || "-"}</td>
                    <td>{titleLabelOf(t)}</td>
                    <td>
                      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                        <button className="btn" onClick={() => openEdit(t)}>
                          Edit
                        </button>
                        <button className="btn" onClick={() => onDelete(t)}>
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div
          style={{
            marginTop: 12,
            display: "flex",
            gap: 10,
            alignItems: "center",
            flexWrap: "wrap",
          }}
        >
          <button className="btn" onClick={loadMore} disabled={loading || !canLoadMore}>
            {loading ? "Loading..." : canLoadMore ? "Load more" : "No more"}
          </button>
          <span className="badge">Batch: {take}</span>
        </div>
      </div>

      <Modal
        open={modalOpen}
        title={mode === "create" ? "Create teacher" : "Edit teacher"}
        onClose={closeModal}
      >
        <form onSubmit={onSubmit} style={{ display: "grid", gap: 10, maxWidth: 560 }}>
          {mode === "create" && (
            <input
              className="input"
              placeholder="JMBG"
              value={form.jmbg}
              onChange={(e) => setForm((p) => ({ ...p, jmbg: e.target.value }))}
              required
            />
          )}

          <input
            className="input"
            placeholder="First name"
            value={form.firstName}
            onChange={(e) => setForm((p) => ({ ...p, firstName: e.target.value }))}
            required={mode === "create"}
          />

          <input
            className="input"
            placeholder="Last name"
            value={form.lastName}
            onChange={(e) => setForm((p) => ({ ...p, lastName: e.target.value }))}
            required={mode === "create"}
          />

          <input
            className="input"
            placeholder="Employee number (e.g. 2023/0007)"
            value={form.employeeNumber}
            onChange={(e) => setForm((p) => ({ ...p, employeeNumber: e.target.value }))}
            required={mode === "create"}
          />

          <select
            className="input"
            value={form.title}
            onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))}
            required
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
            {saving ? "Saving..." : mode === "create" ? "Create" : "Save changes"}
          </button>

          {formError && <div className="alert-error">{formError}</div>}
        </form>
      </Modal>
    </div>
  );
}
