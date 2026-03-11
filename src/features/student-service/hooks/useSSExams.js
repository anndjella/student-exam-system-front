import { useCallback, useMemo, useState } from "react";
import { useAuth } from "../../../auth/AuthContext";
import { listExamsByTermSubject } from "../api/examsSSApi";

function pick(obj, ...keys) {
  for (const k of keys) {
    const v = obj?.[k];
    if (v !== undefined && v !== null) return v;
  }
  return undefined;
}

function getItems(res) {
  const exams = pick(res, "exams", "Exams");
  return Array.isArray(exams) ? exams : [];
}

function getUnsignedCount(res) {
  return Number(pick(res, "unsignedCount", "UnsignedCount") ?? 0);
}

function getTotal(res, fallbackItemsLength = 0) {
  const total = pick(res, "total", "Total", "totalCount", "TotalCount");
  if (total !== undefined && total !== null && !Number.isNaN(Number(total))) {
    return Number(total);
  }
  return fallbackItemsLength;
}

export function useSSExams(defaultTake = 20) {
  const { token } = useAuth();

  const [termId, setTermId] = useState("");
  const [subjectId, setSubjectId] = useState("");

  const [queryInput, setQueryInput] = useState("");
  const [appliedQuery, setAppliedQuery] = useState("");

  const [items, setItems] = useState([]);
  const [unsignedCount, setUnsignedCount] = useState(0);
  const [total, setTotal] = useState(0);

  const [skip, setSkip] = useState(0);
  const [take] = useState(defaultTake);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const canSearch = Boolean(termId && subjectId);

  const page = useMemo(() => Math.floor(skip / take) + 1, [skip, take]);
  const totalPages = useMemo(() => {
    const pages = Math.ceil((total || 0) / take);
    return pages > 0 ? pages : 1;
  }, [total, take]);

  const canPrev = skip > 0;
  const canNext = skip + take < total;

  const run = useCallback(
    async ({ nextSkip = 0, nextQuery = "", keepPaging = false } = {}) => {
      if (!token) return;

      if (!termId || !subjectId) {
        setItems([]);
        setUnsignedCount(0);
        setTotal(0);
        setError("");
        if (!keepPaging) setSkip(0);
        return;
      }

      setLoading(true);
      setError("");

      try {
        const res = await listExamsByTermSubject(
          Number(subjectId),
          Number(termId),
          {
            skip: nextSkip,
            take,
            query: nextQuery,
          },
          token
        );

        const nextItems = getItems(res);

        setItems(nextItems);
        setUnsignedCount(getUnsignedCount(res));
        setTotal(getTotal(res, nextItems.length));
        setSkip(nextSkip);
        setAppliedQuery(nextQuery);
      } catch (e) {
        setError(e?.userMessage || e?.message || "Failed to load exams.");
        setItems([]);
        setUnsignedCount(0);
        setTotal(0);
      } finally {
        setLoading(false);
      }
    },
    [token, termId, subjectId, take]
  );

  const search = useCallback(async () => {
    await run({
      nextSkip: 0,
      nextQuery: queryInput.trim(),
    });
  }, [run, queryInput]);

  const reload = useCallback(async () => {
    await run({
      nextSkip: skip,
      nextQuery: appliedQuery,
      keepPaging: true,
    });
  }, [run, skip, appliedQuery]);

  const prev = useCallback(async () => {
    if (!canPrev || loading) return;
    await run({
      nextSkip: Math.max(0, skip - take),
      nextQuery: appliedQuery,
      keepPaging: true,
    });
  }, [canPrev, loading, run, skip, take, appliedQuery]);

  const next = useCallback(async () => {
    if (!canNext || loading) return;
    await run({
      nextSkip: skip + take,
      nextQuery: appliedQuery,
      keepPaging: true,
    });
  }, [canNext, loading, run, skip, take, appliedQuery]);

  const clearSearch = useCallback(() => {
    setQueryInput("");
    setAppliedQuery("");
    setItems([]);
    setUnsignedCount(0);
    setTotal(0);
    setSkip(0);
    setError("");
  }, []);

  return {
    termId,
    setTermId,
    subjectId,
    setSubjectId,

    query: queryInput,
    setQuery: setQueryInput,
    appliedQuery,

    items,
    unsignedCount,
    total,

    skip,
    take,
    page,
    totalPages,

    loading,
    error,
    canSearch,
    canPrev,
    canNext,

    search,
    reload,
    prev,
    next,
    clearSearch,
  };
}