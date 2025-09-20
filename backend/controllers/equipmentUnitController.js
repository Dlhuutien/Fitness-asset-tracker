const equipmentUnitService = require("../services/equipmentUnitService");

const equipmentUnitController = {
  getUnits: async (req, res) => {
    try {
      const units = await equipmentUnitService.getAllUnits();
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
      const updated = await equipmentUnitService.updateUnit(req.params.id, req.body);
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
};

module.exports = equipmentUnitController;
