import { useMemo, useState } from "react";
import { useStudentRegistrations } from "../hooks/useStudentRegistrations";

/* helpers */

function subjectIdOf(s) {
  return s.id ?? s.subjectID ?? s.subjectId;
}

function subjectLabel(s) {
  const code = s.code ?? "-";
  const name = s.name ?? "";
  return `${code}${name ? " · " + name : ""}`;
}

function teacherNames(teachers) {
  if (!teachers || teachers.length === 0) return "-";
  return teachers.map(t => `${t.firstName} ${t.lastName}`).join(", ");
}

/* page */

export function StudentRegistrationsPage() {
  const {
    activeRegs,
    subjects,
    terms,
    selectedTermId,
    setSelectedTermId,
    termIdOf,
    termLabel,
    loading,
    actionLoading,
    error,
    reloadAll,
    canRegister,
    create,
    cancel,
  } = useStudentRegistrations();

  const [query, setQuery] = useState("");

  const filteredSubjects = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return subjects || [];
    return (subjects || []).filter(
      s =>
        (s.code || "").toLowerCase().includes(q) ||
        (s.name || "").toLowerCase().includes(q)
    );
  }, [subjects, query]);

  async function onRegister(s) {
    const sid = subjectIdOf(s);
    if (!sid) return;
    await create(sid);
  }

  async function onCancel(r) {
    const sid = r.subjectID ?? r.subjectId;
    const tid = r.termID ?? r.termId;
    if (!sid || !tid) return;

    const code = r.subjectCode ?? r.code ?? "";
    const ok = window.confirm(`Cancel registration ${code ? code : ""}?`);
    if (!ok) return;

    await cancel(sid, tid);
  }

  return (
    <div className="container">
      <div className="page-header">
        <div>
          <h1 className="page-title">Registrations</h1>
          <div className="page-subtitle">
            Register exams during an open term and manage your active registrations.
          </div>
        </div>

        <button
          className="btn"
          onClick={reloadAll}
          disabled={loading || actionLoading}
        >
          Refresh
        </button>
      </div>

      {error ? <div className="alert-error">{error}</div> : null}

      {/* Create registration */}
      <div className="card" style={{ padding: 12, marginBottom: 12 }}>
        <div style={{ display: "flex", gap: 12, alignItems: "center", flexWrap: "wrap" }}>
          <div style={{ fontWeight: 900 }}>Create registration</div>
          <div style={{ flex: 1 }} />

          <select
            className="input"
            style={{ width: 320 }}
            value={selectedTermId || ""}
            onChange={e => setSelectedTermId(Number(e.target.value))}
            disabled={loading || (terms || []).length === 0}
            title="Select an open term"
          >
            {(terms || []).length === 0 ? (
              <option value="">No open terms</option>
            ) : (
              (terms || []).map(t => (
                <option key={termIdOf(t)} value={termIdOf(t)}>
                  {termLabel(t)}
                </option>
              ))
            )}
          </select>

          <input
            className="input"
            style={{ width: 240 }}
            placeholder="Search subjects..."
            value={query}
            onChange={e => setQuery(e.target.value)}
          />
        </div>

        <div className="page-subtitle" style={{ marginTop: 8 }}>
          You can register only for subjects you have not passed.
        </div>

        <div className="table-wrap" style={{ marginTop: 10 }}>
          <table className="table">
           <thead>
            <tr>
              <th style={{ width: 120 }}>Code</th>
              <th>Subject</th>
              <th>Teachers</th>
              <th style={{ width: 90 }}>ECTS</th>
              <th style={{ width: 160 }}>Actions</th>
            </tr>
          </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={4} style={{ padding: 10 }}>
                    Loading...
                  </td>
                </tr>
              ) : filteredSubjects.length === 0 ? (
                <tr>
                  <td colSpan={4} style={{ padding: 10 }}>
                    No subjects available.
                  </td>
                </tr>
              ) : (
                filteredSubjects.map(s => (
                  <tr key={subjectIdOf(s)}>
                      <td className="mono">
                        {s.code ?? "-"}
                      </td>

                      <td>
                        <div style={{ fontWeight: 750 }}>
                          {s.name ?? "-"}
                        </div>
                      </td>

                      <td className="page-subtitle">
                        {teacherNames(s.teachers)}
                      </td>

                      <td>
                        {s.ects ?? "-"}
                      </td>

                      <td>
                        <button
                          className="btn btn-primary"
                          disabled={!canRegister || actionLoading}
                          onClick={() => onRegister(s)}
                          title={!selectedTermId ? "Select an open term first." : ""}
                        >
                          Register
                        </button>
                      </td>
                    </tr>

                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Active registrations */}
      <div className="card" style={{ padding: 12 }}>
        <div style={{ fontWeight: 900, marginBottom: 8 }}>
          My active registrations
        </div>

        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th>Subject</th>
                <th style={{ width: 220 }}>Term</th>
                <th style={{ width: 160 }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={3} style={{ padding: 10 }}>
                    Loading...
                  </td>
                </tr>
              ) : activeRegs.length === 0 ? (
                <tr>
                  <td colSpan={3} style={{ padding: 10 }}>
                    No active registrations.
                  </td>
                </tr>
              ) : (
                activeRegs.map((r, idx) => (
                  <tr
                    key={`${r.subjectID ?? r.subjectId}-${r.termID ?? r.termId}-${idx}`}
                  >
                    <td>
                      <div className="page-subtitle">
                        {r.subjectName ?? r.name ?? ""}
                      </div>
                    </td>
                    <td>{r.termName ?? r.term ?? "-"}</td>
                    <td>
                      <button
                        className="btn"
                        disabled={actionLoading}
                        onClick={() => onCancel(r)}
                      >
                        Cancel
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="page-subtitle" style={{ marginTop: 10 }}>
          You can cancel only while the term is open for registration.
        </div>
      </div>
    </div>
  );
}
