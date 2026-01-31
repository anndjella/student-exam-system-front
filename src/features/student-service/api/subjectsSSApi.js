import { apiFetchJson } from "../../../api/client";

export async function fetchAllSubjectsGrouped(token) {
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
