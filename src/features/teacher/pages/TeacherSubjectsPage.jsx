import { useMemo, useState } from "react";
import { useTeacherSubjects } from "../hooks/useTeacherSubjects";
import { GradeEntryPanel } from "../components/GradeEntryPanel";
import { TeacherRegistrationsViewPanel } from "../components/TeacherRegistrationsViewPanel";


function subjectLabel(s) {
  return `${s.code} · ${s.name}`;
}

export function TeacherSubjectsPage() {
  const { gradable, nonGradable, loading, error, reload } = useTeacherSubjects();

  const [tab, setTab] = useState("gradable"); // gradable | nonGradable
  const [selectedId, setSelectedId] = useState(null);

  const list = tab === "gradable" ? gradable : nonGradable;

  const selectedSubject = useMemo(() => {
    if (!selectedId) return null;
    const all = [...(gradable || []), ...(nonGradable || [])];
    return all.find((x) => x.id === selectedId) || null;
  }, [selectedId, gradable, nonGradable]);

  return (
    <div className="container">
      <div className="page-header">
        <div>
          <h1 className="page-title">My subjects</h1>
          <div className="page-subtitle">Select a subject to view registrations and enter grades.</div>
        </div>
        <button className="btn" onClick={reload} disabled={loading}>
          Refresh
        </button>
      </div>

      {error ? <div className="alert-error">{error}</div> : null}

      <div style={{ display: "grid", gridTemplateColumns: "360px 1fr", gap: 12 }}>
        {/* left */}
        <div className="card" style={{ padding: 12 }}>
          <div style={{ display: "flex", gap: 10, marginBottom: 10, flexWrap: "wrap" }}>
            <button
              className={`btn ${tab === "gradable" ? "btn-primary" : ""}`}
              type="button"
              onClick={() => {
                setTab("gradable");
                setSelectedId(null);
              }}
            >
              Can grade ({gradable.length})
            </button>

            <button
              className={`btn ${tab === "nonGradable" ? "btn-primary" : ""}`}
              type="button"
              onClick={() => {
                setTab("nonGradable");
                setSelectedId(null);
              }}
            >
              View only ({nonGradable.length})
            </button>
          </div>

          {loading ? (
            <div className="page-subtitle">Loading...</div>
          ) : list.length === 0 ? (
            <div className="page-subtitle">No subjects.</div>
          ) : (
            <div style={{ display: "grid", gap: 8 }}>
              {list.map((s) => (
                <button
                  key={s.id}
                  className="btn"
                  type="button"
                  onClick={() => setSelectedId(s.id)}
                  style={{
                    textAlign: "left",
                    height: "auto",
                    padding: "10px",
                    borderColor: selectedId === s.id ? "var(--primary)" : "var(--border)",
                  }}
                >
                  <div style={{ fontWeight: 800 }}>{s.code}</div>
                  <div className="page-subtitle">{s.name}</div>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* right */}
        {/* right */}
<div className="card" style={{ padding: 12 }}>
  {!selectedSubject ? (
    <div className="page-subtitle">Pick a subject on the left.</div>
  ) : tab === "nonGradable" ? (
    <TeacherRegistrationsViewPanel
      key={`view-${selectedSubject.id}`}
      subject={selectedSubject}
    />
  ) : (
    <GradeEntryPanel
      key={`grade-${selectedSubject.id}`}
      subject={selectedSubject}
    />
  )}
</div>


      </div>
    </div>
  );
}
