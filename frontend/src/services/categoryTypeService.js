import axios from "axios";
import { API } from "@/config/url";
import AuthService from "./AuthService";

const CategoryTypeService = {
  /**
   * Lấy danh sách tất cả category type
   * GET /categoryType
   */
  async getAll() {
    try {
      const res = await axios.get(`${API}categoryType`);
      return res.data; // giữ nguyên response
    } catch (err) {
      console.error("Lỗi khi lấy danh sách categoryType:", err.response?.data || err.message);
      throw err.response?.data || err;
    }
  },

  /**
   * Lấy danh sách category type kèm displayName = "name (main_name)"
   */
  async getAllWithDisplayName() {
    const list = await this.getAll();
    return list.map((ct) => ({
      ...ct,
      displayName: `${ct.name} (${ct.main_name || ct.category_main_id})`,
      fullCode: `${ct.category_main_id}${ct.id}`,
    }));
  },

  /**
   * Lấy chi tiết category type theo id
   * GET /categoryType/:id
   */
  async getById(id) {
    try {
      const res = await axios.get(`${API}categoryType/${id}`);
      return res.data; // giữ nguyên
    } catch (err) {
      console.error("Lỗi khi lấy chi tiết categoryType:", err.response?.data || err.message);
      throw err.response?.data || err;
    }
  },

  /**
   * Lấy danh sách category type theo category_main_id
   * GET /categoryType/main/:category_main_id
   */
  async getByMainId(mainId) {
    try {
      const res = await axios.get(`${API}categoryType/main/${mainId}`);
      return res.data; // giữ nguyên
    } catch (err) {
      console.error("Lỗi khi lấy categoryType theo main:", err.response?.data || err.message);
      throw err.response?.data || err;
    }
  },

  /**
   * Tạo category type mới (admin, super-admin)
   * POST /categoryType
   */
  async create(data) {
    const auth = AuthService.getAuth();
    if (!auth?.accessToken) throw new Error("Chưa đăng nhập");

    try {
      const res = await axios.post(`${API}categoryType`, data, {
        headers: { Authorization: `Bearer ${auth.accessToken}` },
      });
      return res.data;
    } catch (err) {
      console.error("Lỗi khi tạo categoryType:", err.response?.data || err.message);
      throw err.response?.data || err;
    }
  },

  /**
   * Cập nhật category type
   * PUT /categoryType/:id
   */
  async update(id, data) {
    const auth = AuthService.getAuth();
    if (!auth?.accessToken) throw new Error("Chưa đăng nhập");

    try {
      const res = await axios.put(`${API}categoryType/${id}`, data, {
        headers: { Authorization: `Bearer ${auth.accessToken}` },
      });
      return res.data;
    } catch (err) {
      console.error("Lỗi khi cập nhật categoryType:", err.response?.data || err.message);
      throw err.response?.data || err;
    }
  },

  /**
   * Xóa category type
   * DELETE /categoryType/:id
   */
  async delete(id) {
    const auth = AuthService.getAuth();
    if (!auth?.accessToken) throw new Error("Chưa đăng nhập");

    try {
      const res = await axios.delete(`${API}categoryType/${id}`, {
        headers: { Authorization: `Bearer ${auth.accessToken}` },
      });
      return res.data;
    } catch (err) {
      console.error("Lỗi khi xóa categoryType:", err.response?.data || err.message);
      throw err.response?.data || err;
    }
  },
};

export default CategoryTypeService;
