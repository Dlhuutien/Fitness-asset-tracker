import axios from "@/config/axiosConfig";
import { API } from "@/config/url";

const VendorService = {
  /**
   * 🧾 Lấy danh sách tất cả vendors
   * GET /vendor
   */
  async getAll() {
    try {
      const res = await axios.get(`${API}vendor`);
      return res.data;
    } catch (err) {
      console.error("❌ Lỗi khi lấy danh sách vendor:", err.response?.data || err.message);
      throw err.response?.data || err;
    }
  },

  /**
   * 🔍 Lấy chi tiết vendor theo id
   * GET /vendor/:id
   */
  async getById(id) {
    try {
      const res = await axios.get(`${API}vendor/${id}`);
      return res.data;
    } catch (err) {
      console.error("❌ Lỗi khi lấy vendor theo id:", err.response?.data || err.message);
      throw err.response?.data || err;
    }
  },

  /**
   * ➕ Tạo vendor mới (admin, super-admin)
   * POST /vendor
   */
  async create(data) {
    try {
      const res = await axios.post(`${API}vendor`, data);
      return res.data;
    } catch (err) {
      console.error("❌ Lỗi khi tạo vendor:", err.response?.data || err.message);
      throw err.response?.data || err;
    }
  },

  /**
   * 🛠️ Cập nhật vendor (admin, super-admin)
   * PUT /vendor/:id
   */
  async update(id, data) {
    try {
      const res = await axios.put(`${API}vendor/${id}`, data);
      return res.data;
    } catch (err) {
      console.error("❌ Lỗi khi cập nhật vendor:", err.response?.data || err.message);
      throw err.response?.data || err;
    }
  },

  /**
   * ❌ Xóa vendor (admin, super-admin)
   * DELETE /vendor/:id
   */
  async delete(id) {
    try {
      const res = await axios.delete(`${API}vendor/${id}`);
      return res.data;
    } catch (err) {
      console.error("❌ Lỗi khi xóa vendor:", err.response?.data || err.message);
      throw err.response?.data || err;
    }
  },
};

export default VendorService;
