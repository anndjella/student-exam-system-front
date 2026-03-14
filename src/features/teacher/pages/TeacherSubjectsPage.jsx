import { useMemo, useState } from "react";
import { useTeacherSubjects } from "../hooks/useTeacherSubjects";
import { GradeEntryPanel } from "../components/GradeEntryPanel";
import { TeacherRegistrationsViewPanel } from "../components/TeacherRegistrationsViewPanel";

export function TeacherSubjectsPage() {
  const { gradable, nonGradable, loading, error, reload } = useTeacherSubjects();

  const [tab, setTab] = useState("gradable"); // gradable | nonGradable
  const [selectedId, setSelectedId] = useState(null);

  const list = tab === "gradable" ? gradable : nonGradable;

  const selectedSubject = useMemo(() => {
    const currentList = tab === "gradable" ? gradable : nonGradable;

    if (!currentList?.length) return null;

    if (!selectedId) return currentList[0] || null;

    return currentList.find((x) => x.id === selectedId) || currentList[0] || null;
  }, [selectedId, gradable, nonGradable, tab]);

  function handleTabChange(nextTab) {
    setTab(nextTab);
    setSelectedId(null);
  }

  return (
    <div className="container">
      <div className="page-header teacher-subjects-header">
        <div>
          <h1 className="page-title">My subjects</h1>
          <div className="page-subtitle">
            Select a subject to view registrations and enter grades.
          </div>
        </div>

        <button className="btn teacher-subjects-refresh" onClick={reload} disabled={loading}>
          {loading ? "Refreshing..." : "Refresh"}
        </button>
      </div>

      {error ? (
        <div className="alert-error teacher-subjects-error">
          {error}
        </div>
      ) : null}

      <div className="teacher-subjects-layout">
        {/* left */}
        <aside className="card teacher-subjects-sidebar">
          <div className="teacher-subjects-tabs">
            <button
              className={`btn ${tab === "gradable" ? "btn-primary" : ""}`}
              type="button"
              onClick={() => handleTabChange("gradable")}
            >
              Can grade ({gradable.length})
            </button>

            <button
              className={`btn ${tab === "nonGradable" ? "btn-primary" : ""}`}
              type="button"
              onClick={() => handleTabChange("nonGradable")}
            >
              View only ({nonGradable.length})
            </button>
          </div>

          {loading ? (
            <div className="page-subtitle">Loading...</div>
          ) : list.length === 0 ? (
            <div className="page-subtitle">No subjects.</div>
          ) : (
            <div className="teacher-subjects-list">
              {list.map((s) => {
                const isSelected = selectedSubject?.id === s.id;

                return (
                  <button
                    key={s.id}
                    className={`teacher-subject-card ${isSelected ? "teacher-subject-card--selected" : ""}`}
                    type="button"
                    onClick={() => setSelectedId(s.id)}
                  >
                    <div className="teacher-subject-card__code">{s.code}</div>
                    <div className="teacher-subject-card__name">{s.name}</div>
                  </button>
                );
              })}
            </div>
          )}
        </aside>

        {/* right */}
        <section className="teacher-subjects-content">
          {!selectedSubject ? (
            <div className="card teacher-subjects-empty">
              <div className="page-subtitle">Pick a subject on the left.</div>
            </div>
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
        </section>
      </div>
    </div>
  );
}