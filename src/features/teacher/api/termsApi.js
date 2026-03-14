import { apiFetchJson } from "../../../api/client";

export async function fetchTermsForGrading(subjectId, token) {
  return await apiFetchJson(
    `/api/me/teacher/terms/for-grading/subject/${subjectId}`,
    { method: "GET" },
    token
  );
}

export async function fetchTermsForExamsView(token) {
  return await apiFetchJson(
    `/api/terms/for-exams-view`,
    { method: "GET" },
    token
  );
}