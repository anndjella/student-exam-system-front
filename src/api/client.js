const API_BASE_URL = "http://localhost:5000";

export class ApiError extends Error {
  constructor(message, { status, title, detail, errorCode } = {}) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.title = title;
    this.detail = detail;
    this.errorCode = errorCode;
    this.userMessage = detail || title || message;
  }
}

async function readJsonSafe(res) {
  try {
    return await res.json();
  } catch {
    return null;
  }
}

function flattenValidationErrors(errorsObj) {
  try {
    return Object.entries(errorsObj)
      .map(([k, v]) => {
        const msg = Array.isArray(v) ? v.join(", ") : String(v ?? "");
        return `${k}: ${msg}`;
      })
      .join("\n");
  } catch {
    return "";
  }
}

async function extractProblem(res) {
  const fallbackTitle = `Request failed (${res.status})`;

  const ct = res.headers.get("content-type") || "";

  // JSON response
  if (ct.includes("json")) {
    const body = await readJsonSafe(res);

    if (!body) {
      return { title: fallbackTitle, detail: "" };
    }

    if (body?.errors) {
      const detail = flattenValidationErrors(body.errors) || "";
      return {
        title: body.title || body.Title || "Validation failed",
        detail,
        errorCode: body?.errorCode || body?.ErrorCode || body?.extensions?.errorCode,
      };
    }

    const title = body.title || body.Title || body.message || body.Message || fallbackTitle;
    const detail = body.detail || body.Detail || "";
    const errorCode = body?.errorCode || body?.ErrorCode || body?.extensions?.errorCode;

    return { title, detail, errorCode };
  }

  try {
    const text = await res.text();
    return { title: fallbackTitle, detail: text || "" };
  } catch {
    return { title: fallbackTitle, detail: "" };
  }
}

async function throwApiError(res) {
  const p = await extractProblem(res);
  const msg = p.detail || p.title || `Request failed (${res.status})`;

  throw new ApiError(msg, {
    status: res.status,
    title: p.title,
    detail: p.detail,
    errorCode: p.errorCode,
  });
}

function withAuthHeaders(options = {}, token) {
  return {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(options.headers || {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  };
}

export async function apiFetchJson(path, options = {}, token) {
  const res = await fetch(API_BASE_URL + path, withAuthHeaders(options, token));

  if (!res.ok) {
    await throwApiError(res);
  }

  if (res.status === 204) return null;
  return await res.json();
}

export async function apiFetchText(path, options = {}, token) {
  const res = await fetch(API_BASE_URL + path, withAuthHeaders(options, token));

  if (!res.ok) {
    await throwApiError(res);
  }

  return await res.text();
}
