import axios from "@/config/axiosConfig";
import { API } from "@/config/url";

const FloorService = {
  /**
   * Lấy danh sách tất cả tầng
   * GET /floor
   */
  async getAll() {
    try {
      const res = await axios.get(`${API}floor`);
      return res.data;
    } catch (err) {
      console.error(
        "❌ Lỗi khi lấy danh sách floor:",
        err.response?.data || err.message
      );
      throw err.response?.data || err;
    }
  },

  /**
   * Tạo tầng mới cho chi nhánh
   * POST /floor
   * body: { branch_id, description }
   */
  async create(data) {
    try {
      const res = await axios.post(`${API}floor`, data);
      return res.data;
    } catch (err) {
      console.error(
        "❌ Lỗi khi tạo floor:",
        err.response?.data || err.message
      );
      throw err.response?.data || err;
    }
  },

  /**
   * Lấy chi tiết tầng theo id
   * GET /floor/:id
   */
  async getById(id) {
    try {
      const res = await axios.get(`${API}floor/${id}`);
      return res.data;
    } catch (err) {
      console.error(
        "❌ Lỗi khi lấy floor theo id:",
        err.response?.data || err.message
      );
      throw err.response?.data || err;
    }
  },

  /**
   * Cập nhật tầng
   * PUT /floor/:id
   * (chỉ update description)
   */
  async update(id, data) {
    try {
      const res = await axios.put(`${API}floor/${id}`, data);
      return res.data;
    } catch (err) {
      console.error(
        "❌ Lỗi khi cập nhật floor:",
        err.response?.data || err.message
      );
      throw err.response?.data || err;
    }
  },

  /**
   * Xóa tầng
   * DELETE /floor/:id
   */
  async delete(id) {
    try {
      const res = await axios.delete(`${API}floor/${id}`);
      return res.data;
    } catch (err) {
      console.error(
        "❌ Lỗi khi xóa floor:",
        err.response?.data || err.message
      );
      throw err.response?.data || err;
    }
  },
};

export default FloorService;
