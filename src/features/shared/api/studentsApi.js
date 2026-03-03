import { apiFetchJson } from "../../../api/client";

export async function listStudents(
  { skip = 0, take = 20, query = "", onlyDeleted = false },
  token
) {
  const qs = new URLSearchParams();
  qs.set("skip", String(skip));
  qs.set("take", String(take));
  if (query) qs.set("query", query);
  if (onlyDeleted) qs.set("onlyDeleted", "true");

  return await apiFetchJson(`/api/students?${qs.toString()}`, { method: "GET" }, token);
}

export async function createStudent(payload, token) {
  return await apiFetchJson("/api/students", { method: "POST", body: JSON.stringify(payload) }, token);
}

export async function updateStudent(id, payload, token) {
  return await apiFetchJson(`/api/students/${id}`, { method: "PUT", body: JSON.stringify(payload) }, token);
}

export async function deleteStudent(id, token) {
  return await apiFetchJson(`/api/students/${id}`, { method: "DELETE" }, token);
}
