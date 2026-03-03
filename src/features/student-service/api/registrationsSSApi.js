import { apiFetchJson } from "../../../api/client";

export async function listRegistrations(subjectId, termId, { skip = 0, take = 20, query = null } = {}, token) {
  const sp = new URLSearchParams();
  sp.set("subjectId", String(subjectId));
  sp.set("termId", String(termId));
  sp.set("skip", String(skip));
  sp.set("take", String(take));
  if (query && query.trim()) sp.set("query", query.trim());

  return await apiFetchJson(`/api/registrations?${sp.toString()}`, { method: "GET" }, token);
}
