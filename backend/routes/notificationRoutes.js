const express = require("express");
const notificationController = require("../controllers/notificationController");
const { verifyAccessToken } = require("../middlewares/authMiddleware");

const router = express.Router();

// CREATE
router.post("/", verifyAccessToken, notificationController.createNotification);

// READ ALL
router.get("/", verifyAccessToken, notificationController.getNotifications);

// READ ONE
router.get("/:id", verifyAccessToken, notificationController.getNotificationById);

// UPDATE (mark as read)
router.put("/:id/read", verifyAccessToken, notificationController.markAsRead);

// DELETE
router.delete("/:id", verifyAccessToken, notificationController.deleteNotification);

module.exports = router;
