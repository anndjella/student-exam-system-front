import { apiFetchJson } from "../../../api/client";

export async function listSubjectsPaged({ active, skip, take, query }, token) {
  const qs = new URLSearchParams();
  qs.set("active", String(Boolean(active)));
  qs.set("skip", String(skip ?? 0));
  qs.set("take", String(take ?? 20));
  if (query && String(query).trim()) qs.set("query", String(query).trim());

  return await apiFetchJson(`/api/subjects?${qs.toString()}`, { method: "GET" }, token);
}

export async function fetchAllWithInactive(token) {
  return await apiFetchJson("/api/subjects/all", { method: "GET" }, token);
}

export async function fetchSubjectByCode(code, token) {
  const safe = encodeURIComponent(code);
  return await apiFetchJson(`/api/subjects/${safe}`, { method: "GET" }, token);
}

export async function deactivateSubject(id, token) {
  return await apiFetchJson(`/api/subjects/deactivate/${id}`, { method: "PATCH" }, token);
}

export async function deleteSubject(id, token) {
  return await apiFetchJson(`/api/subjects/${id}`, { method: "DELETE" }, token);
}

export async function createSubject(payload, token) {
  return await apiFetchJson(
    "/api/subjects",
    {
      method: "POST",
      body: JSON.stringify(payload),
    },
    token
  );
}
