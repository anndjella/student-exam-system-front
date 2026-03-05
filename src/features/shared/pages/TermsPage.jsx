import { useMemo, useState } from "react";
import { useAuth } from "../../../auth/AuthContext";
import { useTerms } from "../hooks/useTerms";
import { createTerm, deleteTerm } from "../../../features/student-service/api/termsSSApi";
import { CreateTermModal } from "../components/CreateTermModal";

function formatDate(value) {
  if (!value) return "-";
  const iso = String(value).slice(0, 10);
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
}

function getName(term) {
  return term?.name ?? term?.termName ?? term?.title ?? "-";
}
function getTermStart(term) {
  return term?.startDate ?? term?.start ?? term?.dateFrom ?? null;
}
function getTermEnd(term) {
  return term?.endDate ?? term?.end ?? term?.dateTo ?? null;
}
function getRegStart(term) {
  return term?.registrationStartDate ?? term?.registrationStart ?? term?.regStartDate ?? term?.regStart ?? null;
}
function getRegEnd(term) {
  return term?.registrationEndDate ?? term?.registrationEnd ?? term?.regEndDate ?? term?.regEnd ?? null;
}
function getId(term) {
  return term?.id ?? term?.termID ?? term?.termId;
}

export function TermsPage() {
  const { token, role } = useAuth();
  const { terms, loading, error, reload } = useTerms();

  const isStudentService = useMemo(
    () => String(role ?? "").toLowerCase() === "studentservice",
    [role]
  );

  const [modalOpen, setModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [createError, setCreateError] = useState("");

  async function handleCreate(form) {
    if (!token) return;

    setSaving(true);
    setCreateError("");

    try {
      await createTerm(form, token);
      setModalOpen(false);
      await reload();
    } catch (err) {
      setCreateError(err?.message ?? "Failed to create term.");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(termId) {
    if (!token || !termId) return;

    const confirmed = window.confirm("Are you sure you want to delete this term?");
    if (!confirmed) return;

    try {
      await deleteTerm(termId, token);
      await reload();
    } catch (err) {
      alert(err?.message ?? "Failed to delete term.");
    }
  }

  return (
    <div className="container">
      <div className="page-header">
        <div>
          <h1 className="page-title">Terms</h1>
          <div className="page-subtitle">
            <span className="mono"></span>
          </div>
        </div>

        <div style={{ display: "flex", gap: 10 }}>
          {isStudentService && (
            <button className="btn btn-primary" onClick={() => setModalOpen(true)}>
              Add term
            </button>
          )}

          <button className="btn" onClick={reload} disabled={loading}>
            Refresh
          </button>
        </div>
      </div>

      <CreateTermModal
        open={modalOpen}
        saving={saving}
        error={createError}
        onClose={() => {
          setModalOpen(false);
          setCreateError("");
        }}
        onSubmit={handleCreate}
      />

      {loading && <div className="page-subtitle">Loading...</div>}
      {!loading && error && <div className="alert-error">{error}</div>}

      {!loading && !error && terms.length === 0 && (
        <div className="page-subtitle center">No terms available.</div>
      )}

      {!loading && !error && terms.length > 0 && (
        <div className="table-wrap">
          <table className="table terms-table">
            <colgroup>
              <col /> {/* Term */}
              <col /> {/* Registration Start */}
              <col /> {/* Registration End */}
              <col /> {/* Duration Start */}
              <col /> {/* Duration End */}
              {isStudentService && <col style={{ width: 130 }} />} {/* Actions */}
            </colgroup>

            <thead>
              <tr>
                <th rowSpan={2}>Term</th>
                <th colSpan={2}>Registration</th>
                <th colSpan={2}>Duration</th>
                {isStudentService && <th rowSpan={2} style={{ textAlign: "center" }}>Actions</th>}
              </tr>
              <tr>
                <th>Start</th>
                <th>End</th>
                <th>Start</th>
                <th>End</th>
              </tr>
            </thead>

            <tbody>
              {terms.map((term) => {
                const id = getId(term);
                return (
                  <tr key={id ?? `${getName(term)}-${getTermStart(term)}-${getTermEnd(term)}`}>
                    <td>{getName(term)}</td>

                    <td className="mono">{formatDate(getRegStart(term))}</td>
                    <td className="mono">{formatDate(getRegEnd(term))}</td>

                    <td className="mono">{formatDate(getTermStart(term))}</td>
                    <td className="mono">{formatDate(getTermEnd(term))}</td>

                    {isStudentService && (
                      <td style={{ textAlign: "center", whiteSpace: "nowrap" }}>
                        <button
                          className="btn btn-ghost"
                          onClick={() => handleDelete(id)}
                          disabled={!id}
                        >
                          Delete
                        </button>
                      </td>
                    )}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
