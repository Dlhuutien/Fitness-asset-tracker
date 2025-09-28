const express = require("express");
const notificationController = require("../controllers/notificationController");
const { verifyAccessToken } = require("../middlewares/authMiddleware");

const router = express.Router();
// READ ALL
router.get("/", verifyAccessToken, notificationController.getNotifications);

// READ ONE
router.get("/:id", verifyAccessToken, notificationController.getNotificationById);

// DELETE
router.delete("/:id", verifyAccessToken, notificationController.deleteNotification);

module.exports = router;
