import { useMemo, useState } from "react";

function hasDateValue(dateStr) {
  return typeof dateStr === "string" && dateStr.trim().length > 0;
}

function todayDateOnly() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function normalizeValue(value) {
  return String(value ?? "").trim();
}

export function GradeDrawer({
  open,
  onClose,
  row,
  disabled,
  onChangeField,
  onSave,
  saving,
  error,
}) {
  const [localError, setLocalError] = useState("");

  const title = useMemo(() => {
    if (!row) return "";
    return `${row.studentName} · ${row.studentIndex || "-"}`;
  }, [row]);

  function validate() {
    if (!row) return "No row selected.";
    if (!hasDateValue(row.date)) return "Exam date is required.";
    if (gradeWasChanged && !normalizeValue(row.note)) {
      return "Enter a note explaining the grade change.";
    }
    if (
      gradeWasChanged &&
      normalizeValue(row.note) === normalizeValue(row.originalNote)
    ) {
      return "Update the note to explain the grade change.";
    }
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

  const gradeDisabled =
    disabled || !hasDateValue(row?.date) || row.date > todayDateOnly();
  const gradeWasChanged =
    Boolean(row?.hasExam) &&
    normalizeValue(row?.grade) !== normalizeValue(row?.originalGrade);
  const displayedError = localError || error;

  return (
    <div
      className="drawer-backdrop"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose?.();
      }}
    >
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
            {displayedError ? (
              <div className="alert-error">{displayedError}</div>
            ) : null}

            <div className="form-grid">
              <label className="form-field">
                <span>Exam date</span>
                <input
                  className="input"
                  type="date"
                  value={row.date || ""}
                  onChange={(e) => {
                    setLocalError("");
                    onChangeField(row.studentId, { date: e.target.value })
                  }}
                  disabled={disabled || row.hasExam}
                />
              </label>

              <label className="form-field">
                <span>Grade</span>
                <input
                  className="input"
                  value={row.grade ?? ""}
                  onChange={(e) => {
                    setLocalError("");
                    onChangeField(row.studentId, { grade: e.target.value })
                  }}
                  disabled={gradeDisabled}
                  inputMode="numeric"
                  placeholder="-"
                />
              </label>

              <label className="form-field form-field--full">
                <span>{gradeWasChanged ? "Note (required)" : "Note"}</span>
                <textarea
                  className="input textarea"
                  value={row.note || ""}
                  onChange={(e) => {
                    setLocalError("");
                    onChangeField(row.studentId, { note: e.target.value })
                  }}
                  disabled={disabled}
                  required={gradeWasChanged}
                  aria-required={gradeWasChanged}
                  placeholder={
                    gradeWasChanged
                      ? "Explain why the grade was changed..."
                      : "Optional note..."
                  }
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
          <button
            className="btn btn-primary"
            type="button"
            onClick={handleSave}
            disabled={disabled || saving || !row}
          >
            {saving ? "Saving..." : "Save"}
          </button>
        </div>
      </aside>
    </div>
  );
}
