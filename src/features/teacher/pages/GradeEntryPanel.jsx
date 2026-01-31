import { useMemo, useState } from "react";
import { useGradeEntry } from "../../hooks/useGradeEntry";
import "../../../styles/ui.css"

function termLabel(t) {
  const name = t.name ?? t.termName ?? `Term ${t.termID ?? t.id}`;
  const from = t.registrationFrom ?? t.from ?? "";
  const to = t.registrationTo ?? t.to ?? "";
  return `${name}${from && to ? ` (${from} to ${to})` : ""}`;
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

  // edit mode per studentId
  const [editing, setEditing] = useState(() => new Set());
  const [snapshots, setSnapshots] = useState(() => new Map()); // studentId -> {date, grade, note}

  const lockedAll = stats.locked;

  const termOptions = useMemo(() => terms || [], [terms]);

  function isEditing(studentId) {
    return editing.has(studentId);
  }

  function startEdit(r) {
    if (lockedAll || r.locked) return;

    setSnapshots((m) => {
      const next = new Map(m);
      next.set(r.studentId, { date: r.date || "", grade: r.grade ?? "", note: r.note || "" });
      return next;
    });

    setEditing((s) => {
      const next = new Set(s);
      next.add(r.studentId);
      return next;
    });
  }

  function cancelEdit(r) {
    const snap = snapshots.get(r.studentId);
    if (snap) {
      updateRow(r.studentId, { date: snap.date, grade: snap.grade, note: snap.note });
    }

    setEditing((s) => {
      const next = new Set(s);
      next.delete(r.studentId);
      return next;
    });

    setSnapshots((m) => {
      const next = new Map(m);
      next.delete(r.studentId);
      return next;
    });
  }

  async function saveEdit(r) {
    await saveOne(r.studentId);

    setEditing((s) => {
      const next = new Set(s);
      next.delete(r.studentId);
      return next;
    });

    setSnapshots((m) => {
      const next = new Map(m);
      next.delete(r.studentId);
      return next;
    });
  }

  // Disable inputs if:
  // - whole thing locked
  // - row locked
  // - row has exam but not in edit mode
  function rowInputsDisabled(r) {
    if (lockedAll || r.locked) return true;
    if (r.hasExam && !isEditing(r.studentId)) return true;
    return false;
  }

  return (
    <div>
      <div style={{ fontWeight: 800, marginBottom: 6 }}>
        {subject.code} · {subject.name}
      </div>

      <div className="page-subtitle" style={{ marginBottom: 10 }}>
        Choose a term, enter grades and notes, then save. Locking prevents further changes.
      </div>

      {error ? (
        <div className="alert-error" style={{ marginBottom: 10 }}>
          {error}
        </div>
      ) : null}

      <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center", marginBottom: 10 }}>
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

      <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center", marginBottom: 10 }}>
        <input
          className="input"
          type="date"
          value={bulkDate}
          onChange={(e) => setBulkDate(e.target.value)}
          disabled={lockedAll}
        />
        <button className="btn" type="button" onClick={() => setAllDates(bulkDate)} disabled={lockedAll || !bulkDate}>
          Apply date to all
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
              <th style={{ width: 220 }}>Actions</th>
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
                const disabled = rowInputsDisabled(r);
                const editingThis = isEditing(r.studentId);

                return (
                  <tr
                    key={r.studentId}
                    className={[
                      r.locked ? "row-locked" : "",
                      r.hasExam ? "row-has-exam" : "",
                      editingThis ? "row-editing" : "",
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
                        disabled={disabled}
                      />
                    </td>

                    <td>
                      <input
                        className="input"
                        value={r.grade}
                        onChange={(e) => updateRow(r.studentId, { grade: e.target.value })}
                        disabled={disabled}
                        inputMode="numeric"
                        placeholder="-"
                      />
                    </td>

                    <td>
                      <input
                        className="input"
                        value={r.note || ""}
                        onChange={(e) => updateRow(r.studentId, { note: e.target.value })}
                        disabled={disabled}
                        placeholder="Optional note..."
                      />
                    </td>

                    <td>
                      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", justifyContent: "flex-end" }}>
                        {r.locked ? (
                          <span className="badge">Locked</span>
                        ) : r.hasExam ? (
                          editingThis ? (
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
                          <button
                            className="btn btn-primary"
                            type="button"
                            onClick={() => saveOne(r.studentId)}
                            disabled={saving || lockedAll}
                          >
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
