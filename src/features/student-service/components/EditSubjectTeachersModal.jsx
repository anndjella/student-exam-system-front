import { useEffect, useMemo, useState } from "react";
import "./editTeachersModal.css";

function titleToText(title) {
  switch (title) {
    case 1:
      return "Assistant Professor";
    case 2:
      return "Associate Professor";
    case 3:
      return "Full Professor";
    case 4:
      return "Professor Emeritus";
    default:
      return "-";
  }
}

export function EditSubjectTeachersModal({
  open,
  subject,
  initialTeachers,
  saving,
  onClose,
  onSave,
  onSearchTeacher,
}) {
  const [items, setItems] = useState([]);
  const [empQuery, setEmpQuery] = useState("");
  const [searchErr, setSearchErr] = useState("");
  const [searching, setSearching] = useState(false);

  useEffect(() => {
    if (!open) return;
    setItems(
      (initialTeachers || []).map((t) => ({
        ...t,
        _op: "keep", // keep | remove | add
      }))
    );
    setEmpQuery("");
    setSearchErr("");
    setSearching(false);
  }, [open, initialTeachers]);

  const existingTeacherIds = useMemo(() => new Set(items.map((x) => x.id)), [items]);

  function toggleCanGrade(id) {
    setItems((cur) =>
      cur.map((x) => (x.id === id ? { ...x, canGrade: !x.canGrade } : x))
    );
  }

  function removeTeacher(id) {
    setItems((cur) =>
      cur.map((x) => (x.id === id ? { ...x, _op: x._op === "add" ? "drop" : "remove" } : x))
        .filter((x) => x._op !== "drop")
    );
  }

  async function onAddTeacher() {
    const q = empQuery.trim();
    if (!q) return;

    setSearchErr("");
    setSearching(true);
    try {
      const t = await onSearchTeacher(q);

      if (!t) {
        setSearchErr("Teacher not found.");
        return;
      }

      if (existingTeacherIds.has(t.id)) {
        setSearchErr("This teacher is already in the list.");
        return;
      }

      setItems((cur) => [
        ...cur,
        {
          id: t.id,
          firstName: t.firstName,
          lastName: t.lastName,
          title: t.title,
          employeeNumber: t.employeeNumber,
          canGrade: false,
          _op: "add",
        },
      ]);

      setEmpQuery("");
    } catch (e) {
      setSearchErr(e?.message || "Search failed.");
    } finally {
      setSearching(false);
    }
  }

 function handleSave() {
  const cleaned = items
    .filter((x) => x._op !== "drop" && x._op !== "remove")
    .map(({ _op, ...rest }) => rest);

  onSave(cleaned, items);
}

  if (!open) return null;

  return (
    <div className="modal-overlay" role="dialog" aria-modal="true">
      <div className="modal-card card">
        <div className="modal-header">
          <div>
            <div className="modal-title">Edit teachers</div>
            <div className="modal-subtitle">
              Subject: <span className="mono">{subject?.code}</span> {subject?.name}
            </div>
          </div>

          <button className="btn btn-ghost" type="button" onClick={onClose} disabled={saving}>
            ✕
          </button>
        </div>

        <div className="modal-body">
          <div style={{ fontWeight: 800, marginBottom: 8 }}>Assigned teachers</div>

          {items.length === 0 ? (
            <div className="page-subtitle">No teachers assigned.</div>
          ) : (
            <div className="table-wrap">
              <table className="table">
                <thead>
                  <tr>
                    <th>Teacher</th>
                    <th style={{ width: 170 }}>Employee No.</th>
                    <th style={{ width: 170 }}>Title</th>
                    <th style={{ width: 140 }}>Can grade</th>
                    <th style={{ width: 90 }}>Remove</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((t) => (
                    <tr key={t.id} style={t._op === "remove" ? { opacity: 0.45 } : undefined}>
                      <td>
                        {t.firstName} {t.lastName}
                      </td>
                      <td className="mono">{t.employeeNumber || "-"}</td>
                      <td>{titleToText(t.title)}</td>
                      <td>
                        <label style={{ display: "flex", alignItems: "center", gap: 10 }}>
                          <input
                            type="checkbox"
                            checked={Boolean(t.canGrade)}
                            disabled={t._op === "remove" || saving}
                            onChange={() => toggleCanGrade(t.id)}
                          />
                          <span>{t.canGrade ? "Yes" : "No"}</span>
                        </label>
                      </td>
                      <td>
                        <button
                          type="button"
                          className="btn"
                          disabled={saving}
                          onClick={() => removeTeacher(t.id)}
                          title="Remove teacher"
                        >
                          Remove
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          <div style={{ height: 16 }} />

          <div style={{ fontWeight: 800, marginBottom: 8 }}>Add teacher</div>
          <div className="add-row">
            <input
              className="input"
              placeholder="Search by employee number..."
              value={empQuery}
              onChange={(e) => setEmpQuery(e.target.value)}
              disabled={saving}
            />
            <button
              className="btn btn-primary"
              type="button"
              onClick={onAddTeacher}
              disabled={saving || searching || !empQuery.trim()}
            >
              {searching ? "Searching..." : "Add"}
            </button>
          </div>

          {searchErr ? <div className="alert-error" style={{ marginTop: 10 }}>{searchErr}</div> : null}
        </div>

        <div className="modal-footer">
          <button className="btn" type="button" onClick={onClose} disabled={saving}>
            Cancel
          </button>
          <button className="btn btn-primary" type="button" onClick={handleSave} disabled={saving}>
            {saving ? "Saving..." : "Save"}
          </button>
        </div>
      </div>
    </div>
  );
}
