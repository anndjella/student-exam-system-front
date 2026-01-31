export function Modal({ open, title, children, onClose }) {
  if (!open) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose?.();
      }}
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.35)",
        display: "grid",
        placeItems: "center",
        padding: 16,
        zIndex: 1000,
      }}
    >
      <div className="card" style={{ width: "min(720px, 100%)", padding: 14 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
          <div style={{ fontWeight: 900 }}>{title}</div>
          <div style={{ flex: 1 }} />
          <button className="btn" onClick={onClose}>
            Close
          </button>
        </div>

        {children}
      </div>
    </div>
  );
}
