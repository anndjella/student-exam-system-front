export const NOTIFICATION_TYPE = Object.freeze({
  REGISTRATION_DEADLINE_REMINDER: 1,
  MISSING_EXAM_RESULT_REMINDER: 2,
});

export function normalizeNotification(value) {
  return {
    id: value?.id ?? value?.ID ?? "",
    type: Number(value?.type ?? value?.Type ?? 0),
    title: value?.title ?? value?.Title ?? "Notification",
    message: value?.message ?? value?.Message ?? "",
    createdAtUtc: value?.createdAtUtc ?? value?.CreatedAtUtc ?? null,
    readAtUtc: value?.readAtUtc ?? value?.ReadAtUtc ?? null,
  };
}

export function sortNotificationsNewestFirst(items) {
  return [...items].sort((left, right) => {
    const leftTime = Date.parse(left.createdAtUtc) || 0;
    const rightTime = Date.parse(right.createdAtUtc) || 0;
    return rightTime - leftTime;
  });
}
