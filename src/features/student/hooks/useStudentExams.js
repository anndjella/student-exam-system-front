import { useCallback, useEffect, useState } from "react";
import { useAuth } from "../../../auth/AuthContext";
import { fetchMySignedExams } from "../api/studentExamsApi";

export function useStudentExams() {
  const { token } = useAuth();

  const [data, setData] = useState({ passed: [], notPassed: [] });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    if (!token) return;

    setLoading(true);
    setError("");

    try {
      const res = await fetchMySignedExams(token);

      setData({
        passed: Array.isArray(res?.passed) ? res.passed : [],
        notPassed: Array.isArray(res?.notPassed) ? res.notPassed : [],
      });
    } catch (e) {
      setError(e?.message ?? "Failed to load exams.");
      setData({ passed: [], notPassed: [] });
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    load();
  }, [load]);

  return {
    passed: data.passed,
    notPassed: data.notPassed,
    loading,
    error,
    reload: load,
  };
}
