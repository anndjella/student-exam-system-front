import { NOTIFICATION_TYPE } from "../model/notification";

export function NotificationTypeIcon({ type }) {
  if (type === NOTIFICATION_TYPE.REGISTRATION_DEADLINE_REMINDER) {
    return (
      <svg aria-hidden="true" viewBox="0 0 24 24" className="notification-item__icon-svg">
        <path d="M7 3v3M17 3v3M4 9h16M5 5h14a1 1 0 0 1 1 1v14H4V6a1 1 0 0 1 1-1Z" />
      </svg>
    );
  }

  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" className="notification-item__icon-svg">
      <path d="M12 3 2.5 20h19L12 3Zm0 6v5m0 3v.01" />
    </svg>
  );
}
