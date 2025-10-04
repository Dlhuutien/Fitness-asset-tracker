import axios from "axios";
import { API } from "@/config/url";
import AuthService from "./AuthService";

const EquipmentUnitService = {
  /**
   * Lấy tất cả equipment units
   */
  async getAll() {
    try {
      const res = await axios.get(`${API}equipmentUnit`);
      return res.data;
    } catch (err) {
      console.error("Lỗi khi lấy equipment units:", err.response?.data || err.message);
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
      console.error("Lỗi khi lấy equipment unit:", err.response?.data || err.message);
      throw err.response?.data || err;
    }
  },

  /**
   * Lấy tất cả unit theo equipment_id
   */
  async getByEquipmentId(equipmentId) {
    try {
      const res = await axios.get(`${API}equipmentUnit/equipment/${equipmentId}`);
      return res.data;
    } catch (err) {
      console.error("Lỗi khi lấy units theo equipment_id:", err.response?.data || err.message);
      throw err.response?.data || err;
    }
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
      console.error("Lỗi khi cập nhật equipment unit:", err.response?.data || err.message);
      throw err.response?.data || err;
    }
  }
};

export default EquipmentUnitService;
