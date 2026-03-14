import { useEffect, useState } from "react";
import { useAuth } from "../../../auth/AuthContext";
import { useTerms } from "../../shared/hooks/useTerms";
import { fetchAllWithInactive } from "../api/subjectsSSApi";
import { useSSExams } from "../hooks/useSSExams";
import { formatDate, formatDateTime } from "../../../utils/datetime";

/* helpers */
const pick = (obj, ...keys) => {
  for (const k of keys) {
    const v = obj?.[k];
    if (v !== undefined && v !== null && v !== "") return v;
  }
  return "";
};

function prettyErrorMessage(message) {
  if (!message) return "Request failed.";

  try {
    const obj = JSON.parse(message);
    return obj.detail || obj.Detail || obj.title || obj.Title || "Request failed.";
  } catch {
    return message;
  }
}

function termIdOf(t) {
  return pick(t, "termID", "TermID", "id", "ID");
}

function subjectIdOf(s) {
  return pick(s, "subjectID", "SubjectID", "id", "ID");
}

function termKeyOf(t, idx) {
  return termIdOf(t) ?? `${pick(t, "termName", "TermName") || "term"}-${idx}`;
}

function subjectKeyOf(s, idx) {
  return subjectIdOf(s) ?? `${pick(s, "code", "Code") || "subject"}-${idx}`;
}

function termLabel(t) {
  return pick(t, "termName", "TermName") || "-";
}

function subjectLabel(s) {
  const code = pick(s, "code", "Code");
  const name = pick(s, "name", "Name");
  return code ? `${code} · ${name || "-"}` : name || "-";
}

function formatGrade(v) {
  if (v === null || v === undefined) return "N.I.";
  if (typeof v === "string" && v.trim() === "") return "N.I.";
  return v;
}

function normalizeSubjectsResponse(res) {
  if (Array.isArray(res)) {
    const looksLikeSubject = res.some(
      (x) => x && (x.code || x.Code || x.name || x.Name) && !(x.subjects || x.Subjects)
    );
    if (looksLikeSubject) return res;

    const flat = [];
    for (const g of res) {
      const items =
        (Array.isArray(g?.subjects) && g.subjects) ||
        (Array.isArray(g?.Subjects) && g.Subjects) ||
        (Array.isArray(g?.items) && g.items) ||
        (Array.isArray(g?.Items) && g.Items) ||
        [];
      flat.push(...items);
    }
    return flat;
  }

  const groups =
    (Array.isArray(res?.groups) && res.groups) ||
    (Array.isArray(res?.Groups) && res.Groups) ||
    null;

  if (Array.isArray(groups)) {
    const flat = [];
    for (const g of groups) {
      const items =
        (Array.isArray(g?.subjects) && g.subjects) ||
        (Array.isArray(g?.Subjects) && g.Subjects) ||
        (Array.isArray(g?.items) && g.items) ||
        (Array.isArray(g?.Items) && g.Items) ||
        [];
      flat.push(...items);
    }
    return flat;
  }

  if (res && typeof res === "object") {
    const vals = Object.values(res);

    const directSubjects = vals.find(
      (v) => Array.isArray(v) && v.some((x) => x && (x.code || x.Code || x.name || x.Name))
    );
    if (Array.isArray(directSubjects)) return directSubjects;

    const groupArrays = vals.filter(Array.isArray);
    if (groupArrays.length) {
      const flat = [];
      for (const maybeGroups of groupArrays) {
        for (const g of maybeGroups) {
          const items =
            (Array.isArray(g?.subjects) && g.subjects) ||
            (Array.isArray(g?.Subjects) && g.Subjects) ||
            (Array.isArray(g?.items) && g.items) ||
            (Array.isArray(g?.Items) && g.Items) ||
            [];
          flat.push(...items);
        }
      }
      return flat;
    }
  }

  return [];
}

export function ExamsPage() {
  const { token, role } = useAuth();
  const isStudentService = role === "StudentService";

  const {
    terms,
    loading: termsLoading,
    error: termsError,
  } = useTerms();

  const [subjects, setSubjects] = useState([]);
  const [subjectsLoading, setSubjectsLoading] = useState(false);
  const [subjectsError, setSubjectsError] = useState("");

  const exams = useSSExams(20);
  const canRun = Boolean(exams.canSearch);
  const items = exams.items || [];

  useEffect(() => {
    let alive = true;

    async function loadSubjects() {
      if (!token) return;

      setSubjectsLoading(true);
      setSubjectsError("");

      try {
        const res = await fetchAllWithInactive(token);
        if (!alive) return;
        setSubjects(normalizeSubjectsResponse(res));
      } catch (e) {
        if (!alive) return;
        setSubjectsError(e?.userMessage || e?.message || "Failed to load subjects.");
        setSubjects([]);
      } finally {
        if (!alive) return;
        setSubjectsLoading(false);
      }
    }

    loadSubjects();

    return () => {
      alive = false;
    };
  }, [token]);

  function onKeyDown(e) {
    if (e.key === "Enter") {
      e.preventDefault();
      exams.search();
    }
  }

  if (!isStudentService) {
    return (
      <div className="container">
        <div className="alert-error">Forbidden</div>
      </div>
    );
  }

  return (
    <div className="container">
      <div className="page-header exams-page-header">
        <div className="page-header-text">
          <h1 className="page-title">Exams</h1>
          <div className="page-subtitle">
            Choose term and subject, optionally filter by student index.
          </div>
        </div>

        <div className="page-header-actions">
          <button
            className="btn"
            onClick={exams.reload}
            disabled={exams.loading || !canRun}
            type="button"
          >
            Refresh list
          </button>
        </div>
      </div>

      <div className="card filters-card">
        <div className="filters-grid filters-grid-3">
          <div className="filter-field">
            <div className="page-subtitle filter-label">Term</div>
            <select
              className="input"
              value={exams.termId}
              onChange={(e) => exams.setTermId(e.target.value)}
              disabled={termsLoading}
            >
              <option value="">Select term...</option>
              {(terms || []).map((t, idx) => {
                const id = termIdOf(t);
                return (
                  <option key={termKeyOf(t, idx)} value={id ?? ""}>
                    {termLabel(t)}
                  </option>
                );
              })}
            </select>

            {termsError ? (
              <div className="alert-error">{prettyErrorMessage(termsError)}</div>
            ) : null}
          </div>

          <div className="filter-field">
            <div className="page-subtitle filter-label">Subject</div>
            <select
              className="input"
              value={exams.subjectId}
              onChange={(e) => exams.setSubjectId(e.target.value)}
              disabled={subjectsLoading}
            >
              <option value="">Select subject...</option>
              {(subjects || []).map((s, idx) => {
                const id = subjectIdOf(s);
                return (
                  <option key={subjectKeyOf(s, idx)} value={id ?? ""}>
                    {subjectLabel(s)}
                  </option>
                );
              })}
            </select>

            {subjectsError ? (
              <div className="alert-error">{prettyErrorMessage(subjectsError)}</div>
            ) : null}
          </div>

          <div className="filter-field">
            <div className="page-subtitle filter-label">Student index (optional)</div>
            <input
              className="input"
              placeholder="e.g. 2021/1234"
              value={exams.query}
              onChange={(e) => exams.setQuery(e.target.value)}
              onKeyDown={onKeyDown}
              disabled={!canRun || exams.loading}
            />
          </div>
        </div>

        <div className="filters-footer">
          <div className="page-subtitle filters-status">
            {!canRun
              ? "Pick term + subject, then Search."
              : `Unsigned: ${exams.unsignedCount} · Showing ${items.length} of ${exams.total} (page ${exams.page}/${exams.totalPages})`}
          </div>

          <div className="filters-actions">
            <button
              className="btn btn-primary"
              type="button"
              onClick={exams.search}
              disabled={!canRun || exams.loading}
            >
              {exams.loading ? "Loading..." : "Search"}
            </button>

            <button
              className="btn btn-ghost"
              type="button"
              onClick={exams.clearSearch}
              disabled={exams.loading}
            >
              Clear
            </button>

            <button
              className="btn"
              type="button"
              onClick={exams.prev}
              disabled={!exams.canPrev || exams.loading}
            >
              Prev
            </button>

            <button
              className="btn"
              type="button"
              onClick={exams.next}
              disabled={!exams.canNext || exams.loading}
            >
              Next
            </button>

            <span className="badge">Page size: {exams.take}</span>
          </div>
        </div>
      </div>

      {exams.error ? (
        <div className="alert-error exams-error-block">
          {prettyErrorMessage(exams.error)}
        </div>
      ) : null}

      {!exams.error && canRun && !exams.loading && items.length === 0 ? (
        <div className="page-subtitle center">No exams found.</div>
      ) : null}

      {!exams.error && items.length > 0 ? (
        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th style={{ width: 60 }}>No</th>
                <th>Student</th>
                <th className="mono" style={{ width: 140 }}>Index</th>
                <th className="mono" style={{ width: 140 }}>Date</th>
                <th>Teacher</th>
                <th className="mono" style={{ width: 140 }}>Teacher e.n.</th>
                <th className="mono" style={{ width: 90 }}>Grade</th>
                <th>Note</th>
                <th className="mono" style={{ width: 180 }}>SignedAt</th>
              </tr>
            </thead>
            <tbody>
              {exams.loading ? (
                <tr>
                  <td colSpan={9} style={{ padding: 10 }}>
                    Loading...
                  </td>
                </tr>
              ) : (
                items.map((x, idx) => {
                  const rowKey =
                    pick(x, "examID", "ExamID", "id", "ID") ||
                    `${pick(x, "studentID", "StudentID")}-${pick(x, "subjectID", "SubjectID")}-${pick(x, "termID", "TermID")}-${pick(x, "date", "Date")}-${idx}`;

                  return (
                    <tr key={rowKey}>
                      <td className="mono">{exams.skip + idx + 1}</td>
                      <td>{pick(x, "studentName", "StudentName") || "-"}</td>
                      <td className="mono">{pick(x, "studentIndexNum", "StudentIndexNum") || "-"}</td>
                      <td className="mono">{formatDate(pick(x, "date", "Date"))}</td>
                      <td>{pick(x, "teacherName", "TeacherName") || "-"}</td>
                      <td className="mono">{pick(x, "teacherEmployeeNum", "TeacherEmployeeNum") || "-"}</td>
                      <td className="mono">{formatGrade(pick(x, "grade", "Grade"))}</td>
                      <td>{pick(x, "note", "Note") || "-"}</td>
                      <td className="mono">{formatDateTime(pick(x, "signedAt", "SignedAt"))}</td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      ) : null}
    </div>
  );
}