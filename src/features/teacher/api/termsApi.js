import { apiFetchJson } from "../../../api/client";

export async function fetchTermsForGrading(token) {
  return await apiFetchJson("/api/terms/for-grading", { method: "GET" }, token);
}