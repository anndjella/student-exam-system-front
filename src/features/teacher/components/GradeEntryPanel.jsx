import { useMemo, useState } from "react";
import { CustomSelect } from "../../shared/components/CustomSelect";
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
  const registrationEnd = normalizeDateOnly(
    pick(term, "registrationEndDate", "RegistrationEndDate"),
  );

  if (!start || !registrationEnd) return false;

  const today = todayDateOnly();
  return today >= start && today > registrationEnd;
}

export function GradeEntryPanel({ subject }) {
  const {
    terms,
    termId,
    setTermId,
    rows,
    updateRow,
    resetRow,
    saveOne,
    lock,
    loadingTerms,
    loadingRegs,
    saving,
    locking,
    error,
    clearError,
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
  const hasFutureExam = rows.some(
    (row) => row.hasExam && normalizeDateOnly(row.date) > todayDateOnly(),
  );

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

  async function onSaveSelected(r) {
    if (!r) return;
    if (lockedAll || gradeEntryBlocked || r.locked) return;
    await saveOne(r.studentId);
  }

  function onRowClick(r) {
    clearError();
    setSelectedId(r.studentId);
  }

  function closeDrawer() {
    if (selectedId) {
      resetRow(selectedId);
    }
    clearError();
    setSelectedId(null);
  }

  return (
    <div className="card" style={{ padding: 16 }}>
      <div style={{ fontWeight: 900, fontSize: 18, marginBottom: 4 }}>
        {subject?.code} · {subject?.name}
      </div>

      <div className="page-subtitle" style={{ marginBottom: 10 }}>
        Choose a term, then select a student to enter grade/date/note in the
        side panel.
      </div>

      {gradeEntryBlocked ? (
        <div className="page-subtitle" style={{ marginBottom: 10 }}>
          Grade entry will be available once the selected term exam period
          begins.
        </div>
      ) : null}

      {error && !selectedRow ? (
        <div className="alert-error" style={{ marginBottom: 10 }}>
          {error}
        </div>
      ) : null}

      <div className="toolbar">
        <CustomSelect
          className="grade-toolbar-select"
          value={termId || termIdOf(effectiveTerm) || ""}
          onChange={(value) => {
            setTermId(Number(value));
            setPage(1);
            setSelectedId(null);
          }}
          disabled={loadingTerms}
          loading={loadingTerms}
          placeholder="Select term..."
          ariaLabel="Term"
          options={termOptions.map((term) => ({
            key: termIdOf(term) || termLabel(term),
            value: termIdOf(term) || "",
            label: termLabel(term),
          }))}
        />

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
          disabled={
            locking ||
            saving ||
            lockedAll ||
            loadingRegs ||
            gradeEntryBlocked ||
            hasFutureExam
          }
        >
          {lockedAll ? "Locked" : locking ? "Locking..." : "Lock"}
        </button>
      </div>

      {/* tabela */}
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
                const hasResult = r.grade !== "" && r.grade != null;
                const status = r.locked
                  ? "Locked"
                  : r.hasExam && !hasResult
                    ? "Pending result"
                    : r.hasExam
                      ? "Entered"
                      : "New";

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
                  >
                    <td style={{ fontWeight: 800 }}>{r.studentName}</td>
                    <td className="mono">{r.studentIndex || "-"}</td>
                    <td className="mono">{r.date || "-"}</td>
                    <td className="mono">{r.grade !== "" ? r.grade : "-"}</td>
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
        key={selectedRow?.studentId ?? "closed"}
        open={Boolean(selectedRow)}
        onClose={closeDrawer}
        row={selectedRow}
        disabled={selectedRow ? isRowDisabled(selectedRow) : true}
        onChangeField={(studentId, patch) => updateRow(studentId, patch)}
        onSave={onSaveSelected}
        saving={saving}
        error={error}
      />

      {lockedAll ? (
        <div className="page-subtitle" style={{ marginTop: 10 }}>
          This subject and term are locked. Editing is disabled.
        </div>
      ) : null}
    </div>
  );
}
