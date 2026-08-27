import { useEffect, useMemo, useState } from "react";
import { useSsSubjects } from "../hooks/useSSSubjects";
import { EditSubjectTeachersModal } from "../components/EditSubjectTeachersModal";
import { useAuth } from "../../../auth/AuthContext";
import { CustomSelect } from "../../shared/components/CustomSelect";

import {
  createTeachingAssignment,
  deleteTeachingAssignment,
  findTeacherByEmployeeNumber,
  updateCanGrade,
} from "../api/teachingAssignmentsApi";

function teacherNameOnly(t) {
  return `${t.firstName || ""} ${t.lastName || ""}`.trim() || "-";
}

function prettyErrorMessage(message) {
  if (!message) return "Request failed.";

  try {
    const obj = JSON.parse(message);
    return obj.detail || obj.Detail || obj.title || obj.Title || "Request failed.";
  } catch {
    return message;
  }
}

export function StudentServiceSubjectsPage() {
  const { token } = useAuth();

  const {
    tab,
    setTab,
    items,
    total,

    query,
    setQuery,

    loading,
    actionLoading,
    error,
    reload,

    skip,
    take,
    setTake,
    page,
    pageCount,
    canPrev,
    canNext,
    goPrev,
    goNext,

    searchByCode,
    deactivate,
    remove,
    create,
  } = useSsSubjects();

  const [codeQuery, setCodeQuery] = useState("");
  const [searchResult, setSearchResult] = useState(null);

  const [newCode, setNewCode] = useState("");
  const [newName, setNewName] = useState("");
  const [newEcts, setNewEcts] = useState("");

  const [editOpen, setEditOpen] = useState(false);
  const [editSubject, setEditSubject] = useState(null);
  const [savingTeachers, setSavingTeachers] = useState(false);

  const [successMessage, setSuccessMessage] = useState("");
  const [formError, setFormError] = useState("");

  useEffect(() => {
    if (!successMessage) return;

    const timer = setTimeout(() => {
      setSuccessMessage("");
    }, 3000);

    return () => clearTimeout(timer);
  }, [successMessage]);

  const ectsTrimmed = newEcts.trim();
  const ectsNum = Number(ectsTrimmed);

  const canCreateSubject = useMemo(() => {
    return (
      newCode.trim() &&
      newName.trim() &&
      ectsTrimmed &&
      Number.isFinite(ectsNum) &&
      ectsNum > 0 &&
      ectsNum <= 15 &&
      !actionLoading
    );
  }, [newCode, newName, ectsTrimmed, ectsNum, actionLoading]);

  async function onSearchExact() {
    setSuccessMessage("");
    setFormError("");

    const res = await searchByCode(codeQuery);
    setSearchResult(res);
  }

  function clearSearch() {
    setSearchResult(null);
    setCodeQuery("");
    setFormError("");
    setSuccessMessage("");
  }

  async function onCreate(e) {
    e.preventDefault();

    setFormError("");
    setSuccessMessage("");

    const code = newCode.trim();
    const name = newName.trim();
    const ectsRaw = newEcts.trim();
    const ects = Number(ectsRaw);

    try {
      await create({ code, name, ects });

      setTab("active");
      setSearchResult(null);
      setCodeQuery("");

      await reload();

      setNewCode("");
      setNewName("");
      setNewEcts("");
      setFormError("");

      setSuccessMessage(`Subject "${code}" was created successfully.`);
    } catch (e) {
      setFormError(prettyErrorMessage(e?.message));
    }
  }

  async function onDeactivate(subject) {
    setSuccessMessage("");
    setFormError("");

    const ok = window.confirm(`Deactivate subject ${subject.code}?`);
    if (!ok) return;

    await deactivate(subject.id);
  }

  async function onDelete(subject) {
    setSuccessMessage("");
    setFormError("");

    const ok = window.confirm(`Delete subject ${subject.code}? This cannot be undone.`);
    if (!ok) return;

    await remove(subject.id);
  }

  function openEditTeachers(subject) {
    setSuccessMessage("");
    setFormError("");
    setEditSubject(subject);
    setEditOpen(true);
  }

  function closeEditTeachers() {
    setEditOpen(false);
    setEditSubject(null);
  }

  async function searchTeacherByEmployeeNumber(employeeNumber) {
    return await findTeacherByEmployeeNumber(employeeNumber, token);
  }

  function buildMap(teachers) {
    const m = new Map();
    (teachers || []).forEach((t) => m.set(t.id, t));
    return m;
  }

  async function saveTeachers(updatedTeachers) {
    if (!editSubject) return;

    const subjectId = editSubject.id;

    const before = editSubject.teachers || [];
    const after = updatedTeachers || [];

    const beforeMap = buildMap(before);
    const afterMap = buildMap(after);

    const toAdd = [];
    const toRemove = [];
    const toUpdate = [];

    for (const t of before) {
      if (!afterMap.has(t.id)) toRemove.push(t);
    }

    for (const t of after) {
      if (!beforeMap.has(t.id)) {
        toAdd.push(t);
      } else {
        const old = beforeMap.get(t.id);
        const oldCan = Boolean(old?.canGrade);
        const newCan = Boolean(t?.canGrade);
        if (oldCan !== newCan) toUpdate.push(t);
      }
    }

    setSavingTeachers(true);
    setSuccessMessage("");
    setFormError("");

    try {
      for (const t of toAdd) {
        await createTeachingAssignment(
          { teacherId: t.id, subjectId, canGrade: Boolean(t.canGrade) },
          token
        );
      }

      for (const t of toUpdate) {
        await updateCanGrade(
          { teacherId: t.id, subjectId, canGrade: Boolean(t.canGrade) },
          token
        );
      }

      for (const t of toRemove) {
        await deleteTeachingAssignment(t.id, subjectId, token);
      }

      await reload();
      closeEditTeachers();
      setSuccessMessage("Teaching assignments updated successfully.");
    } catch (e) {
      const msg = prettyErrorMessage(e?.message);
      alert(msg);
    } finally {
      setSavingTeachers(false);
    }
  }

  const listToRender = searchResult ? [searchResult] : items;

  return (
    <div className="container">
      <div className="page-header">
        <div>
          <h1 className="page-title">Subjects</h1>
          <div className="page-subtitle">
            Manage active and inactive subjects. Teaching assignments are edited per subject.
          </div>
        </div>

        <div className="page-header-actions">
          <button
            className="btn"
            onClick={() => {
              setSuccessMessage("");
              setFormError("");
              reload();
            }}
            disabled={loading || actionLoading}
          >
            Refresh
          </button>
        </div>
      </div>

      {error ? <div className="alert-error subjects-page-error">{error}</div> : null}

      {successMessage ? (
        <div className="alert-success subjects-page-success">{successMessage}</div>
      ) : null}

      {formError ? (
        <div className="alert-error subjects-form-error">{formError}</div>
      ) : null}

      <div className="card subjects-create-card">
        <div className="subjects-section-title">Create subject</div>

        <form onSubmit={onCreate} className="subjects-create-form">
          <input
            className="input"
            placeholder="Code (e.g. MAT1)"
            value={newCode}
            onChange={(e) => {
              setNewCode(e.target.value);
              setFormError("");
            }}
          />

          <input
            className="input"
            placeholder="Name"
            value={newName}
            onChange={(e) => {
              setNewName(e.target.value);
              setFormError("");
            }}
          />

          <input
            className="input"
            placeholder="ECTS"
            value={newEcts}
            onChange={(e) => {
              setNewEcts(e.target.value);
              setFormError("");
            }}
            inputMode="numeric"
          />

          <button className="btn btn-primary" disabled={!canCreateSubject}>
            {actionLoading ? "Creating..." : "Create"}
          </button>
        </form>
      </div>

      <div className="card subjects-filters-card">
        <div className="subjects-top-row">
          <div className="subjects-tabs">
            <button
              className={`btn ${tab === "active" ? "btn-primary" : ""}`}
              onClick={() => {
                setTab("active");
                setSearchResult(null);
                setSuccessMessage("");
                setFormError("");
              }}
              type="button"
            >
              Active
            </button>

            <button
              className={`btn ${tab === "inactive" ? "btn-primary" : ""}`}
              onClick={() => {
                setTab("inactive");
                setSearchResult(null);
                setSuccessMessage("");
                setFormError("");
              }}
              type="button"
            >
              Inactive
            </button>
          </div>

          <div className="subjects-search-group">
            <input
              className="input subjects-search-input"
              placeholder="Search (code or name)..."
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                setSuccessMessage("");
                setFormError("");
              }}
            />

            <input
              className="input subjects-exact-input"
              placeholder="Find exact code..."
              value={codeQuery}
              onChange={(e) => {
                setCodeQuery(e.target.value);
                setSuccessMessage("");
                setFormError("");
              }}
            />

            <button
              className="btn"
              type="button"
              onClick={onSearchExact}
              disabled={!codeQuery.trim() || loading}
            >
              Find exact
            </button>

            <button
              className="btn btn-ghost"
              type="button"
              onClick={clearSearch}
              disabled={!codeQuery && !searchResult}
            >
              Clear exact
            </button>
          </div>
        </div>

        <div className="subjects-bottom-row">
          <div className="subjects-meta">
            <span>
              Total in tab: <span className="mono">{total}</span>
            </span>
            <span>
              Page <span className="mono">{page}</span>/<span className="mono">{pageCount}</span>
            </span>
          </div>

          <div className="subjects-pager-controls">
            <span className="subjects-page-size-label">Page size:</span>

            <CustomSelect
              className="custom-select--compact subjects-page-size-select"
              value={take}
              onChange={(value) => {
                setTake(Number(value));
                setSuccessMessage("");
                setFormError("");
              }}
              disabled={loading}
              ariaLabel="Page size"
              showOptionCount={false}
              options={[10, 20, 50].map((value) => ({ value, label: String(value) }))}
            />

            <button className="btn" onClick={goPrev} disabled={!canPrev || loading}>
              Prev
            </button>

            <button className="btn" onClick={goNext} disabled={!canNext || loading}>
              Next
            </button>
          </div>
        </div>
      </div>

      <div className="table-wrap">
        <table className="table subjects-table">
          <colgroup>
            <col style={{ width: "6%" }} />
            <col style={{ width: "9%" }} />
            <col style={{ width: "24%" }} />
            <col style={{ width: "7%" }} />
            <col style={{ width: "34%" }} />
            <col style={{ width: "32%" }} />
          </colgroup>

          <thead>
            <tr>
              <th>No.</th>
              <th>Code</th>
              <th>Name</th>
              <th>ECTS</th>
              <th>Teachers</th>
              <th>Actions</th>
            </tr>
          </thead>

          <tbody>
            {loading ? (
              <tr>
                <td colSpan={6} style={{ padding: 10 }}>
                  Loading...
                </td>
              </tr>
            ) : listToRender.length === 0 ? (
              <tr>
                <td colSpan={6} style={{ padding: 10 }}>
                  No subjects found.
                </td>
              </tr>
            ) : (
              listToRender.map((s, i) => (
                <tr key={s.id}>
                  <td className="mono" style={{ textAlign: "center" }}>
                    {skip + i + 1}
                  </td>

                  <td className="mono">{s.code}</td>

                  <td className="subjects-name-cell" title={s.name}>
                    {s.name}
                  </td>

                  <td>{s.ects}</td>

                  <td
                    className="subjects-teachers-cell"
                    title={(s.teachers || []).map(teacherNameOnly).join(", ")}
                  >
                    {(s.teachers || []).length === 0
                      ? "-"
                      : (s.teachers || []).map(teacherNameOnly).join(", ")}
                  </td>

                  <td>
                    <div className="subjects-actions">
                      <button
                        className="btn"
                        type="button"
                        onClick={() => openEditTeachers(s)}
                        disabled={actionLoading}
                      >
                        Edit teachers
                      </button>

                      <button
                        className="btn"
                        type="button"
                        onClick={() => onDelete(s)}
                        disabled={actionLoading}
                      >
                        Delete
                      </button>

                      <button
                        className="btn"
                        type="button"
                        onClick={() => onDeactivate(s)}
                        disabled={actionLoading || !s.isActive}
                      >
                        Deactivate
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <EditSubjectTeachersModal
        open={editOpen}
        subject={editSubject}
        initialTeachers={editSubject?.teachers || []}
        saving={savingTeachers}
        onClose={closeEditTeachers}
        onSave={saveTeachers}
        onSearchTeacher={searchTeacherByEmployeeNumber}
      />
    </div>
  );
}
