import axios from "@/config/axiosConfig";
import { API } from "@/config/url";

const MaintenancePlanService = {
  /**
   * 📋 Lấy danh sách tất cả kế hoạch bảo trì
   * GET /maintenance-plan
   * Quyền: technician, operator, admin, super-admin
   */
  async getAll() {
    try {
      const res = await axios.get(`${API}maintenance-plan`);
      return res.data;
    } catch (err) {
      console.error("❌ Lỗi khi lấy danh sách kế hoạch bảo trì:", err.response?.data || err.message);
      throw err.response?.data || err;
    }
  },

  /**
   * 🔍 Lấy chi tiết 1 kế hoạch bảo trì theo id
   * GET /maintenance-plan/:id
   * Quyền: technician, operator, admin, super-admin
   */
  async getById(id) {
    try {
      const res = await axios.get(`${API}maintenance-plan/${id}`);
      return res.data;
    } catch (err) {
      console.error("❌ Lỗi khi lấy chi tiết kế hoạch bảo trì:", err.response?.data || err.message);
      throw err.response?.data || err;
    }
  },

  /**
   * 🔍 Lấy kế hoạch bảo trì theo equipment_id
   * GET /maintenance-plan/equipment/:equipmentId
   * Quyền: technician, operator, admin, super-admin
   */
  async getByEquipmentId(equipmentId) {
    try {
      const res = await axios.get(`${API}maintenance-plan/equipment/${equipmentId}`);
      return res.data;
    } catch (err) {
      console.error("❌ Lỗi khi lấy kế hoạch theo equipment_id:", err.response?.data || err.message);
      throw err.response?.data || err;
    }
  },

  /**
   * ➕ Tạo mới kế hoạch bảo trì định kỳ
   * POST /maintenance-plan
   * Quyền: admin, super-admin
   * Body:
   * {
   *   equipment_id: "CAOTMJS",
   *   frequency: "3_months",
   *   next_maintenance_date: "2025-12-01T08:00:00.000Z"
   * }
   */
  async create(data) {
    try {
      const res = await axios.post(`${API}maintenance-plan`, data);
      return res.data;
    } catch (err) {
      console.error("❌ Lỗi khi tạo kế hoạch bảo trì:", err.response?.data || err.message);
      throw err.response?.data || err;
    }
  },

  /**
   * 🛠️ Cập nhật kế hoạch bảo trì
   * PUT /maintenance-plan/:id
   * Quyền: admin, super-admin
   * Body:
   * {
   *   frequency: "6_months",
   *   next_maintenance_date: "2026-01-01T08:00:00.000Z"
   * }
   */
  async update(id, data) {
    try {
      const res = await axios.put(`${API}maintenance-plan/${id}`, data);
      return res.data;
    } catch (err) {
      console.error("❌ Lỗi khi cập nhật kế hoạch bảo trì:", err.response?.data || err.message);
      throw err.response?.data || err;
    }
  },

  /**
   * ❌ Xóa kế hoạch bảo trì
   * DELETE /maintenance-plan/:id
   * Quyền: admin, super-admin
   * Tự động xóa luôn schedule AWS tương ứng
   */
  async delete(id) {
    try {
      const res = await axios.delete(`${API}maintenance-plan/${id}`);
      return res.data;
    } catch (err) {
      console.error("❌ Lỗi khi xóa kế hoạch bảo trì:", err.response?.data || err.message);
      throw err.response?.data || err;
    }
  },
};

export default MaintenancePlanService;
