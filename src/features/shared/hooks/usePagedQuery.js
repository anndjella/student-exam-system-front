import { useCallback, useEffect, useMemo, useRef, useState } from "react";

export function usePagedQuery(fetchPage, { take = 20 } = {}) {
  const [items, setItems] = useState([]);
  const [total, setTotal] = useState(0);

  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const reqIdRef = useRef(0);
  const mountedRef = useRef(false);
  const loadingRef = useRef(false);

  const canLoadMore = useMemo(() => items.length < total, [items.length, total]);

  const run = useCallback(
    async ({ skip }) => {
      if (loadingRef.current) return;
      loadingRef.current = true;

      const reqId = ++reqIdRef.current;

      setLoading(true);
      setError("");

      try {
        const res = await fetchPage({ skip, take, query: query.trim() });

        if (reqId !== reqIdRef.current) return;

        const list = Array.isArray(res?.items) ? res.items : [];
        const tot = typeof res?.total === "number" ? res.total : list.length;

        if (skip === 0) {
          setItems(list);
        } else {
          setItems((prev) => [...prev, ...list]);
        }

        setTotal(tot);
      } catch (e) {
        if (reqId !== reqIdRef.current) return;
        if (skip === 0) {
          setItems([]);
          setTotal(0);
        }
        setError(e?.message ?? "Failed to load.");
      } finally {
        if (reqId === reqIdRef.current) setLoading(false);
        loadingRef.current = false;
      }
    },
    [fetchPage, take, query]
  );

  const reload = useCallback(async () => {
    await run({ skip: 0 });
  }, [run]);

  const loadMore = useCallback(async () => {
    if (!canLoadMore) return;
    await run({ skip: items.length });
  }, [run, canLoadMore, items.length]);

  useEffect(() => {
    if (mountedRef.current) return;
    mountedRef.current = true;
    reload();
  }, [reload]);

  useEffect(() => {
    if (!mountedRef.current) return;
    reload();
  }, [query, reload]);

  return {
    items,
    total,
    query,
    setQuery,
    loading,
    error,
    reload,
    loadMore,
    canLoadMore,
    take,
  };
}
