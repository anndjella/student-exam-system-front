import { useCallback, useMemo, useState } from "react";
import { useAuth } from "../../../auth/AuthContext";
import { listRegistrations } from "../api/registrationsSSApi";

export function useSsRegistrations(takeDefault = 20) {
  const { token } = useAuth();

  const [items, setItems] = useState([]);
  const [skip, setSkip] = useState(0);
  const [take] = useState(takeDefault);
  const [total, setTotal] = useState(0);

  const [subjectId, setSubjectId] = useState("");
  const [termId, setTermId] = useState("");

  const [query, setQuery] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const canSearch = useMemo(() => {
    const sid = Number(subjectId);
    const tid = Number(termId);
    return Number.isFinite(sid) && sid > 0 && Number.isFinite(tid) && tid > 0;
  }, [subjectId, termId]);

  const page = Math.floor(skip / take) + 1;
  const totalPages = Math.max(1, Math.ceil((total || 0) / take));

  const load = useCallback(
    async (opts = {}) => {
      const nextSkip = opts.skip ?? skip;
      const nextQuery = opts.query ?? query;
      const nextSubjectId = opts.subjectId ?? subjectId;
      const nextTermId = opts.termId ?? termId;

      setLoading(true);
      setError("");

      try {
        const sid = Number(nextSubjectId);
        const tid = Number(nextTermId);

        if (!Number.isFinite(sid) || sid <= 0 || !Number.isFinite(tid) || tid <= 0) {
          setItems([]);
          setSkip(nextSkip);
          setTotal(0);
          setError("Pick term and subject.");
          return;
        }

        const res = await listRegistrations(
          sid,
          tid,
          { skip: nextSkip, take, query: nextQuery },
          token
        );
        console.log("[registrations] raw response:", res);
console.log("[registrations] items:", res?.items ?? res?.Items);
console.log("[registrations] total:", res?.total ?? res?.Total);

        const nextItems = res.items || res.Items || [];
        const nextTotal = res.total || res.Total || 0;

        setItems(nextItems);
        setSkip(nextSkip);
        setTotal(Number(nextTotal) || 0);
      } catch (e) {
        setError(e?.userMessage || e?.message || "Request failed.");
      } finally {
        setLoading(false);
      }
    },
    [token, skip, take, query, subjectId, termId]
  );

  const applyFilters = useCallback(
    async ({ nextSubjectId, nextTermId } = {}) => {
      if (nextSubjectId !== undefined) setSubjectId(String(nextSubjectId));
      if (nextTermId !== undefined) setTermId(String(nextTermId));

      // reset paging kad promeniš filtere
      setSkip(0);
      setItems([]);
      setTotal(0);
      setError("");
    },
    []
  );

  const search = useCallback(async () => {
    await load({ skip: 0, query });
  }, [load, query]);

  const reload = useCallback(async () => {
    await load({ skip, query });
  }, [load, skip, query]);

  const clearSearch = useCallback(async () => {
    setQuery("");
    await load({ skip: 0, query: "" });
  }, [load]);

  const canPrev = skip > 0;
  const canNext = skip + take < total;

  const prev = useCallback(async () => {
    if (!canPrev) return;
    await load({ skip: Math.max(0, skip - take) });
  }, [canPrev, load, skip, take]);

  const next = useCallback(async () => {
    if (!canNext) return;
    await load({ skip: skip + take });
  }, [canNext, load, skip, take]);

  return {
    items,
    skip,
    take,
    total,
    page,
    totalPages,

    subjectId,
    setSubjectId: (v) => applyFilters({ nextSubjectId: v }),
    termId,
    setTermId: (v) => applyFilters({ nextTermId: v }),

    query,
    setQuery,

    loading,
    error,

    canSearch,
    reload,
    search,
    clearSearch,
    prev,
    next,
    canPrev,
    canNext,
  };
}
