import { useCallback, useMemo, useState } from "react";
import { useAuth } from "../../../auth/AuthContext";
import { usePagedQuery } from "../hooks/usePagedQuery";
import { useStudentsApi } from "../hooks/useStudentsApi";
import { formatDate, formatDateTime } from "../../../utils/datetime";

/* ---------- small helpers ---------- */
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
function indexOf(x) {
  return x?.indexNumber ?? x?.IndexNumber ?? "";
}
function emailOf(x) {
  return x?.email ?? x?.Email ?? "";
}
function dobOf(x) {
  return x?.dateOfBirth ?? x?.DateOfBirth ?? null;
}
function ectsOf(x) {
  if (x?.ectsCount === 0) return null;
  return x?.ectsCount ?? x?.ECTSCount ?? null;
}
function gpaOf(x) {
  return x?.gpa ?? x?.GPA ?? null;
}
function deletedAtOf(x) {
  return x?.deletedAt ?? x?.DeletedAt ?? null;
}

function fmtGpa(v) {
  if (v === null || v === undefined) return "-";
  const n = Number(v);
  return Number.isFinite(n) ? n.toFixed(2) : "-";
}
function clamp(n, min, max) {
  return Math.max(min, Math.min(max, n));
}

export function StudentsTablePage({
  title = "Students",
  readOnly = false,
  showDeletedTabs = false,
  allowAdd = false,
  allowEdit = true,
  allowDelete = true,
  onAddStudent,
}) {
  const { token } = useAuth();
  const {
    list,
    update,
    remove,
    actionLoading,
    error: actionError,
    clearError,
  } = useStudentsApi();

  const [tab, setTab] = useState("active"); // active | deleted
  const onlyDeleted = showDeletedTabs && tab === "deleted";

  const effectiveReadOnly = readOnly || onlyDeleted;
  const canEdit = !effectiveReadOnly && allowEdit;
  const canDelete = !effectiveReadOnly && allowDelete;
  const showActions = canEdit || canDelete;

  const fetcher = useCallback(
    (args) => list({ ...args, onlyDeleted }),
    [list, onlyDeleted]
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

  const [editing, setEditing] = useState(null);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState("");
  const [editOpen, setEditOpen] = useState(false);

  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    email: "",
    indexNumber: "",
  });

  const showingFrom = useMemo(() => (total === 0 ? 0 : skip + 1), [skip, total]);
  const showingTo = useMemo(() => clamp(skip + items.length, 0, total), [skip, items.length, total]);

  const extraCols = tab === "deleted" ? 1 : 0;
  const tableColSpan = (showActions ? 8 : 7) + extraCols;

  function openEdit(s) {
    if (!canEdit) return;
    clearError();
    setEditing(s);
    setFormError("");
    setForm({
      firstName: firstNameOf(s),
      lastName: lastNameOf(s),
      email: emailOf(s),
      indexNumber: indexOf(s),
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
    if (!token || !editing || !canEdit) return;

    setSaving(true);
    setFormError("");
    clearError();

    try {
      const id = idOf(editing);
      if (!id) throw new Error("Missing student ID.");

      await update(id, {
        firstName: form.firstName || null,
        lastName: form.lastName || null,
        email: form.email.trim() || null,
        indexNumber: form.indexNumber || null,
      });

      await reload();
      closeEdit();
    } catch (err) {
      setFormError(err?.message ?? "Save failed.");
    } finally {
      setSaving(false);
    }
  }

  async function onDelete(s) {
    if (!token || !canDelete) return;
    if (!window.confirm("Soft delete this student?")) return;

    clearError();
    try {
      await remove(idOf(s));
      await reload();
    } catch (err) {
      alert(err?.message ?? "Delete failed.");
    }
  }

  return (
    <div className="container">
      <div className="page-header">
        <div>
          <h1 className="page-title">{title}</h1>
          <div className="page-subtitle">
            {showDeletedTabs ? "Active and soft deleted students." : "Search and paging."}
          </div>
        </div>

        <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
          <button className="btn" onClick={reload} disabled={loading || actionLoading}>
            Refresh
          </button>

          {allowAdd && !effectiveReadOnly && (
            <button
              className="btn btn-primary"
              onClick={onAddStudent}
              disabled={loading || actionLoading}
            >
              Add student
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
              disabled={loading || actionLoading}
            >
              Active
            </button>

            <button
              type="button"
              className={"btn" + (tab === "deleted" ? " btn-primary" : "")}
              onClick={() => setTab("deleted")}
              disabled={loading || actionLoading}
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
            {tab === "active" ? "Showing active students." : "Showing soft deleted students."}
          </div>
        </div>
      )}

      {error && (
        <div className="alert-error" style={{ marginBottom: 12 }}>
          {error}
        </div>
      )}

      {actionError && (
        <div className="alert-error" style={{ marginBottom: 12 }}>
          {actionError}
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
              placeholder="Search by name or index..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
            {query && (
              <button
                type="button"
                className="btn"
                onClick={() => setQuery("")}
                disabled={loading || actionLoading}
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
            <button className="btn" onClick={goPrev} disabled={!canPrev || loading || actionLoading}>
              Prev
            </button>
            <button className="btn" onClick={goNext} disabled={!canNext || loading || actionLoading}>
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
              <select
                className="input"
                style={{ width: 92, padding: "6px 8px" }}
                value={take}
                onChange={(e) => setTake(Number(e.target.value))}
                disabled={loading || actionLoading}
              >
                <option value={10}>10</option>
                <option value={20}>20</option>
                <option value={50}>50</option>
              </select>
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
                <th style={{ width: 50, textAlign: "center" }}>No.</th>
                <th style={{ width: 150, textAlign: "left" }}>Student</th>
                <th style={{ width: 220, textAlign: "left" }}>Email</th>
                <th style={{ width: 150, textAlign: "center" }}>Date of birth</th>
                <th style={{ width: 160, textAlign: "center" }}>Index number</th>

                {tab === "deleted" && (
                  <th style={{ width: 190, textAlign: "center" }}>Deleted at</th>
                )}

                <th style={{ width: 110, textAlign: "center" }}>ECTS</th>
                <th style={{ width: 110, textAlign: "center" }}>GPA</th>

                {showActions && (
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
                items.map((s, i) => (
                  <tr key={idOf(s) ?? `${indexOf(s)}-${i}`}>
                    <td className="mono" style={{ textAlign: "center" }}>
                      {skip + i + 1}
                    </td>

                    <td style={{ textAlign: "left" }}>{fullNameOf(s) || "-"}</td>

                    <td style={{ textAlign: "left" }}>{emailOf(s) || "-"}</td>

                    <td className="mono" style={{ textAlign: "center", whiteSpace: "nowrap" }}>
                      {formatDate(dobOf(s))}
                    </td>

                    <td className="mono" style={{ textAlign: "center", whiteSpace: "nowrap" }}>
                      {indexOf(s) || "-"}
                    </td>

                    {tab === "deleted" && (
                      <td className="mono" style={{ textAlign: "center", whiteSpace: "nowrap" }}>
                        {formatDateTime(deletedAtOf(s))}
                      </td>
                    )}

                    <td className="mono" style={{ textAlign: "center" }}>
                      {ectsOf(s) ?? "-"}
                    </td>

                    <td className="mono" style={{ textAlign: "center" }}>
                      {fmtGpa(gpaOf(s))}
                    </td>

                    {showActions && (
                      <td style={{ textAlign: "center" }}>
                        <div style={{ display: "flex", gap: 8, justifyContent: "center", flexWrap: "wrap" }}>
                          {canEdit && (
                            <button className="btn" onClick={() => openEdit(s)} disabled={actionLoading}>
                              Edit
                            </button>
                          )}

                          {canDelete && (
                            <button className="btn" onClick={() => onDelete(s)} disabled={actionLoading}>
                              Delete
                            </button>
                          )}
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
          <button className="btn" onClick={goPrev} disabled={!canPrev || loading || actionLoading}>
            Prev
          </button>
          <button className="btn" onClick={goNext} disabled={!canNext || loading || actionLoading}>
            Next
          </button>
          <span className="badge">
            Page <span className="mono">{page}</span>/<span className="mono">{pageCount}</span>
          </span>
        </div>
      </div>

      {editOpen && canEdit && (
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
              <div style={{ fontWeight: 900 }}>Edit student</div>
              <div style={{ flex: 1 }} />
              <button className="btn" onClick={closeEdit} disabled={saving || actionLoading}>
                Close
              </button>
            </div>

            <form onSubmit={onSubmitEdit} style={{ display: "grid", gap: 10, maxWidth: 560 }}>
              <input
                className="input"
                placeholder="First name"
                value={form.firstName}
                onChange={(e) => setForm((p) => ({ ...p, firstName: e.target.value }))}
                disabled={saving || actionLoading}
              />

              <input
                className="input"
                placeholder="Last name"
                value={form.lastName}
                onChange={(e) => setForm((p) => ({ ...p, lastName: e.target.value }))}
                disabled={saving || actionLoading}
              />

              <input
                className="input"
                type="email"
                placeholder="Email address"
                value={form.email}
                onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))}
                maxLength={254}
                autoComplete="email"
                disabled={saving || actionLoading}
              />

              <input
                className="input"
                placeholder="Index number (e.g. 2021/0123)"
                value={form.indexNumber}
                onChange={(e) => setForm((p) => ({ ...p, indexNumber: e.target.value }))}
                disabled={saving || actionLoading}
              />

              <button className="btn btn-primary" disabled={saving || actionLoading}>
                {saving ? "Saving..." : "Save changes"}
              </button>

              {formError && <div className="alert-error">{formError}</div>}
              {!formError && actionError && <div className="alert-error">{actionError}</div>}
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
