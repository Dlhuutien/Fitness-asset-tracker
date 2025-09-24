const maintenanceService = require("../services/maintenanceService");

const maintenanceController = {
  create: async (req, res) => {
    try {
      const { role, sub } = req.user;

      const data = {
        ...req.body,
        assigned_by: sub,
      };

      // Nếu role là operator thì gán luôn user_id
      if (role === "operator") {
        data.user_id = sub;
      }

      const maintenance = await maintenanceService.createMaintenance(data, role);
      res.status(201).json(maintenance);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  },

  progress: async (req, res) => {
    try {
      const { sub } = req.user; // user_id lấy từ token
      const maintenance = await maintenanceService.progressMaintenance(
        req.params.id,
        { user_id: sub }
      );
      res.json(maintenance);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  },

  complete: async (req, res) => {
    try {
      const maintenance = await maintenanceService.completeMaintenance(
        req.params.id,
        req.body
      );
      res.json(maintenance);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  },

  getAll: async (req, res) => {
    try {
      const data = await maintenanceService.getAll();
      res.json(data);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },

  getById: async (req, res) => {
    try {
      const data = await maintenanceService.getById(req.params.id);
      res.json(data);
    } catch (error) {
      res.status(404).json({ error: error.message });
    }
  },

  delete: async (req, res) => {
    try {
      await maintenanceService.delete(req.params.id);
      res.json({ message: "Maintenance deleted successfully" });
    } catch (error) {
      res.status(404).json({ error: error.message });
    }
  },
};

module.exports = maintenanceController;
