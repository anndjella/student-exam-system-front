import { useCallback, useEffect, useState } from "react";
import { listExamsByTermSubject } from "../api/examsSSApi";
import { useAuth } from "../../../auth/AuthContext";

function getUnsignedCount(res) {
  return res?.unsignedCount ?? res?.UnsignedCount ?? 0;
}
function getExams(res) {
  return res?.exams ?? res?.Exams ?? [];
}

export function useSSExams(termId, subjectId, auto = true) {
  const { token } = useAuth();

  const [data, setData] = useState({ unsignedCount: 0, exams: [] });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const reload = useCallback(async () => {
    if (!token) return;

    if (!termId || !subjectId) {
      setData({ unsignedCount: 0, exams: [] });
      setError("");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const res = await listExamsByTermSubject(termId, subjectId, token);
      setData({
        unsignedCount: getUnsignedCount(res),
        exams: getExams(res),
      });
    } catch (e) {
      setError(e?.message ?? "Failed to load exams.");
      setData({ unsignedCount: 0, exams: [] });
    } finally {
      setLoading(false);
    }
  }, [token, termId, subjectId]);

  useEffect(() => {
    if (!auto) return;
    reload();
  }, [auto, reload]);

  return { ...data, loading, error, reload };
}
