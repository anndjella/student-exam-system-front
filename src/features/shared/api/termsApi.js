import { apiFetchJson } from "../../../api/client";

export async function fetchTerms(token) {
  return await apiFetchJson("/api/terms", { method: "GET" }, token);
}

