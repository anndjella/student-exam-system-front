import { useCallback, useEffect, useMemo, useState } from "react";
import { useAuth } from "../../../auth/AuthContext";
import {
  createSubject,
  deactivateSubject,
  deleteSubject,
  fetchAllSubjectsGrouped,
  fetchSubjectByCode,
} from "../api/subjectsSSApi";

export function useSsSubjects() {
  const { token } = useAuth();

  const [active, setActive] = useState([]);
  const [inactive, setInactive] = useState([]);

  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setError("");
    setLoading(true);
    try {
      const data = await fetchAllSubjectsGrouped(token);
      setActive(data?.active || []);
      setInactive(data?.inactive || []);
    } catch (e) {
      setError(e?.message || "Failed to load subjects.");
      setActive([]);
      setInactive([]);
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    load();
  }, [load]);

  const api = useMemo(() => {
    return {
      async searchByCode(code) {
        setError("");
        const c = (code || "").trim();
        if (!c) return null;

        try {
          return await fetchSubjectByCode(c, token);
        } catch (e) {
          setError(e?.message || "Subject not found.");
          return null;
        }
      },

      async deactivate(id) {
        setError("");
        setActionLoading(true);
        try {
          await deactivateSubject(id, token);
          await load();
        } catch (e) {
          setError(e?.message || "Failed to deactivate subject.");
        } finally {
          setActionLoading(false);
        }
      },

      async remove(id) {
        setError("");
        setActionLoading(true);
        try {
          await deleteSubject(id, token);
          await load();
        } catch (e) {
          setError(e?.message || "Failed to delete subject.");
        } finally {
          setActionLoading(false);
        }
      },

      async create(payload) {
        setError("");
        setActionLoading(true);
        try {
          await createSubject(payload, token);
          await load();
        } catch (e) {
          setError(e?.message || "Failed to create subject.");
        } finally {
          setActionLoading(false);
        }
      },
    };
  }, [token, load]);

  return {
    active,
    inactive,
    loading,
    actionLoading,
    error,
    reload: load,
    ...api,
  };
}
