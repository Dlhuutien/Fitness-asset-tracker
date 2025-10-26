import axios from "@/config/axiosConfig";
import { API } from "@/config/url";

// ✅ Tránh sai chính tả status
export const UNIT_STATUS = {
  ACTIVE: "Active",
  INACTIVE: "Inactive",
  TEMP_URGENT: "Temporary Urgent",
  IN_PROGRESS: "In Progress",
  READY: "Ready",
  FAILED: "Failed",
};

const EquipmentUnitService = {
  /**
   * 🔹 Lấy tất cả equipment units
   * GET /equipmentUnit
   */
  async getAll() {
    try {
      const res = await axios.get(`${API}equipmentUnit`);
      return res.data;
    } catch (err) {
      console.error("❌ Lỗi khi lấy equipment units:", err.response?.data || err.message);
      throw err.response?.data || err;
    }
  },

  /**
   * 🔹 Lấy chi tiết unit theo id
   * GET /equipmentUnit/:id
   */
  async getById(id) {
    try {
      const res = await axios.get(`${API}equipmentUnit/${id}`);
      return res.data;
    } catch (err) {
      console.error("❌ Lỗi khi lấy equipment unit:", err.response?.data || err.message);
      throw err.response?.data || err;
    }
  },

  /**
   * 🔹 Lấy tất cả unit theo equipment_id (thiết bị gốc)
   * GET /equipmentUnit/equipment/:equipmentId
   */
  async getByEquipmentId(equipmentId) {
    try {
      const res = await axios.get(`${API}equipmentUnit/equipment/${equipmentId}`);
      return res.data;
    } catch (err) {
      console.error("❌ Lỗi khi lấy units theo equipment_id:", err.response?.data || err.message);
      throw err.response?.data || err;
    }
  },

  /**
   * 🔹 Lọc theo 1 trạng thái duy nhất
   * GET /equipmentUnit/status/:status
   */
  async getByStatus(status) {
    try {
      const res = await axios.get(`${API}equipmentUnit/status/${encodeURIComponent(status)}`);
      return res.data;
    } catch (err) {
      console.error("❌ Lỗi khi lọc theo status:", err.response?.data || err.message);
      throw err.response?.data || err;
    }
  },

  /**
   * 🔹 Lọc theo nhiều trạng thái (status-group)
   * GET /equipmentUnit/status-group?statuses=a,b,c
   */
  async getByStatusGroup(statuses = []) {
    const qs = statuses.map(encodeURIComponent).join(",");
    const url = `${API}equipmentUnit/status-group?statuses=${qs}`;
    try {
      const res = await axios.get(url);
      return res.data;
    } catch (err) {
      console.error("❌ Lỗi khi lọc theo status-group:", err.response?.data || err.message);
      throw err.response?.data || err;
    }
  },

  /**
   * 🔹 Helper cho màn Urgent
   * => Trả về units có trạng thái Temporary Urgent & In Progress
   */
  async getUrgentUnits() {
    return this.getByStatusGroup([
      UNIT_STATUS.TEMP_URGENT,
      UNIT_STATUS.IN_PROGRESS,
    ]);
  },

  /**
   * 🔹 Helper cho màn Ready
   * => Trả về units có trạng thái Ready & Failed
   */
  async getReadyUnits() {
    return this.getByStatusGroup([UNIT_STATUS.READY, UNIT_STATUS.FAILED]);
  },

  /**
   * 🔹 Cập nhật equipment unit (chỉ admin, super-admin)
   * PUT /equipmentUnit/:id
   */
  async update(id, data) {
    try {
      const res = await axios.put(`${API}equipmentUnit/${id}`, data);
      return res.data;
    } catch (err) {
      console.error("❌ Lỗi khi cập nhật equipment unit:", err.response?.data || err.message);
      throw err.response?.data || err;
    }
  },

  /**
   * 🔹 Cập nhật thông tin thiết bị gốc (model Equipment)
   * PUT /equipment/:equipmentId
   */
  async updateBaseInfo(equipmentId, data) {
    try {
      const res = await axios.put(`${API}equipment/${equipmentId}`, data);
      return res.data;
    } catch (err) {
      console.error("❌ Lỗi khi cập nhật thiết bị gốc:", err.response?.data || err.message);
      throw err.response?.data || err;
    }
  },

  /**
   * 🔹 Helper phê duyệt cuối (giai đoạn 4)
   * status: "Active" | "Inactive"
   */
  async setFinalStatus(id, status) {
    if (![UNIT_STATUS.ACTIVE, UNIT_STATUS.INACTIVE].includes(status)) {
      throw new Error("Trạng thái cuối không hợp lệ");
    }
    return this.update(id, { status });
  },
};

export default EquipmentUnitService;
