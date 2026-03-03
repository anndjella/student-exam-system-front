import { useState } from "react";
import { useSsSubjects } from "../hooks/useSSSubjects";
import { EditSubjectTeachersModal } from "../components/EditSubjectTeachersModal";
import { useAuth } from "../../../auth/AuthContext";

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

  // modal state
  const [editOpen, setEditOpen] = useState(false);
  const [editSubject, setEditSubject] = useState(null);
  const [savingTeachers, setSavingTeachers] = useState(false);

  async function onSearchExact() {
    const res = await searchByCode(codeQuery);
    setSearchResult(res);
  }

  function clearSearch() {
    setSearchResult(null);
    setCodeQuery("");
  }

  async function onCreate(e) {
    e.preventDefault();

    const code = newCode.trim();
    const name = newName.trim();
    const ectsNum = Number(newEcts);

    if (!code || !name) return;
    if (!Number.isFinite(ectsNum) || ectsNum <= 0) return;

    await create({ code, name, ects: ectsNum });

    setNewCode("");
    setNewName("");
    setNewEcts("");
  }

  async function onDeactivate(subject) {
    const ok = window.confirm(`Deactivate subject ${subject.code}?`);
    if (!ok) return;
    await deactivate(subject.id);
  }

  async function onDelete(subject) {
    const ok = window.confirm(`Delete subject ${subject.code}? This cannot be undone.`);
    if (!ok) return;
    await remove(subject.id);
  }

  function openEditTeachers(subject) {
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

        <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
          <button className="btn" onClick={reload} disabled={loading || actionLoading}>
            Refresh
          </button>
        </div>
      </div>

      {error ? <div className="alert-error">{error}</div> : null}

      {/* Create */}
      <div className="card" style={{ padding: 12, marginBottom: 12 }}>
        <div style={{ fontWeight: 800, marginBottom: 8 }}>Create subject</div>
        <form
          onSubmit={onCreate}
          style={{
            display: "grid",
            gap: 10,
            gridTemplateColumns: "160px 1fr 120px 160px",
          }}
        >
          <input
            className="input"
            placeholder="Code (e.g. MAT1)"
            value={newCode}
            onChange={(e) => setNewCode(e.target.value)}
          />
          <input
            className="input"
            placeholder="Name"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
          />
          <input
            className="input"
            placeholder="ECTS"
            value={newEcts}
            onChange={(e) => setNewEcts(e.target.value)}
            inputMode="numeric"
          />
          <button className="btn btn-primary" disabled={actionLoading}>
            Create
          </button>
        </form>
      </div>

      {/* Tabs + server query + exact code */}
      <div className="card" style={{ padding: 12, marginBottom: 12 }}>
        <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
          <button
            className={`btn ${tab === "active" ? "btn-primary" : ""}`}
            onClick={() => {
              setTab("active");
              setSearchResult(null);
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
            }}
            type="button"
          >
            Inactive
          </button>

          <div style={{ flex: 1 }} />

          <input
            className="input"
            style={{ width: 240 }}
            placeholder="Search (code or name)..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />

          <input
            className="input"
            style={{ width: 220 }}
            placeholder="Find exact code..."
            value={codeQuery}
            onChange={(e) => setCodeQuery(e.target.value)}
          />

          <button className="btn" type="button" onClick={onSearchExact} disabled={!codeQuery.trim() || loading}>
            Find exact
          </button>

          <button className="btn btn-ghost" type="button" onClick={clearSearch} disabled={!codeQuery && !searchResult}>
            Clear exact
          </button>
        </div>

        <div className="page-subtitle" style={{ marginTop: 8, display: "flex", gap: 12, flexWrap: "wrap" }}>
          <span>
            Total in tab: <span className="mono">{total}</span>
          </span>
          <span>
            Page <span className="mono">{page}</span>/<span className="mono">{pageCount}</span>
          </span>

          <div style={{ marginLeft: "auto", display: "flex", gap: 8, alignItems: "center" }}>
            <span style={{ whiteSpace: "nowrap" }}>Page size:</span>
            <select
              className="input"
              style={{ width: 92, padding: "6px 8px" }}
              value={take}
              onChange={(e) => setTake(Number(e.target.value))}
              disabled={loading}
            >
              <option value={10}>10</option>
              <option value={20}>20</option>
              <option value={50}>50</option>
            </select>

            <button className="btn" onClick={goPrev} disabled={!canPrev || loading}>
              Prev
            </button>
            <button className="btn" onClick={goNext} disabled={!canNext || loading}>
              Next
            </button>
          </div>
        </div>
      </div>

      {/* List */}
      <div className="table-wrap">
        <table className="table">
          <thead>
            <tr>
              <th style={{ width: 70}}>No.</th>
              <th style={{ width: 90 }}>Code</th>
              <th>Name</th>
              <th style={{ width: 80 }}>ECTS</th>
              <th>Teachers</th>
              <th style={{ width: 320 }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={5} style={{ padding: 10 }}>
                  Loading...
                </td>
              </tr>
            ) : listToRender.length === 0 ? (
              <tr>
                <td colSpan={5} style={{ padding: 10 }}>
                  No subjects found.
                </td>
              </tr>
            ) : (
              listToRender.map((s,i) => (
                <tr key={s.id}>
                  <td className="mono" style={{ textAlign: "center" }}>
                  {skip + i + 1}
                  </td>
                  <td className="mono">{s.code}</td>
                  <td>{s.name}</td>
                  <td>{s.ects}</td>
                  <td>
                    {(s.teachers || []).length === 0
                      ? "-"
                      : (s.teachers || []).map(teacherNameOnly).join(", ")}
                  </td>
                  <td>
                    <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                      <button className="btn" type="button" onClick={() => openEditTeachers(s)} disabled={actionLoading}>
                        Edit teachers
                      </button>

                      <button className="btn" type="button" onClick={() => onDelete(s)} disabled={actionLoading}>
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
