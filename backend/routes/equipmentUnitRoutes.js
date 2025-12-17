const express = require("express");
const router = express.Router();
const equipmentUnitController = require("../controllers/equipmentUnitController");
const {
  verifyAccessToken,
  requireRole,
} = require("../middlewares/authMiddleware");
const branchFilterMiddleware = require("../middlewares/branchFilterMiddleware");

// READ ALL
router.get(
  "/",
  verifyAccessToken,
  branchFilterMiddleware,
  equipmentUnitController.getUnits
);

// Lọc theo 1 trạng thái
router.get(
  "/status/:status",
  verifyAccessToken,
  branchFilterMiddleware,
  equipmentUnitController.getByStatus
);

// Lấy danh sách theo nhóm trạng thái
router.get(
  "/status-group",
  verifyAccessToken,
  branchFilterMiddleware,
  equipmentUnitController.getByStatusGroup
);

// READ BY equipment_id
router.get(
  "/equipment/:equipment_id",
  equipmentUnitController.getUnitsByEquipmentId
);

// Lấy danh sách thiết bị từng thuộc chi nhánh này nhưng hiện tại không còn
router.get(
  "/transfer-history",
  verifyAccessToken,
  branchFilterMiddleware,
  equipmentUnitController.getUnitsPreviouslyInBranch
);

// READ ONE
router.get("/:id", equipmentUnitController.getUnitById);

// UPDATE
router.put("/:id", verifyAccessToken, equipmentUnitController.updateUnit);

// Đưa thiết bị vào hoạt động (gắn area)
router.put(
  "/:id/activeUnit",
  verifyAccessToken,
  equipmentUnitController.activateUnit
);

// Đưa thiết bị vào kho (bỏ area)
router.put(
  "/:id/inStockUnit",
  verifyAccessToken,
  equipmentUnitController.moveToStock
);

// DELETE
router.delete(
  "/:id",
  verifyAccessToken,
  requireRole("admin", "super-admin"),
  equipmentUnitController.deleteUnit
);

module.exports = router;
