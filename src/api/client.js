const API_BASE_URL = "http://localhost:5000";

async function extractErrorMessage(res) {
  let fallback = `Request failed (${res.status})`;

  try {
    const ct = res.headers.get("content-type") || "";

    if (ct.includes("application/problem+json") || ct.includes("application/json")) {
      const obj = await res.json();
      return obj.detail || obj.Detail || obj.title || obj.Title || fallback;
    }

    const text = await res.text().catch(() => "");
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
    const msg = await extractErrorMessage(res);
    throw new Error(msg);
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
    const msg = await extractErrorMessage(res);
    throw new Error(msg);
  }

  return await res.text();
}
