import { apiFetchJson } from "../../../api/client";

export async function bulkEnrollByIndexYear(payload, token) {
  return await apiFetchJson(
    "/api/enrollments/bulk-by-index-year",
    {
      method: "POST",
      body: JSON.stringify(payload),
    },
    token
  );
}
