import { apiFetchJson } from "../../../api/client";
export async function createTerm(payload, token) {
  return await apiFetchJson(
    "/api/terms",
    { method: "POST", body: JSON.stringify(payload) },
    token
  );
}

export async function deleteTerm(id, token) {
  return await apiFetchJson(`/api/terms/${id}`, { method: "DELETE" }, token);
}