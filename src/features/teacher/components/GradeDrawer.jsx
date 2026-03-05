import { useEffect, useMemo, useState } from "react";

function hasDateValue(dateStr) {
  return typeof dateStr === "string" && dateStr.trim().length > 0;
}

export function GradeDrawer({
  open,
  onClose,
  row,
  disabled,
  onChangeField,
  onSave,
  saving,
}) {
  const [localError, setLocalError] = useState("");

  useEffect(() => {
    setLocalError("");
  }, [row?.studentId, open]);

  const title = useMemo(() => {
    if (!row) return "";
    return `${row.studentName} · ${row.studentIndex || "-"}`;
  }, [row]);

  function validate() {
    if (!row) return "No row selected.";
    if (!hasDateValue(row.date)) return "Exam date is required.";
    return "";
  }

  async function handleSave() {
    const msg = validate();
    if (msg) {
      setLocalError(msg);
      return;
    }
    await onSave?.(row);
    setLocalError("");
  }

  if (!open) return null;

  return (
    <div className="drawer-backdrop" onMouseDown={(e) => {
      if (e.target === e.currentTarget) onClose?.();
    }}>
      <aside className="drawer" role="dialog" aria-modal="true">
        <div className="drawer-head">
          <div>
            <div className="drawer-title">Grade entry</div>
            <div className="drawer-sub">{title}</div>
          </div>

          <button className="btn" type="button" onClick={onClose}>
            Close
          </button>
        </div>

        {row ? (
          <div className="drawer-body">
            {localError ? <div className="alert-error">{localError}</div> : null}

            <div className="form-grid">
              <label className="form-field">
                <span>Exam date</span>
                <input
                  className="input"
                  type="date"
                  value={row.date || ""}
                  onChange={(e) => onChangeField(row.studentId, { date: e.target.value })}
                  disabled={disabled || row.hasExam}
                />
              </label>

              <label className="form-field">
                <span>Grade</span>
                <input
                  className="input"
                  value={row.grade ?? ""}
                  onChange={(e) => onChangeField(row.studentId, { grade: e.target.value })}
                  disabled={disabled}
                  inputMode="numeric"
                  placeholder="-"
                />
              </label>

              <label className="form-field form-field--full">
                <span>Note</span>
                <textarea
                  className="input textarea"
                  value={row.note || ""}
                  onChange={(e) => onChangeField(row.studentId, { note: e.target.value })}
                  disabled={disabled}
                  placeholder="Optional note..."
                />
              </label>
            </div>
          </div>
        ) : (
          <div className="drawer-body">
            <div className="page-subtitle">Select a student row to edit.</div>
          </div>
        )}

        <div className="drawer-foot">
          <button className="btn btn-primary" type="button" onClick={handleSave} disabled={disabled || saving || !row}>
            {saving ? "Saving..." : "Save"}
          </button>
        </div>
      </aside>
    </div>
  );
}