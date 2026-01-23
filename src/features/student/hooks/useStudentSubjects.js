import { useEffect, useState } from "react";
import { apiFetchJson } from "../../../api/client";
import { useAuth } from "../../../auth/AuthContext";

export function useStudentSubjects() {
  const { token } = useAuth();

  const [subjects, setSubjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function load() {
    setLoading(true);
    setError("");

    try {
      const data = await apiFetchJson(
        "/api/me/student/subjects/my-enrolled-subjects",
        {},
        token
      );

      setSubjects(Array.isArray(data) ? data : []);
    } catch (e) {
      setError(e?.message || "Failed to load subjects.");
      setSubjects([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  return { subjects, loading, error, reload: load };
}
