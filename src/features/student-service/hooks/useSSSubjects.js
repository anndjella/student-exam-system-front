import { useCallback, useEffect, useMemo, useState } from "react";
import { useAuth } from "../../../auth/AuthContext";
import {
  createSubject,
  deactivateSubject,
  deleteSubject,
  fetchSubjectByCode,
  listSubjectsPaged,
} from "../api/subjectsSSApi";

function clamp(n, min, max) {
  return Math.max(min, Math.min(max, n));
}

export function useSsSubjects() {
  const { token } = useAuth();

  const [tab, setTab] = useState("active");
  const activeFlag = tab === "active";

  const [items, setItems] = useState([]);
  const [total, setTotal] = useState(0);

  const [query, setQuery] = useState("");
  const [skip, setSkip] = useState(0);
  const [take, setTake] = useState(20);

  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState("");

  const page = useMemo(() => Math.floor(skip / take) + 1, [skip, take]);
  const pageCount = useMemo(() => Math.max(1, Math.ceil(total / take)), [total, take]);

  const canPrev = useMemo(() => skip > 0, [skip]);
  const canNext = useMemo(() => skip + take < total, [skip, take, total]);

  const goPrev = useCallback(() => {
    setSkip((s) => Math.max(0, s - take));
  }, [take]);

  const goNext = useCallback(() => {
    setSkip((s) => s + take);
  }, []);

  const goFirst = useCallback(() => {
    setSkip(0);
  }, []);

  const load = useCallback(async () => {
    if (!token) return;

    setError("");
    setLoading(true);

    try {
      const data = await listSubjectsPaged(
        { active: activeFlag, skip, take, query },
        token
      );

      setItems(data?.items || []);
      setTotal(Number(data?.total) || 0);
    } catch (e) {
      setError(e?.message || "Failed to load subjects.");
      setItems([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  }, [token, activeFlag, skip, take, query]);

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
          setTab("active");
          setSkip(0);
        } catch (e) {
          setError(e?.message || "Failed to create subject.");
          throw e;
        } finally {
          setActionLoading(false);
        }
      },
    };
  }, [token, load]);

  const setTabSafe = useCallback((t) => {
    setTab(t);
    setSkip(0);
  }, []);

  const setTakeSafe = useCallback((v) => {
    const n = Number(v);
    const next = Number.isFinite(n) ? clamp(n, 1, 100) : 20;
    setTake(next);
    setSkip(0);
  }, []);

  return {
    tab,
    setTab: setTabSafe,
    activeFlag,

    items,
    total,

    query,
    setQuery: (v) => {
      setQuery(v);
      setSkip(0);
    },

    skip,
    take,
    setTake: setTakeSafe,

    page,
    pageCount,
    canPrev,
    canNext,
    goPrev,
    goNext,
    goFirst,

    loading,
    actionLoading,
    error,

    reload: load,

    ...api,
  };
}
