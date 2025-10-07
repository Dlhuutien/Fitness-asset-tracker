import axios from "axios";
import { API } from "@/config/url";
import AuthService from "./AuthService";

const BranchService = {
  /**
   * Lấy danh sách tất cả branches (mọi user)
   * GET /branch
   */
  async getAll() {
    try {
      const res = await axios.get(`${API}branch`);
      return res.data;
    } catch (err) {
      console.error("❌ Lỗi khi lấy danh sách branch:", err.response?.data || err.message);
      throw err.response?.data || err;
    }
  },

  /**
   * Lấy chi tiết branch theo id
   * GET /branch/:id
   */
  async getById(id) {
    try {
      const res = await axios.get(`${API}branch/${id}`);
      return res.data;
    } catch (err) {
      console.error("❌ Lỗi khi lấy branch theo id:", err.response?.data || err.message);
      throw err.response?.data || err;
    }
  },

  /**
   * Cập nhật branch (admin, super-admin)
   * PUT /branch/:id
   */
  async update(id, data) {
    const auth = AuthService.getAuth();
    if (!auth?.accessToken) throw new Error("Chưa đăng nhập");

    try {
      const res = await axios.put(`${API}branch/${id}`, data, {
        headers: { Authorization: `Bearer ${auth.accessToken}` },
      });
      return res.data;
    } catch (err) {
      console.error("❌ Lỗi khi cập nhật branch:", err.response?.data || err.message);
      throw err.response?.data || err;
    }
  },
};

export default BranchService;
