import axios from "axios";
import { API } from "@/config/url";
import AuthService from "./AuthService";

const AttributeValueService = {
  /**
   * Lấy tất cả attribute values
   * GET /attributeValue
   */
  async getAll() {
    try {
      const res = await axios.get(`${API}attributeValue`);
      return res.data;
    } catch (err) {
      console.error("Lỗi khi lấy danh sách attributeValue:", err.response?.data || err.message);
      throw err.response?.data || err;
    }
  },

  /**
   * Lấy chi tiết attribute value theo id
   * GET /attributeValue/:id
   */
  async getById(id) {
    try {
      const res = await axios.get(`${API}attributeValue/${id}`);
      return res.data;
    } catch (err) {
      console.error("Lỗi khi lấy attributeValue theo id:", err.response?.data || err.message);
      throw err.response?.data || err;
    }
  },

  /**
   * Lấy tất cả attribute values theo equipment_id
   * GET /attributeValue/equipment/:equipment_id
   */
  async getByEquipmentId(equipmentId) {
    try {
      const res = await axios.get(`${API}attributeValue/equipment/${equipmentId}`);
      return res.data;
    } catch (err) {
      console.error("Lỗi khi lấy attributeValue theo equipment_id:", err.response?.data || err.message);
      throw err.response?.data || err;
    }
  },

  /**
   * Lấy tất cả attribute values theo attribute_id
   * GET /attributeValue/attribute/:attribute_id
   */
  async getByAttributeId(attributeId) {
    try {
      const res = await axios.get(`${API}attributeValue/attribute/${attributeId}`);
      return res.data;
    } catch (err) {
      console.error("Lỗi khi lấy attributeValue theo attribute_id:", err.response?.data || err.message);
      throw err.response?.data || err;
    }
  },

  /**
   * Tạo attribute value mới (admin, super-admin)
   * POST /attributeValue
   */
  async create(data) {
    const auth = AuthService.getAuth();
    if (!auth?.accessToken) throw new Error("Chưa đăng nhập");

    try {
      const res = await axios.post(`${API}attributeValue`, data, {
        headers: { Authorization: `Bearer ${auth.accessToken}` },
      });
      return res.data;
    } catch (err) {
      console.error("Lỗi khi tạo attributeValue:", err.response?.data || err.message);
      throw err.response?.data || err;
    }
  },

  /**
   * Cập nhật attribute value
   * PUT /attributeValue/:id
   */
  async update(id, data) {
    const auth = AuthService.getAuth();
    if (!auth?.accessToken) throw new Error("Chưa đăng nhập");

    try {
      const res = await axios.put(`${API}attributeValue/${id}`, data, {
        headers: { Authorization: `Bearer ${auth.accessToken}` },
      });
      return res.data;
    } catch (err) {
      console.error("Lỗi khi cập nhật attributeValue:", err.response?.data || err.message);
      throw err.response?.data || err;
    }
  },

  /**
   * Xóa attribute value
   * DELETE /attributeValue/:id
   */
  async delete(id) {
    const auth = AuthService.getAuth();
    if (!auth?.accessToken) throw new Error("Chưa đăng nhập");

    try {
      const res = await axios.delete(`${API}attributeValue/${id}`, {
        headers: { Authorization: `Bearer ${auth.accessToken}` },
      });
      return res.data;
    } catch (err) {
      console.error("Lỗi khi xóa attributeValue:", err.response?.data || err.message);
      throw err.response?.data || err;
    }
  },
};

export default AttributeValueService;
