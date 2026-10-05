import * as notificationService from '../services/notificationService.js';
import { isConnected } from '../config/db.js';

export const getMyNotifications = async (req, res, next) => {
  try {
    if (!isConnected()) {
      return res.status(200).json({
        success: true,
        data: [],
      });
    }

    const notifications = await notificationService.getUserNotifications(req.user._id);
    res.status(200).json({
      success: true,
      data: notifications,
    });
  } catch (error) {
    next(error);
  }
};

export const markNotificationRead = async (req, res, next) => {
  try {
    if (!isConnected()) {
      return res.status(200).json({
        success: true,
        data: null,
      });
    }

    const updated = await notificationService.markAsRead(req.params.id, req.user._id);
    res.status(200).json({
      success: true,
      message: 'Notification marked as read',
      data: updated,
    });
  } catch (error) {
    next(error);
  }
};

export const markAllNotificationsRead = async (req, res, next) => {
  try {
    if (!isConnected()) {
      return res.status(200).json({
        success: true,
        data: null,
      });
    }

    await notificationService.markAllAsRead(req.user._id);
    res.status(200).json({
      success: true,
      message: 'All notifications marked as read',
    });
  } catch (error) {
    next(error);
  }
};
