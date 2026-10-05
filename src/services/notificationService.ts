import api, { isMockMode } from './api';
import { AppNotification } from '../types';

const NOTIFICATIONS_KEY = 'cems_notifications_data';

const getInitialMockNotifications = (): AppNotification[] => {
  return [
    {
      _id: 'notif_1',
      recipient: 'usr_student_1',
      type: 'event_cancelled',
      title: 'Event Update',
      message: 'Robotics Workshop has been updated. Please verify the event timings.',
      isRead: false,
      createdAt: new Date(Date.now() - 3600000).toISOString(),
    },
    {
      _id: 'notif_2',
      recipient: 'usr_student_1',
      type: 'event_status',
      title: 'Upcoming Event',
      message: 'Your registered event Hackathon 2026 is starting soon!',
      isRead: false,
      createdAt: new Date(Date.now() - 86400000).toISOString(),
    },
    {
      _id: 'notif_3',
      recipient: 'usr_admin_1',
      type: 'organizer_application',
      title: 'New Organizer Application',
      message: 'A new faculty organizer application is pending review.',
      isRead: false,
      createdAt: new Date(Date.now() - 172800000).toISOString(),
    },
  ];
};

const getStoredNotifications = (): AppNotification[] => {
  const data = localStorage.getItem(NOTIFICATIONS_KEY);
  if (!data) {
    const initial = getInitialMockNotifications();
    localStorage.setItem(NOTIFICATIONS_KEY, JSON.stringify(initial));
    return initial;
  }
  try {
    return JSON.parse(data);
  } catch {
    return getInitialMockNotifications();
  }
};

const saveStoredNotifications = (notifications: AppNotification[]) => {
  localStorage.setItem(NOTIFICATIONS_KEY, JSON.stringify(notifications));
};

export const notificationService = {
  async getNotifications(): Promise<{ notifications: AppNotification[]; unreadCount: number }> {
    if (isMockMode()) {
      await new Promise((r) => setTimeout(r, 200));
      const notifs = getStoredNotifications();
      const unreadCount = notifs.filter((n) => !n.isRead).length;
      return { notifications: notifs, unreadCount };
    }

    const response = await api.get('/notifications');
    return response.data.data;
  },

  async markAsRead(id: string): Promise<AppNotification> {
    if (isMockMode()) {
      const notifs = getStoredNotifications();
      const index = notifs.findIndex((n) => n._id === id);
      if (index !== -1) {
        notifs[index].isRead = true;
        saveStoredNotifications(notifs);
        return notifs[index];
      }
      throw new Error('Notification not found');
    }

    const response = await api.patch(`/notifications/${id}/read`);
    return response.data.data;
  },

  async markAllAsRead(): Promise<void> {
    if (isMockMode()) {
      const notifs = getStoredNotifications().map((n) => ({ ...n, isRead: true }));
      saveStoredNotifications(notifs);
      return;
    }

    await api.patch('/notifications/read-all');
  },
};
