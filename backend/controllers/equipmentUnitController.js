const equipmentUnitService = require("../services/equipmentUnitService");

const equipmentUnitController = {
  getUnits: async (req, res) => {
    try {
      const user = req.user;
      let branchFilter = null;

      // 🧠 Chỉ super-admin thấy tất cả
      // Còn lại (admin, technician, operator) chỉ thấy theo chi nhánh của họ
      if (user && user.role !== "super-admin") {
        branchFilter =
          user["custom:branch_id"] ||
          user?.attributes?.["custom:branch_id"] ||
          null;
      }

      const units = await equipmentUnitService.getAllUnits(branchFilter);
      res.json(units);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  },

  getUnitById: async (req, res) => {
    try {
      const unit = await equipmentUnitService.getUnitById(req.params.id);
      res.json(unit);
    } catch (err) {
      res.status(404).json({ error: err.message });
    }
  },

  updateUnit: async (req, res) => {
    try {
      const updated = await equipmentUnitService.updateUnit(
        req.params.id,
        req.body
      );
      res.json(updated);
    } catch (err) {
      res.status(400).json({ error: err.message });
    }
  },

  deleteUnit: async (req, res) => {
    try {
      await equipmentUnitService.deleteUnit(req.params.id);
      res.json({ message: "Equipment Unit deleted successfully" });
    } catch (err) {
      res.status(404).json({ error: err.message });
    }
  },

  getUnitsByEquipmentId: async (req, res) => {
    try {
      const units = await equipmentUnitService.getUnitsByEquipmentId(
        req.params.equipment_id
      );
      res.json(units);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },

  getByStatus: async (req, res) => {
    try {
      const status = req.params.status;
      const all = await equipmentUnitService.getAllUnits();
      const filtered = all.filter(
        (u) => u.status.toLowerCase() === status.toLowerCase()
      );
      res.json(filtered);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  },
  // GET /equipmentUnit/status-group?statuses=Temporary%20Urgent,In%20Progress
  getByStatusGroup: async (req, res) => {
    try {
      const statuses = req.query.statuses
        ? req.query.statuses.split(",").map((s) => s.trim().toLowerCase())
        : [];
      const all = await equipmentUnitService.getAllUnits();
      const filtered = all.filter((u) =>
        statuses.includes(u.status.toLowerCase())
      );
      res.json(filtered);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  },
};

module.exports = equipmentUnitController;
