const express = require("express");
const router = express.Router();
const maintenanceController = require("../controllers/maintenanceController");
const {
  verifyAccessToken,
  requireRole,
} = require("../middlewares/authMiddleware");
const branchFilterMiddleware = require("../middlewares/branchFilterMiddleware");

// CREATE
router.post("/", verifyAccessToken, maintenanceController.create);

// 🕒 Lên lịch bảo trì
router.post(
  "/schedule",
  verifyAccessToken,
  maintenanceController.schedule
);

// GET maintenance theo unit ID
router.get(
  "/by-unit/:unitId",
  verifyAccessToken,
  maintenanceController.getByUnitId
);

// Lấy toàn bộ lịch sử bảo trì (bao gồm hóa đơn)
router.get(
  "/history/:unitId",
  verifyAccessToken,
  maintenanceController.getFullHistoryByUnit
);
// Lấy lịch sử gần nhất (mới nhất)
router.get(
  "/history/:unitId/latest",
  verifyAccessToken,
  maintenanceController.getLatestHistoryByUnit
);

// GET
router.get(
  "/",
  verifyAccessToken,
  branchFilterMiddleware,
  maintenanceController.getAll
);

// GET chỉ lấy những maintenance có result
router.get(
  "/results",
  verifyAccessToken,
  branchFilterMiddleware,
  maintenanceController.getAllResult
);

router.get("/:id", maintenanceController.getById);

// UPDATE status
router.put(
  "/:id/progress",
  verifyAccessToken,
  requireRole("super-admin", "admin", "technician"),
  maintenanceController.progress
);

router.put(
  "/:id/complete",
  verifyAccessToken,
  requireRole("super-admin", "admin", "technician"),
  maintenanceController.complete
);

// DELETE
router.delete(
  "/:id",
  verifyAccessToken,
  requireRole("super-admin", "admin"),
  maintenanceController.delete
);

module.exports = router;
