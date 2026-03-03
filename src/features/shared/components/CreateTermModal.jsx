import { useEffect, useState } from "react";

const initialForm = {
  termName: "",
  startDate: "",
  endDate: "",
  registrationStartDate: "",
  registrationEndDate: "",
};

export function CreateTermModal({ open, saving, error, onClose, onSubmit }) {
  const [form, setForm] = useState(initialForm);

  useEffect(() => {
    if (open) {
      setForm(initialForm);
    }
  }, [open]);

  useEffect(() => {
    function onKeyDown(e) {
      if (e.key === "Escape") onClose?.();
    }
    if (open) window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open, onClose]);

  if (!open) return null;

  function submit(e) {
    e.preventDefault();
    onSubmit?.(form);
  }

  return (
    <div
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose?.();
      }}
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(15, 23, 42, 0.45)",
        display: "grid",
        placeItems: "center",
        zIndex: 50,
        padding: 18,
      }}
    >
      <div className="card" style={{ width: "min(720px, 100%)", padding: 16 }}>
        <div style={{ display: "flex", justifyContent: "space-between", gap: 12 }}>
          <div>
            <div className="page-title" style={{ fontSize: 18 }}>
              Create term
            </div>
            <div className="page-subtitle">
              Fill in term dates and registration window.
            </div>
          </div>

          <button type="button" className="btn" onClick={onClose} disabled={saving}>
            Close
          </button>
        </div>

        <form onSubmit={submit} style={{ marginTop: 14, display: "grid", gap: 12 }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <div style={{ display: "grid", gap: 6 }}>
              <div className="page-subtitle">Name</div>
              <input
                className="input"
                value={form.termName}
                onChange={(e) => setForm((p) => ({ ...p, termName: e.target.value }))}
                placeholder="e.g. January 2026"
                required
              />
            </div>

            <div style={{ display: "grid", gap: 6 }}>
              <div className="page-subtitle">Registration start</div>
              <input
                type="date"
                className="input"
                value={form.registrationStartDate}
                onChange={(e) =>
                  setForm((p) => ({ ...p, registrationStartDate: e.target.value }))
                }
                placeholder="YYYY-MM-DD"
                required
              />
            </div>

            <div style={{ display: "grid", gap: 6 }}>
              <div className="page-subtitle">Term start</div>
              <input
                type="date"
                className="input"
                value={form.startDate}
                onChange={(e) => setForm((p) => ({ ...p, startDate: e.target.value }))}
                placeholder="YYYY-MM-DD"
                required
              />
            </div>

            <div style={{ display: "grid", gap: 6 }}>
              <div className="page-subtitle">Registration end</div>
              <input
                type="date"
                className="input"
                value={form.registrationEndDate}
                onChange={(e) =>
                  setForm((p) => ({ ...p, registrationEndDate: e.target.value }))
                }
                placeholder="YYYY-MM-DD"
                required
              />
            </div>

            <div style={{ display: "grid", gap: 6 }}>
              <div className="page-subtitle">Term end</div>
              <input
                type="date"
                className="input"
                value={form.endDate}
                onChange={(e) => setForm((p) => ({ ...p, endDate: e.target.value }))}
                placeholder="YYYY-MM-DD"
                required
              />
            </div>
          </div>

          {error && <div className="alert-error">{error}</div>}

          <div style={{ display: "flex", justifyContent: "flex-end", gap: 10 }}>
            <button type="button" className="btn" onClick={onClose} disabled={saving}>
              Cancel
            </button>

            <button className="btn btn-primary" disabled={saving}>
              {saving ? "Saving..." : "Create"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
