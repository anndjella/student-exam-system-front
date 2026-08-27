import { useCallback, useEffect, useState } from "react";
import { useAuth } from "../../../auth/AuthContext";
import { listEnrollments } from "../api/enrollmentsSSApi";

export function useSsEnrollments(takeDefault = 20) {
  const { token } = useAuth();

  const [items, setItems] = useState([]);
  const [skip, setSkip] = useState(0);
  const [take] = useState(takeDefault);
  const [total, setTotal] = useState(0);

  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const page = Math.floor(skip / take) + 1;
  const totalPages = Math.max(1, Math.ceil(total / take));

  const load = useCallback(
    async (opts = {}) => {
      const nextSkip = opts.skip ?? skip;
      const nextQuery = opts.query ?? query;

      setLoading(true);
      setError("");

      try {
        const res = await listEnrollments(
          { skip: nextSkip, take, query: nextQuery },
          token
        );

        const nextItems = res.items || res.Items || [];
        const nextTotal = res.total || res.Total || 0;

        setItems(nextItems);
        setSkip(nextSkip);
        setTotal(nextTotal);
      } catch (e) {
        setError(e?.userMessage || e?.message || "Request failed.");
      } finally {
        setLoading(false);
      }
    },
    [token, skip, take, query]
  );

  useEffect(() => {
    load({ skip: 0 });
  }, []);

  const reload = useCallback(() => load({ skip, query }), [load, skip, query]);

  const search = useCallback(async () => {
    await load({ skip: 0, query });
  }, [load, query]);

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
    query,
    setQuery,
    loading,
    error,
    reload,
    search,
    clearSearch,
    prev,
    next,
    canPrev,
    canNext,
  };
}
