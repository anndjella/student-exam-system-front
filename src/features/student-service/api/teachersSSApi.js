import { apiFetchJson } from "../../../api/client";

export async function listTeachers({ skip = 0, take = 20, query = "" }, token) {
  const qs = new URLSearchParams();
  qs.set("skip", String(skip));
  qs.set("take", String(take));
  if (query) qs.set("query", query);

  return await apiFetchJson(`/api/teachers?${qs.toString()}`, { method: "GET" }, token);
}

export async function createTeacher(payload, token) {
  return await apiFetchJson("/api/teachers", { method: "POST", body: JSON.stringify(payload) }, token);
}

export async function updateTeacher(id, payload, token) {
  return await apiFetchJson(`/api/teachers/${id}`, { method: "PUT", body: JSON.stringify(payload) }, token);
}

export async function deleteTeacher(id, token) {
  return await apiFetchJson(`/api/teachers/${id}`, { method: "DELETE" }, token);
}
