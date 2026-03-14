import { useCallback, useEffect, useMemo, useState } from "react";
import { useAuth } from "../../../auth/AuthContext";

import { fetchTermsForGrading } from "../api/termsApi";
import { fetchRegistrationsForSubjectAndTerm } from "../api/registrationsApi";
import { createExam, updateExam, lockExams } from "../api/examsApi";

function toInputDate(v) {
  if (!v) return "";
  if (typeof v === "string") return v;
  return String(v);
}

export function useGradeEntry(subjectId) {
  const { token } = useAuth();

  const [terms, setTerms] = useState([]);
  const [termId, setTermId] = useState(null);

  const [rows, setRows] = useState([]);
  const [loadingTerms, setLoadingTerms] = useState(false);
  const [loadingRegs, setLoadingRegs] = useState(false);
  const [saving, setSaving] = useState(false);
  const [locking, setLocking] = useState(false);
  const [error, setError] = useState("");

  const loadTerms = useCallback(async () => {
    if (!token || !subjectId) {
      setTerms([]);
      setTermId(null);
      return;
    }

    setError("");
    setLoadingTerms(true);

    try {
      const data = await fetchTermsForGrading(subjectId, token);

      const list = data || [];
      setTerms(list);

      setTermId((current) => {
        if (!list.length) return null;

        const exists = list.some(
          (t) => Number(t?.termID ?? t?.id) === Number(current)
        );

        if (exists) return current;

        const first = list[0];
        return first?.termID ?? first?.id ?? null;
      });
    } catch (e) {
      setError(e?.userMessage || e?.message || "Failed to load terms.");
      setTerms([]);
      setTermId(null);
    } finally {
      setLoadingTerms(false);
    }
  }, [token, subjectId]);

  const loadRegistrations = useCallback(
    async (sid, tid) => {
      if (!token || !sid || !tid) {
        setRows([]);
        return;
      }

      setError("");
      setLoadingRegs(true);

      try {
        const data = await fetchRegistrationsForSubjectAndTerm(sid, tid, token);

        const mapped = (data || []).map((r) => {
          const studentId = r.studentID ?? r.StudentID;
          const signedAt = r.signedAt ?? r.SignedAt ?? null;

          return {
            studentId,
            studentName: r.studentName ?? r.StudentName ?? "",
            studentIndex: r.studentIndexNumber ?? r.StudentIndexNumber ?? "",

            hasExam: Boolean(r.hasExam ?? r.HasExam),
            examId: r.examID ?? r.ExamID ?? null,

            signedAt,
            locked: Boolean(signedAt),

            date: toInputDate(r.examDate ?? r.ExamDate),
            grade:
              (r.grade ?? r.Grade) == null ? "" : String(r.grade ?? r.Grade),
            note: r.note ?? r.Note ?? "",
          };
        });

        setRows(mapped);
      } catch (e) {
        setError(e?.userMessage || e?.message || "Failed to load registrations.");
        setRows([]);
      } finally {
        setLoadingRegs(false);
      }
    },
    [token]
  );

  useEffect(() => {
    loadTerms();
  }, [loadTerms]);

  useEffect(() => {
    if (!subjectId || !termId) {
      setRows([]);
      return;
    }

    loadRegistrations(subjectId, termId);
  }, [subjectId, termId, loadRegistrations]);

  const stats = useMemo(() => {
    const total = rows.length;
    const entered = rows.filter((r) => r.hasExam).length;
    const locked = rows.length > 0 && rows.every((r) => r.locked);
    return { total, entered, locked };
  }, [rows]);

  function setAllDates(dateValue) {
    setRows((cur) => cur.map((r) => (r.locked ? r : { ...r, date: dateValue })));
  }

  function updateRow(studentId, patch) {
    setRows((cur) =>
      cur.map((r) => (r.studentId === studentId ? { ...r, ...patch } : r))
    );
  }

  async function saveOne(studentId) {
    if (!token || !subjectId || !termId) return;

    const row = rows.find((r) => r.studentId === studentId);
    if (!row || row.locked) return;

    setError("");
    setSaving(true);

    try {
      const payload = {
        Date: row.date || null,
        Grade: row.grade === "" ? null : Number(row.grade),
        Note: row.note || null,
      };

      const res = row.hasExam
        ? await updateExam(subjectId, termId, studentId, payload, token)
        : await createExam(subjectId, termId, studentId, payload, token);

      const signedAt = res?.signedAt ?? res?.SignedAt ?? row.signedAt ?? null;

      updateRow(studentId, {
        hasExam: true,
        examId: res?.examID ?? res?.ExamID ?? res?.id ?? res?.ID ?? row.examId,
        date:
          toInputDate(
            res?.examDate ?? res?.ExamDate ?? res?.date ?? res?.Date
          ) || row.date,
        grade:
          (res?.grade ?? res?.Grade) == null
            ? row.grade
            : String(res?.grade ?? res?.Grade),
        note: res?.note ?? res?.Note ?? row.note,
        signedAt,
        locked: Boolean(signedAt),
      });

      await loadRegistrations(subjectId, termId);
    } catch (e) {
      setError(e?.userMessage || e?.message || "Failed to save exam.");
    } finally {
      setSaving(false);
    }
  }

  async function saveAll() {
    if (!token || !subjectId || !termId) return;

    setError("");
    setSaving(true);

    try {
      for (const r of rows) {
        if (r.locked) continue;

        const hasAny =
          (r.date && String(r.date).trim()) ||
          r.grade !== "" ||
          (r.note && r.note.trim());

        if (!hasAny) continue;

        const payload = {
          Date: r.date || null,
          Grade: r.grade === "" ? null : Number(r.grade),
          Note: r.note || null,
        };

        if (r.hasExam) {
          await updateExam(subjectId, termId, r.studentId, payload, token);
        } else {
          await createExam(subjectId, termId, r.studentId, payload, token);
        }
      }

      await loadRegistrations(subjectId, termId);
    } catch (e) {
      setError(e?.userMessage || e?.message || "Failed to save exams.");
    } finally {
      setSaving(false);
    }
  }

  async function lock() {
    if (!token || !subjectId || !termId) return;

    const ok = window.confirm(
      "Lock exams for this subject and term? This will prevent further changes."
    );
    if (!ok) return;

    setError("");
    setLocking(true);

    try {
      await lockExams({ SubjectID: subjectId, TermID: termId }, token);
      await loadRegistrations(subjectId, termId);
    } catch (e) {
      setError(e?.userMessage || e?.message || "Failed to lock exams.");
    } finally {
      setLocking(false);
    }
  }

  return {
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
    reloadRegistrations: () => loadRegistrations(subjectId, termId),
  };
}