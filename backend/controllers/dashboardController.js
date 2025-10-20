const statisticsService = require("../services/statisticsService");
const equipmentHierarchyService = require("../services/equipmentHierarchyService");

const dashboardController = {
  // 📊 Thống kê tổng hợp
  getStatistics: async (req, res) => {
    try {
      const { type = "month", year, month, quarter, week, branch_id } = req.query;
      const branchFilter = branch_id || req.branchFilter || null;
      const userRole = req.user?.role || null;

      const data = await statisticsService.getStatistics({
        type,
        year: parseInt(year),
        month: parseInt(month),
        quarter: parseInt(quarter),
        week: parseInt(week),
        branchFilter,
        userRole,
      });

      res.json(data);
    } catch (error) {
      console.error("❌ Dashboard statistics error:", error);
      res.status(500).json({ error: error.message });
    }
  },

  // Cấu trúc nhóm → loại → dòng thiết bị → số lượng unit
  getHierarchy: async (req, res) => {
    try {
      // Ưu tiên branch từ middleware (user admin)
      const branchFilter = req.branchFilter || req.query.branch_id || null;
      const data = await equipmentHierarchyService.getEquipmentHierarchy(
        branchFilter
      );
      res.json(data);
    } catch (error) {
      console.error("❌ [Equipment Hierarchy ERROR]:", error);
      res.status(500).json({ error: error.message });
    }
  },

  // 📈 Biểu đồ xu hướng (trend theo tháng/quý)
  getTrend: async (req, res) => {
    try {
      const { type = "month", year, month, branch_id } = req.query;
      const branchFilter = req.branchFilter || branch_id || null;

      console.log("📩 [Controller received query]:", req.query);

      if (!year) {
        return res
          .status(400)
          .json({ error: "Missing required parameter: year" });
      }

      const trendData = await statisticsService.getTrend({
        type,
        year: parseInt(year),
        month: month ? parseInt(month) : undefined,
        branchFilter,
      });

      res.json(trendData);
    } catch (error) {
      console.error("❌ [Dashboard Trend ERROR]:", error);
      res.status(500).json({ error: error.message });
    }
  },
};

module.exports = dashboardController;
