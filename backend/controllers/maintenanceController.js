const maintenanceService = require("../services/maintenanceService");
const notificationService = require("../services/notificationService");
const userService = require("../services/userService");
const sendEmail = require("../services/emailService");

const maintenanceController = {
  create: async (req, res) => {
    try {
      const { role, sub } = req.user;

      console.log("Creating maintenance - role:", role, "user:", sub);

      const data = {
        ...req.body,
        assigned_by: sub,
      };

      const maintenance = await maintenanceService.createMaintenance(
        data,
        role
      );
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
      const { sub } = req.user; // user đang thực hiện

      // 1. Update trạng thái bảo trì
      const maintenance = await maintenanceService.completeMaintenance(
        req.params.id,
        req.body
      );

      // 2. Lấy email admin + super-admin
      const admins = await userService.getUsersByRoles([
        "admin",
        "super-admin",
      ]);
      const recipients = admins.map((u) => u.email);

      console.log("Admin/Super-admin emails:", recipients);

      // 3. Gửi email thông báo
      await sendEmail.sendMaintenanceCompletedEmail(recipients, maintenance);

      // 4. Tạo notification trong DB
      await notificationService.createNotification({
        type: "maintenance",
        title: "Hoàn tất bảo trì",
        message: `Thiết bị ${maintenance.equipment_unit_id} đã bảo trì xong (${maintenance.status})`,
        receiver_role: "admin", // tất cả admin sẽ nhìn thấy
        created_by: sub,
      });

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
};

module.exports = maintenanceController;
