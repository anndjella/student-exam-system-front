import { useStudentSubjects } from "../hooks/useStudentSubjects";

function teacherNames(teachers) {
  if (!teachers || teachers.length === 0) return "-";
  return teachers.map(t => `${t.firstName} ${t.lastName}`).join(", ");
}

export function StudentSubjectsPage() {
  const { subjects, loading, error, reload } = useStudentSubjects();

  return (
    <div className="container">
      <div className="page-header">
        <h1 className="page-title">My Subjects</h1>
        <button className="btn" onClick={reload} disabled={loading}>
          Refresh
        </button>
      </div>

      {loading && <div className="info">Loading...</div>}

      {!loading && error && <div className="alert-error">{error}</div>}

      {!loading && !error && subjects.length === 0 && (
        <div className="info">You are not enrolled in any subjects.</div>
      )}

      {!loading && !error && subjects.length > 0 && (
        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th style={{ width: 70 }}>No.</th>
                <th style={{ width: 120 }}>Code</th>
                <th>Name</th>
                <th style={{ width: 90 }}>ECTS</th>
                <th style={{ minWidth: 260 }}>Teachers</th>
              </tr>
            </thead>

            <tbody>
              {subjects.map((s, idx) => (
                <tr key={s.id}>
                  <td>{idx + 1}</td>
                  <td className="mono">{s.code}</td>
                  <td>{s.name}</td>
                  <td className="center">{s.ects}</td>
                  <td>{teacherNames(s.teachers)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
