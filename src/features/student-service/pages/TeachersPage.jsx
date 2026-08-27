import { useCallback, useMemo, useState } from "react";
import { useAuth } from "../../../auth/AuthContext";
import { usePagedQuery } from "../../shared/hooks/usePagedQuery";
import { listTeachers, updateTeacher, deleteTeacher } from "../api/teachersSSApi";
import { AddTeacherModal } from "../components/AddTeacherModal";
import { formatDate, formatDateTime } from "../../../utils/datetime";
import { TEACHER_TITLE_OPTIONS } from "../../../utils/teacherTitle";
import { CustomSelect } from "../../shared/components/CustomSelect";

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
  const n = `${firstNameOf(x)} ${lastNameOf(x)}`.trim();
  return n || "";
}
function employeeNumOf(x) {
  return x?.employeeNumber ?? x?.EmployeeNumber ?? "";
}
function emailOf(x) {
  return x?.email ?? x?.Email ?? "";
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
  return TEACHER_TITLE_OPTIONS.find((o) => o.value === n)?.label || "-";
}
function dobOf(x) {
  return x?.dateOfBirth ?? x?.DateOfBirth ?? null;
}
function deletedAtOf(x) {
  return x?.deletedAt ?? x?.DeletedAt ?? null;
}
function clamp(n, min, max) {
  return Math.max(min, Math.min(max, n));
}

export function TeachersPage({
  title = "Teachers",
  showDeletedTabs = true,
  allowCreate = true,
}) {
  const { token, role } = useAuth();
  const isStudentService = role === "StudentService";

  const [tab, setTab] = useState("active");
  const onlyDeleted = showDeletedTabs && tab === "deleted";

  const effectiveAllowCreate = allowCreate && !onlyDeleted;
  const effectiveReadOnly = onlyDeleted;

  const [addOpen, setAddOpen] = useState(false);

  const fetcher = useCallback(
    (args) => listTeachers({ ...args, onlyDeleted }, token),
    [token, onlyDeleted]
  );

  const {
    items,
    total,
    query,
    setQuery,
    loading,
    error,
    reload,

    take,
    setTake,
    skip,

    page,
    pageCount,
    canPrev,
    canNext,
    goPrev,
    goNext,
  } = usePagedQuery(fetcher, { take: 20 });

  const [editOpen, setEditOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState("");

  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    email: "",
    employeeNumber: "",
    title: "",
  });

  const showingFrom = useMemo(() => (total === 0 ? 0 : skip + 1), [skip, total]);
  const showingTo = useMemo(() => clamp(skip + items.length, 0, total), [skip, items.length, total]);

  const tableColSpan = (effectiveReadOnly ? 6 : 7) + (onlyDeleted ? 1 : 0);

  function openEdit(t) {
    if (effectiveReadOnly) return;

    setEditing(t);
    setFormError("");
    setForm({
      firstName: firstNameOf(t),
      lastName: lastNameOf(t),
      email: emailOf(t),
      employeeNumber: employeeNumOf(t),
      title: String(titleNumberOf(t) ?? ""),
    });
    setEditOpen(true);
  }

  function closeEdit() {
    setEditOpen(false);
    setEditing(null);
    setSaving(false);
    setFormError("");
  }

  async function onSubmitEdit(e) {
    e.preventDefault();
    if (effectiveReadOnly || !token || !editing) return;

    setSaving(true);
    setFormError("");

    try {
      const titleVal = Number(form.title);
      if (!Number.isFinite(titleVal)) throw new Error("Title is required.");

      const id = idOf(editing);
      if (!id) throw new Error("Missing teacher ID.");

      await updateTeacher(
        id,
        {
          firstName: form.firstName || null,
          lastName: form.lastName || null,
          email: form.email.trim() || null,
          employeeNumber: form.employeeNumber || null,
          title: titleVal,
        },
        token
      );

      await reload();
      closeEdit();
    } catch (err) {
      setFormError(err?.message ?? "Save failed.");
    } finally {
      setSaving(false);
    }
  }

  async function onDelete(t) {
    if (effectiveReadOnly || !token) return;
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
    <>
      <div className="container">
        <div className="page-header">
          <div>
            <h1 className="page-title">{title}</h1>
            <div className="page-subtitle">
              {showDeletedTabs ? "Active and soft deleted teachers." : "Search and paging."}
            </div>
          </div>

          <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
            <button className="btn" onClick={reload} disabled={loading || saving}>
              Refresh
            </button>

            {!effectiveReadOnly && effectiveAllowCreate && (
              <button
                className="btn btn-primary"
                onClick={() => setAddOpen(true)}
                disabled={loading || saving}
              >
                Add teacher
              </button>
            )}
          </div>
        </div>

        {showDeletedTabs && (
          <div className="card" style={{ padding: 12, marginBottom: 12 }}>
            <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
              <button
                type="button"
                className={"btn" + (tab === "active" ? " btn-primary" : "")}
                onClick={() => setTab("active")}
                disabled={loading}
              >
                Active
              </button>

              <button
                type="button"
                className={"btn" + (tab === "deleted" ? " btn-primary" : "")}
                onClick={() => setTab("deleted")}
                disabled={loading}
              >
                Deleted
              </button>

              {tab === "deleted" && (
                <span className="badge" style={{ alignSelf: "center" }}>
                  Deleted view is read-only
                </span>
              )}
            </div>

            <div className="page-subtitle" style={{ marginTop: 8 }}>
              {tab === "active" ? "Showing active teachers." : "Showing soft deleted teachers."}
            </div>
          </div>
        )}

        {error && (
          <div className="alert-error" style={{ marginBottom: 12 }}>
            {error}
          </div>
        )}

        <div className="card" style={{ padding: 12, marginBottom: 12 }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 12,
              flexWrap: "wrap",
            }}
          >
            <div style={{ position: "relative", flex: "1 1 360px", minWidth: 260 }}>
              <input
                className="input"
                style={{ width: "100%", paddingRight: 40 }}
                placeholder={onlyDeleted ? "Search deleted teachers..." : "Search by name or employee number..."}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
              {query && (
                <button
                  type="button"
                  className="btn"
                  onClick={() => setQuery("")}
                  disabled={loading}
                  style={{
                    position: "absolute",
                    right: 6,
                    top: "50%",
                    transform: "translateY(-50%)",
                    padding: "6px 10px",
                    lineHeight: 1,
                  }}
                  aria-label="Clear search"
                  title="Clear"
                >
                  ×
                </button>
              )}
            </div>

            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                flex: "0 0 auto",
                flexWrap: "wrap",
                justifyContent: "flex-end",
                marginLeft: "auto",
              }}
            >
              <button className="btn" onClick={goPrev} disabled={!canPrev || loading}>
                Prev
              </button>
              <button className="btn" onClick={goNext} disabled={!canNext || loading}>
                Next
              </button>

              <div
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 8,
                  padding: "6px 10px",
                  borderRadius: 999,
                  border: "1px solid var(--border)",
                  background: "rgba(255,255,255,0.03)",
                }}
              >
                <span style={{ whiteSpace: "nowrap" }}>Page size:</span>
                <CustomSelect
                  className="custom-select--compact"
                  value={take}
                  onChange={(value) => setTake(Number(value))}
                  disabled={loading}
                  ariaLabel="Page size"
                  showOptionCount={false}
                  options={[10, 20, 50].map((value) => ({ value, label: String(value) }))}
                />
              </div>
            </div>
          </div>

          <div className="page-subtitle" style={{ marginTop: 8 }}>
            Showing <span className="mono">{showingFrom}</span>-<span className="mono">{showingTo}</span> of{" "}
            <span className="mono">{total}</span> (page <span className="mono">{page}</span>/
            <span className="mono">{pageCount}</span>)
          </div>
        </div>

        <div className="card" style={{ padding: 12 }}>
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr>
                  <th style={{ width: 70, textAlign: "center" }}>No.</th>
                  <th style={{ width: 160, textAlign: "left" }}>Teacher</th>
                  <th style={{ width: 220, textAlign: "left" }}>Email</th>
                  <th style={{ width: 160, textAlign: "center" }}>Date of birth</th>
                  <th style={{ width: 160, textAlign: "center" }}>Employee number</th>

                  {onlyDeleted && (
                    <th style={{ width: 190, textAlign: "center" }}>Deleted at</th>
                  )}

                  <th style={{ width: 160, textAlign: "center" }}>Title</th>

                  {!effectiveReadOnly && (
                    <th style={{ width: 190, textAlign: "center" }}>Actions</th>
                  )}
                </tr>
              </thead>

              <tbody>
                {loading && items.length === 0 ? (
                  <tr>
                    <td colSpan={tableColSpan} style={{ padding: 10 }}>
                      Loading...
                    </td>
                  </tr>
                ) : items.length === 0 ? (
                  <tr>
                    <td colSpan={tableColSpan} style={{ padding: 10 }}>
                      No results.
                    </td>
                  </tr>
                ) : (
                  items.map((t, i) => (
                    <tr key={idOf(t) ?? `${employeeNumOf(t)}-${i}`}>
                      <td className="mono" style={{ textAlign: "center" }}>
                        {skip + i + 1}
                      </td>

                      <td style={{ textAlign: "left" }}>{fullNameOf(t) || "-"}</td>

                      <td style={{ textAlign: "left" }}>{emailOf(t) || "-"}</td>

                      <td className="mono" style={{ textAlign: "center", whiteSpace: "nowrap" }}>
                        {formatDate(dobOf(t))}
                      </td>

                      <td className="mono" style={{ textAlign: "center", whiteSpace: "nowrap" }}>
                        {employeeNumOf(t) || "-"}
                      </td>

                      {onlyDeleted && (
                        <td className="mono" style={{ textAlign: "center", whiteSpace: "nowrap" }}>
                          {formatDateTime(deletedAtOf(t))}
                        </td>
                      )}

                      <td style={{ textAlign: "center" }}>{titleLabelOf(t)}</td>

                      {!effectiveReadOnly && (
                        <td style={{ textAlign: "center" }}>
                          <div style={{ display: "flex", gap: 8, justifyContent: "center", flexWrap: "wrap" }}>
                            <button className="btn" onClick={() => openEdit(t)} disabled={saving}>
                              Edit
                            </button>
                            <button className="btn" onClick={() => onDelete(t)} disabled={saving}>
                              Delete
                            </button>
                          </div>
                        </td>
                      )}
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
              justifyContent: "flex-end",
              flexWrap: "wrap",
            }}
          >
            <button className="btn" onClick={goPrev} disabled={!canPrev || loading}>
              Prev
            </button>
            <button className="btn" onClick={goNext} disabled={!canNext || loading}>
              Next
            </button>
            <span className="badge">
              Page <span className="mono">{page}</span>/<span className="mono">{pageCount}</span>
            </span>
          </div>
        </div>

        {editOpen && !effectiveReadOnly && (
          <div
            role="dialog"
            aria-modal="true"
            onMouseDown={(e) => {
              if (e.target === e.currentTarget) closeEdit();
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
                <div style={{ fontWeight: 900 }}>Edit teacher</div>
                <div style={{ flex: 1 }} />
                <button className="btn" onClick={closeEdit} disabled={saving}>
                  Close
                </button>
              </div>

              <form onSubmit={onSubmitEdit} style={{ display: "grid", gap: 10, maxWidth: 560 }}>
                <input
                  className="input"
                  placeholder="First name"
                  value={form.firstName}
                  onChange={(e) => setForm((p) => ({ ...p, firstName: e.target.value }))}
                  disabled={saving}
                />

                <input
                  className="input"
                  placeholder="Last name"
                  value={form.lastName}
                  onChange={(e) => setForm((p) => ({ ...p, lastName: e.target.value }))}
                  disabled={saving}
                />

                <input
                  className="input"
                  type="email"
                  placeholder="Email address"
                  value={form.email}
                  onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))}
                  maxLength={254}
                  autoComplete="email"
                  disabled={saving}
                />

                <input
                  className="input"
                  placeholder="Employee number (e.g. 2023/0007)"
                  value={form.employeeNumber}
                  onChange={(e) => setForm((p) => ({ ...p, employeeNumber: e.target.value }))}
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
                  {saving ? "Saving..." : "Save changes"}
                </button>

                {formError && <div className="alert-error">{formError}</div>}
              </form>
            </div>
          </div>
        )}
      </div>

      <AddTeacherModal
        open={addOpen}
        onClose={() => setAddOpen(false)}
        onCreated={reload}
      />
    </>
  );
}
