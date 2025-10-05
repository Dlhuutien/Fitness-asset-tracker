// src/services/userService.js
import axios from "axios";
import { API } from "@/config/url";
import AuthService from "./AuthService";

const UserService = {
  /**
   * Lấy danh sách tất cả users (admin / super-admin)
   * GET /user/list-user
   */
  async getAll() {
    const auth = AuthService.getAuth();
    if (!auth?.accessToken) throw new Error("Chưa đăng nhập hoặc token không hợp lệ");

    try {
      const res = await axios.get(`${API}user/list-user`, {
        headers: {
          Authorization: `Bearer ${auth.accessToken}`,
        },
      });
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
   * 🔹 Lấy chi tiết user theo username
   * (vì dữ liệu trả về đã có đầy đủ attributes, nên lọc local)
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
};

export default UserService;
