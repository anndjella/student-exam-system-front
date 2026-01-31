import { useMemo, useState } from "react";
import { useStudentExams } from "../hooks/useStudentExams";
import { useMe } from "../../shared/hooks/useMe"; // adjust path if needed

function formatDate(value) {
  if (!value) return "-";
  const iso = String(value).slice(0, 10);
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function formatGpa(value) {
  if (value === null || value === undefined) return "-";
  const num = Number(value);
  if (Number.isNaN(num)) return String(value);
  return num.toFixed(2);
}

function ExamsTable({ items, emptyText }) {
  if (!items || items.length === 0) {
    return (
      <div className="page-subtitle center" style={{ padding: 12 }}>
        {emptyText}
      </div>
    );
  }

  return (
    <div className="table-wrap">
      <table className="table">
        <thead>
          <tr>
            <th>#</th>
            <th>Code</th>
            <th>Subject</th>
            <th>ECTS</th>
            <th>Term</th>
            <th>Date</th>
            <th>Teacher</th>
            <th>Grade</th>
            <th>Note</th>
          </tr>
        </thead>
        <tbody>
          {items.map((x, idx) => (
            <tr key={x.id ?? x.ID ?? idx}>
              <td className="mono">{idx + 1}</td>
              <td className="mono">{x.subjectCode ?? x.SubjectCode ?? "-"}</td>
              <td>{x.subjectName ?? x.SubjectName ?? "-"}</td>
              <td className="mono">{x.subjectECTS ?? x.SubjectECTS ?? "-"}</td>
              <td>{x.termName ?? x.TermName ?? "-"}</td>
              <td className="mono">{formatDate(x.date ?? x.Date)}</td>
              <td>{x.teacherName ?? x.TeacherName ?? "-"}</td>
              <td className="mono">{(x.grade ?? x.Grade) ?? "-"}</td>
              <td>{(x.note ?? x.Note) || "-"}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function StatPill({ label, value }) {
  return (
    <div
      className="badge"
      style={{
        height: "auto",
        padding: "8px 10px",
        borderRadius: 12,
        display: "flex",
        gap: 8,
        alignItems: "baseline",
      }}
    >
      <span className="page-subtitle" style={{ margin: 0 }}>
        {label}
      </span>
      <span className="mono" style={{ fontWeight: 900 }}>
        {value}
      </span>
    </div>
  );
}

export function StudentExamsPage() {
  const { passed, notPassed, loading, error, reload } = useStudentExams();
  const { me, loading: meLoading } = useMe();

  // Default open: Passed
  const [tab, setTab] = useState("passed"); // "passed" | "notPassed"

  const activeItems = useMemo(
    () => (tab === "passed" ? passed : notPassed),
    [tab, passed, notPassed]
  );

  const activeEmptyText =
    tab === "passed" ? "No passed exams yet." : "No failed exams.";

  // Support both camelCase and PascalCase
  const gpa = me?.gpa ?? me?.GPA;
  const ectsCount = me?.ectsCount ?? me?.ECTSCount;

  return (
    <div className="container">
      <div className="page-header">
        <div>
          <h1 className="page-title">My Exams</h1>
          <div className="page-subtitle">
            Signed exams. Choose Passed or Not passed.
          </div>
        </div>

        <button className="btn" onClick={reload} disabled={loading}>
          Refresh
        </button>
      </div>

      {loading && <div className="page-subtitle">Loading...</div>}
      {!loading && error && <div className="alert-error">{error}</div>}

      {!loading && !error && (
        <div className="card" style={{ padding: 16 }}>
          {/* Tabs on the left, stats on the right */}
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              gap: 12,
              marginBottom: 12,
              flexWrap: "wrap",
            }}
          >
            <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
              <button
                className={"btn" + (tab === "passed" ? " btn-primary" : "")}
                onClick={() => setTab("passed")}
              >
                Passed
                <span className="badge" style={{ marginLeft: 10 }}>
                  {passed.length}
                </span>
              </button>

              <button
                className={"btn" + (tab === "notPassed" ? " btn-primary" : "")}
                onClick={() => setTab("notPassed")}
              >
                Not passed
                <span className="badge" style={{ marginLeft: 10 }}>
                  {notPassed.length}
                </span>
              </button>
            </div>

            {tab === "passed" && (
              <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                <StatPill
                  label="ECTS"
                  value={meLoading ? "..." : (ectsCount ?? 0)}
                />
                <StatPill
                  label="GPA"
                  value={meLoading ? "..." : formatGpa(gpa)}
                />
              </div>
            )}
          </div>

          <ExamsTable items={activeItems} emptyText={activeEmptyText} />
        </div>
      )}
    </div>
  );
}
