import { useEffect, useMemo, useState } from "react";
import { useAuth } from "../../../auth/AuthContext";
import { fetchAllSubjectsGrouped } from "../api/subjectsSSApi";
import { bulkEnrollByIndexYear } from "../api/enrollmentsSSApi";

/* helpers */
function idOf(x) {
  return x?.id ?? x?.ID;
}
function codeOf(x) {
  return x?.code ?? x?.Code ?? "";
}
function nameOf(x) {
  return x?.name ?? x?.Name ?? "";
}
function displayOf(x) {
  const c = codeOf(x);
  const n = nameOf(x);
  return c ? `${c} - ${n}` : n;
}

function studentsMatchedOf(r) {
  return r?.studentsMatched ?? r?.StudentsMatched ?? 0;
}
function createdOf(r) {
  return r?.enrollmentsCreated ?? r?.EnrollmentsCreated ?? 0;
}
function skippedOf(r) {
  return r?.enrollmentsSkipped ?? r?.EnrollmentsSkipped ?? 0;
}

export function EnrollmentsPage() {
  const { token, role } = useAuth();
  const isStudentService = role === "StudentService";

  const [loadingSubjects, setLoadingSubjects] = useState(true);
  const [subjectsError, setSubjectsError] = useState("");

  const [activeSubjects, setActiveSubjects] = useState([]);

  const [indexStartYear, setIndexStartYear] = useState("2023");
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState(() => new Set());

  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState("");
  const [result, setResult] = useState(null);

  useEffect(() => {
    let alive = true;

    async function load() {
      if (!token) return;

      setLoadingSubjects(true);
      setSubjectsError("");

      try {
        const data = await fetchAllSubjectsGrouped(token);
        if (!alive) return;

        setActiveSubjects(Array.isArray(data?.active) ? data.active : []);
      } catch (e) {
        if (!alive) return;
        setSubjectsError(e?.message ?? "Failed to load subjects.");
        setActiveSubjects([]);
      } finally {
        if (!alive) return;
        setLoadingSubjects(false);
      }
    }

    load();
    return () => {
      alive = false;
    };
  }, [token]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return activeSubjects || [];

    return (activeSubjects || []).filter((s) => {
      const c = codeOf(s).toLowerCase();
      const n = nameOf(s).toLowerCase();
      return c.includes(q) || n.includes(q);
    });
  }, [activeSubjects, search]);

  function toggleSubject(id) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function selectAllFiltered() {
    setSelected((prev) => {
      const next = new Set(prev);
      for (const s of filtered) {
        const id = idOf(s);
        if (id) next.add(id);
      }
      return next;
    });
  }

  function clearSelection() {
    setSelected(new Set());
  }

  async function onSubmit(e) {
    e.preventDefault();
    if (!token) return;

    setFormError("");
    setResult(null);

    const year = Number(indexStartYear);
    if (!Number.isInteger(year) || year < 1900 || year > 2100) {
      setFormError("Index start year must be a valid year (e.g. 2023).");
      return;
    }

    const subjectIds = Array.from(selected);
    if (subjectIds.length === 0) {
      setFormError("Pick at least 1 subject.");
      return;
    }

    setSubmitting(true);
    try {
      const res = await bulkEnrollByIndexYear(
        {
          indexStartYear: year,
          subjectIds,
        },
        token
      );

      setResult(
        res ?? { StudentsMatched: 0, EnrollmentsCreated: 0, EnrollmentsSkipped: 0 }
      );
    } catch (e2) {
      setFormError(e2?.message ?? "Bulk enroll failed.");
    } finally {
      setSubmitting(false);
    }
  }

  if (!isStudentService) {
    return (
      <div className="container">
        <div className="alert-error">Forbidden</div>
      </div>
    );
  }

  const studentsMatched = result ? studentsMatchedOf(result) : 0;
  const created = result ? createdOf(result) : 0;
  const skipped = result ? skippedOf(result) : 0;

  return (
    <div className="container">
      <div className="page-header">
        <div>
          <h1 className="page-title">Enrollments</h1>
          <div className="page-subtitle">Bulk enroll students by index year.</div>
        </div>
      </div>

      {subjectsError ? (
        <div className="alert-error" style={{ marginBottom: 12 }}>
          {subjectsError}
        </div>
      ) : null}

      {formError ? (
        <div className="alert-error" style={{ marginBottom: 12 }}>
          {formError}
        </div>
      ) : null}

      {result ? (
        <div className="card" style={{ padding: 12, marginBottom: 12 }}>
          <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
            <span className="badge">
              Students matched: <span className="mono">{studentsMatched}</span>
            </span>
            <span className="badge">
              Enrollments created: <span className="mono">{created}</span>
            </span>
            <span className="badge">
              Enrollments skipped: <span className="mono">{skipped}</span>
            </span>
          </div>

          {studentsMatched === 0 ? (
            <div className="page-subtitle" style={{ marginTop: 8 }}>
              No students found for this index year.
            </div>
          ) : skipped > 0 ? (
            <div className="page-subtitle" style={{ marginTop: 8 }}>
              Some enrollments already existed and were skipped.
            </div>
          ) : (
            <div className="page-subtitle" style={{ marginTop: 8 }}>
              Done.
            </div>
          )}
        </div>
      ) : null}

      <div className="card" style={{ padding: 12, marginBottom: 12 }}>
        <form onSubmit={onSubmit} style={{ display: "grid", gap: 10, maxWidth: 820 }}>
          <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
            <input
              className="input"
              style={{ width: 220 }}
              inputMode="numeric"
              placeholder="Index start year (e.g. 2023)"
              value={indexStartYear}
              onChange={(e) => setIndexStartYear(e.target.value)}
            />

            <div style={{ flex: 1 }} />

            <button className="btn btn-primary" disabled={submitting || loadingSubjects}>
              {submitting ? "Creating..." : "Bulk enroll"}
            </button>
          </div>

          <div className="page-subtitle">
            Selected <span className="mono">{selected.size}</span> subject(s)
          </div>
        </form>
      </div>

      <div className="card" style={{ padding: 12 }}>
        <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
          <input
            className="input"
            style={{ width: 320 }}
            placeholder="Search subjects..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            disabled={loadingSubjects}
          />

          <button className="btn" onClick={selectAllFiltered} disabled={loadingSubjects}>
            Select all (filtered)
          </button>

          <button className="btn" onClick={clearSelection} disabled={selected.size === 0}>
            Clear selection
          </button>

          <div style={{ flex: 1 }} />

          <span className="badge">
            Subjects: {loadingSubjects ? "Loading..." : filtered.length}
          </span>
        </div>

        <div style={{ marginTop: 12 }}>
          {loadingSubjects ? (
            <div className="info">Loading subjects...</div>
          ) : filtered.length === 0 ? (
            <div className="info">No subjects.</div>
          ) : (
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
                gap: 8,
              }}
            >
              {filtered.map((s) => {
                const id = idOf(s);
                const checked = id ? selected.has(id) : false;

                return (
                  <label
                    key={id ?? displayOf(s)}
                    className="card"
                    style={{
                      padding: 10,
                      display: "flex",
                      gap: 10,
                      alignItems: "center",
                      cursor: "pointer",
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => id && toggleSubject(id)}
                      disabled={!id}
                    />

                    <div style={{ minWidth: 0 }}>
                      <div style={{ fontWeight: 600 }}>{displayOf(s) || "-"}</div>
                    </div>
                  </label>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
