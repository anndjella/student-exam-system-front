import { apiFetchJson } from "../../../api/client";

export async function fetchMyTeacherSubjects(token) {
  return await apiFetchJson("/api/me/teacher/subjects", { method: "GET" }, token);
}