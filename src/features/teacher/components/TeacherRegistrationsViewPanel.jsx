import { useEffect, useMemo, useState } from "react";
import { useAuth } from "../../../auth/AuthContext";
import { fetchTermsForGrading } from "../api/termsApi";
import { fetchRegistrationsForSubjectAndTerm } from "../api/registrationsApi";

function termLabel(t) {
  return t.name ?? t.termName ?? "Term";
}

export function TeacherRegistrationsViewPanel({ subject }) {
  const { token } = useAuth();

  const [terms, setTerms] = useState([]);
  const [termId, setTermId] = useState(null);

  const [rows, setRows] = useState([]);
  const [loadingTerms, setLoadingTerms] = useState(false);
  const [loadingRegs, setLoadingRegs] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadTerms() {
      if (!subject?.id) {
        setTerms([]);
        setTermId(null);
        return;
      }

      setError("");
      setLoadingTerms(true);

      try {
        const data = await fetchTermsForGrading(subject.id, token);
        setTerms(data || []);
        const first = (data || [])[0];
        setTermId(first?.termID ?? first?.id ?? null);
      } catch (e) {
        setError(e?.userMessage || e?.message || "Failed to load terms.");
        setTerms([]);
        setTermId(null);
      } finally {
        setLoadingTerms(false);
      }
    }

    loadTerms();
  }, [subject?.id, token]);

  useEffect(() => {
    async function loadRegs() {
      if (!subject?.id || !termId) {
        setRows([]);
        return;
      }

      setError("");
      setLoadingRegs(true);

      try {
        const data = await fetchRegistrationsForSubjectAndTerm(subject.id, termId, token);
        const mapped = (data || []).map((r) => ({
          studentId: r.studentID ?? r.StudentID,
          studentName: r.studentName ?? r.StudentName ?? "",
          studentIndex: r.studentIndexNumber ?? r.StudentIndexNumber ?? "",
        }));
        setRows(mapped);
      } catch (e) {
        setError(e?.userMessage || e?.message || "Failed to load registrations.");
        setRows([]);
      } finally {
        setLoadingRegs(false);
      }
    }

    loadRegs();
  }, [subject?.id, termId, token]);

  const total = useMemo(() => rows.length, [rows]);

  return (
    <div className="card" style={{ padding: 16 }}>
      <div style={{ fontWeight: 900, fontSize: 18, marginBottom: 4 }}>
        {subject?.code} · {subject?.name}
      </div>
      <div className="page-subtitle" style={{ marginBottom: 10 }}>
        View registrations for this subject. You do not have permission to enter grades.
      </div>

      {error ? (
        <div className="alert-error" style={{ marginBottom: 10 }}>
          {error}
        </div>
      ) : null}

      <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap", marginBottom: 12 }}>
        <select
          className="input"
          style={{ width: 320 }}
          value={termId || ""}
          onChange={(e) => setTermId(Number(e.target.value))}
          disabled={loadingTerms}
        >
          {(terms || []).map((t) => (
            <option key={t.termID ?? t.id} value={t.termID ?? t.id}>
              {termLabel(t)}
            </option>
          ))}
        </select>

        <div style={{ flex: 1 }} />

        <div className="page-subtitle">
          Registrations: <b>{total}</b>
        </div>
      </div>

      <div className="table-wrap">
        <table className="table">
          <thead>
            <tr>
              <th>Student</th>
              <th style={{ width: 180 }}>Index</th>
            </tr>
          </thead>
          <tbody>
            {loadingRegs ? (
              <tr>
                <td colSpan={2} style={{ padding: 10 }}>
                  Loading registrations...
                </td>
              </tr>
            ) : rows.length === 0 ? (
              <tr>
                <td colSpan={2} style={{ padding: 10 }}>
                  No registrations for this subject and term.
                </td>
              </tr>
            ) : (
              rows.map((r) => (
                <tr key={r.studentId}>
                  <td>{r.studentName}</td>
                  <td className="mono">{r.studentIndex || "-"}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}