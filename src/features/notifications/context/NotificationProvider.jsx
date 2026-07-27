import { useCallback, useEffect, useMemo, useState } from "react";
import { useAuth } from "../../../auth/AuthContext";
import {
  getMyUnreadNotificationCount,
  listMyNotifications,
  markMyNotificationAsRead,
} from "../api/notificationsApi";
import {
  normalizeNotification,
  sortNotificationsNewestFirst,
} from "../model/notification";
import { NotificationContext } from "./NotificationContext";

const POLLING_INTERVAL_MS = 60_000;
const NOTIFICATION_ROLES = new Set(["Student", "Teacher"]);

const EMPTY_STATE = {
  ownerToken: null,
  notifications: [],
  unreadCount: 0,
  loading: false,
  error: "",
  markingIds: [],
};

export function NotificationProvider({ children }) {
  const { token } = useAuth();

  return (
    <NotificationStateProvider key={token || "signed-out"}>
      {children}
    </NotificationStateProvider>
  );
}

function NotificationStateProvider({ children }) {
  const { token, role } = useAuth();
  const [state, setState] = useState(EMPTY_STATE);
  const notificationsEnabled = Boolean(token && NOTIFICATION_ROLES.has(role));
  const ownsCurrentState = notificationsEnabled && state.ownerToken === token;

  useEffect(() => {
    if (!notificationsEnabled) return undefined;

    let cancelled = false;

    async function refreshUnreadCount() {
      try {
        const response = await getMyUnreadNotificationCount(token);
        if (cancelled) return;

        const nextCount = Math.max(0, Number(response?.count ?? response?.Count ?? 0) || 0);
        setState((current) => ({
          ...(current.ownerToken === token ? current : EMPTY_STATE),
          ownerToken: token,
          unreadCount: nextCount,
        }));
      } catch {
        // Keep the last known count. The next poll will retry automatically.
      }
    }

    void refreshUnreadCount();
    const intervalId = window.setInterval(refreshUnreadCount, POLLING_INTERVAL_MS);

    return () => {
      cancelled = true;
      window.clearInterval(intervalId);
    };
  }, [notificationsEnabled, token]);

  const loadNotifications = useCallback(async () => {
    if (!notificationsEnabled) return;

    setState((current) => ({
      ...(current.ownerToken === token ? current : EMPTY_STATE),
      ownerToken: token,
      loading: true,
      error: "",
    }));

    try {
      const response = await listMyNotifications(token);
      const normalized = sortNotificationsNewestFirst(
        (Array.isArray(response) ? response : []).map(normalizeNotification)
      );

      setState((current) => {
        if (current.ownerToken !== token) return current;
        return { ...current, notifications: normalized, loading: false };
      });
    } catch (error) {
      setState((current) => {
        if (current.ownerToken !== token) return current;
        return {
          ...current,
          loading: false,
          error: error?.message || "Notifications could not be loaded.",
        };
      });
    }
  }, [notificationsEnabled, token]);

  const markAsRead = useCallback(
    async (notificationId) => {
      if (!notificationsEnabled || !notificationId) return;

      const notification = state.notifications.find((item) => item.id === notificationId);
      if (!notification || notification.readAtUtc || state.markingIds.includes(notificationId)) return;

      setState((current) => ({
        ...current,
        markingIds: [...current.markingIds, notificationId],
        error: "",
      }));

      try {
        await markMyNotificationAsRead(notificationId, token);
        const readAtUtc = new Date().toISOString();

        setState((current) => {
          if (current.ownerToken !== token) return current;

          return {
            ...current,
            notifications: current.notifications.map((item) =>
              item.id === notificationId ? { ...item, readAtUtc } : item
            ),
            unreadCount: Math.max(0, current.unreadCount - 1),
            markingIds: current.markingIds.filter((id) => id !== notificationId),
          };
        });
      } catch (error) {
        setState((current) => {
          if (current.ownerToken !== token) return current;
          return {
            ...current,
            error: error?.message || "The notification could not be marked as read.",
            markingIds: current.markingIds.filter((id) => id !== notificationId),
          };
        });
      }
    },
    [notificationsEnabled, state.markingIds, state.notifications, token]
  );

  const value = useMemo(
    () => ({
      notifications: ownsCurrentState ? state.notifications : [],
      unreadCount: ownsCurrentState ? state.unreadCount : 0,
      loading: ownsCurrentState ? state.loading : false,
      error: ownsCurrentState ? state.error : "",
      markingIds: ownsCurrentState ? state.markingIds : [],
      loadNotifications,
      markAsRead,
    }),
    [loadNotifications, markAsRead, ownsCurrentState, state]
  );

  return <NotificationContext.Provider value={value}>{children}</NotificationContext.Provider>;
}
