const express = require("express");
const equipmentController = require("../controllers/equipmentController");
const { verifyAccessToken, requireRole } = require("../middlewares/authMiddleware");
const upload = require("../middlewares/upload");

const router = express.Router();

// Create
router.post(
  "/",
  verifyAccessToken,
  requireRole("admin", "super-admin", "operator"),
  upload,
  equipmentController.createEquipment
);

// Read all
router.get("/", equipmentController.getEquipments);

// Read one
router.get("/:id", equipmentController.getEquipmentById);

router.get("/attribute/:id", equipmentController.getEquipmentAttributeById);

// Read by category_type_id
router.get("/categoryType/:category_type_id", equipmentController.getByCategoryTypeId);

// Update
router.put(
  "/:id",
  verifyAccessToken,
  requireRole("admin", "super-admin", "operator"),
  upload,
  equipmentController.updateEquipment
);

// Delete (admin only)
router.delete(
  "/:id",
  verifyAccessToken,
  requireRole("admin", "super-admin"),
  equipmentController.deleteEquipment
);

module.exports = router;
