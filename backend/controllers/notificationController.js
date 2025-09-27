const notificationService = require("../services/notificationService");

const notificationController = {
  createNotification: async (req, res) => {
    try {
      const noti = await notificationService.createNotification({
        type: req.body.type,
        title: req.body.title,
        message: req.body.message,
        receiver_role: req.body.receiver_role,
        receiver_id: req.body.receiver_id,
        created_by: req.user.sub, // lấy từ token
      });
      res.status(201).json(noti);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  },

  getNotifications: async (req, res) => {
    try {
      const list = await notificationService.getNotifications();
      res.json(list);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },

  getNotificationById: async (req, res) => {
    try {
      const noti = await notificationService.getNotificationById(req.params.id);
      res.json(noti);
    } catch (error) {
      res.status(404).json({ error: error.message });
    }
  },

  markAsRead: async (req, res) => {
    try {
      const updated = await notificationService.markAsRead(req.params.id);
      res.json(updated);
    } catch (error) {
      res.status(404).json({ error: error.message });
    }
  },

  deleteNotification: async (req, res) => {
    try {
      await notificationService.deleteNotification(req.params.id);
      res.json({ message: "Notification deleted successfully" });
    } catch (error) {
      res.status(404).json({ error: error.message });
    }
  },
};

module.exports = notificationController;
