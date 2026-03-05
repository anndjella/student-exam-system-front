import { apiFetchJson } from "../../../api/client";

export async function fetchRegistrationsForSubjectAndTerm(subjectId, termId, token) {
  return await apiFetchJson(
    `/api/me/teacher/registrations/subject/${subjectId}/term/${termId}`,
    { method: "GET" },
    token
  );
}