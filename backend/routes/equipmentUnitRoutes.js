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
  requireRole("super-admin", "admin", "technician"),
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
router.put(
  "/:id",
  verifyAccessToken,
  requireRole("admin", "super-admin"),
  equipmentUnitController.updateUnit
);

// DELETE
router.delete(
  "/:id",
  verifyAccessToken,
  requireRole("admin", "super-admin"),
  equipmentUnitController.deleteUnit
);

module.exports = router;
