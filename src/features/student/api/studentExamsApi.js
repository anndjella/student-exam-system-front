import { apiFetchJson } from "../../../api/client";

export async function fetchMySignedExams(token) {
  return await apiFetchJson("/api/me/student/exams/signed", { method: "GET" }, token);
}
