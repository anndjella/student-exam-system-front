import { apiFetchJson } from "../../../api/client";

export async function listMyNotifications(token) {
  return await apiFetchJson("/api/me/notifications", { method: "GET" }, token);
}

export async function getMyUnreadNotificationCount(token) {
  return await apiFetchJson("/api/me/notifications/unread-count", { method: "GET" }, token);
}

export async function markMyNotificationAsRead(notificationId, token) {
  return await apiFetchJson(
    `/api/me/notifications/${encodeURIComponent(notificationId)}/read`,
    { method: "PUT" },
    token
  );
}
