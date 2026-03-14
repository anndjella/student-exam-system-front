import { useMemo, useState } from "react";
import { useGradeEntry } from "../hooks/useGradeEntry";
import { GradeDrawer } from "./GradeDrawer";

/* helpers */
const pick = (obj, ...keys) => {
  for (const k of keys) {
    const v = obj?.[k];
    if (v !== undefined && v !== null && v !== "") return v;
  }
  return "";
};

function termLabel(t) {
  return pick(t, "termName", "TermName", "name", "Name") || "Term";
}

function termIdOf(t) {
  return Number(pick(t, "termID", "TermID", "id", "ID") || 0);
}

function normalizeDateOnly(value) {
  if (!value) return "";
  return String(value).slice(0, 10);
}

function todayDateOnly() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function canEnterGradesOf(term) {
  if (!term) return false;

  const start = normalizeDateOnly(pick(term, "startDate", "StartDate"));
  const end = normalizeDateOnly(pick(term, "endDate", "EndDate"));

  if (!start || !end) return false;

  const today = todayDateOnly();
  return today >= start && today <= end;
}

function hasDateValue(dateStr) {
  return typeof dateStr === "string" && dateStr.trim().length > 0;
}

export function GradeEntryPanel({ subject }) {
  const {
    terms,
    termId,
    setTermId,
    rows,
    setAllDates,
    updateRow,
    saveOne,
    saveAll,
    lock,
    loadingTerms,
    loadingRegs,
    saving,
    locking,
    error,
    stats,
  } = useGradeEntry(subject?.id);

  const lockedAll = !!stats?.locked;

  const termOptions = useMemo(() => terms || [], [terms]);

  const effectiveTerm = useMemo(() => {
    if (!termOptions.length) return null;

    const id = Number(termId);
    if (id) {
      const found = termOptions.find((t) => termIdOf(t) === id);
      if (found) return found;
    }

    return termOptions[0] ?? null;
  }, [termId, termOptions]);

  const canEnterGrades = canEnterGradesOf(effectiveTerm);
  const gradeEntryBlocked = !lockedAll && !canEnterGrades;

  const [query, setQuery] = useState("");
  const [page, setPage] = useState(1);
  const pageSize = 12;

  const [selectedId, setSelectedId] = useState(null);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return rows;

    return rows.filter((r) => {
      const name = String(r.studentName || "").toLowerCase();
      const idx = String(r.studentIndex || "").toLowerCase();
      return name.includes(q) || idx.includes(q);
    });
  }, [rows, query]);

  const totalPages = useMemo(() => {
    return Math.max(1, Math.ceil(filtered.length / pageSize));
  }, [filtered.length]);

  const pageSafe = Math.min(page, totalPages);

  const pagedRows = useMemo(() => {
    const start = (pageSafe - 1) * pageSize;
    return filtered.slice(start, start + pageSize);
  }, [filtered, pageSafe]);

  const selectedRow = useMemo(() => {
    if (!selectedId) return null;
    return rows.find((r) => r.studentId === selectedId) || null;
  }, [rows, selectedId]);

  function isRowDisabled(r) {
    return lockedAll || gradeEntryBlocked || r.locked;
  }

  async function onSaveAll() {
    if (lockedAll || gradeEntryBlocked) return;

    const invalid = rows.some((r) => !r.locked && !hasDateValue(r.date));
    if (invalid) return;

    await saveAll();
  }

  async function onSaveSelected(r) {
    if (!r) return;
    if (lockedAll || gradeEntryBlocked || r.locked) return;
    if (!hasDateValue(r.date)) return;

    await saveOne(r.studentId);
  }

  function onRowClick(r) {
    setSelectedId(r.studentId);
  }

  function closeDrawer() {
    setSelectedId(null);
  }

  return (
    <div className="card" style={{ padding: 16 }}>
      <div style={{ fontWeight: 900, fontSize: 18, marginBottom: 4 }}>
        {subject?.code} · {subject?.name}
      </div>

      <div className="page-subtitle" style={{ marginBottom: 10 }}>
        Choose a term, then select a student to enter grade/date/note in the side panel. Use Save all when done.
      </div>

      {gradeEntryBlocked ? (
        <div className="page-subtitle" style={{ marginBottom: 10 }}>
          Grade entry will be available only while today is within the selected term exam period.
        </div>
      ) : null}

      {error ? (
        <div className="alert-error" style={{ marginBottom: 10 }}>
          {error}
        </div>
      ) : null}

      <div className="toolbar">
        <select
          className="input grade-toolbar-select"
          value={termId || termIdOf(effectiveTerm) || ""}
          onChange={(e) => {
            setTermId(Number(e.target.value));
            setPage(1);
            setSelectedId(null);
          }}
          disabled={loadingTerms}
        >
          {termOptions.map((t) => (
            <option key={termIdOf(t) || termLabel(t)} value={termIdOf(t) || ""}>
              {termLabel(t)}
            </option>
          ))}
        </select>

        <input
          className="input grade-toolbar-select"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setPage(1);
          }}
          placeholder="Search by name or index..."
          disabled={loadingRegs}
        />

        <div style={{ flex: 1 }} />

        <div className="page-subtitle">
          Registrations: <b>{stats.total}</b> · Entered: <b>{stats.entered}</b>
        </div>

        <button
          className="btn"
          type="button"
          onClick={lock}
          disabled={locking || saving || lockedAll || loadingRegs || gradeEntryBlocked}
        >
          {lockedAll ? "Locked" : locking ? "Locking..." : "Lock"}
        </button>

        <button
          className="btn btn-primary"
          type="button"
          onClick={onSaveAll}
          disabled={saving || lockedAll || gradeEntryBlocked || loadingRegs}
        >
          {saving ? "Saving..." : "Save all"}
        </button>
      </div>

      <div className="toolbar" style={{ marginTop: 10 }}>
        <div style={{ flex: 1 }} />

        <div className="pager">
          <button className="btn" type="button" onClick={() => setPage(1)} disabled={pageSafe === 1}>
            {"<<"}
          </button>
          <button className="btn" type="button" onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={pageSafe === 1}>
            {"<"}
          </button>
          <div className="page-subtitle" style={{ margin: "0 8px" }}>
            Page <b>{pageSafe}</b> / <b>{totalPages}</b>
          </div>
          <button className="btn" type="button" onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={pageSafe === totalPages}>
            {">"}
          </button>
          <button className="btn" type="button" onClick={() => setPage(totalPages)} disabled={pageSafe === totalPages}>
            {">>"}
          </button>
        </div>
      </div>

      <div className="table-wrap" style={{ marginTop: 12 }}>
        <table className="table table-compact">
          <thead>
            <tr>
              <th>Student</th>
              <th style={{ width: 140 }}>Index</th>
              <th style={{ width: 120 }}>Exam date</th>
              <th style={{ width: 80 }}>Grade</th>
              <th style={{ width: 90 }}>Status</th>
            </tr>
          </thead>

          <tbody>
            {loadingRegs ? (
              <tr>
                <td colSpan={5} style={{ padding: 10 }}>
                  Loading registrations...
                </td>
              </tr>
            ) : filtered.length === 0 ? (
              <tr>
                <td colSpan={5} style={{ padding: 10 }}>
                  No registrations for this subject and term.
                </td>
              </tr>
            ) : (
              pagedRows.map((r) => {
                const selected = r.studentId === selectedId;
                const status = r.locked ? "Locked" : r.hasExam ? "Entered" : "New";

                return (
                  <tr
                    key={r.studentId}
                    className={[
                      selected ? "row-selected" : "",
                      gradeEntryBlocked ? "row-entry-blocked" : "",
                      r.locked ? "row-locked" : "",
                    ].join(" ")}
                    onClick={() => onRowClick(r)}
                    style={{ cursor: "pointer" }}
                    title="Click to edit"
                  >
                    <td style={{ fontWeight: 800 }}>{r.studentName}</td>
                    <td className="mono">{r.studentIndex || "-"}</td>
                    <td className="mono">{r.date ? r.date : "-"}</td>
                    <td className="mono">{r.grade ?? "-"}</td>
                    <td>
                      <span className="badge">{status}</span>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      <GradeDrawer
        open={Boolean(selectedRow)}
        onClose={closeDrawer}
        row={selectedRow}
        disabled={selectedRow ? isRowDisabled(selectedRow) : true}
        onChangeField={(studentId, patch) => updateRow(studentId, patch)}
        onSave={onSaveSelected}
        saving={saving}
      />

      {lockedAll ? (
        <div className="page-subtitle" style={{ marginTop: 10 }}>
          This subject and term are locked. Editing is disabled.
        </div>
      ) : null}
    </div>
  );
}