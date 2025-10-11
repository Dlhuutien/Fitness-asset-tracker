import axios from "axios";
import { API } from "@/config/url";
import AuthService from "./AuthService";

// Tránh sai chính tả status
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
   * Lấy tất cả equipment units
   */
  async getAll() {
    const auth = AuthService.getAuth();
    if (!auth?.accessToken) throw new Error("Chưa đăng nhập");

    try {
      const res = await axios.get(`${API}equipmentUnit`, {
        headers: { Authorization: `Bearer ${auth.accessToken}` },
      });
      return res.data;
    } catch (err) {
      console.error(
        "Lỗi khi lấy equipment units:",
        err.response?.data || err.message
      );
      throw err.response?.data || err;
    }
  },

  /**
   * Lấy chi tiết unit theo id
   */
  async getById(id) {
    try {
      const res = await axios.get(`${API}equipmentUnit/${id}`);
      return res.data;
    } catch (err) {
      console.error(
        "Lỗi khi lấy equipment unit:",
        err.response?.data || err.message
      );
      throw err.response?.data || err;
    }
  },

  /**
   * Lấy tất cả unit theo equipment_id (model gốc)
   */
  async getByEquipmentId(equipmentId) {
    try {
      const res = await axios.get(
        `${API}equipmentUnit/equipment/${equipmentId}`
      );
      return res.data;
    } catch (err) {
      console.error(
        "Lỗi khi lấy units theo equipment_id:",
        err.response?.data || err.message
      );
      throw err.response?.data || err;
    }
  },

  /**
   * Lọc theo 1 trạng thái duy nhất
   * VD: In Progress
   */
  async getByStatus(status) {
    const auth = AuthService.getAuth();
    if (!auth?.accessToken) throw new Error("Chưa đăng nhập");

    try {
      const res = await axios.get(
        `${API}equipmentUnit/status/${encodeURIComponent(status)}`,
        {
          headers: { Authorization: `Bearer ${auth.accessToken}` },
        }
      );
      return res.data;
    } catch (err) {
      console.error(
        "Lỗi khi lọc theo status:",
        err.response?.data || err.message
      );
      throw err.response?.data || err;
    }
  },

  /**
   * Lọc theo nhiều trạng thái (status-group)
   * VD: ["Temporary Urgent","In Progress"] hoặc ["Ready","Failed"]
   */
  async getByStatusGroup(statuses = []) {
    const auth = AuthService.getAuth();
    if (!auth?.accessToken) throw new Error("Chưa đăng nhập");

    // Mã hoá từng phần tử để tránh lỗi dấu cách, dấu phẩy
    const qs = statuses.map(encodeURIComponent).join(",");
    const url = `${API}equipmentUnit/status-group?statuses=${qs}`;

    try {
      const res = await axios.get(url, {
        headers: { Authorization: `Bearer ${auth.accessToken}` },
      });
      return res.data;
    } catch (err) {
      console.error(
        "Lỗi khi lọc theo status-group:",
        err.response?.data || err.message
      );
      throw err.response?.data || err;
    }
  },

  /**
   * Helper cho màn Urgent
   * => trả về units có trạng thái Temporary Urgent & In Progress
   */
  async getUrgentUnits() {
    return this.getByStatusGroup([
      UNIT_STATUS.TEMP_URGENT,
      UNIT_STATUS.IN_PROGRESS,
    ]);
  },

  /**
   * Helper cho màn Ready
   * => trả về units có trạng thái Ready & Failed
   */
  async getReadyUnits() {
    return this.getByStatusGroup([UNIT_STATUS.READY, UNIT_STATUS.FAILED]);
  },

  /**
   * Cập nhật equipment unit (chỉ admin, super-admin)
   */
  async update(id, data) {
    const auth = AuthService.getAuth();
    if (!auth?.accessToken) throw new Error("Chưa đăng nhập");

    try {
      const res = await axios.put(`${API}equipmentUnit/${id}`, data, {
        headers: {
          Authorization: `Bearer ${auth.accessToken}`,
        },
      });
      return res.data;
    } catch (err) {
      console.error(
        "Lỗi khi cập nhật equipment unit:",
        err.response?.data || err.message
      );
      throw err.response?.data || err;
    }
  },

  /**
   * Helper phê duyệt cuối (giai đoạn 4)
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
