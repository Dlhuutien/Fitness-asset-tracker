import axios from "@/config/axiosConfig";
import { API } from "@/config/url";

const AreaService = {
  /**
   * Lấy danh sách tất cả khu vực
   * GET /area
   */
  async getAll() {
    try {
      const res = await axios.get(`${API}area`);
      return res.data;
    } catch (err) {
      console.error(
        "❌ Lỗi khi lấy danh sách area:",
        err.response?.data || err.message
      );
      throw err.response?.data || err;
    }
  },

  /**
   * Tạo khu vực mới trong tầng
   * POST /area
   * body: { floor_id, name, description }
   */
  async create(data) {
    try {
      const res = await axios.post(`${API}area`, data);
      return res.data;
    } catch (err) {
      console.error(
        "❌ Lỗi khi tạo area:",
        err.response?.data || err.message
      );
      throw err.response?.data || err;
    }
  },

  /**
   * Lấy chi tiết khu vực theo id
   * GET /area/:id
   */
  async getById(id) {
    try {
      const res = await axios.get(`${API}area/${id}`);
      return res.data;
    } catch (err) {
      console.error(
        "❌ Lỗi khi lấy area theo id:",
        err.response?.data || err.message
      );
      throw err.response?.data || err;
    }
  },

  /**
   * Cập nhật khu vực
   * PUT /area/:id
   * (chỉ update name, description)
   */
  async update(id, data) {
    try {
      const res = await axios.put(`${API}area/${id}`, data);
      return res.data;
    } catch (err) {
      console.error(
        "❌ Lỗi khi cập nhật area:",
        err.response?.data || err.message
      );
      throw err.response?.data || err;
    }
  },

  /**
   * Xóa khu vực
   * DELETE /area/:id
   */
  async delete(id) {
    try {
      const res = await axios.delete(`${API}area/${id}`);
      return res.data;
    } catch (err) {
      console.error(
        "❌ Lỗi khi xóa area:",
        err.response?.data || err.message
      );
      throw err.response?.data || err;
    }
  },
};

export default AreaService;
