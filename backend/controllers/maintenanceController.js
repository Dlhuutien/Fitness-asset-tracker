const maintenanceService = require("../services/maintenanceService");
const notificationService = require("../services/notificationService");
const userService = require("../services/userService");

const maintenanceController = {
  create: async (req, res) => {
    try {
      const { role, sub } = req.user;

      console.log("Creating maintenance - role:", role, "user:", sub);

      const data = {
        ...req.body,
        assigned_by: sub,
      };

      // 1. Tạo yêu cầu bảo trì
      const maintenance = await maintenanceService.createMaintenance(
        data,
        role
      );

      // 2. Lấy email admin + super-admin
      const admins = await userService.getUsersByRoles([
        "admin",
        "super-admin",
      ]);
      const recipients = admins.map((u) => u.email);

      // 3. Gửi thông báo tạo mới
      await notificationService.notifyMaintenanceCreated(
        maintenance,
        admins,
        sub
      );

      // 4. Trả response
      res.status(201).json(maintenance);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  },

  progress: async (req, res) => {
    try {
      const { sub } = req.user; // user_id lấy từ token

      // 1. Update trạng thái bảo trì
      const maintenance = await maintenanceService.progressMaintenance(
        req.params.id,
        { user_id: sub }
      );

      // 2. Lấy email admin + super-admin
      const admins = await userService.getUsersByRoles([
        "admin",
        "super-admin",
      ]);
      const recipients = admins.map((u) => u.email);

      // 3. Gửi thông báo
      await notificationService.notifyMaintenanceInProgress(
        maintenance,
        admins,
        sub
      );

      // 5. Trả response
      res.json(maintenance);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  },

  complete: async (req, res) => {
    try {
      const { sub } = req.user; // user đang thực hiện

      // 1. Update trạng thái bảo trì
      const maintenance = await maintenanceService.completeMaintenance(
        req.params.id,
        req.body
      );

      // 2. Lấy user admin + super-admin
      const admins = await userService.getUsersByRoles([
        "admin",
        "super-admin",
      ]);
      const recipients = admins.map((u) => u.email);

      // 3. Gửi thông báo
      await notificationService.notifyMaintenanceCompleted(
        maintenance,
        admins,
        sub
      );

      // 5. Trả response về client
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

  getByUnitId: async (req, res) => {
    try {
      const data = await maintenanceService.getByUnitId(req.params.unitId);
      if (!data)
        return res.status(404).json({ error: "No active maintenance" });
      res.json(data);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },
};

module.exports = maintenanceController;
