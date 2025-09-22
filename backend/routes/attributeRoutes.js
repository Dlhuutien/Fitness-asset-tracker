const express = require("express");
const attributeController = require("../controllers/attributeController");
const { verifyAccessToken, requireRole } = require("../middlewares/authMiddleware");

const router = express.Router();

// Tạo attribute (chỉ admin, super-admin)
router.post(
  "/",
  verifyAccessToken,
  requireRole("admin", "super-admin"),
  attributeController.createAttribute
);

// Lấy tất cả attributes
router.get("/", attributeController.getAttributes);

// Lấy attribute theo id
router.get("/:id", attributeController.getAttributeById);

// Update attribute (chỉ admin, super-admin)
router.put(
  "/:id",
  verifyAccessToken,
  requireRole("admin", "super-admin"),
  attributeController.updateAttribute
);

// Delete attribute (chỉ admin, super-admin)
router.delete(
  "/:id",
  verifyAccessToken,
  requireRole("admin", "super-admin"),
  attributeController.deleteAttribute
);

module.exports = router;
