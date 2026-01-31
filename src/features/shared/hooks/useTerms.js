import { useCallback, useEffect, useState } from "react";
import { useAuth } from "../../../auth/AuthContext";
import { fetchTerms } from "../api/termsApi";

export function useTerms() {
  const { token } = useAuth();

  const [terms, setTerms] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    if (!token) return;

    setLoading(true);
    setError("");

    try {
      const data = await fetchTerms(token);
      setTerms(Array.isArray(data) ? data : []);
    } catch (e) {
      setError(e?.message ?? "Failed to load terms.");
      setTerms([]);
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    load();
  }, [load]);

  return { terms, loading, error, reload: load };
}
