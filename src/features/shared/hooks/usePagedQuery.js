import { useCallback, useEffect, useMemo, useRef, useState } from "react";

export function usePagedQuery(fetchPage, { take: initialTake = 20 } = {}) {
  const [items, setItems] = useState([]);
  const [total, setTotal] = useState(0);

  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [take, setTake] = useState(initialTake);
  const [skip, setSkip] = useState(0);

  const reqIdRef = useRef(0);
  const mountedRef = useRef(false);
  const loadingRef = useRef(false);

  const page = useMemo(() => Math.floor(skip / take) + 1, [skip, take]);
  const pageCount = useMemo(() => Math.max(1, Math.ceil(total / take)), [total, take]);

  const canPrev = useMemo(() => skip > 0, [skip]);
  const canNext = useMemo(() => skip + take < total, [skip, take, total]);

  const run = useCallback(
    async (nextSkip) => {
      if (loadingRef.current) return;
      loadingRef.current = true;

      const reqId = ++reqIdRef.current;
      setLoading(true);
      setError("");

      try {
        const res = await fetchPage({ skip: nextSkip, take, query: query.trim() });

        if (reqId !== reqIdRef.current) return;

        const list = Array.isArray(res?.items) ? res.items : [];
        const tot = typeof res?.total === "number" ? res.total : list.length;

        setItems(list);
        setTotal(tot);
        setSkip(nextSkip);
      } catch (e) {
        if (reqId !== reqIdRef.current) return;
        setItems([]);
        setTotal(0);
        setError(e?.message ?? "Failed to load.");
      } finally {
        if (reqId === reqIdRef.current) setLoading(false);
        loadingRef.current = false;
      }
    },
    [fetchPage, take, query]
  );

  const reload = useCallback(async () => {
    await run(0);
  }, [run]);

  const goPrev = useCallback(async () => {
    if (!canPrev) return;
    await run(Math.max(0, skip - take));
  }, [canPrev, run, skip, take]);

  const goNext = useCallback(async () => {
    if (!canNext) return;
    await run(skip + take);
  }, [canNext, run, skip, take]);

  useEffect(() => {
    if (mountedRef.current) return;
    mountedRef.current = true;
    reload();
  }, [reload]);

  useEffect(() => {
    if (!mountedRef.current) return;
    run(0);
  }, [query, run]);

  useEffect(() => {
    if (!mountedRef.current) return;
    run(0);
  }, [take, run]);

  useEffect(() => {
    if (!mountedRef.current) return;
    run(0);
  }, [run]);

  return {
    items,
    total,
    query,
    setQuery,
    loading,
    error,
    reload,

    take,
    setTake,
    skip,

    page,
    pageCount,
    canPrev,
    canNext,
    goPrev,
    goNext,
  };
}
