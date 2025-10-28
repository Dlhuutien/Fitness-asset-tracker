const equipmentTransferHistoryService = require("../services/equipmentTransferHistoryService");

const equipmentTransferHistoryController = {
  // ===================================================
  // 🔍 LẤY TOÀN BỘ LỊCH SỬ (admin / super-admin)
  // ===================================================
  getAllHistories: async (req, res) => {
    try {
      const histories = await equipmentTransferHistoryService.getAllHistories();
      res.status(200).json(histories);
    } catch (error) {
      console.error("❌ getAllHistories error:", error);
      res.status(500).json({ error: error.message });
    }
  },

  // ===================================================
  // 🔍 LẤY LỊCH SỬ THEO UNIT ID
  // ===================================================
  getHistoryByUnitId: async (req, res) => {
    try {
      const { unit_id } = req.params;
      const histories = await equipmentTransferHistoryService.getHistoryByUnitId(unit_id);

      if (!histories || histories.length === 0) {
        return res.status(404).json({
          message: `Không tìm thấy lịch sử cho thiết bị unit_id = ${unit_id}`,
        });
      }

      res.status(200).json(histories);
    } catch (error) {
      console.error("❌ getHistoryByUnitId error:", error);
      res.status(500).json({ error: error.message });
    }
  },
};

module.exports = equipmentTransferHistoryController;
