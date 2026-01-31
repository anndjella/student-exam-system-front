import { apiFetchJson } from "../../../api/client";

export async function fetchMe(token) {
  return await apiFetchJson("/api/me", { method: "GET" }, token);
}
