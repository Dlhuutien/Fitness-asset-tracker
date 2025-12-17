const equipmentUnitService = require("../services/equipmentUnitService");

const equipmentUnitController = {
  getUnits: async (req, res) => {
    try {
      const units = await equipmentUnitService.getAllUnits(req.branchFilter);
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
        req.body,
        req.user.branch_id
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
      const all = await equipmentUnitService.getAllUnits(req.branchFilter);
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
      const all = await equipmentUnitService.getAllUnits(req.branchFilter);
      const filtered = all.filter((u) =>
        statuses.includes(u.status.toLowerCase())
      );
      res.json(filtered);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  },
  getUnitsPreviouslyInBranch: async (req, res) => {
    try {
      const units = await equipmentUnitService.getUnitsPreviouslyInBranch(
        req.branchFilter
      );
      res.json(units);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  },
  activateUnit: async (req, res) => {
    try {
      const { area_id } = req.body;
      if (!area_id) {
        return res.status(400).json({ error: "area_id is required" });
      }

      const updated = await equipmentUnitService.activateUnit(
        req.params.id,
        area_id,
        req.user.branch_id
      );

      res.json(updated);
    } catch (err) {
      res.status(400).json({ error: err.message });
    }
  },

  moveToStock: async (req, res) => {
    try {
      const updated = await equipmentUnitService.moveUnitToStock(
        req.params.id,
        req.user.branch_id
      );

      res.json(updated);
    } catch (err) {
      res.status(400).json({ error: err.message });
    }
  },
};

module.exports = equipmentUnitController;
