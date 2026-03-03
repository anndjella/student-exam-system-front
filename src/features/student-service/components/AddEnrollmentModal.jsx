import { useEffect, useMemo, useState } from "react";

export function AddEnrollmentModal({ open, creating, onClose, onCreate }) {
  const [studentIndex, setStudentIndex] = useState("");
  const [subjectCode, setSubjectCode] = useState("");
  const [localError, setLocalError] = useState("");
  const [localSuccess, setLocalSuccess] = useState("");

  useEffect(() => {
    if (!open) return;
    setStudentIndex("");
    setSubjectCode("");
    setLocalError("");
    setLocalSuccess("");
  }, [open]);

  const canSubmit = useMemo(() => {
    return studentIndex.trim() && subjectCode.trim() && !creating;
  }, [studentIndex, subjectCode, creating]);

  function onStudentIndexChange(e) {
    setStudentIndex(e.target.value);
    if (localError) setLocalError("");
    if (localSuccess) setLocalSuccess("");
  }

  function onSubjectCodeChange(e) {
    setSubjectCode(e.target.value);
    if (localError) setLocalError("");
    if (localSuccess) setLocalSuccess("");
  }

  async function submit(e) {
    e.preventDefault();

    setLocalError("");
    setLocalSuccess("");

    const si = studentIndex.trim();
    const sc = subjectCode.trim();

    if (!si || !sc) {
      setLocalError("Please enter both student index and subject code.");
      return;
    }

    try {
      await onCreate({ studentIndex: si, subjectCode: sc });

      setStudentIndex("");
      setSubjectCode("");
      setLocalSuccess("Enrollment added successfully.");
    } catch (err) {
      const msg =
        err?.userMessage ||
        err?.message ||
        (typeof err === "string" ? err : "") ||
        "Create failed.";
      setLocalError(msg);
    }
  }

  function onKeyDown(e) {
    if (e.key === "Escape") {
      if (!creating) onClose();
    }
  }

  function onOverlayMouseDown() {
    if (!creating) onClose();
  }

  if (!open) return null;

  return (
    <div
      className="modal-overlay"
      onMouseDown={onOverlayMouseDown}
      onKeyDown={onKeyDown}
      role="dialog"
      aria-modal="true"
      tabIndex={-1}
    >
      <div className="card modal-card" onMouseDown={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div>
            <div className="modal-title">Add enrollment</div>
            <div className="modal-subtitle">Enter student index and subject code.</div>
          </div>

          <button className="btn" type="button" onClick={onClose} disabled={creating}>
            Close
          </button>
        </div>

        <div className="modal-body">
          <form onSubmit={submit}>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
                gap: 10,
                alignItems: "center",
              }}
            >
              <input
                className="input"
                placeholder="Student index (e.g. 2022/0056)"
                value={studentIndex}
                onChange={onStudentIndexChange}
                autoComplete="off"
                disabled={creating}
              />
              <input
                className="input"
                placeholder="Subject code (e.g. MAT1)"
                value={subjectCode}
                onChange={onSubjectCodeChange}
                autoComplete="off"
                disabled={creating}
              />
            </div>

            {localError ? (
              <div className="alert-error" style={{ marginTop: 10 }}>
                {localError}
              </div>
            ) : null}

            {localSuccess ? (
              <div className="alert-success" style={{ marginTop: 10 }}>
                {localSuccess}
              </div>
            ) : null}

            <div className="modal-footer">
              <button className="btn" type="button" onClick={onClose} disabled={creating}>
                Cancel
              </button>
              <button className="btn btn-primary" disabled={!canSubmit}>
                {creating ? "Creating..." : "Create"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
