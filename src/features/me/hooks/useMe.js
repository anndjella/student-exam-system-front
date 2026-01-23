import { useCallback, useEffect, useState } from "react";
import { useAuth } from "../../../auth/AuthContext";
import { fetchMe } from "../api/meApi";

export function useMe() {
  const { token } = useAuth();

  const [me, setMe] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setError("");
    setLoading(true);
    try {
      const data = await fetchMe(token);
      setMe(data);
    } catch (e) {
      setError(e?.message || "Failed to load profile.");
      setMe(null);
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    load();
  }, [load]);

  return { me, loading, error, reload: load };
}
