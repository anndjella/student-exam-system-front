import { useEffect, useMemo, useState } from "react";
import { useAuth } from "../../../auth/AuthContext";
import { fetchActiveSubjects } from "../api/subjectsSSApi";
import {
  bulkEnrollByIndexYear,
  createEnrollmentSingle,
  deleteEnrollment,
  listEnrollmentsByStudent,
  listEnrollmentsBySubject,
} from "../api/enrollmentsSSApi";
import { AddEnrollmentModal } from "../components/AddEnrollmentModal";
import {formatDateTime} from "../../../utils/datetime";

/* ---------- small helpers ---------- */
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

function displayOfSubject(s) {
  const code = pick(s, "code", "Code");
  const name = pick(s, "name", "Name");
  return code ? `${code} - ${name || "-"}` : name || "-";
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

function studentsMatchedOf(r) {
  return Number(pick(r, "studentsMatched", "StudentsMatched") || 0);
}
function createdOf(r) {
  return Number(pick(r, "enrollmentsCreated", "EnrollmentsCreated") || 0);
}
function skippedOf(r) {
  return Number(pick(r, "enrollmentsSkipped", "EnrollmentsSkipped") || 0);
}

export function EnrollmentsPage() {
  const { token, role } = useAuth();
  const isStudentService = role === "StudentService";

  const [tab, setTab] = useState("all"); // all | bulk

  const [addOpen, setAddOpen] = useState(false);
  const [creatingSingle, setCreatingSingle] = useState(false);
  const [modalError, setModalError] = useState("");
  const [modalSuccess, setModalSuccess] = useState("");

  const [actionLoading, setActionLoading] = useState(false);
  const [actionError, setActionError] = useState("");

  const take = 20;

  const [studentIndexFilter, setStudentIndexFilter] = useState("");
  const [subjectCodeFilter, setSubjectCodeFilter] = useState("");

  const [appliedStudentIndex, setAppliedStudentIndex] = useState("");
  const [appliedSubjectCode, setAppliedSubjectCode] = useState("");

  const [searchMode, setSearchMode] = useState(null); // "student" | "subject" | null
  const [searchedOnce, setSearchedOnce] = useState(false);

  const [skipAll, setSkipAll] = useState(0);
  const [itemsAll, setItemsAll] = useState([]);
  const [totalAll, setTotalAll] = useState(0);

  const [loadingAll, setLoadingAll] = useState(false);
  const [errorAll, setErrorAll] = useState("");

  const [reloadAllTick, setReloadAllTick] = useState(0);

  const canSearchAll = Boolean(studentIndexFilter.trim() || subjectCodeFilter.trim());
  const hasSearchContext = searchedOnce && (searchMode === "student" || searchMode === "subject");

  const pageAll = Math.floor(skipAll / take) + 1;
  const totalPagesAll = Math.max(1, Math.ceil((totalAll || 0) / take));
  const canPrevAll = skipAll > 0;
  const canNextAll = skipAll + take < totalAll;

  function prevAll() {
    setSkipAll((s) => Math.max(0, s - take));
  }

  function nextAll() {
    setSkipAll((s) => s + take);
  }

  function refreshAll() {
    setReloadAllTick((x) => x + 1);
  }

  function clearAllSearch() {
    setStudentIndexFilter("");
    setSubjectCodeFilter("");
    setAppliedStudentIndex("");
    setAppliedSubjectCode("");
    setSearchMode(null);
    setSkipAll(0);
    setItemsAll([]);
    setTotalAll(0);
    setErrorAll("");
    setSearchedOnce(false);
  }

  async function runSearchAll() {
    const idx = studentIndexFilter.trim();
    const code = subjectCodeFilter.trim();

    setSearchedOnce(true);
    setErrorAll("");

    if (!idx && !code) {
      setSearchMode(null);
      setAppliedStudentIndex("");
      setAppliedSubjectCode("");
      setSkipAll(0);
      setItemsAll([]);
      setTotalAll(0);
      setErrorAll("Enter student index or subject code.");
      return;
    }

    const mode = idx ? "student" : "subject";
    setSearchMode(mode);

    setAppliedStudentIndex(idx);
    setAppliedSubjectCode(code);

    setSkipAll(0);
  }

  function onSearchKeyDown(e) {
    if (e.key === "Enter") {
      e.preventDefault();
      runSearchAll();
    }
  }

  useEffect(() => {
    let alive = true;

    async function load() {
      if (!token) return;
      if (tab !== "all") return;
      if (!searchedOnce) return;
      if (!searchMode) return;

      const idx = appliedStudentIndex;
      const code = appliedSubjectCode;

      if (searchMode === "student" && !idx) return;
      if (searchMode === "subject" && !code) return;

      setLoadingAll(true);
      setErrorAll("");

      try {
        const res =
          searchMode === "student"
            ? await listEnrollmentsByStudent(idx, { skip: skipAll, take, query: code || null }, token)
            : await listEnrollmentsBySubject(code, { skip: skipAll, take, query: idx || null }, token);

        if (!alive) return;

        setItemsAll(pick(res, "items", "Items") || []);
        setTotalAll(Number(pick(res, "total", "Total") || 0));
      } catch (e) {
        if (!alive) return;
        setErrorAll(e?.userMessage || e?.message || "Failed to load enrollments.");
        setItemsAll([]);
        setTotalAll(0);
      } finally {
        if (!alive) return;
        setLoadingAll(false);
      }
    }

    load();
    return () => {
      alive = false;
    };
  }, [
    token,
    tab,
    searchedOnce,
    searchMode,
    skipAll,
    take,
    appliedStudentIndex,
    appliedSubjectCode,
    reloadAllTick,
  ]);

  async function onDeleteEnrollment(row) {
    setActionError("");

    const subjectId = pick(row, "subjectID", "SubjectID");
    const studentId = pick(row, "studentID", "StudentID");

    if (!subjectId || !studentId) {
      setActionError("Enrollment row is missing subjectId or studentId.");
      return;
    }

    const ok = window.confirm("Delete this enrollment?");
    if (!ok) return;

    setActionLoading(true);
    try {
      await deleteEnrollment(subjectId, studentId, token);

      if (itemsAll.length === 1 && skipAll > 0) {
        setSkipAll((s) => Math.max(0, s - take));
      } else {
        refreshAll();
      }
    } catch (e) {
      setActionError(e?.userMessage || e?.message || "Delete failed.");
    } finally {
      setActionLoading(false);
    }
  }

  function openAddModal() {
   setModalError("");
   setModalSuccess("");
   setAddOpen(true);
  }

  function closeAddModal() {
     setAddOpen(false);
  setModalError("");
  setModalSuccess("");
  }

 async function onCreateSingle(payload) {
  setCreatingSingle(true);
 setModalError("");
  setModalSuccess("");

  try {
    await createEnrollmentSingle(payload, token);
    setModalSuccess("Enrollment added successfully.");

    if (tab === "all" && hasSearchContext) refreshAll();
  } catch (e) {
    const msg = e?.userMessage || e?.message || "Create failed.";
    throw new Error(msg);
  } finally {
    setCreatingSingle(false);
  }
}


  /* ---------- BULK ENROLL ---------- */
  const [loadingSubjects, setLoadingSubjects] = useState(false);
  const [subjectsError, setSubjectsError] = useState("");
  const [activeSubjects, setActiveSubjects] = useState([]);

  const [indexStartYear, setIndexStartYear] = useState("2023");
  const [searchSubjects, setSearchSubjects] = useState("");
  const [selected, setSelected] = useState(() => new Set());

  const [submittingBulk, setSubmittingBulk] = useState(false);
  const [bulkError, setBulkError] = useState("");
  const [result, setResult] = useState(null);

  useEffect(() => {
    let alive = true;

    async function loadSubjects() {
      if (!token) return;
      if (tab !== "bulk") return;

      setLoadingSubjects(true);
      setSubjectsError("");

      try {
        const res = await fetchActiveSubjects(token);
        if (!alive) return;
        setActiveSubjects(normalizeSubjectsResponse(res));
      } catch (e) {
        if (!alive) return;
        setSubjectsError(e?.userMessage || e?.message || "Failed to load subjects.");
        setActiveSubjects([]);
      } finally {
        if (!alive) return;
        setLoadingSubjects(false);
      }
    }

    loadSubjects();
    return () => {
      alive = false;
    };
  }, [token, tab]);

  const filteredSubjects = useMemo(() => {
    const q = searchSubjects.trim().toLowerCase();
    if (!q) return activeSubjects || [];

    return (activeSubjects || []).filter((s) => {
      const code = String(pick(s, "code", "Code")).toLowerCase();
      const name = String(pick(s, "name", "Name")).toLowerCase();
      return code.includes(q) || name.includes(q);
    });
  }, [activeSubjects, searchSubjects]);

  const toggleSubject = (id) =>
    setSelected((prev) => {
      const nextSet = new Set(prev);
      nextSet.has(id) ? nextSet.delete(id) : nextSet.add(id);
      return nextSet;
    });

  const selectAllFiltered = () =>
    setSelected((prev) => {
      const nextSet = new Set(prev);
      for (const s of filteredSubjects) {
        const id = pick(s, "id", "ID");
        if (id) nextSet.add(id);
      }
      return nextSet;
    });

  const clearSelection = () => setSelected(new Set());

  async function onSubmitBulk(e) {
    e.preventDefault();
    if (!token) return;

    setBulkError("");
    setResult(null);

    const year = Number(indexStartYear);
    if (!Number.isInteger(year) || year < 1900 || year > 2100) {
      setBulkError("Index start year must be a valid year (e.g. 2023).");
      return;
    }

    const subjectIds = Array.from(selected);
    if (subjectIds.length === 0) {
      setBulkError("Pick at least 1 subject.");
      return;
    }

    setSubmittingBulk(true);
    try {
      const res = await bulkEnrollByIndexYear({ indexStartYear: year, subjectIds }, token);
      setResult(res ?? { StudentsMatched: 0, EnrollmentsCreated: 0, EnrollmentsSkipped: 0 });
    } catch (e2) {
      setBulkError(e2?.userMessage || e2?.message || "Bulk enroll failed.");
    } finally {
      setSubmittingBulk(false);
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
          <div className="page-subtitle">Manage enrollments and bulk enroll students by index year.</div>
        </div>

        <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
          <button
            className="btn btn-primary"
            type="button"
            onClick={openAddModal}
            disabled={creatingSingle || actionLoading}
          >
            Add enrollment
          </button>

          {tab === "all" ? (
            <button
              className="btn"
              type="button"
              onClick={refreshAll}
              disabled={!hasSearchContext || loadingAll || actionLoading}
              title={!hasSearchContext ? "Search first" : "Refresh current results"}
            >
              Refresh
            </button>
          ) : null}
        </div>
      </div>

      {actionError && !addOpen ? (
        <div className="alert-error" style={{ marginBottom: 12 }}>
          {prettyErrorMessage(actionError)}
        </div>
      ) : null}

      <div className="card" style={{ padding: 12, marginBottom: 12 }}>
        <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
          <button
            className={`btn ${tab === "all" ? "btn-primary" : ""}`}
            type="button"
            onClick={() => setTab("all")}
            disabled={actionLoading}
          >
            Enrollments search
          </button>

          <button
            className={`btn ${tab === "bulk" ? "btn-primary" : ""}`}
            type="button"
            onClick={() => setTab("bulk")}
            disabled={actionLoading}
          >
            Bulk enroll
          </button>

          <div style={{ flex: 1 }} />

          {tab === "all" ? (
            <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
              <input
                className="input"
                style={{ width: 220 }}
                placeholder="Student index..."
                value={studentIndexFilter}
                onChange={(e) => setStudentIndexFilter(e.target.value)}
                onKeyDown={onSearchKeyDown}
                disabled={loadingAll || actionLoading}
              />
              <input
                className="input"
                style={{ width: 180 }}
                placeholder="Subject code..."
                value={subjectCodeFilter}
                onChange={(e) => setSubjectCodeFilter(e.target.value)}
                onKeyDown={onSearchKeyDown}
                disabled={loadingAll || actionLoading}
              />

              <button className="btn" type="button" onClick={runSearchAll} disabled={!canSearchAll || loadingAll || actionLoading}>
                Search
              </button>

              <button className="btn btn-ghost" type="button" onClick={clearAllSearch} disabled={loadingAll || actionLoading}>
                Clear
              </button>
            </div>
          ) : null}
        </div>
      </div>

      {/* ALL TAB */}
      {tab === "all" ? (
        <div className="card" style={{ padding: 12 }}>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              gap: 10,
              flexWrap: "wrap",
            }}
          >
            <div className="page-subtitle">
              {!searchedOnce
                ? "Enter student index or subject code, then click Search."
                : !hasSearchContext
                ? "No results."
                : `Showing ${itemsAll.length} of ${totalAll} (page ${pageAll}/${totalPagesAll})`}
            </div>

            <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
              <button className="btn" type="button" onClick={prevAll} disabled={!hasSearchContext || !canPrevAll || loadingAll || actionLoading}>
                Prev
              </button>
              <button className="btn" type="button" onClick={nextAll} disabled={!hasSearchContext || !canNextAll || loadingAll || actionLoading}>
                Next
              </button>
              <span className="badge">Page size: {take}</span>
            </div>
          </div>

          {errorAll ? (
            <div className="alert-error" style={{ marginTop: 10 }}>
              {prettyErrorMessage(errorAll)}
            </div>
          ) : null}

          {!searchedOnce || !hasSearchContext ? null : (
            <div className="table-wrap" style={{ marginTop: 10 }}>
              <table className="table">
                <thead>
                  <tr>
                    <th style={{ width: 150 }}>Student index</th>
                    <th>Student name</th>
                    <th style={{ width: 120 }}>Subject code</th>
                    <th>Subject name</th>
                    <th style={{ width: 170 }}>Created at</th>
                    <th style={{ width: 120 }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {loadingAll ? (
                    <tr>
                      <td colSpan={6} style={{ padding: 10 }}>
                        Loading...
                      </td>
                    </tr>
                  ) : itemsAll.length === 0 ? (
                    <tr>
                      <td colSpan={6} style={{ padding: 10 }}>
                        No enrollments found.
                      </td>
                    </tr>
                  ) : (
                    itemsAll.map((e) => {
                      const studentId = pick(e, "studentID", "StudentID");
                      const subjectId = pick(e, "subjectID", "SubjectID");
                      const createdAt = pick(e, "createdAt", "CreatedAt");

                      return (
                        <tr key={`${studentId}-${subjectId}`}>
                          <td className="mono">{pick(e, "studentIndex", "StudentIndex") || "-"}</td>
                          <td>{String(pick(e, "studentName", "StudentName")).trim() || "-"}</td>
                          <td className="mono">{pick(e, "subjectCode", "SubjectCode") || "-"}</td>
                          <td>{pick(e, "subjectName", "SubjectName") || "-"}</td>
                          <td className="mono">{formatDateTime(createdAt)}</td>
                          <td>
                            <button className="btn" type="button" onClick={() => onDeleteEnrollment(e)} disabled={actionLoading || loadingAll}>
                              Delete
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      ) : null}

      {/* BULK TAB */}
      {tab === "bulk" ? (
        <>
          {subjectsError ? (
            <div className="alert-error" style={{ marginBottom: 12 }}>
              {prettyErrorMessage(subjectsError)}
            </div>
          ) : null}

          {bulkError ? (
            <div className="alert-error" style={{ marginBottom: 12 }}>
              {prettyErrorMessage(bulkError)}
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
            </div>
          ) : null}

          <div className="card" style={{ padding: 12, marginBottom: 12 }}>
            <form onSubmit={onSubmitBulk} style={{ display: "grid", gap: 10, maxWidth: 820 }}>
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
                <button className="btn btn-primary" disabled={submittingBulk || loadingSubjects}>
                  {submittingBulk ? "Creating..." : "Bulk enroll"}
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
                value={searchSubjects}
                onChange={(e) => setSearchSubjects(e.target.value)}
                disabled={loadingSubjects}
              />

              <button className="btn" type="button" onClick={selectAllFiltered} disabled={loadingSubjects}>
                Select all (filtered)
              </button>

              <button className="btn" type="button" onClick={clearSelection} disabled={selected.size === 0}>
                Clear selection
              </button>

              <div style={{ flex: 1 }} />

              <span className="badge">Subjects: {loadingSubjects ? "Loading..." : filteredSubjects.length}</span>
            </div>

            <div style={{ marginTop: 12 }}>
              {loadingSubjects ? (
                <div className="page-subtitle">Loading subjects...</div>
              ) : filteredSubjects.length === 0 ? (
                <div className="page-subtitle">No subjects.</div>
              ) : (
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: 8 }}>
                  {filteredSubjects.map((s) => {
                    const id = pick(s, "id", "ID");
                    const checked = id ? selected.has(id) : false;

                    return (
                      <label
                        key={id || displayOfSubject(s)}
                        className="card"
                        style={{ padding: 10, display: "flex", gap: 10, alignItems: "center", cursor: "pointer" }}
                      >
                        <input type="checkbox" checked={checked} onChange={() => id && toggleSubject(id)} disabled={!id} />
                        <div style={{ minWidth: 0 }}>
                          <div style={{ fontWeight: 600 }}>{displayOfSubject(s)}</div>
                        </div>
                      </label>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </>
      ) : null}

      <AddEnrollmentModal
       open={addOpen}
       creating={creatingSingle}
       error={modalError}
       success={modalSuccess}
       onClose={closeAddModal}
       onCreate={onCreateSingle}
      />
    </div>
  );
}
