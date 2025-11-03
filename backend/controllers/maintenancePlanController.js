const maintenancePlanService = require("../services/maintenancePlanService");

const maintenancePlanController = {
  create: async (req, res) => {
    try {
      const { sub } = req.user;
      const plan = await maintenancePlanService.createPlan(req.body, sub);
      res.status(201).json({
        message: "Maintenance plan created successfully",
        plan,
      });
    } catch (err) {
      console.error("❌ Error creating plan:", err);
      res.status(400).json({ error: err.message });
    }
  },

  getAll: async (req, res) => {
    try {
      const plans = await maintenancePlanService.getAll();
      res.json(plans);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  },

  getById: async (req, res) => {
    try {
      const plan = await maintenancePlanService.getById(req.params.id);
      res.json(plan);
    } catch (err) {
      res.status(404).json({ error: err.message });
    }
  },

  getByEquipmentId: async (req, res) => {
    try {
      const data = await maintenancePlanService.getByEquipmentId(
        req.params.equipmentId
      );
      res.json(data);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  },

  update: async (req, res) => {
    try {
      const updated = await maintenancePlanService.updatePlan(
        req.params.id,
        req.body
      );
      res.json(updated);
    } catch (err) {
      res.status(400).json({ error: err.message });
    }
  },

  delete: async (req, res) => {
    try {
      await maintenancePlanService.deletePlan(req.params.id);
      res.json({ message: "Plan deleted successfully" });
    } catch (err) {
      res.status(400).json({ error: err.message });
    }
  },
};

module.exports = maintenancePlanController;
