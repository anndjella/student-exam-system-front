import { NavLink } from "react-router-dom";
import { useNotifications } from "../hooks/useNotifications";

export function NotificationBell({ to }) {
  const { unreadCount } = useNotifications();

  return (
    <NavLink
      to={to}
      className={({ isActive }) => `notification-bell${isActive ? " active" : ""}`}
      aria-label={unreadCount > 0 ? `Notifications, ${unreadCount} unread` : "Notifications"}
      title="Notifications"
    >
      <svg aria-hidden="true" viewBox="0 0 24 24" className="notification-bell__icon">
        <path
          d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9M10 21h4"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="2"
        />
      </svg>

      {unreadCount > 0 && (
        <span className="notification-bell__badge" aria-hidden="true">
          {unreadCount > 99 ? "99+" : unreadCount}
        </span>
      )}
    </NavLink>
  );
}
