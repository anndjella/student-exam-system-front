import { apiFetchJson } from "../../../api/client";

export async function listExamsByTermSubject(
  subjectId,
  termId,
  { skip = 0, take = 20, query = null } = {},
  token
) {
  const sp = new URLSearchParams();
  sp.set("skip", String(skip));
  sp.set("take", String(take));

  if (query && query.trim()) {
    sp.set("query", query.trim());
  }

  return await apiFetchJson(
    `/api/exams/term/${termId}/subject/${subjectId}?${sp.toString()}`,
    { method: "GET" },
    token
  );
}