const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || "").replace(/\/+$/, "");

export class ApiError extends Error {
  constructor(message, { status, title, detail, errorCode } = {}) {
    const finalMessage = buildMessage(message, title, detail);

    super(finalMessage);

    this.name = "ApiError";
    this.status = status;
    this.title = title;
    this.detail = detail;
    this.errorCode = errorCode;

    this.userMessage = finalMessage;
  }
}

function buildMessage(message, title, detail) {
  if (detail && message && detail !== message) {
    return `${message} ${detail}`;
  }

  if (detail) return detail;
  if (title) return title;
  if (message) return message;

  return "Request failed.";
}

function normalizeNetworkError(err) {
  if (!navigator.onLine) {
    return new ApiError("You are offline.", {
      detail: "Check your internet connection.",
    });
  }

  if (
    err instanceof TypeError &&
    (err.message.includes("Failed to fetch") ||
      err.message.includes("NetworkError") ||
      err.message.includes("Load failed"))
  ) {
    return new ApiError("Cannot connect to the server.", {
      detail: "Make sure the backend is running.",
    });
  }

  return err instanceof ApiError
    ? err
    : new ApiError("Unexpected network error.", { detail: err?.message });
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
        errorCode:
          body?.errorCode || body?.ErrorCode || body?.extensions?.errorCode,
      };
    }

    const title =
      body.title || body.Title || body.message || body.Message || fallbackTitle;

    const detail = body.detail || body.Detail || "";

    const errorCode =
      body?.errorCode || body?.ErrorCode || body?.extensions?.errorCode;

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

  throw new ApiError(p.detail || p.title, {
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
  let res;

  try {
    res = await fetch(API_BASE_URL + path, withAuthHeaders(options, token));
  } catch (err) {
    throw normalizeNetworkError(err);
  }

  if (!res.ok) {
    await throwApiError(res);
  }

  if (res.status === 204) return null;

  return await res.json();
}

export async function apiFetchText(path, options = {}, token) {
  let res;

  try {
    res = await fetch(API_BASE_URL + path, withAuthHeaders(options, token));
  } catch (err) {
    throw normalizeNetworkError(err);
  }

  if (!res.ok) {
    await throwApiError(res);
  }

  return await res.text();
}
