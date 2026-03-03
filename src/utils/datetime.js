const LOCALE = "en-GB";

export function formatDateTime(value, opts = {}) {
  if (!value) return "-";

  const s = String(value).trim();

  const hasTz = /([zZ]|[+\-]\d{2}:\d{2})$/.test(s);
  const iso = hasTz ? s : s + "Z";

  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "-";

  return d.toLocaleString(LOCALE, {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    ...opts,
  });
}

export function formatDate(value, opts = {}) {
  if (!value) return "-";

  const s = String(value).trim();
  const hasTz = /([zZ]|[+\-]\d{2}:\d{2})$/.test(s);
  const iso = hasTz ? s : s + "Z";

  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "-";

  return d.toLocaleDateString(LOCALE, {
    day: "2-digit",
    month: "short",
    year: "numeric",
    ...opts,
  });
}
