import { useState, useEffect, useCallback } from "react";
import { Dropdown } from "../ui/dropdown/Dropdown";
import { notificationService } from "../../services/notificationService";
import { AppNotification } from "../../types";

export default function NotificationDropdown() {
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  const fetchNotifications = useCallback(async () => {
    try {
      const data = await notificationService.getNotifications();
      setNotifications(data.notifications || []);
      setUnreadCount(data.unreadCount || 0);
    } catch {
      // Gracefully silent fallback
    }
  }, []);

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  function toggleDropdown() {
    setIsOpen(!isOpen);
    if (!isOpen) {
      fetchNotifications();
    }
  }

  function closeDropdown() {
    setIsOpen(false);
  }

  const handleMarkAsRead = async (id: string) => {
    try {
      await notificationService.markAsRead(id);
      setNotifications((prev) =>
        prev.map((n) => (n._id === id ? { ...n, isRead: true } : n))
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch {
      // ignore
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await notificationService.markAllAsRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      setUnreadCount(0);
    } catch {
      // ignore
    }
  };

  const formatTime = (dateStr: string) => {
    const d = new Date(dateStr);
    const diff = Math.floor((Date.now() - d.getTime()) / 1000);
    if (diff < 60) return "Just now";
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    return d.toLocaleDateString();
  };

  return (
    <div className="relative">
      <button
        className="relative flex items-center justify-center text-gray-500 transition-colors bg-white border border-gray-200 rounded-full dropdown-toggle hover:text-gray-700 h-11 w-11 hover:bg-gray-100 dark:border-gray-800 dark:bg-gray-900 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-white cursor-pointer"
        onClick={toggleDropdown}
        aria-label="View notifications"
      >
        {unreadCount > 0 && (
          <span className="absolute right-0 top-0.5 z-10 flex h-4 min-w-4 items-center justify-center rounded-full bg-orange-500 px-1 text-[10px] font-black text-white shadow-sm">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
        <svg
          className="fill-current"
          width="20"
          height="20"
          viewBox="0 0 20 20"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            fillRule="evenodd"
            clipRule="evenodd"
            d="M10.75 2.29248C10.75 1.87827 10.4143 1.54248 10 1.54248C9.58583 1.54248 9.25004 1.87827 9.25004 2.29248V2.83613C6.08266 3.20733 3.62504 5.9004 3.62504 9.16748V14.4591H3.33337C2.91916 14.4591 2.58337 14.7949 2.58337 15.2091C2.58337 15.6234 2.91916 15.9591 3.33337 15.9591H4.37504H15.625H16.6667C17.0809 15.9591 17.4167 15.6234 17.4167 15.2091C17.4167 14.7949 17.0809 14.4591 16.6667 14.4591H16.375V9.16748C16.375 5.9004 13.9174 3.20733 10.75 2.83613V2.29248ZM14.875 14.4591V9.16748C14.875 6.47509 12.6924 4.29248 10 4.29248C7.30765 4.29248 5.12504 6.47509 5.12504 9.16748V14.4591H14.875ZM8.00004 17.7085C8.00004 18.1228 8.33583 18.4585 8.75004 18.4585H11.25C11.6643 18.4585 12 18.1228 12 17.7085C12 17.2943 11.6643 16.9585 11.25 16.9585H8.75004C8.33583 16.9585 8.00004 17.2943 8.00004 17.7085Z"
            fill="currentColor"
          />
        </svg>
      </button>

      <Dropdown
        isOpen={isOpen}
        onClose={closeDropdown}
        className="absolute -right-[240px] mt-[17px] flex max-h-[480px] w-[350px] flex-col rounded-2xl border border-gray-200 bg-white p-3 shadow-theme-lg dark:border-gray-800 dark:bg-gray-dark sm:w-[361px] lg:right-0 z-50"
      >
        <div className="flex items-center justify-between pb-3 mb-2 border-b border-gray-100 dark:border-gray-700">
          <div className="flex items-center gap-2">
            <h5 className="text-sm font-bold text-gray-800 dark:text-gray-200">
              Notifications
            </h5>
            {unreadCount > 0 && (
              <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-brand-500 text-white">
                {unreadCount} new
              </span>
            )}
          </div>
          {unreadCount > 0 && (
            <button
              onClick={handleMarkAllAsRead}
              className="text-[11px] font-semibold text-brand-600 hover:underline dark:text-brand-400 cursor-pointer"
            >
              Mark all read
            </button>
          )}
        </div>

        <ul className="flex flex-col h-auto overflow-y-auto max-h-[360px] divide-y divide-gray-100 dark:divide-gray-800">
          {notifications.length === 0 ? (
            <li className="p-6 text-center text-xs text-gray-400">
              No notifications yet.
            </li>
          ) : (
            notifications.map((notif) => (
              <li
                key={notif._id}
                onClick={() => handleMarkAsRead(notif._id)}
                className={`p-3 rounded-xl transition-colors cursor-pointer flex gap-3 ${
                  notif.isRead
                    ? "hover:bg-gray-50 dark:hover:bg-white/5 opacity-80"
                    : "bg-brand-50/40 dark:bg-brand-950/20 hover:bg-brand-50/70"
                }`}
              >
                <div className="text-xl">
                  {notif.type === "event_cancelled"
                    ? "🚫"
                    : notif.type === "organizer_application"
                    ? "📝"
                    : notif.type === "organizer_approved"
                    ? "✅"
                    : "🔔"}
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between gap-1">
                    <span className="text-xs font-bold text-gray-900 dark:text-white">
                      {notif.title}
                    </span>
                    <span className="text-[10px] text-gray-400 whitespace-nowrap">
                      {formatTime(notif.createdAt)}
                    </span>
                  </div>
                  <p className="text-xs text-gray-600 dark:text-gray-300 mt-0.5 leading-snug">
                    {notif.message}
                  </p>
                </div>
                {!notif.isRead && (
                  <span className="size-2 rounded-full bg-brand-500 self-center"></span>
                )}
              </li>
            ))
          )}
        </ul>
      </Dropdown>
    </div>
  );
}
