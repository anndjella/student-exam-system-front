import { useEffect, useMemo, useState } from "react";
import { useAuth } from "../../../auth/AuthContext";
import { useTerms } from "../../shared/hooks/useTerms";
import { fetchActiveSubjects } from "../api/subjectsSSApi";
import { useSSExams } from "../hooks/useSSExams";
import {formatDate,formatDateTime} from "../../../utils/datetime";

/* small pick helper */
const pick = (obj, ...keys) => {
  for (const k of keys) {
    const v = obj?.[k];
    if (v !== undefined && v !== null && v !== "") return v;
  }
  return "";
};

function termIdOf(t) {
  return pick(t, "termID", "TermID", "id", "ID");
}

function subjectIdOf(s) {
  return pick(s, "subjectID", "SubjectID", "id", "ID");
}

function termLabel(t) {
  return pick(t, "name", "termName", "TermName", "title", "Title") || "-";
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
    const directSubjects = vals.find((v) => Array.isArray(v) && v.some((x) => x && (x.code || x.Code)));
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

  const isStudentService = useMemo(() => String(role ?? "").toLowerCase() === "studentservice", [role]);

  const { terms, loading: termsLoading, error: termsError, reload: reloadTerms } = useTerms();

  const [subjects, setSubjects] = useState([]);
  const [subjectsLoading, setSubjectsLoading] = useState(false);
  const [subjectsError, setSubjectsError] = useState("");

  const [termId, setTermId] = useState("");
  const [subjectId, setSubjectId] = useState("");
  const [hasLoaded, setHasLoaded] = useState(false);

  const canLoad = Boolean(termId && subjectId);

  const { unsignedCount, exams, loading, error, reload } = useSSExams(
    termId ? Number(termId) : null,
    subjectId ? Number(subjectId) : null,
    false
  );

  useEffect(() => {
    if (!token) return;

    let alive = true;

    (async () => {
      setSubjectsLoading(true);
      setSubjectsError("");

      try {
        const res = await fetchActiveSubjects(token);
        if (!alive) return;
        setSubjects(normalizeSubjectsResponse(res));
      } catch (e) {
        if (!alive) return;
        setSubjectsError(e?.message ?? "Failed to load subjects.");
        setSubjects([]);
      } finally {
        if (!alive) return;
        setSubjectsLoading(false);
      }
    })();

    return () => {
      alive = false;
    };
  }, [token]);

  useEffect(() => {
    setHasLoaded(false);
  }, [termId, subjectId]);

  if (!isStudentService) {
    return (
      <div className="container">
        <div className="alert-error">You are not allowed to view this page.</div>
      </div>
    );
  }

  return (
    <div className="container">
      <div className="page-header">
        <div>
          <h1 className="page-title">Exams</h1>
          <div className="page-subtitle">Choose term and subject to list exams (Student Service).</div>
        </div>

        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
          <button className="btn" onClick={reloadTerms} disabled={termsLoading}>
            Refresh terms
          </button>

          <button className="btn" onClick={reload} disabled={loading || !canLoad}>
            Refresh list
          </button>
        </div>
      </div>

      <div className="card" style={{ padding: 16, marginBottom: 12 }}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          <div style={{ display: "grid", gap: 6 }}>
            <div className="page-subtitle">Term</div>
            <select
              className="input"
              value={termId}
              onChange={(e) => setTermId(e.target.value)}
              disabled={termsLoading}
            >
              <option value="">Select term...</option>
              {(terms || []).map((t, idx) => {
                const id = termIdOf(t);
                const key = id ?? `${termLabel(t)}-${idx}`;
                return (
                  <option key={key} value={id != null ? String(id) : ""}>
                    {termLabel(t)}
                  </option>
                );
              })}
            </select>

            {termsError && <div className="alert-error">{String(termsError)}</div>}
          </div>

          <div style={{ display: "grid", gap: 6 }}>
            <div className="page-subtitle">Subject</div>
            <select
              className="input"
              value={subjectId}
              onChange={(e) => setSubjectId(e.target.value)}
              disabled={subjectsLoading}
            >
              <option value="">Select subject...</option>
              {(subjects || []).map((s, idx) => {
                const id = subjectIdOf(s);
                const key = id ?? `${pick(s, "code", "Code", "name", "Name")}-${idx}`;
                return (
                  <option key={key} value={id != null ? String(id) : ""}>
                    {subjectLabel(s)}
                  </option>
                );
              })}
            </select>

            {subjectsError && <div className="alert-error">{subjectsError}</div>}
          </div>
        </div>

        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            gap: 10,
            flexWrap: "wrap",
            marginTop: 12,
            alignItems: "center",
          }}
        >
          <div className="page-subtitle" style={{ margin: 0 }}>
            {canLoad && hasLoaded ? (
              <>
                Unsigned:{" "}
                <span className="mono" style={{ fontWeight: 900 }}>
                  {unsignedCount ?? 0}
                </span>
              </>
            ) : (
              <>Pick term + subject to load exams.</>
            )}
          </div>

          <button className="btn btn-primary" onClick={() => {
            reload();
            setHasLoaded(true);
          }} disabled={loading || !canLoad}>
            {loading ? "Loading..." : "Load"}
          </button>
        </div>
      </div>

      {error && <div className="alert-error">{error}</div>}

      {!error && canLoad && !loading && (exams?.length ?? 0) === 0 && (
        <div className="page-subtitle center">No exams for selected term and subject.</div>
      )}

      {!error && (exams?.length ?? 0) > 0 && (
        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th style={{ width: 50 }}>No</th>
                <th>Student</th>
                <th className="mono">Index</th>
                <th className="mono">Code</th>
                <th>Subject</th>
                <th className="mono" style={{ width: 80 }}>
                  ECTS
                </th>
                <th>Term</th>
                <th className="mono">Date</th>
                <th>Teacher</th>
                <th className="mono" style={{ width: 80 }}>
                  Grade
                </th>
                <th>Note</th>
                <th className="mono">SignedAt</th>
              </tr>
            </thead>
            <tbody>
              {exams.map((x, idx) => {
                const rowKey =
                  pick(x, "examID", "ExamID", "id", "ID") ||
                  `${pick(x, "studentID", "StudentID")}-${pick(x, "subjectID", "SubjectID")}-${pick(x, "termID", "TermID")}-${pick(x, "date", "Date")}-${idx}`;

                return (
                  <tr key={rowKey}>
                    <td className="mono">{idx + 1}</td>
                    <td>{pick(x, "studentName", "StudentName") || "-"}</td>
                    <td className="mono">{pick(x, "studentIndexNum", "StudentIndexNum") || "-"}</td>
                    <td className="mono">{pick(x, "subjectCode", "SubjectCode") || "-"}</td>
                    <td>{pick(x, "subjectName", "SubjectName") || "-"}</td>
                    <td className="mono">{pick(x, "subjectECTS", "SubjectECTS") || "-"}</td>
                    <td>{pick(x, "termName", "TermName") || "-"}</td>
                    <td className="mono">{formatDate(pick(x, "date", "Date"))}</td>
                    <td>{pick(x, "teacherName", "TeacherName") || "-"}</td>
                    <td className="mono">{formatGrade(pick(x, "grade", "Grade"))}</td>
                    <td>{pick(x, "note", "Note") || "-"}</td>
                    <td className="mono">{formatDateTime(pick(x, "signedAt", "SignedAt"))}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
