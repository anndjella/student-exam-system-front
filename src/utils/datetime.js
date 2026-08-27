const LOCALE = "en-GB";

export function formatDateTime(value, opts = {}) {
  if (!value) return "-";

  const s = String(value).trim();

  const hasTz = /([zZ]|[+-]\d{2}:\d{2})$/.test(s);
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
  const hasTz = /([zZ]|[+-]\d{2}:\d{2})$/.test(s);
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

export function formatLocalDateTime(value) {
  if (!value) return "-";

  const text = String(value).trim();
  const hasTimeZone = /([zZ]|[+-]\d{2}:\d{2})$/.test(text);
  const date = new Date(hasTimeZone ? text : `${text}Z`);
  if (Number.isNaN(date.getTime())) return "-";

  return date
    .toLocaleString("en-GB", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      hourCycle: "h23",
    })
    .replaceAll("/", ".")
    .replace(",", ".");
}
