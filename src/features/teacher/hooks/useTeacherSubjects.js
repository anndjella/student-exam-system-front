import { useCallback, useEffect, useState } from "react";
import { useAuth } from "../../../auth/AuthContext";
import { fetchMyTeacherSubjects } from "../api/teacherApi";

export function useTeacherSubjects() {
  const { token } = useAuth();

  const [gradable, setGradable] = useState([]);
  const [nonGradable, setNonGradable] = useState([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setError("");
    setLoading(true);
    try {
      const data = await fetchMyTeacherSubjects(token);

      const g = data?.gradableSubjects ?? [];
      const ng = data?.nonGradableSubjects ?? [];

      setGradable(Array.isArray(g) ? g : []);
      setNonGradable(Array.isArray(ng) ? ng : []);
    } catch (e) {
      setError(e?.message || "Failed to load teacher subjects.");
      setGradable([]);
      setNonGradable([]);
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    load();
  }, [load]);

  return { gradable, nonGradable, loading, error, reload: load };
}
