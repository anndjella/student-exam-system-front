import { useEffect, useState } from "react";
import { useAuth } from "../../../auth/AuthContext";
import { useTerms } from "../../shared/hooks/useTerms";
import {fetchAllWithInactive} from "../api/subjectsSSApi";
import { useSsRegistrations } from "../hooks/useSSRegistrations";
import { formatDateTime } from "../../../utils/datetime";

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
      (v) => Array.isArray(v) && v.some((x) => x && (x.code || x.Code))
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

export function RegistrationsPage() {
  const { token, role } = useAuth();
  const isStudentService = role === "StudentService";

  const { terms, loading: termsLoading, error: termsError } = useTerms();

  const [subjects, setSubjects] = useState([]);
  const [subjectsLoading, setSubjectsLoading] = useState(false);
  const [subjectsError, setSubjectsError] = useState("");

  const regs = useSsRegistrations(20);
  const canRun = Boolean(regs.canSearch);
  const items = regs.items || [];

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
      regs.search();
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
      <div className="page-header">
        <div className="page-header-text">
          <h1 className="page-title">Registrations</h1>
          <div className="page-subtitle">
            Choose term and subject, optionally filter by student index.
          </div>
        </div>

        <div className="page-header-actions">
          <button
            className="btn"
            onClick={regs.reload}
            disabled={regs.loading || !canRun}
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
              value={regs.termId}
              onChange={(e) => regs.setTermId(e.target.value)}
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
              value={regs.subjectId}
              onChange={(e) => regs.setSubjectId(e.target.value)}
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
              value={regs.query}
              onChange={(e) => regs.setQuery(e.target.value)}
              onKeyDown={onKeyDown}
              disabled={!canRun || regs.loading}
            />
          </div>
        </div>

        <div className="filters-footer">
          <div className="page-subtitle filters-status">
            {!canRun
              ? "Pick term + subject, then Search."
              : `Showing ${items.length} of ${regs.total} (page ${regs.page}/${regs.totalPages})`}
          </div>

          <div className="filters-actions">
            <button
              className="btn btn-primary"
              type="button"
              onClick={regs.search}
              disabled={!canRun || regs.loading}
            >
              {regs.loading ? "Loading..." : "Search"}
            </button>

            <button
              className="btn btn-ghost"
              type="button"
              onClick={regs.clearSearch}
              disabled={regs.loading}
            >
              Clear
            </button>

            <button
              className="btn"
              type="button"
              onClick={regs.prev}
              disabled={!regs.canPrev || regs.loading}
            >
              Prev
            </button>

            <button
              className="btn"
              type="button"
              onClick={regs.next}
              disabled={!regs.canNext || regs.loading}
            >
              Next
            </button>

            <span className="badge">Page size: {regs.take}</span>
          </div>
        </div>
      </div>

      {regs.error ? (
        <div className="alert-error exams-error-block">
          {prettyErrorMessage(regs.error)}
        </div>
      ) : null}

      {!regs.error && canRun && !regs.loading && items.length === 0 ? (
        <div className="page-subtitle center">No registrations found.</div>
      ) : null}

      {!regs.error && items.length > 0 ? (
        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th style={{ width: 60 }}>No</th>
                <th>Student</th>
                <th className="mono" style={{ width: 140 }}>
                  Index
                </th>
                <th className="mono" style={{ width: 180 }}>
                  RegisteredAt
                </th>
                <th className="mono" style={{ width: 180 }}>
                  CancelledAt
                </th>
              </tr>
            </thead>
            <tbody>
              {regs.loading ? (
                <tr>
                  <td colSpan={5} style={{ padding: 10 }}>
                    Loading...
                  </td>
                </tr>
              ) : (
                items.map((r, idx) => {
                  const studentName = pick(r, "studentName", "StudentName") || "-";
                  const studentIndex =
                    pick(r, "studentIndexNumber", "StudentIndexNumber") || "-";

                  const registeredAt = pick(r, "registeredAt", "RegisteredAt") || null;
                  const cancelledAt = pick(r, "cancelledAt", "CancelledAt") || null;

                  const stableId =
                    pick(r, "registrationID", "RegistrationID", "id", "ID") ||
                    `${pick(r, "studentID", "StudentID")}-${pick(r, "subjectID", "SubjectID")}-${pick(r, "termID", "TermID")}`;

                  return (
                    <tr key={stableId}>
                      <td className="mono">{regs.skip + idx + 1}</td>
                      <td>{String(studentName).trim() || "-"}</td>
                      <td className="mono">{studentIndex}</td>
                      <td className="mono">{formatDateTime(registeredAt)}</td>
                      <td className="mono">{formatDateTime(cancelledAt)}</td>
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