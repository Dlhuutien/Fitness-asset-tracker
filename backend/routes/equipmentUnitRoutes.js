const express = require("express");
const router = express.Router();
const equipmentUnitController = require("../controllers/equipmentUnitController");
const { verifyAccessToken, requireRole } = require("../middlewares/authMiddleware");

// READ ALL
router.get("/", equipmentUnitController.getUnits);

// READ ONE
router.get("/:id", equipmentUnitController.getUnitById);

// READ BY equipment_id
router.get(
  "/equipment/:equipment_id",
  equipmentUnitController.getUnitsByEquipmentId
);

// UPDATE
router.put("/:id", verifyAccessToken, requireRole("admin", "super-admin"), equipmentUnitController.updateUnit);

// DELETE
router.delete("/:id", verifyAccessToken, requireRole("admin", "super-admin"), equipmentUnitController.deleteUnit);

module.exports = router;
