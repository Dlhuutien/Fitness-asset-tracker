import axios from "@/config/axiosConfig";
import { API } from "@/config/url";

/**
 * 🧰 Service xử lý yêu cầu bảo trì (Maintenance Requests)
 * Role: admin, super-admin, technician
 */
const MaintenanceRequestService = {
  /**
   * 🔹 Lấy danh sách tất cả yêu cầu bảo trì
   * (middleware backend sẽ tự lọc branch nếu cần)
   */
  async getAll() {
    try {
      const res = await axios.get(`${API}maintenance-requests`);
      return res.data;
    } catch (err) {
      console.error("❌ Lỗi khi lấy danh sách yêu cầu bảo trì:", err.response?.data || err.message);
      throw err.response?.data || err;
    }
  },

  /**
   * 🔹 Lấy chi tiết 1 yêu cầu bảo trì theo ID
   */
  async getById(id) {
    try {
      const res = await axios.get(`${API}maintenance-requests/${id}`);
      return res.data;
    } catch (err) {
      console.error("❌ Lỗi khi lấy chi tiết yêu cầu bảo trì:", err.response?.data || err.message);
      throw err.response?.data || err;
    }
  },

  /**
   * 🔹 Lấy danh sách yêu cầu bảo trì theo thiết bị (unit)
   */
  async getByUnit(unitId) {
    try {
      const res = await axios.get(`${API}maintenance-requests/by-unit/${unitId}`);
      return res.data;
    } catch (err) {
      console.error("❌ Lỗi khi lấy yêu cầu theo thiết bị:", err.response?.data || err.message);
      throw err.response?.data || err;
    }
  },

  /**
   * 🟢 Tạo yêu cầu bảo trì mới
   * - Nếu có candidate_tech_id → status = "confirmed" + tạo AWS Schedule
   * - Nếu không có → status = "pending"
   */
  async create(data) {
    try {
      const res = await axios.post(`${API}maintenance-requests`, data);
      return res.data;
    } catch (err) {
      console.error("❌ Lỗi khi tạo yêu cầu bảo trì:", err.response?.data || err.message);
      throw err.response?.data || err;
    }
  },

  /**
   * 🟡 Cập nhật yêu cầu bảo trì
   * - Chỉ khi status = pending hoặc confirmed
   * - Nếu thay đổi scheduled_at → xóa schedule cũ & tạo lại
   * - Nếu thêm candidate_tech_id → gửi thông báo “Assigned”
   */
  async update(id, data) {
    try {
      const res = await axios.put(`${API}maintenance-requests/${id}`, data);
      return res.data;
    } catch (err) {
      console.error("❌ Lỗi khi cập nhật yêu cầu bảo trì:", err.response?.data || err.message);
      throw err.response?.data || err;
    }
  },

  /**
   * ✅ Kỹ thuật viên xác nhận nhận việc
   * - PUT /maintenance-requests/:id/confirm
   */
  async confirm(id) {
    try {
      const res = await axios.put(`${API}maintenance-requests/${id}/confirm`);
      return res.data;
    } catch (err) {
      console.error("❌ Lỗi khi xác nhận nhận việc:", err.response?.data || err.message);
      throw err.response?.data || err;
    }
  },

  /**
   * ❌ Hủy yêu cầu (admin hoặc người tạo)
   * - Chỉ khi status = pending
   */
  async cancel(id) {
    try {
      const res = await axios.put(`${API}maintenance-requests/${id}/cancel`);
      return res.data;
    } catch (err) {
      console.error("❌ Lỗi khi hủy yêu cầu bảo trì:", err.response?.data || err.message);
      throw err.response?.data || err;
    }
  },

  /**
   * 🗑️ Xóa yêu cầu (chỉ cho phép super-admin / test)
   */
  async delete(id) {
    try {
      const res = await axios.delete(`${API}maintenance-requests/${id}`);
      return res.data;
    } catch (err) {
      console.error("❌ Lỗi khi xóa yêu cầu bảo trì:", err.response?.data || err.message);
      throw err.response?.data || err;
    }
  },
};

export default MaintenanceRequestService;
