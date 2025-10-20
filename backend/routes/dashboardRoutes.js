const express = require("express");
const { verifyAccessToken } = require("../middlewares/authMiddleware");
const branchFilterMiddleware = require("../middlewares/branchFilterMiddleware");
const dashboardController = require("../controllers/dashboardController");

const router = express.Router();

// 📊 Thống kê tổng hợp
router.get(
  "/statistics",
  verifyAccessToken,
  branchFilterMiddleware,
  dashboardController.getStatistics
);

// Cấu trúc nhóm → loại → dòng thiết bị → số lượng unit
router.get(
  "/equipment-hierarchy",
  verifyAccessToken,
  branchFilterMiddleware,
  dashboardController.getHierarchy
);

// 📈 Biểu đồ xu hướng theo tháng/quý
router.get(
  "/statistics/trend",
  verifyAccessToken,
  branchFilterMiddleware,
  dashboardController.getTrend
);

module.exports = router;
