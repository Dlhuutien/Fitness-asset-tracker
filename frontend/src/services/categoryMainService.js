import axios from "axios";
import { API } from "@/config/url";
import AuthService from "./AuthService";

const CategoryMainService = {
  /**
   * Lấy tất cả category main
   */
  async getAll() {
    try {
      const res = await axios.get(`${API}categoryMain`);
      return res.data;
    } catch (err) {
      console.error("Lỗi khi lấy category main:", err.response?.data || err.message);
      throw err.response?.data || err;
    }
  },

  /**
   * Lấy chi tiết category main theo id
   */
  async getById(id) {
    try {
      const res = await axios.get(`${API}categoryMain/${id}`);
      return res.data;
    } catch (err) {
      console.error("Lỗi khi lấy chi tiết category main:", err.response?.data || err.message);
      throw err.response?.data || err;
    }
  },

  /**
   * Tạo category main (admin, super-admin)
   */
  async create(data) {
    const auth = AuthService.getAuth();
    if (!auth?.accessToken) throw new Error("Chưa đăng nhập");

    try {
      const res = await axios.post(`${API}categoryMain`, data, {
        headers: { Authorization: `Bearer ${auth.accessToken}` },
      });
      return res.data;
    } catch (err) {
      console.error("Lỗi khi tạo category main:", err.response?.data || err.message);
      throw err.response?.data || err;
    }
  },

  /**
   * Cập nhật category main (admin, super-admin)
   */
  async update(id, data) {
    const auth = AuthService.getAuth();
    if (!auth?.accessToken) throw new Error("Chưa đăng nhập");

    try {
      const res = await axios.put(`${API}categoryMain/${id}`, data, {
        headers: { Authorization: `Bearer ${auth.accessToken}` },
      });
      return res.data;
    } catch (err) {
      console.error("Lỗi khi cập nhật category main:", err.response?.data || err.message);
      throw err.response?.data || err;
    }
  },

  /**
   * Xóa category main (admin, super-admin)
   */
  async delete(id) {
    const auth = AuthService.getAuth();
    if (!auth?.accessToken) throw new Error("Chưa đăng nhập");

    try {
      const res = await axios.delete(`${API}categoryMain/${id}`, {
        headers: { Authorization: `Bearer ${auth.accessToken}` },
      });
      return res.data;
    } catch (err) {
      console.error("Lỗi khi xóa category main:", err.response?.data || err.message);
      throw err.response?.data || err;
    }
  },
};

export default CategoryMainService;
