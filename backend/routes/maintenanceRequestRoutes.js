// routes/maintenanceRequestRoutes.js
const express = require("express");
const router = express.Router();
const maintenanceRequestController = require("../controllers/maintenanceRequestController");
const {
  verifyAccessToken,
  requireRole,
} = require("../middlewares/authMiddleware");
const branchFilterMiddleware = require("../middlewares/branchFilterMiddleware");

// Admin tạo yêu cầu (pending)
router.post(
  "/",
  verifyAccessToken,
  requireRole("admin", "super-admin"),
  maintenanceRequestController.create
);

// Technician xác nhận nhận việc (lock 1 người) → tạo Maintenance + Scheduler
router.put(
  "/:id/confirm",
  verifyAccessToken,
  requireRole("technician", "admin", "super-admin"),
  maintenanceRequestController.confirm
);

// Admin (hoặc chính người tạo) hủy request khi pending
router.put(
  "/:id/cancel",
  verifyAccessToken,
  maintenanceRequestController.cancel
);

// Lấy theo unit
router.get(
  "/by-unit/:unitId",
  verifyAccessToken,
  maintenanceRequestController.getByUnit
);

// List all (theo branch nếu có branchFilter)
router.get(
  "/",
  verifyAccessToken,
  branchFilterMiddleware,
  maintenanceRequestController.getAll
);

// Detail
router.get("/:id", verifyAccessToken, maintenanceRequestController.getById);

module.exports = router;
