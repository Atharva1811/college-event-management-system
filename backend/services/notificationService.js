import Notification from '../models/Notification.js';
import User from '../models/User.js';

export const createNotification = async ({ recipient, type, title, message, relatedEvent }) => {
  try {
    return await Notification.create({
      recipient,
      type,
      title,
      message,
      relatedEvent,
    });
  } catch (err) {
    console.error('Failed to create notification:', err.message);
    return null;
  }
};

export const notifyUsers = async (recipientIds, { type, title, message, relatedEvent }) => {
  if (!recipientIds || recipientIds.length === 0) return;
  try {
    const docs = recipientIds.map((recipient) => ({
      recipient,
      type,
      title,
      message,
      relatedEvent,
    }));
    await Notification.insertMany(docs);
  } catch (err) {
    console.error('Failed to send bulk notifications:', err.message);
  }
};

export const notifyAdmins = async ({ type, title, message, relatedEvent }) => {
  try {
    const admins = await User.find({ role: 'admin' }).select('_id');
    const adminIds = admins.map((a) => a._id);
    await notifyUsers(adminIds, { type, title, message, relatedEvent });
  } catch (err) {
    console.error('Failed to notify admins:', err.message);
  }
};

export const getUserNotifications = async (userId) => {
  return await Notification.find({ recipient: userId })
    .populate('relatedEvent', 'title date venue')
    .sort({ createdAt: -1 })
    .limit(30);
};

export const markAsRead = async (notificationId, userId) => {
  const notification = await Notification.findOne({
    _id: notificationId,
    recipient: userId,
  });

  if (!notification) {
    const error = new Error('Notification not found.');
    error.statusCode = 404;
    throw error;
  }

  notification.isRead = true;
  await notification.save();
  return notification;
};

export const markAllAsRead = async (userId) => {
  await Notification.updateMany({ recipient: userId, isRead: false }, { isRead: true });
  return { success: true };
};
