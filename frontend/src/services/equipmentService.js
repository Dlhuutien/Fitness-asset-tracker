import axios from "axios";
import { API } from "@/config/url";
import AuthService from "./AuthService";

const EquipmentService = {
  /**
   * Lấy danh sách tất cả equipment
   * GET /equipment
   */
  async getAll() {
    try {
      const res = await axios.get(`${API}equipment`);
      return res.data;
    } catch (err) {
      console.error(
        "Lỗi khi lấy danh sách equipment:",
        err.response?.data || err.message
      );
      throw err.response?.data || err;
    }
  },

  /**
   * Lấy chi tiết equipment theo id
   * GET /equipment/:id
   */
  async getById(id) {
    try {
      const res = await axios.get(`${API}equipment/${id}`);
      return res.data;
    } catch (err) {
      console.error(
        "Lỗi khi lấy chi tiết equipment:",
        err.response?.data || err.message
      );
      throw err.response?.data || err;
    }
  },

  /**
   * Tạo equipment mới (chỉ admin, super-admin)
   * POST /equipment
   */
  async create(data) {
    const auth = AuthService.getAuth();
    if (!auth?.accessToken) throw new Error("Chưa đăng nhập");

    // Nếu có ảnh file => gửi bằng FormData
    const isFile = data.image instanceof File;
    let payload = data;
    let headers = {
      Authorization: `Bearer ${auth.accessToken}`,
    };

    if (isFile) {
      const formData = new FormData();
      formData.append("name", String(data.name || ""));
      formData.append("vendor_id", String(data.vendor_id || ""));
      formData.append("category_type_id", String(data.category_type_id || ""));
      formData.append("description", String(data.description || ""));
      formData.append(
        "warranty_duration",
        String(data.warranty_duration || "2")
      );

      if (data.image instanceof File) {
        formData.append("image", data.image);
      }

      //  Gửi attributes dạng JSON string
      if (Array.isArray(data.attributes) && data.attributes.length > 0) {
        formData.append("attributes", JSON.stringify(data.attributes));
      }

      payload = formData;
      headers["Content-Type"] = "multipart/form-data";
    }

    const res = await axios.post(`${API}equipment`, payload, { headers });
    return res.data;
  },

  /**
   * Cập nhật equipment (chỉ admin, super-admin)
   * PUT /equipment/:id
   */
  async update(id, data) {
    const auth = AuthService.getAuth();
    if (!auth?.accessToken) throw new Error("Chưa đăng nhập");

    try {
      const res = await axios.put(`${API}equipment/${id}`, data, {
        headers: { Authorization: `Bearer ${auth.accessToken}` },
      });
      return res.data;
    } catch (err) {
      console.error(
        "Lỗi khi cập nhật equipment:",
        err.response?.data || err.message
      );
      throw err.response?.data || err;
    }
  },

  /**
   * Xóa equipment (chỉ admin, super-admin)
   * DELETE /equipment/:id
   */
  async delete(id) {
    const auth = AuthService.getAuth();
    if (!auth?.accessToken) throw new Error("Chưa đăng nhập");

    try {
      const res = await axios.delete(`${API}equipment/${id}`, {
        headers: { Authorization: `Bearer ${auth.accessToken}` },
      });
      return res.data;
    } catch (err) {
      console.error(
        "Lỗi khi xóa equipment:",
        err.response?.data || err.message
      );
      throw err.response?.data || err;
    }
  },
};

export default EquipmentService;
