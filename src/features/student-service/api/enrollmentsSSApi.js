import { apiFetchJson } from "../../../api/client";

export async function bulkEnrollByIndexYear(payload, token) {
  return await apiFetchJson(
    "/api/enrollments/bulk-by-index-year",
    {
      method: "POST",
      body: JSON.stringify(payload),
    },
    token
  );
}

export async function listEnrollmentsByStudent(index, { skip = 0, take = 20, query = null } = {}, token) {
  const sp = new URLSearchParams();
  sp.set("skip", String(skip));
  sp.set("take", String(take));
  if (query && query.trim()) sp.set("query", query.trim());

  return await apiFetchJson(
    `/api/enrollments/student/index/${encodeURIComponent(index)}?${sp.toString()}`,
    { method: "GET" },
    token
  );
}

export async function listEnrollmentsBySubject(code, { skip = 0, take = 20, query = null } = {}, token) {
  const sp = new URLSearchParams();
  sp.set("skip", String(skip));
  sp.set("take", String(take));
  if (query && query.trim()) sp.set("query", query.trim());

  return await apiFetchJson(
    `/api/enrollments/subject/code/${encodeURIComponent(code)}?${sp.toString()}`,
    { method: "GET" },
    token
  );
}

export async function createEnrollmentSingle(payload, token) {
  return await apiFetchJson(
    "/api/enrollments",
    {
      method: "POST",
      body: JSON.stringify(payload),
    },
    token
  );
}

export async function deleteEnrollment(subjectId, studentId, token) {
  return await apiFetchJson(
    `/api/enrollments/subject/${encodeURIComponent(subjectId)}/student/${encodeURIComponent(studentId)}`,
    { method: "DELETE" },
    token
  );
}
