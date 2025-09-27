const NotificationModel = require("../models/Notification");

const notificationRepository = {
  create: async (data) => NotificationModel.createNotification(data),
  findAll: async () => NotificationModel.getNotifications(),
  findById: async (id) => NotificationModel.getNotificationById(id),
  markAsRead: async (id) => NotificationModel.markAsRead(id),
  delete: async (id) => NotificationModel.deleteNotification(id),
};

module.exports = notificationRepository;
