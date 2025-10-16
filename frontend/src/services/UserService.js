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
      console.error("❌ Lỗi khi lấy danh sách user:", err.response?.data || err.message);
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
      const res = await axios.post(`${API}user/create`, data, {
        headers: { "Content-Type": "application/json" },
      });
      // { message: "Admin created user", username: "tech001", role: "technician" }
      return res.data;
    } catch (err) {
      console.error("❌ Lỗi khi tạo user:", err.response?.data || err.message);
      throw err.response?.data || err;
    }
  },
};

export default UserService;
