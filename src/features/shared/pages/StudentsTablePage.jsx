import { useCallback, useMemo, useState } from "react";
import { useAuth } from "../../../auth/AuthContext";
import { Modal } from "../../shared/components/Modal";
import { usePagedQuery } from "../hooks/usePagedQuery";
import { useStudentsApi } from "../hooks/useStudentsApi";
import {formatDate,formatDateTime} from "../../../utils/datetime";

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
  allowCreate = true,
  showDeletedTabs = false,
}) {
  const { token } = useAuth();
  const { list, create, update, remove, actionLoading, error: actionError, clearError } = useStudentsApi();

  const [tab, setTab] = useState("active"); // active | deleted
  const onlyDeleted = showDeletedTabs && tab === "deleted";

  const effectiveReadOnly = readOnly || onlyDeleted;
  const effectiveAllowCreate = allowCreate && !onlyDeleted;

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

  const [modalOpen, setModalOpen] = useState(false);
  const [mode, setMode] = useState("create"); // create | edit
  const [editing, setEditing] = useState(null);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState("");

  const [form, setForm] = useState({
    jmbg: "",
    firstName: "",
    lastName: "",
    indexNumber: "",
  });

  const showingFrom = useMemo(() => (total === 0 ? 0 : skip + 1), [skip, total]);
  const showingTo = useMemo(() => clamp(skip + items.length, 0, total), [skip, items.length, total]);

  const extraCols = tab === "deleted" ? 1 : 0;
  const tableColSpan = (effectiveReadOnly ? 7 : 8) + extraCols;

  function openCreate() {
    if (effectiveReadOnly || !effectiveAllowCreate) return;
    clearError();
    setMode("create");
    setEditing(null);
    setFormError("");
    setForm({ jmbg: "", firstName: "", lastName: "", indexNumber: "" });
    setModalOpen(true);
  }

  function openEdit(s) {
    if (effectiveReadOnly) return;
    clearError();
    setMode("edit");
    setEditing(s);
    setFormError("");
    setForm({
      jmbg: "",
      firstName: firstNameOf(s),
      lastName: lastNameOf(s),
      indexNumber: indexOf(s),
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
    if (effectiveReadOnly || !token) return;

    setSaving(true);
    setFormError("");
    clearError();

    try {
      if (mode === "create") {
        await create({
          jmbg: form.jmbg,
          firstName: form.firstName,
          lastName: form.lastName,
          indexNumber: form.indexNumber,
        });
      } else {
        const id = idOf(editing);
        if (!id) throw new Error("Missing student ID.");

        await update(id, {
          firstName: form.firstName || null,
          lastName: form.lastName || null,
          indexNumber: form.indexNumber || null,
        });
      }

      await reload();
      closeModal();
    } catch (err) {
      setFormError(err?.message ?? "Save failed.");
    } finally {
      setSaving(false);
    }
  }

  async function onDelete(s) {
    if (effectiveReadOnly || !token) return;
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

        <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
          <button className="btn" onClick={reload} disabled={loading || actionLoading}>
            Refresh
          </button>

          {!effectiveReadOnly && effectiveAllowCreate && (
            <button className="btn btn-primary" onClick={openCreate} disabled={loading || actionLoading}>
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
                <th style={{ width: 70, textAlign: "center" }}>No.</th>
                <th style={{ textAlign: "left" }}>Student</th>
                <th style={{ width: 150, textAlign: "center" }}>Date of birth</th>
                <th style={{ width: 220, textAlign: "center" }}>Index number</th>

                {tab === "deleted" && (
                  <th style={{ width: 190, textAlign: "center" }}>Deleted at</th>
                )}

                <th style={{ width: 110, textAlign: "center" }}>ECTS</th>
                <th style={{ width: 110, textAlign: "center" }}>GPA</th>

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
                items.map((s, i) => (
                  <tr key={idOf(s) ?? `${indexOf(s)}-${i}`}>
                    <td className="mono" style={{ textAlign: "center" }}>
                      {skip + i + 1}
                    </td>

                    <td style={{ textAlign: "left" }}>{fullNameOf(s) || "-"}</td>

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

                    {!effectiveReadOnly && (
                      <td style={{ textAlign: "center" }}>
                        <div style={{ display: "flex", gap: 8, justifyContent: "center", flexWrap: "wrap" }}>
                          <button className="btn" onClick={() => openEdit(s)} disabled={actionLoading}>
                            Edit
                          </button>
                          <button className="btn" onClick={() => onDelete(s)} disabled={actionLoading}>
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

      {!effectiveReadOnly && (
        <Modal
          open={modalOpen}
          title={mode === "create" ? "Create student" : "Edit student"}
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
                disabled={saving || actionLoading}
              />
            )}

            <input
              className="input"
              placeholder="First name"
              value={form.firstName}
              onChange={(e) => setForm((p) => ({ ...p, firstName: e.target.value }))}
              required={mode === "create"}
              disabled={saving || actionLoading}
            />

            <input
              className="input"
              placeholder="Last name"
              value={form.lastName}
              onChange={(e) => setForm((p) => ({ ...p, lastName: e.target.value }))}
              required={mode === "create"}
              disabled={saving || actionLoading}
            />

            <input
              className="input"
              placeholder="Index number (e.g. 2021/0123)"
              value={form.indexNumber}
              onChange={(e) => setForm((p) => ({ ...p, indexNumber: e.target.value }))}
              required={mode === "create"}
              disabled={saving || actionLoading}
            />

            <button className="btn btn-primary" disabled={saving || actionLoading}>
              {saving ? "Saving..." : mode === "create" ? "Create" : "Save changes"}
            </button>

            {formError && <div className="alert-error">{formError}</div>}
            {!formError && actionError && <div className="alert-error">{actionError}</div>}
          </form>
        </Modal>
      )}
    </div>
  );
}
