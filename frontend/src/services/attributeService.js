import axios from "@/config/axiosConfig";
import { API } from "@/config/url";

const AttributeService = {
  /**
   * Lấy tất cả attributes
   * GET /attribute
   */
  async getAll() {
    try {
      const res = await axios.get(`${API}attribute`);
      return res.data;
    } catch (err) {
      console.error("Lỗi khi lấy danh sách attribute:", err.response?.data || err.message);
      throw err.response?.data || err;
    }
  },

  /**
   * Lấy chi tiết attribute theo id
   * GET /attribute/:id
   */
  async getById(id) {
    try {
      const res = await axios.get(`${API}attribute/${id}`);
      return res.data;
    } catch (err) {
      console.error("Lỗi khi lấy attribute theo id:", err.response?.data || err.message);
      throw err.response?.data || err;
    }
  },

  /**
   * Tạo attribute mới (admin, super-admin)
   * POST /attribute
   */
  async create(data) {
    try {
      const res = await axios.post(`${API}attribute`, data);
      return res.data;
    } catch (err) {
      console.error("Lỗi khi tạo attribute:", err.response?.data || err.message);
      throw err.response?.data || err;
    }
  },

  /**
   * Cập nhật attribute
   * PUT /attribute/:id
   */
  async update(id, data) {
    try {
      const res = await axios.put(`${API}attribute/${id}`, data);
      return res.data;
    } catch (err) {
      console.error("Lỗi khi cập nhật attribute:", err.response?.data || err.message);
      throw err.response?.data || err;
    }
  },

  /**
   * Xóa attribute
   * DELETE /attribute/:id
   */
  async delete(id) {
    try {
      const res = await axios.delete(`${API}attribute/${id}`);
      return res.data;
    } catch (err) {
      console.error("Lỗi khi xóa attribute:", err.response?.data || err.message);
      throw err.response?.data || err;
    }
  },
};

export default AttributeService;
