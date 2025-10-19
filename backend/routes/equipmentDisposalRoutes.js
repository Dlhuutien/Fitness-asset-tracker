const express = require("express");
const router = express.Router();
const equipmentDisposalController = require("../controllers/equipmentDisposalController");
const { verifyAccessToken, requireRole } = require("../middlewares/authMiddleware");
const branchFilterMiddleware = require("../middlewares/branchFilterMiddleware");

// Tạo đợt thanh lý
router.post(
  "/",
  verifyAccessToken,
  requireRole("admin", "super-admin", "operator"),
  equipmentDisposalController.createDisposal
);

// Lấy tất cả đợt thanh lý (lọc theo chi nhánh nếu có)
router.get(
  "/",
  verifyAccessToken,
  branchFilterMiddleware,
  equipmentDisposalController.getAll
);

// Lấy chi tiết 1 đợt thanh lý
router.get(
  "/:id",
  verifyAccessToken,
  equipmentDisposalController.getById
);

module.exports = router;
