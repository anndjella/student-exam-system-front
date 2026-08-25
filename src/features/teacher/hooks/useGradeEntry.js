import { useCallback, useEffect, useMemo, useState } from "react";
import { useAuth } from "../../../auth/AuthContext";

import { fetchTermsForGrading } from "../api/termsApi";
import { fetchRegistrationsForSubjectAndTerm } from "../api/registrationsApi";
import { createExam, updateExam, lockExams } from "../api/examsApi";

function toInputDate(v) {
  if (!v) return "";
  return String(v).slice(0, 10);
}

function normalizeText(v) {
  return String(v ?? "").trim();
}

function normalizeGradeValue(v) {
  if (v === "" || v == null) return "";
  return String(v).trim();
}

function todayDateOnly() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function hasAnyRowValue(r) {
  return Boolean(
    normalizeText(r?.date) ||
    normalizeGradeValue(r?.grade) !== "" ||
    normalizeText(r?.note),
  );
}

function gradeChanged(r) {
  return normalizeGradeValue(r.grade) !== normalizeGradeValue(r.originalGrade);
}

function noteChanged(r) {
  return normalizeText(r.note) !== normalizeText(r.originalNote);
}

function validateRow(r) {
  if (!hasAnyRowValue(r)) return "";

  if (!normalizeText(r.date)) {
    return `Student ${r.studentName || r.studentId}: exam date is required.`;
  }

  if (normalizeGradeValue(r.grade) !== "" && r.date > todayDateOnly()) {
    return `Student ${r.studentName || r.studentId}: a grade cannot be entered before the exam date.`;
  }

  if (r.hasExam && gradeChanged(r)) {
    const note = normalizeText(r.note);

    if (!note) {
      return `Student ${r.studentName || r.studentId}: if you change the grade, you must enter a new note.`;
    }

    if (!noteChanged(r)) {
      return `Student ${r.studentName || r.studentId}: if you change the grade, the note must also be updated.`;
    }
  }

  return "";
}

function buildPayload(row) {
  return {
    Date: normalizeText(row.date) || null,
    Grade: row.grade === "" ? null : Number(row.grade),
    Note: normalizeText(row.note) || null,
  };
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
      const list = Array.isArray(data) ? data : [];

      setTerms(list);

      setTermId((current) => {
        if (!list.length) return null;

        const exists = list.some(
          (t) =>
            Number(t?.termID ?? t?.TermID ?? t?.id ?? t?.ID) ===
            Number(current),
        );

        if (exists) return current;

        const first = list[0];
        return first?.termID ?? first?.TermID ?? first?.id ?? first?.ID ?? null;
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

        const mapped = (Array.isArray(data) ? data : [])
          .map((r) => {
            const studentId = r.studentID ?? r.StudentID;
            const signedAt = r.signedAt ?? r.SignedAt ?? null;

            const date = toInputDate(
              r.examDate ?? r.ExamDate ?? r.date ?? r.Date,
            );
            const grade =
              (r.grade ?? r.Grade) == null ? "" : String(r.grade ?? r.Grade);
            const note = r.note ?? r.Note ?? "";

            return {
              studentId,
              studentName: r.studentName ?? r.StudentName ?? "",
              studentIndex: r.studentIndexNumber ?? r.StudentIndexNumber ?? "",

              hasExam: Boolean(r.hasExam ?? r.HasExam),
              examId: r.examID ?? r.ExamID ?? r.id ?? r.ID ?? null,

              signedAt,
              locked: Boolean(signedAt),

              date,
              grade,
              note,

              originalDate: date,
              originalGrade: grade,
              originalNote: note,
            };
          })
          .sort((a, b) =>
            String(a.studentIndex || "").localeCompare(
              String(b.studentIndex || ""),
            ),
          );

        setRows(mapped);
      } catch (e) {
        setError(
          e?.userMessage || e?.message || "Failed to load registrations.",
        );
        setRows([]);
      } finally {
        setLoadingRegs(false);
      }
    },
    [token],
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
    setRows((cur) =>
      cur.map((r) => (r.locked ? r : { ...r, date: dateValue })),
    );
  }

  function updateRow(studentId, patch) {
    setRows((cur) =>
      cur.map((r) => (r.studentId === studentId ? { ...r, ...patch } : r)),
    );
  }

  async function saveOne(studentId) {
    if (!token || !subjectId || !termId) return;

    const row = rows.find((r) => r.studentId === studentId);
    if (!row || row.locked) return;

    setError("");

    const rowError = validateRow(row);
    if (rowError) {
      setError(rowError);
      return;
    }

    setSaving(true);

    try {
      const payload = buildPayload(row);

      if (row.hasExam) {
        if (!row.examId) {
          throw new Error("Exam ID is missing for update.");
        }

        await updateExam(row.examId, payload, token);
      } else {
        await createExam(subjectId, termId, studentId, payload, token);
      }

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

    const candidateRows = rows.filter((r) => !r.locked && hasAnyRowValue(r));

    if (!candidateRows.length) {
      setError("There are no entered exams to save.");
      return;
    }

    for (const row of candidateRows) {
      const rowError = validateRow(row);
      if (rowError) {
        setError(rowError);
        return;
      }
    }

    setSaving(true);

    try {
      for (const row of candidateRows) {
        const payload = buildPayload(row);

        if (row.hasExam) {
          if (!row.examId) {
            throw new Error(
              `Exam ID is missing for student ${row.studentName || row.studentId}.`,
            );
          }

          await updateExam(row.examId, payload, token);
        } else {
          await createExam(subjectId, termId, row.studentId, payload, token);
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
      "Lock exams for this subject and term? This will prevent further changes.",
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
