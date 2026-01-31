const API_BASE_URL = "http://localhost:5000";

async function extractError(res) {
  const fallback = `Request failed (${res.status})`;
  const ct = res.headers.get("content-type") || "";

  try {
    if (ct.includes("json")) {
      const body = await res.json();

      if (body?.errors) {
        return Object.entries(body.errors)
          .map(([k, v]) => `${k}: ${Array.isArray(v) ? v.join(", ") : v}`)
          .join("\n");
      }

      return body.detail || body.title || body.message || fallback;
    }

    const text = await res.text();
    return text || fallback;
  } catch {
    return fallback;
  }
}

export async function apiFetchJson(path, options = {}, token) {
  const res = await fetch(API_BASE_URL + path, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(options.headers || {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  });

  if (!res.ok) {
    throw new Error(await extractError(res));
  }

  if (res.status === 204) return null;
  return await res.json();
}

export async function apiFetchText(path, options = {}, token) {
  const res = await fetch(API_BASE_URL + path, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(options.headers || {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  });

  if (!res.ok) {
    throw new Error(await extractError(res));
  }

  return await res.text();
}
