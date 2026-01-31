import { useMemo, useState } from "react";
import { useGradeEntry } from "../hooks/useGradeEntry";

function termLabel(t) {
  return t.name ?? t.termName ?? "Term";
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

  // per-row edit mode (only for rows that already have an exam)
  const [editingId, setEditingId] = useState(null);
  const [snapshot, setSnapshot] = useState(null);

  const lockedAll = stats.locked;
  const termOptions = useMemo(() => terms || [], [terms]);

  function startEdit(r) {
    if (lockedAll || r.locked) return;
    if (!r.hasExam) return; // new rows are editable by default
    setEditingId(r.studentId);
    setSnapshot({
      date: r.date || "",
      grade: r.grade ?? "",
      note: r.note || "",
    });
  }

  function cancelEdit(r) {
    if (snapshot) {
      updateRow(r.studentId, {
        date: snapshot.date,
        grade: snapshot.grade,
        note: snapshot.note,
      });
    }
    setEditingId(null);
    setSnapshot(null);
  }

  async function saveEdit(r) {
    await saveOne(r.studentId);
    setEditingId(null);
    setSnapshot(null);
  }

  function isEditing(r) {
    return editingId === r.studentId;
  }

  // For existing exams:
  // - not editing: everything disabled
  // - editing: date disabled, grade+note enabled
  // For new exams:
  // - allow editing normally (date+grade+note enabled)
  function isDateDisabled(r) {
    if (lockedAll || r.locked) return true;
    if (r.hasExam) return true; // date never changes once exam exists
    return false;
  }

  function areGradeNoteDisabled(r) {
    if (lockedAll || r.locked) return true;

    if (r.hasExam) {
      // existing exam: only editable when in edit mode
      return !isEditing(r);
    }

    // new exam: editable
    return false;
  }

  // Apply date only to rows without existing exam (and not locked)
  function applyBulkDate() {
    if (!bulkDate) return;
    setAllDates(bulkDate);
  }

  return (
    <div className="card" style={{ padding: 16 }}>
      <div style={{ fontWeight: 900, fontSize: 18, marginBottom: 4 }}>
        {subject?.code} · {subject?.name}
      </div>
      <div className="page-subtitle" style={{ marginBottom: 10 }}>
        Choose a term, enter grades and notes, then save. Locking prevents further changes.
      </div>

      {error ? (
        <div className="alert-error" style={{ marginBottom: 10 }}>
          {error}
        </div>
      ) : null}

      <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap", marginBottom: 10 }}>
        <select
          className="input"
          style={{ width: 320 }}
          value={termId || ""}
          onChange={(e) => setTermId(Number(e.target.value))}
          disabled={loadingTerms}
        >
          {termOptions.map((t) => (
            <option key={t.termID ?? t.id} value={t.termID ?? t.id}>
              {termLabel(t)}
            </option>
          ))}
        </select>

        <div style={{ flex: 1 }} />

        <div className="page-subtitle">
          Registrations: <b>{stats.total}</b> · Entered: <b>{stats.entered}</b>
        </div>

        <button className="btn" type="button" onClick={lock} disabled={locking || saving || lockedAll || loadingRegs}>
          {lockedAll ? "Locked" : locking ? "Locking..." : "Lock"}
        </button>
      </div>

      <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap", marginBottom: 12 }}>
        <input
          className="input"
          type="date"
          value={bulkDate}
          onChange={(e) => setBulkDate(e.target.value)}
          disabled={lockedAll}
        />
        <button className="btn" type="button" onClick={applyBulkDate} disabled={lockedAll || !bulkDate}>
          Apply date to all (new only)
        </button>

        <div style={{ flex: 1 }} />

        <button className="btn btn-primary" type="button" onClick={saveAll} disabled={saving || lockedAll || loadingRegs}>
          {saving ? "Saving..." : "Save all"}
        </button>
      </div>

      <div className="table-wrap">
        <table className="table">
          <thead>
            <tr>
              <th>Student</th>
              <th style={{ width: 140 }}>Index</th>
              <th style={{ width: 150 }}>Exam date</th>
              <th style={{ width: 90 }}>Grade</th>
              <th>Note</th>
              <th style={{ width: 240 }}>Actions</th>
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

                return (
                  <tr
                    key={r.studentId}
                    className={[
                      r.hasExam ? "row-has-exam" : "",
                      editing ? "row-editing" : "",
                      r.locked ? "row-locked" : "",
                    ].join(" ")}
                  >
                    <td>{r.studentName}</td>
                    <td className="mono">{r.studentIndex || "-"}</td>

                    <td>
                      <input
                        className="input"
                        type="date"
                        value={r.date || ""}
                        onChange={(e) => updateRow(r.studentId, { date: e.target.value })}
                        disabled={isDateDisabled(r)}
                      />
                    </td>

                    <td>
                      <input
                        className="input"
                        value={r.grade}
                        onChange={(e) => updateRow(r.studentId, { grade: e.target.value })}
                        disabled={areGradeNoteDisabled(r)}
                        inputMode="numeric"
                        placeholder="-"
                      />
                    </td>

                    <td>
                      <input
                        className="input"
                        value={r.note || ""}
                        onChange={(e) => updateRow(r.studentId, { note: e.target.value })}
                        disabled={areGradeNoteDisabled(r)}
                        placeholder="Optional note..."
                      />
                    </td>

                    <td>
                      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", justifyContent: "flex-end" }}>
                        {r.locked ? (
                          <span className="badge">Locked</span>
                        ) : r.hasExam ? (
                          editing ? (
                            <>
                              <button className="btn btn-primary" type="button" onClick={() => saveEdit(r)} disabled={saving}>
                                Save
                              </button>
                              <button className="btn btn-ghost" type="button" onClick={() => cancelEdit(r)} disabled={saving}>
                                Cancel
                              </button>
                            </>
                          ) : (
                            <button className="btn" type="button" onClick={() => startEdit(r)} disabled={saving || lockedAll}>
                              Edit
                            </button>
                          )
                        ) : (
                          <button className="btn btn-primary" type="button" onClick={() => saveOne(r.studentId)} disabled={saving || lockedAll}>
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
