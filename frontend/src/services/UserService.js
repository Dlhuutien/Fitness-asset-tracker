// src/services/userService.js
import axios from "@/config/axiosConfig";
import { API } from "@/config/url";

const UserService = {
  /**
   * 👥 Lấy danh sách tất cả users (admin / super-admin)
   * GET /user/list-user
   */
  async getAll() {
    try {
      const res = await axios.get(`${API}user/list-user`);
      return res.data?.users || [];
    } catch (err) {
      console.error(
        "❌ Lỗi khi lấy danh sách user:",
        err.response?.data || err.message
      );
      throw err.response?.data || err;
    }
  },

  /**
   * 🔍 Lấy chi tiết user theo username
   */
  async getByUsername(username) {
    try {
      const users = await this.getAll();
      return users.find((u) => u.username === username) || null;
    } catch (err) {
      console.error("❌ Lỗi khi tìm user theo username:", err);
      throw err;
    }
  },

  /**
   * 🆕 Admin tạo user mới
   * POST /user/create
   * Body: { username, email, role, extra }
   */
  async createUser(data) {
    try {
      const res = await axios.post(`${API}user/create`, data);
      return res.data;
    } catch (err) {
      console.error("❌ Lỗi khi tạo user:", err.response?.data || err.message);
      throw err.response?.data || err;
    }
  },

  // ============================================================
  // 🧩 API QUẢN LÝ USER
  // ============================================================

  /**
   * 🧍‍♂️ User tự cập nhật thông tin cá nhân của chính mình
   * PUT /user/update-info
   * Body: { name, phone_number, address, ... }
   */
  async updateSelf(attributes) {
    try {
      const res = await axios.put(`${API}user/update-info`, attributes);
      return res.data;
    } catch (err) {
      console.error(
        "❌ Lỗi khi cập nhật thông tin cá nhân:",
        err.response?.data || err.message
      );
      throw err.response?.data || err;
    }
  },

  /**
   * 🧑‍💼 Admin hoặc Super-admin thay đổi role của user
   * PUT /user/set-role
   * Body: { username, role }
   */
  async setRole(username, role) {
    try {
      const res = await axios.put(`${API}user/set-role`, { username, role });
      return res.data;
    } catch (err) {
      console.error(
        "❌ Lỗi khi đổi role user:",
        err.response?.data || err.message
      );
      throw err.response?.data || err;
    }
  },

  /**
   * 🔒 Thay đổi trạng thái hoạt động của user (enable / disable)
   * PUT /user/change-status
   * Body: { username, enabled: true/false }
   */
  async changeStatus(username, enabled) {
    try {
      const res = await axios.put(`${API}user/change-status`, {
        username,
        enabled,
      });
      return res.data;
    } catch (err) {
      console.error(
        "❌ Lỗi khi thay đổi trạng thái user:",
        err.response?.data || err.message
      );
      throw err.response?.data || err;
    }
  },

  /**
   * 🛠️ Admin / Super-admin cập nhật attributes của user khác
   * PUT /user/admin-update-user
   * Body: { username, attributes: { key: value, ... } }
   */
  /**
   * 🛠️ Admin / Super-admin cập nhật attributes của user khác
   * PUT /user/admin-update-user
   * Body: { username, attributes: { key: value, ... } }
   */
  async adminUpdateUser(username, attributes) {
    try {
      const res = await axios.put(`${API}user/admin-update-user`, {
        username,
        attributes,
      });
      return res.data;
    } catch (err) {
      console.error(
        "❌ Lỗi khi admin cập nhật thông tin user:",
        err.response?.data || err.message
      );
      throw err.response?.data || err;
    }
  },
};

export default UserService;
