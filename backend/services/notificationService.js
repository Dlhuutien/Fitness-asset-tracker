const notificationRepository = require("../repositories/notificationRepository");

const notificationService = {
  createNotification: async (data) => {
    if (!data.type || !data.title || !data.message) {
      throw new Error("type, title, message are required");
    }
    return await notificationRepository.create(data);
  },

  getNotifications: async () => {
    return await notificationRepository.findAll();
  },

  getNotificationById: async (id) => {
    const noti = await notificationRepository.findById(id);
    if (!noti) throw new Error("Notification not found");
    return noti;
  },

  markAsRead: async (id) => {
    const noti = await notificationRepository.findById(id);
    if (!noti) throw new Error("Notification not found");
    return await notificationRepository.markAsRead(id);
  },

  deleteNotification: async (id) => {
    const noti = await notificationRepository.findById(id);
    if (!noti) throw new Error("Notification not found");
    return await notificationRepository.delete(id);
  },
};

module.exports = notificationService;
