// controllers/maintenanceRequestController.js
const maintenanceRequestService = require("../services/maintenanceRequestService");

const maintenanceRequestController = {
  create: async (req, res) => {
    try {
      const { sub, role } = req.user;
      const data = { ...req.body };
      const item = await maintenanceRequestService.createRequest(data, sub);
      res.status(201).json(item);
    } catch (err) {
      console.error("❌ create maintenance request error:", err);
      res.status(400).json({ error: err.message });
    }
    },

  confirm: async (req, res) => {
    try {
      const { sub } = req.user; // technician sub
      const { id } = req.params;
      const result = await maintenanceRequestService.confirmRequest(id, sub);
      res.json({
        message: "Request confirmed and Maintenance created",
        ...result,
      });
    } catch (err) {
      console.error("❌ confirm request error:", err);
      res.status(400).json({ error: err.message });
    }
  },

  cancel: async (req, res) => {
    try {
      const { sub, role } = req.user;
      const isAdminOrSuperAdmin = ["admin", "super-admin"].includes(role);
      const { id } = req.params;
      const updated = await maintenanceRequestService.cancelRequest(
        id,
        sub,
        isAdminOrSuperAdmin
      );
      res.json({ message: "Request cancelled", request: updated });
    } catch (err) {
      console.error("❌ cancel request error:", err);
      res.status(400).json({ error: err.message });
    }
  },

  getAll: async (req, res) => {
    try {
      const data = await maintenanceRequestService.getAll(req.branchFilter);
      res.json(data);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  },

  getById: async (req, res) => {
    try {
      const item = await maintenanceRequestService.getById(req.params.id);
      res.json(item);
    } catch (err) {
      res.status(404).json({ error: err.message });
    }
  },

  getByUnit: async (req, res) => {
    try {
      const list = await maintenanceRequestService.getByUnitId(
        req.params.unitId
      );
      res.json(list);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  },
};

module.exports = maintenanceRequestController;
