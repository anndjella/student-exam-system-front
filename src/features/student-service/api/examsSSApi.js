import { apiFetchJson } from "../../../api/client";

export async function listExamsByTermSubject(termId, subjectId, token) {
  if (!termId || !subjectId) throw new Error("Term and subject are required.");

  return await apiFetchJson(
    `/api/exams/term/${termId}/subject/${subjectId}`,
    { method: "GET" },
    token
  );
}
