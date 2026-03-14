import { useCallback, useEffect, useState } from "react";
import { useAuth } from "../../../auth/AuthContext";

import { fetchMyTeacherSubjects } from "../api/subjectsApi";
import { fetchTermsForExamsView } from "../api/termsApi";
import { fetchTeacherExamsForSubjectAndTerm } from "../api/examsApi";

export function useTeacherExamsPage() {
  const { token } = useAuth();

  const [gradableSubjects, setGradableSubjects] = useState([]);
  const [nonGradableSubjects, setNonGradableSubjects] = useState([]);

  const [terms, setTerms] = useState([]);
  const [subjectId, setSubjectId] = useState("");
  const [termId, setTermId] = useState("");

  const [data, setData] = useState(null);
  const [loadingInit, setLoadingInit] = useState(false);
  const [loadingExams, setLoadingExams] = useState(false);
  const [error, setError] = useState("");

  const loadInit = useCallback(async () => {
    if (!token) return;

    setError("");
    setLoadingInit(true);

    try {
      const [subj, t] = await Promise.all([
        fetchMyTeacherSubjects(token),
        fetchTermsForExamsView(token),
      ]);

      const g = subj?.gradableSubjects ?? [];
      const ng = subj?.nonGradableSubjects ?? [];

      setGradableSubjects(Array.isArray(g) ? g : []);
      setNonGradableSubjects(Array.isArray(ng) ? ng : []);
      setTerms(Array.isArray(t) ? t : []);

      setSubjectId("");
      setTermId("");
      setData(null);
    } catch (e) {
      setError(e?.message || "Failed to load data.");
      setGradableSubjects([]);
      setNonGradableSubjects([]);
      setTerms([]);
      setSubjectId("");
      setTermId("");
      setData(null);
    } finally {
      setLoadingInit(false);
    }
  }, [token]);

  const loadExams = useCallback(
    async (sid, tid) => {
      if (!token || !sid || !tid) return;

      setError("");
      setLoadingExams(true);

      try {
        const res = await fetchTeacherExamsForSubjectAndTerm(sid, tid, token);
        setData(
          res || { mine: [], others: [], unsignedCount: 0, myUnsignedCount: 0 }
        );
      } catch (e) {
        setError(e?.message || "Failed to load exams.");
        setData(null);
      } finally {
        setLoadingExams(false);
      }
    },
    [token]
  );

  const reload = useCallback(async () => {
    if (!subjectId || !termId) return;
    await loadExams(Number(subjectId), Number(termId));
  }, [loadExams, subjectId, termId]);

  useEffect(() => {
    loadInit();
  }, [loadInit]);

  return {
    gradableSubjects,
    nonGradableSubjects,
    terms,

    subjectId,
    setSubjectId,
    termId,
    setTermId,

    data,
    loadingInit,
    loadingExams,
    error,

    loadExams,
    reload,
  };
}