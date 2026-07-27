import { useEffect } from "react";
import { formatLocalDateTime } from "../../../utils/datetime";
import { NotificationTypeIcon } from "../components/NotificationTypeIcon";
import { useNotifications } from "../hooks/useNotifications";

export function NotificationsPage() {
  const {
    notifications,
    loading,
    error,
    markingIds,
    loadNotifications,
    markAsRead,
  } = useNotifications();

  useEffect(() => {
    void loadNotifications();
  }, [loadNotifications]);

  return (
    <div className="container notifications-page">
      <div className="page-header">
        <div>
          <h1 className="page-title">Notifications</h1>
          <div className="page-subtitle">Updates and reminders related to your exams.</div>
        </div>

        <button className="btn" type="button" onClick={loadNotifications} disabled={loading}>
          {loading ? "Refreshing..." : "Refresh"}
        </button>
      </div>

      {error && <div className="alert-error notifications-page__error">{error}</div>}

      {loading && notifications.length === 0 && (
        <div className="card notifications-state">Loading notifications...</div>
      )}

      {!loading && !error && notifications.length === 0 && (
        <div className="card notifications-state">
          <div className="notifications-state__title">No notifications</div>
          <div className="page-subtitle">You do not have any notifications yet.</div>
        </div>
      )}

      {notifications.length > 0 && (
        <div className="notifications-list" aria-live="polite">
          {notifications.map((notification) => {
            const unread = !notification.readAtUtc;
            const marking = markingIds.includes(notification.id);
            const className = `card notification-item${unread ? " unread" : " read"}`;
            const content = (
              <>
                <span className="notification-item__icon">
                  <NotificationTypeIcon type={notification.type} />
                </span>

                <span className="notification-item__content">
                  <span className="notification-item__heading">
                    <span className="notification-item__title">{notification.title}</span>
                    {unread && <span className="notification-item__unread-label">Unread</span>}
                  </span>
                  <span className="notification-item__message">{notification.message}</span>
                  <time className="notification-item__date" dateTime={notification.createdAtUtc || undefined}>
                    {formatLocalDateTime(notification.createdAtUtc)}
                  </time>
                </span>
              </>
            );

            return unread ? (
              <button
                className={className}
                type="button"
                key={notification.id}
                onClick={() => markAsRead(notification.id)}
                disabled={marking}
                aria-label={`${notification.title}. Mark as read.`}
              >
                {content}
              </button>
            ) : (
              <article className={className} key={notification.id}>
                {content}
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}
