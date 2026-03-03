import { useMemo, useState } from "react";
import { useGradeEntry } from "../hooks/useGradeEntry";

/* helpers */
const pick = (obj, ...keys) => {
  for (const k of keys) {
    const v = obj?.[k];
    if (v !== undefined && v !== null && v !== "") return v;
  }
  return "";
};

function termLabel(t) {
  return pick(t, "name", "termName", "TermName") || "Term";
}

function termIdOf(t) {
  return Number(pick(t, "termID", "TermID", "id", "ID") || 0);
}

function canEnterGradesOf(t) {
  if (!t) return true;
  const v = pick(t, "canEnterGrades", "CanEnterGrades");
  if (typeof v === "boolean") return v;
  if (typeof v === "string") return v.trim().toLowerCase() === "true";
  return true;
}

function hasDateValue(dateStr) {
  return typeof dateStr === "string" && dateStr.trim().length > 0;
}

function validateRow(r) {
  if (!hasDateValue(r.date)) return "Exam date is required.";
  return "";
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

  const [bulkDate, setBulkDate] = useState("");

  const [editingId, setEditingId] = useState(null);
  const [snapshot, setSnapshot] = useState(null);

  const [rowErrorById, setRowErrorById] = useState(() => new Map()); // studentId -> message

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
  const gradeEntryBlocked = !lockedAll && canEnterGrades === false;

  function setRowError(studentId, msg) {
    setRowErrorById((m) => {
      const next = new Map(m);
      if (!msg) next.delete(studentId);
      else next.set(studentId, msg);
      return next;
    });
  }

  function clearRowError(studentId) {
    setRowError(studentId, "");
  }

  function startEdit(r) {
    if (lockedAll || gradeEntryBlocked || r.locked) return;
    if (!r.hasExam) return;

    setEditingId(r.studentId);
    setSnapshot({ date: r.date || "", grade: r.grade ?? "", note: r.note || "" });
    clearRowError(r.studentId);
  }

  function cancelEdit(r) {
    if (snapshot) {
      updateRow(r.studentId, { date: snapshot.date, grade: snapshot.grade, note: snapshot.note });
    }
    setEditingId(null);
    setSnapshot(null);
    clearRowError(r.studentId);
  }

  async function saveEdit(r) {
    if (lockedAll || gradeEntryBlocked || r.locked) return;

    const msg = validateRow(r);
    if (msg) {
      setRowError(r.studentId, msg);
      return;
    }

    await saveOne(r.studentId);
    setEditingId(null);
    setSnapshot(null);
    clearRowError(r.studentId);
  }

  function isEditing(r) {
    return editingId === r.studentId;
  }

  function isDateDisabled(r) {
    if (lockedAll || gradeEntryBlocked || r.locked) return true;
    if (r.hasExam) return true;
    return false;
  }

  function areGradeNoteDisabled(r) {
    if (lockedAll || gradeEntryBlocked || r.locked) return true;
    if (r.hasExam) return !isEditing(r);
    return false;
  }

  function applyBulkDate() {
    if (!bulkDate) return;
    if (lockedAll || gradeEntryBlocked) return;
    setAllDates(bulkDate);
  }

  async function onSaveOne(r) {
    if (lockedAll || gradeEntryBlocked || r.locked) return;

    const msg = validateRow(r);
    if (msg) {
      setRowError(r.studentId, msg);
      return;
    }

    await saveOne(r.studentId);
    clearRowError(r.studentId);
  }

  async function onSaveAll() {
    if (lockedAll || gradeEntryBlocked) return;

    let anyInvalid = false;
    for (const r of rows) {
      if (r.locked) continue;
      const msg = validateRow(r);
      if (msg) {
        anyInvalid = true;
        setRowError(r.studentId, msg);
      }
    }
    if (anyInvalid) return;

    await saveAll();
    setRowErrorById(new Map());
  }

  function onChangeField(studentId, patch) {
    updateRow(studentId, patch);
    clearRowError(studentId);
  }

  return (
    <div className="card" style={{ padding: 16 }}>
      <style>{`
        .row-entry-blocked td { opacity: 0.65; }
        .input-invalid { border-color: rgba(220, 38, 38, 0.65) !important; }
        .field-error { color: rgba(220, 38, 38, 0.95); font-size: 12px; margin-top: 6px; }
      `}</style>

      <div style={{ fontWeight: 900, fontSize: 18, marginBottom: 4 }}>
        {subject?.code} · {subject?.name}
      </div>

      <div className="page-subtitle" style={{ marginBottom: 6 }}>
        Choose a term, enter grades and notes, then save. Locking prevents further changes.
      </div>

      {gradeEntryBlocked ? (
        <div className="page-subtitle" style={{ marginBottom: 10 }}>
          Grade entry will be available when the exam period starts for the selected term.
        </div>
      ) : (
        <div style={{ marginBottom: 10 }} />
      )}

      {error ? (
        <div className="alert-error" style={{ marginBottom: 10 }}>
          {error}
        </div>
      ) : null}

      <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap", marginBottom: 10 }}>
        <select
          className="input"
          style={{ width: 320 }}
          value={termId || termIdOf(effectiveTerm) || ""}
          onChange={(e) => setTermId(Number(e.target.value))}
          disabled={loadingTerms}
        >
          {termOptions.map((t) => (
            <option key={termIdOf(t) || termLabel(t)} value={termIdOf(t) || ""}>
              {termLabel(t)}
            </option>
          ))}
        </select>

        <div style={{ flex: 1 }} />

        <div className="page-subtitle">
          Registrations: <b>{stats.total}</b> · Entered: <b>{stats.entered}</b>
        </div>

        <button className="btn" type="button" onClick={lock} disabled={locking || saving || lockedAll || loadingRegs || gradeEntryBlocked}>
          {lockedAll ? "Locked" : locking ? "Locking..." : "Lock"}
        </button>
      </div>

      <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap", marginBottom: 12 }}>
        <input className="input" type="date" value={bulkDate} onChange={(e) => setBulkDate(e.target.value)} disabled={lockedAll || gradeEntryBlocked} />
        <button className="btn" type="button" onClick={applyBulkDate} disabled={lockedAll || gradeEntryBlocked || !bulkDate}>
          Apply date to all (new only)
        </button>

        <div style={{ flex: 1 }} />

        <button className="btn btn-primary" type="button" onClick={onSaveAll} disabled={saving || lockedAll || gradeEntryBlocked || loadingRegs}>
          {saving ? "Saving..." : "Save all"}
        </button>
      </div>

      <div className="table-wrap">
        <table className="table">
          <thead>
            <tr>
              <th>Student</th>
              <th style={{ width: 100 }}>Index</th>
              <th style={{ width: 150 }}>Exam date</th>
              <th style={{ width: 90 }}>Grade</th>
              <th>Note</th>
              <th style={{ width: 150 }}>Actions</th>
            </tr>
          </thead>

          <tbody>
            {loadingRegs ? (
              <tr>
                <td colSpan={6} style={{ padding: 10 }}>
                  Loading registrations...
                </td>
              </tr>
            ) : rows.length === 0 ? (
              <tr>
                <td colSpan={6} style={{ padding: 10 }}>
                  No registrations for this subject and term.
                </td>
              </tr>
            ) : (
              rows.map((r) => {
                const editing = isEditing(r);
                const rowErr = rowErrorById.get(r.studentId) || "";
                const dateInvalid = !!rowErr && !hasDateValue(r.date);

                return (
                  <tr
                    key={r.studentId}
                    className={[
                      r.hasExam ? "row-has-exam" : "",
                      editing ? "row-editing" : "",
                      r.locked ? "row-locked" : "",
                      gradeEntryBlocked ? "row-entry-blocked" : "",
                    ].join(" ")}
                  >
                    <td>{r.studentName}</td>
                    <td className="mono">{r.studentIndex || "-"}</td>

                    <td>
                      <div style={{ display: "grid" }}>
                        <input
                          className={["input", dateInvalid ? "input-invalid" : ""].join(" ")}
                          type="date"
                          value={r.date || ""}
                          onChange={(e) => onChangeField(r.studentId, { date: e.target.value })}
                          disabled={isDateDisabled(r)}
                        />
                        {dateInvalid ? <div className="field-error">{rowErr}</div> : null}
                      </div>
                    </td>

                    <td>
                      <input
                        className="input"
                        value={r.grade}
                        onChange={(e) => onChangeField(r.studentId, { grade: e.target.value })}
                        disabled={areGradeNoteDisabled(r)}
                        inputMode="numeric"
                        placeholder="-"
                      />
                    </td>

                    <td>
                      <input
                        className="input"
                        value={r.note || ""}
                        onChange={(e) => onChangeField(r.studentId, { note: e.target.value })}
                        disabled={areGradeNoteDisabled(r)}
                        placeholder="Optional note..."
                      />
                    </td>

                    <td>
                      <div style={{ display: "flex", gap: 8, flexWrap: "nowrap", justifyContent: "center" }}>
                        {r.locked ? (
                          <span className="badge">Locked</span>
                        ) : r.hasExam ? (
                          editing ? (
                            <>
                              <button className="btn btn-primary" type="button" onClick={() => saveEdit(r)} disabled={saving || lockedAll || gradeEntryBlocked}>
                                Save
                              </button>
                              <button className="btn btn-ghost" type="button" onClick={() => cancelEdit(r)} disabled={saving}>
                                Cancel
                              </button>
                            </>
                          ) : (
                            <button className="btn" type="button" onClick={() => startEdit(r)} disabled={saving || lockedAll || gradeEntryBlocked}>
                              Edit
                            </button>
                          )
                        ) : (
                          <button className="btn btn-primary" type="button" onClick={() => onSaveOne(r)} disabled={saving || lockedAll || gradeEntryBlocked || r.locked}>
                            Save
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {lockedAll ? (
        <div className="page-subtitle" style={{ marginTop: 10 }}>
          This subject and term are locked. Editing is disabled.
        </div>
      ) : null}
    </div>
  );
}
