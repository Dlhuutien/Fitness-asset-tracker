const express = require("express");
const router = express.Router();
const attributeValueController = require("../controllers/attributeValueController");
const { verifyAccessToken, requireRole } = require("../middlewares/authMiddleware");

// Create (admin only)
router.post(
  "/",
  verifyAccessToken,
  requireRole("admin", "super-admin"),
  attributeValueController.createAttributeValue
);

// Read all
router.get("/", attributeValueController.getAttributeValues);

// Read one
router.get("/:id", attributeValueController.getAttributeValueById);

// Read all by equipment_id
router.get("/equipment/:equipment_id", attributeValueController.getAttributeValuesByEquipmentId);

// Read all by attribute_id
router.get("/attribute/:attribute_id", attributeValueController.getAttributeValuesByAttributeId);

// Update (admin only)
router.put(
  "/:id",
  verifyAccessToken,
  requireRole("admin", "super-admin"),
  attributeValueController.updateAttributeValue
);

// Delete (admin only - nếu muốn giống CategoryType luôn)
router.delete(
  "/:id",
  verifyAccessToken,
  requireRole("admin", "super-admin"),
  attributeValueController.deleteAttributeValue
);

module.exports = router;
