const express = require("express");
const equipmentTransferHistoryController = require("../controllers/equipmentTransferHistoryController");
const { verifyAccessToken } = require("../middlewares/authMiddleware");

const router = express.Router();

// Lấy toàn bộ lịch sử (admin/super-admin)
router.get("/", verifyAccessToken, equipmentTransferHistoryController.getAllHistories);

// Lấy lịch sử của 1 thiết bị cụ thể
router.get("/:unit_id", verifyAccessToken, equipmentTransferHistoryController.getHistoryByUnitId);

module.exports = router;
