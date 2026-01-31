import { useMemo, useState } from "react";
import { useSsSubjects } from "../hooks/useSsSubjects";
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
    active,
    inactive,
    loading,
    actionLoading,
    error,
    reload,
    searchByCode,
    deactivate,
    remove,
    create,
  } = useSsSubjects();

  const [tab, setTab] = useState("active");
  const [codeQuery, setCodeQuery] = useState("");
  const [searchResult, setSearchResult] = useState(null);

  const [newCode, setNewCode] = useState("");
  const [newName, setNewName] = useState("");
  const [newEcts, setNewEcts] = useState("");

  // modal state
  const [editOpen, setEditOpen] = useState(false);
  const [editSubject, setEditSubject] = useState(null);
  const [savingTeachers, setSavingTeachers] = useState(false);

  const list = tab === "active" ? active : inactive;

  const filteredList = useMemo(() => {
    const q = codeQuery.trim().toLowerCase();
    if (!q) return list;
    return list.filter((s) => (s.code || "").toLowerCase().includes(q));
  }, [list, codeQuery]);

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
    setTab("active");
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
    // returns TeacherResponse from backend
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

    // removed: in before but not in after
    for (const t of before) {
      if (!afterMap.has(t.id)) toRemove.push(t);
    }

    // added + canGrade changes
    for (const t of after) {
      if (!beforeMap.has(t.id)) {
        toAdd.push(t);
      } else {
        const old = beforeMap.get(t.id);
        const oldCan = Boolean(old?.canGrade);
        const newCan = Boolean(t?.canGrade);
        if (oldCan !== newCan) {
          toUpdate.push(t);
        }
      }
    }

    setSavingTeachers(true);
    try {
      // 1) add
      for (const t of toAdd) {
        await createTeachingAssignment(
          { teacherId: t.id, subjectId, canGrade: Boolean(t.canGrade) },
          token
        );
      }

      // 2) update canGrade
      for (const t of toUpdate) {
        await updateCanGrade(
          { teacherId: t.id, subjectId, canGrade: Boolean(t.canGrade) },
          token
        );
      }

      // 3) remove
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

  return (
    <div className="container">
      <div className="page-header">
        <div>
          <h1 className="page-title">Subjects</h1>
          <div className="page-subtitle">Manage active and inactive subjects. And teaching assignments for subjects.</div>
        </div>
        <button className="btn" onClick={reload} disabled={loading || actionLoading}>
          Refresh
        </button>
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
        {/* <div className="page-subtitle" style={{ marginTop: 8 }}>
          Teachers are managed via Teaching Assignments.
        </div> */}
      </div>

      {/* Tabs + Search */}
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
            Active ({active.length})
          </button>

          <button
            className={`btn ${tab === "inactive" ? "btn-primary" : ""}`}
            onClick={() => {
              setTab("inactive");
              setSearchResult(null);
            }}
            type="button"
          >
            Inactive ({inactive.length})
          </button>

          <div style={{ flex: 1 }} />

          <input
            className="input"
            style={{ width: 220 }}
            placeholder="Search by code..."
            value={codeQuery}
            onChange={(e) => setCodeQuery(e.target.value)}
          />

          <button className="btn" type="button" onClick={onSearchExact} disabled={!codeQuery.trim() || loading}>
            Find exact
          </button>

          <button className="btn btn-ghost" type="button" onClick={clearSearch} disabled={!codeQuery && !searchResult}>
            Clear
          </button>
        </div>
      </div>

      {/* List */}
      <div className="table-wrap">
        <table className="table">
          <thead>
            <tr>
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
            ) : filteredList.length === 0 ? (
              <tr>
                <td colSpan={5} style={{ padding: 10 }}>
                  No subjects found.
                </td>
              </tr>
            ) : (
              filteredList.map((s) => (
                <tr key={s.id}>
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
