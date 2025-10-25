const express = require("express");
const typeAttributeController = require("../controllers/typeAttributeController");
const {
  verifyAccessToken,
  requireRole,
} = require("../middlewares/authMiddleware");

const router = express.Router();

// Lấy toàn bộ attributes theo type
router.get("/:typeId", typeAttributeController.getAttributesByType);

// Thêm attribute mới cho type
router.post(
  "/:typeId",
  verifyAccessToken,
  typeAttributeController.addAttributeToType
);

// Thêm nhiều attributes cho type (bulk)
router.post(
  "/:typeId/bulk",
  verifyAccessToken,
  typeAttributeController.bulkAddAttributesToType
);

// Xoá liên kết attribute khỏi type
router.delete(
  "/:typeId/:attrId",
  verifyAccessToken,
  typeAttributeController.removeAttributeFromType
);

module.exports = router;
