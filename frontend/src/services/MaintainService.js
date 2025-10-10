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
      console.error(
        "❌ Lỗi khi lấy danh sách maintenance:",
        err.response?.data || err.message
      );
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
      console.error(
        "❌ Lỗi khi lấy chi tiết maintenance:",
        err.response?.data || err.message
      );
      throw err.response?.data || err;
    }
  },

  /**
   * 🔍 Lấy maintenance hiện hành theo unit ID
   * GET /maintenance/by-unit/:unitId
   */
  async getByUnit(unitId) {
    const auth = AuthService.getAuth();
    if (!auth?.accessToken) throw new Error("⚠️ Chưa đăng nhập!");

    try {
      const res = await axios.get(`${API}maintenance/by-unit/${unitId}`, {
        headers: { Authorization: `Bearer ${auth.accessToken}` },
      });
      return res.data;
    } catch (err) {
      if (err.response?.status === 404) return null; // không có maintenance đang mở
      console.error(
        "❌ Lỗi khi lấy maintenance theo unit:",
        err.response?.data || err.message
      );
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
      console.error(
        "❌ Lỗi khi tạo yêu cầu bảo trì:",
        err.response?.data || err.message
      );
      throw err.response?.data || err;
    }
  },

  /**
   * ⚙️ Bắt đầu bảo trì (In Progress)
   * PUT /maintenance/:id/progress
   * Role: admin, super-admin, technician
   */
  async progress(id) {
    const auth = AuthService.getAuth();
    if (!auth?.accessToken) throw new Error("⚠️ Chưa đăng nhập!");

    try {
      const res = await axios.put(
        `${API}maintenance/${id}/progress`,
        {},
        {
          headers: { Authorization: `Bearer ${auth.accessToken}` },
        }
      );
      return res.data;
    } catch (err) {
      console.error(
        "❌ Lỗi khi cập nhật trạng thái In Progress:",
        err.response?.data || err.message
      );
      throw err.response?.data || err;
    }
  },

  /**
   * ✅ Hoàn tất bảo trì
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
      console.error(
        "❌ Lỗi khi hoàn tất bảo trì:",
        err.response?.data || err.message
      );
      throw err.response?.data || err;
    }
  },

  /**
   * 🧾 Lấy toàn bộ lịch sử bảo trì (bao gồm hóa đơn)
   * GET /maintenance/history/:unitId
   */
  async getFullHistory(unitId) {
    const auth = AuthService.getAuth();
    if (!auth?.accessToken) throw new Error("⚠️ Chưa đăng nhập!");

    try {
      const res = await axios.get(`${API}maintenance/history/${unitId}`, {
        headers: { Authorization: `Bearer ${auth.accessToken}` },
      });
      return res.data;
    } catch (err) {
      console.error(
        "❌ Lỗi khi lấy lịch sử bảo trì:",
        err.response?.data || err.message
      );
      throw err.response?.data || err;
    }
  },

  /**
   * 🕐 Lấy lịch sử bảo trì gần nhất
   * GET /maintenance/history/:unitId/latest
   */
  async getLatestHistory(unitId) {
    const auth = AuthService.getAuth();
    if (!auth?.accessToken) throw new Error("⚠️ Chưa đăng nhập!");

    try {
      const res = await axios.get(
        `${API}maintenance/history/${unitId}/latest`,
        {
          headers: { Authorization: `Bearer ${auth.accessToken}` },
        }
      );
      return res.data;
    } catch (err) {
      if (err.response?.status === 404) return null;
      console.error(
        "❌ Lỗi khi lấy lịch sử bảo trì gần nhất:",
        err.response?.data || err.message
      );
      throw err.response?.data || err;
    }
  },
};

export default MaintainService;
