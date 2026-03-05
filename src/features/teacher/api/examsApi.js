import { apiFetchJson } from "../../../api/client";

export async function createExam(subjectId, termId, studentId, payload, token) {
  return await apiFetchJson(
    `/api/me/teacher/exams/subject/${subjectId}/term/${termId}/student/${studentId}`,
    { method: "POST", body: JSON.stringify(payload) },
    token
  );
}

export async function updateExam(subjectId, termId, studentId, payload, token) {
  return await apiFetchJson(
    `/api/me/teacher/exams/subject/${subjectId}/term/${termId}/student/${studentId}`,
    { method: "PATCH", body: JSON.stringify(payload) },
    token
  );
}

export async function lockExams(payload, token) {
  return await apiFetchJson(
    `/api/me/teacher/exams/lock`,
    { method: "POST", body: JSON.stringify(payload) },
    token
  );
}

export async function fetchTeacherExamsForSubjectAndTerm(subjectId, termId, token) {
  return await apiFetchJson(
    `/api/me/teacher/exams/term/${termId}/subject/${subjectId}`,
    { method: "GET" },
    token
  );
}