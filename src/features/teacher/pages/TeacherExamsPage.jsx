import { useMemo, useState } from "react";
import { CustomSelect } from "../../shared/components/CustomSelect";
import TeacherExamTable from "../components/TeacherExamTable";
import { useTeacherExamsPage } from "../hooks/useTeacherExams";

export function TeacherExamsPage() {
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
    loadExams,
  } = useTeacherExamsPage();

  const allSubjects = useMemo(() => {
    return [...(gradableSubjects ?? []), ...(nonGradableSubjects ?? [])];
  }, [gradableSubjects, nonGradableSubjects]);

  const [tab, setTab] = useState("mine");
  const [hasLoaded, setHasLoaded] = useState(false);

  const canLoad = Boolean(subjectId) && Boolean(termId);

  const mineCount = hasLoaded ? (data?.mine?.length ?? 0) : 0;
  const othersCount = hasLoaded ? (data?.others?.length ?? 0) : 0;

  const tableData = useMemo(() => {
    if (!hasLoaded) return [];
    return tab === "mine" ? (data?.mine ?? []) : (data?.others ?? []);
  }, [tab, data, hasLoaded]);

  const showTeacher = tab === "others";

  async function handleLoad() {
    if (!canLoad) return;

    await loadExams(Number(subjectId), Number(termId));
    setHasLoaded(true);
    setTab("mine");
  }

  async function handleRefresh() {
    if (!hasLoaded) return;
    await reload();
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
          disabled={loadingInit || loadingExams || !hasLoaded}
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
            <CustomSelect
              value={subjectId}
              onChange={setSubjectId}
              disabled={loadingInit}
              loading={loadingInit}
              placeholder="Select subject..."
              ariaLabel="Subject"
              options={allSubjects.map((s) => {
                const id = s?.subjectID ?? s?.id;
                const label = s?.code
                  ? `${s.code} · ${s.name}`
                  : s?.name ?? `#${id}`;
                return { key: id, value: String(id), label };
              })}
            />
          </div>

          <div className="form-field">
            <span>Term</span>
            <CustomSelect
              value={termId}
              onChange={setTermId}
              disabled={loadingInit}
              loading={loadingInit}
              placeholder="Select term..."
              ariaLabel="Term"
              options={terms.map((t) => {
                const id = t?.termID ?? t?.id;
                const label = t?.name ?? t?.termName ?? `Term ${id}`;
                return { key: id, value: String(id), label };
              })}
            />
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
