import { apiFetchJson } from "../../../api/client";

export async function fetchMyTeacherSubjects(token) {
  return await apiFetchJson("/api/me/teacher/subjects", { method: "GET" }, token);
}

export async function fetchTermsForGrading(token) {
  return await apiFetchJson("/api/terms/for-grading", { method: "GET" }, token);
}

export async function fetchRegistrationsForSubjectAndTerm(subjectId, termId, token) {
  return await apiFetchJson(
    `/api/me/teacher/registrations/subject/${subjectId}/term/${termId}`,
    { method: "GET" },
    token
  );
}

export async function createExam(subjectId, termId, studentId, payload, token) {
  return await apiFetchJson(
    `/api/me/teacher/subjects/${subjectId}/terms/${termId}/students/${studentId}`,
    { method: "POST", body: JSON.stringify(payload) },
    token
  );
}

export async function updateExam(subjectId, termId, studentId, payload, token) {
  return await apiFetchJson(
    `/api/me/teacher/subjects/${subjectId}/terms/${termId}/students/${studentId}`,
    { method: "PATCH", body: JSON.stringify(payload) },
    token
  );
}

export async function lockExams(payload, token) {
  return await apiFetchJson(
    `/api/me/teacher/subjects/lock`,
    { method: "POST", body: JSON.stringify(payload) },
    token
  );
}
