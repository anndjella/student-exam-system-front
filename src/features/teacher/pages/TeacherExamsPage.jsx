import { useMemo, useState } from "react";
import TeacherExamTable from "../components/TeacherExamTable";
import { useTeacherExamsPage } from "../hooks/useTeacherExams";

export  function TeacherExamsPage() {
  const {
    gradableSubjects,
    nonGradableSubjects,
    terms,
    subjectId,
    setSubjectId,
    termId,
    setTermId,
    data,
    loadingInit,
    loadingExams,
    error,
    reload,
  } = useTeacherExamsPage();

  const allSubjects = [...gradableSubjects, ...nonGradableSubjects];

  const mineCount = data?.mine?.length ?? 0;
  const othersCount = data?.others?.length ?? 0;

  const [tab, setTab] = useState("mine"); // "mine" | "others"

  const tableData = useMemo(() => {
    return tab === "mine" ? data?.mine ?? [] : data?.others ?? [];
  }, [tab, data]);

  const showTeacher = tab === "others";

  return (
    <div className="container">
      <div className="page-header">
        <div>
          <h1 className="page-title">Exams</h1>
          <div className="page-subtitle">
            Select a subject and term to view entered grades.
          </div>
        </div>

        <button className="btn" onClick={reload} disabled={loadingInit || loadingExams}>
          Refresh
        </button>
      </div>

      {error && <div className="alert-error">Request failed ({error})</div>}

      <div className="card" style={{ padding: 14 }}>
        <div className="toolbar">
          <div className="form-field">
            <span>Subject</span>
            <select
              className="input"
              value={subjectId ?? ""}
              onChange={(e) => setSubjectId(Number(e.target.value))}
              disabled={loadingInit}
            >
              {allSubjects.map((s) => {
                const id = s?.subjectID ?? s?.id;
                const label = s?.code ? `${s.code} · ${s.name}` : s?.name ?? `#${id}`;
                return (
                  <option key={id} value={id}>
                    {label}
                  </option>
                );
              })}
            </select>
          </div>

          <div className="form-field">
            <span>Term</span>
            <select
              className="input"
              value={termId ?? ""}
              onChange={(e) => setTermId(Number(e.target.value))}
              disabled={loadingInit}
            >
              {terms.map((t) => {
                const id = t?.termID ?? t?.id;
                const label = t?.name ?? t?.termName ?? `Term ${id}`;
                return (
                  <option key={id} value={id}>
                    {label}
                  </option>
                );
              })}
            </select>
          </div>
        </div>
      </div>

      <div style={{ height: 14 }} />

      <div className="card" style={{ padding: 14 }}>
        <div className="toolbar" style={{ justifyContent: "space-between" }}>
          <div style={{ display: "flex", gap: 10 }}>
            <button
              className={`btn ${tab === "mine" ? "btn-primary" : ""}`}
              onClick={() => setTab("mine")}
              type="button"
            >
              Entered by me ({mineCount})
            </button>

            <button
              className={`btn ${tab === "others" ? "btn-primary" : ""}`}
              onClick={() => setTab("others")}
              type="button"
            >
              Entered by others ({othersCount})
            </button>
          </div>

          {loadingExams && <span className="badge">Loading...</span>}
        </div>

        <div style={{ height: 12 }} />

        <TeacherExamTable exams={tableData} showTeacher={showTeacher} />
      </div>
    </div>
  );
}