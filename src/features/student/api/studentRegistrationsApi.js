import { apiFetchJson } from "../../../api/client";

export async function fetchMyActiveRegistrations(token) {
  return await apiFetchJson(
    "/api/me/student/registrations/my-active-registrations",
    { method: "GET" },
    token
  );
}

export async function createRegistration(payload, token) {
  // payload: { subjectID, termID }
  return await apiFetchJson(
    "/api/me/student/registrations/registrations",
    { method: "POST", body: JSON.stringify(payload) },
    token
  );
}

export async function cancelRegistration(subjectId, termId, token) {
  return await apiFetchJson(
    `/api/me/student/registrations/cancel/subject/${subjectId}/term/${termId}`,
    { method: "PUT" },
    token
  );
}

export async function fetchNotPassedSubjects(token) {
  return await apiFetchJson(
    "/api/me/student/subjects/not-passed-subjects",
    { method: "GET" },
    token
  );
}

export async function fetchOpenTermsForRegistration(token) {
  return await apiFetchJson(
    "/api/terms/open-for-registration",
    { method: "GET" },
    token
  );
}
