import { useMemo, useState } from "react";
import TeacherExamTable from "../components/TeacherExamTable";
import { useTeacherExamsPage } from "../hooks/useTeacherExams";

export function TeacherExamsPage() {
  const {
    gradableSubjects,
    nonGradableSubjects,
    terms,
    data,
    loadingInit,
    loadingExams,
    error,
    reload,
    loadExams,
  } = useTeacherExamsPage();

  const allSubjects = useMemo(() => {
    return [...(gradableSubjects ?? []), ...(nonGradableSubjects ?? [])];
  }, [gradableSubjects, nonGradableSubjects]);

  const [tab, setTab] = useState("mine");
  const [selectedSubjectId, setSelectedSubjectId] = useState("");
  const [selectedTermId, setSelectedTermId] = useState("");
  const [hasLoaded, setHasLoaded] = useState(false);

  const canLoad = Boolean(selectedSubjectId) && Boolean(selectedTermId);

  const mineCount = hasLoaded ? (data?.mine?.length ?? 0) : 0;
  const othersCount = hasLoaded ? (data?.others?.length ?? 0) : 0;

  const tableData = useMemo(() => {
    if (!hasLoaded) return [];
    return tab === "mine" ? (data?.mine ?? []) : (data?.others ?? []);
  }, [tab, data, hasLoaded]);

  const showTeacher = tab === "others";

  async function handleLoad() {
    if (!canLoad) return;

    await loadExams(Number(selectedSubjectId), Number(selectedTermId));
    setHasLoaded(true);
  }

  async function handleRefresh() {
    if (!canLoad || !hasLoaded) return;

    await reload(Number(selectedSubjectId), Number(selectedTermId));
  }

  return (
    <div className="container">
      <div className="page-header">
        <div>
          <h1 className="page-title">Exams</h1>
          <div className="page-subtitle">
            Select a subject and term to view entered grades.
          </div>
        </div>

        <button
          className="btn"
          onClick={handleRefresh}
          disabled={loadingInit || loadingExams || !hasLoaded || !canLoad}
          type="button"
        >
          Refresh
        </button>
      </div>

      {error && <div className="alert-error">Request failed ({error})</div>}

      <div className="card" style={{ padding: 14 }}>
        <div
          className="toolbar"
          style={{ alignItems: "end", gap: 14, flexWrap: "wrap" }}
        >
          <div className="form-field">
            <span>Subject</span>
            <select
              className="input"
              value={selectedSubjectId}
              onChange={(e) => setSelectedSubjectId(e.target.value)}
              disabled={loadingInit}
            >
              <option value="">Select subject</option>
              {allSubjects.map((s) => {
                const id = s?.subjectID ?? s?.id;
                const label = s?.code
                  ? `${s.code} · ${s.name}`
                  : s?.name ?? `#${id}`;

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
              value={selectedTermId}
              onChange={(e) => setSelectedTermId(e.target.value)}
              disabled={loadingInit}
            >
              <option value="">Select term</option>
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

          <div style={{ display: "flex", alignItems: "end" }}>
            <button
              className="btn btn-primary"
              onClick={handleLoad}
              disabled={!canLoad || loadingInit || loadingExams}
              type="button"
            >
              Load
            </button>
          </div>
        </div>
      </div>

      <div style={{ height: 14 }} />

      <div className="card" style={{ padding: 14 }}>
        <div className="toolbar" style={{ justifyContent: "space-between" }}>
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
            <button
              className={`btn ${tab === "mine" ? "btn-primary" : ""}`}
              onClick={() => setTab("mine")}
              type="button"
              disabled={!hasLoaded}
            >
              Entered by me ({mineCount})
            </button>

            <button
              className={`btn ${tab === "others" ? "btn-primary" : ""}`}
              onClick={() => setTab("others")}
              type="button"
              disabled={!hasLoaded}
            >
              Entered by others ({othersCount})
            </button>
          </div>

          {loadingExams && hasLoaded && <span className="badge">Loading...</span>}
        </div>

        <div style={{ height: 12 }} />

        {!hasLoaded ? (
          <div className="page-subtitle center" style={{ padding: 20 }}>
            Select subject and term, then click Load.
          </div>
        ) : (
          <TeacherExamTable exams={tableData} showTeacher={showTeacher} />
        )}
      </div>
    </div>
  );
}