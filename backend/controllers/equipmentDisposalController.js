const equipmentDisposalService = require("../services/equipmentDisposalService");
const userService = require("../services/userService");
const notificationService = require("../services/notificationService");

const equipmentDisposalController = {
  // 🧾 Tạo phiếu thanh lý (nhiều thiết bị)
  createDisposal: async (req, res) => {
    try {
      const { sub: userId } = req.user; // Cognito sub
      const { branch_id, note, items } = req.body;

      // 0️⃣ Kiểm tra input
      if (!branch_id) {
        return res
          .status(400)
          .json({ error: "Thiếu mã chi nhánh (branch_id)" });
      }
      if (!Array.isArray(items) || items.length === 0) {
        return res
          .status(400)
          .json({ error: "Danh sách thiết bị không được trống" });
      }

      // 1️⃣ Gọi service tạo đợt thanh lý
      const { id, details, ...disposal } =
        await equipmentDisposalService.createDisposal({
          user_id: userId,
          branch_id,
          note,
          items,
        });

      // 2️⃣ Lấy danh sách admin/super-admin để gửi thông báo
      const admins = await userService.getUsersByRoles([
        "admin",
        "super-admin",
      ]);
      if (admins.length) {
        await notificationService.notifyDisposalCreated(
          { id, ...disposal },
          details,
          admins
        );
      }

      // 3️⃣ Trả kết quả
      res.status(201).json({
        id,
        ...disposal,
        details,
      });
    } catch (error) {
      console.error("❌ [DisposalController.createDisposal]", error);
      res
        .status(400)
        .json({ error: error.message || "Lỗi khi tạo đợt thanh lý" });
    }
  },

  // 🧩 Lấy tất cả đợt thanh lý
  getAll: async (req, res) => {
    try {
      const data = await equipmentDisposalService.getAll(req.branchFilter);
      res.json(data);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },

  // 🧰 Lấy chi tiết 1 đợt thanh lý
  getById: async (req, res) => {
    try {
      const data = await equipmentDisposalService.getById(req.params.id);
      res.json(data);
    } catch (error) {
      res.status(404).json({ error: error.message });
    }
  },
};

module.exports = equipmentDisposalController;
