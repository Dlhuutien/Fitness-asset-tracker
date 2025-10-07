import axios from "axios";
import { API } from "@/config/url";
import AuthService from "./AuthService";

const MaintainService = {
  /**
   * 🧩 Lấy danh sách tất cả yêu cầu bảo trì
   * GET /maintenance
   * (mọi user đều gọi được)
   */
  async getAll() {
    try {
      const res = await axios.get(`${API}maintenance`);
      return res.data;
    } catch (err) {
      console.error("❌ Lỗi khi lấy danh sách maintenance:", err.response?.data || err.message);
      throw err.response?.data || err;
    }
  },

  /**
   * 🔍 Lấy chi tiết 1 yêu cầu bảo trì
   * GET /maintenance/:id
   */
  async getById(id) {
    try {
      const res = await axios.get(`${API}maintenance/${id}`);
      return res.data;
    } catch (err) {
      console.error("❌ Lỗi khi lấy chi tiết maintenance:", err.response?.data || err.message);
      throw err.response?.data || err;
    }
  },

  /**
   * 🧠 Tạo yêu cầu bảo trì mới
   * POST /maintenance
   * Role: operator, admin, super-admin, technician
   */
  async create(data) {
    const auth = AuthService.getAuth();
    if (!auth?.accessToken) throw new Error("⚠️ Chưa đăng nhập!");

    try {
      const res = await axios.post(`${API}maintenance`, data, {
        headers: { Authorization: `Bearer ${auth.accessToken}` },
      });
      return res.data;
    } catch (err) {
      console.error("❌ Lỗi khi tạo yêu cầu bảo trì:", err.response?.data || err.message);
      throw err.response?.data || err;
    }
  },

  /**
   * ⚙️ Chuyển yêu cầu sang In Progress
   * PUT /maintenance/:id/progress
   * Role: admin, super-admin, technician
   */
  async setInProgress(id) {
    const auth = AuthService.getAuth();
    if (!auth?.accessToken) throw new Error("⚠️ Chưa đăng nhập!");

    try {
      const res = await axios.put(`${API}maintenance/${id}/progress`, {}, {
        headers: { Authorization: `Bearer ${auth.accessToken}` },
      });
      return res.data;
    } catch (err) {
      console.error("❌ Lỗi khi cập nhật trạng thái In Progress:", err.response?.data || err.message);
      throw err.response?.data || err;
    }
  },

  /**
   * ✅ Hoàn tất yêu cầu bảo trì
   * PUT /maintenance/:id/complete
   * Role: admin, super-admin, technician
   * @param {Object} data - { maintenance_detail, status, cost }
   */
  async complete(id, data) {
    const auth = AuthService.getAuth();
    if (!auth?.accessToken) throw new Error("⚠️ Chưa đăng nhập!");

    try {
      const res = await axios.put(`${API}maintenance/${id}/complete`, data, {
        headers: { Authorization: `Bearer ${auth.accessToken}` },
      });
      return res.data;
    } catch (err) {
      console.error("❌ Lỗi khi hoàn tất bảo trì:", err.response?.data || err.message);
      throw err.response?.data || err;
    }
  },
};

export default MaintainService;
