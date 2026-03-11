import { useMemo, useState } from "react";
import { useStudentExams } from "../hooks/useStudentExams";
import { useMe } from "../../shared/hooks/useMe";
import { formatDate } from "../../../utils/datetime";

function formatGrade(value) {
  if (value === null || value === undefined) {
    return "N.I.";
  }
  return value;
}

function formatGpa(value) {
  if (value === null || value === undefined) return "-";
  const num = Number(value);
  if (Number.isNaN(num)) return String(value);
  return num.toFixed(2);
}

function sortIndicator(column, sortBy, sortDir) {
  if (sortBy !== column) return "↕";
  return sortDir === "asc" ? "↑" : "↓";
}

function ExamsTable({ items, emptyText, sortBy, sortDir, onSort }) {
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
            <th style={{ width: 50 }}>No</th>
            <th style={{ width: 80 }}>Code</th>
            <th>Subject</th>

            <th
              style={{ width: 80, cursor: "pointer", userSelect: "none" }}
              onClick={() => onSort("ects")}
            >
              ECTS {sortIndicator("ects", sortBy, sortDir)}
            </th>

            <th>Term</th>

            <th
              style={{ cursor: "pointer", userSelect: "none" }}
              onClick={() => onSort("date")}
            >
              Date {sortIndicator("date", sortBy, sortDir)}
            </th>

            <th>Teacher</th>

            <th
              style={{ width: 80, cursor: "pointer", userSelect: "none" }}
              onClick={() => onSort("grade")}
            >
              Grade {sortIndicator("grade", sortBy, sortDir)}
            </th>

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
              <td className="mono">{formatGrade(x.grade ?? x.Grade)}</td>
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

  const [tab, setTab] = useState("passed");
  const [sortBy, setSortBy] = useState(null); // "ects" | "date" | "grade" | null
  const [sortDir, setSortDir] = useState("asc"); // "asc" | "desc"

  function handleSort(column) {
    if (sortBy === column) {
      setSortDir((prev) => (prev === "asc" ? "desc" : "asc"));
    } else {
      setSortBy(column);
      setSortDir("asc");
    }
  }

  const activeItems = useMemo(() => {
    return tab === "passed" ? passed : notPassed;
  }, [tab, passed, notPassed]);

  const sortedItems = useMemo(() => {
    const arr = [...activeItems];

    if (!sortBy) return arr;

    arr.sort((a, b) => {
      if (sortBy === "ects") {
        const aVal = Number(a.subjectECTS ?? a.SubjectECTS ?? 0);
        const bVal = Number(b.subjectECTS ?? b.SubjectECTS ?? 0);
        return sortDir === "asc" ? aVal - bVal : bVal - aVal;
      }

      if (sortBy === "grade") {
        const aVal = Number(a.grade ?? a.Grade ?? 0);
        const bVal = Number(b.grade ?? b.Grade ?? 0);
        return sortDir === "asc" ? aVal - bVal : bVal - aVal;
      }

      if (sortBy === "date") {
        const aVal = new Date(a.date ?? a.Date ?? 0).getTime();
        const bVal = new Date(b.date ?? b.Date ?? 0).getTime();
        return sortDir === "asc" ? aVal - bVal : bVal - aVal;
      }

      return 0;
    });

    return arr;
  }, [activeItems, sortBy, sortDir]);

  const activeEmptyText =
    tab === "passed" ? "No passed exams yet." : "No failed exams.";

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

          <ExamsTable
            items={sortedItems}
            emptyText={activeEmptyText}
            sortBy={sortBy}
            sortDir={sortDir}
            onSort={handleSort}
          />
        </div>
      )}
    </div>
  );
}