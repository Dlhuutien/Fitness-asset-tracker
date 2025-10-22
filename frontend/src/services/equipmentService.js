import axios from "@/config/axiosConfig";
import { API } from "@/config/url";

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
      console.error("❌ Lỗi khi lấy danh sách equipment:", err.response?.data || err.message);
      throw err.response?.data || err;
    }
  },

  /**
   * Lấy chi tiết equipment theo id
   * GET /equipment/:id
   */
  async getById(id) {
    try {
      const res = await axios.get(`${API}equipment/attribute/${id}`);
      return res.data;
    } catch (err) {
      console.error("❌ Lỗi khi lấy chi tiết equipment:", err.response?.data || err.message);
      throw err.response?.data || err;
    }
  },

  /**
   * Tạo equipment mới (chỉ admin, super-admin)
   * POST /equipment
   */
  async create(data) {
    try {
      // Nếu có ảnh file => gửi bằng FormData
      const isFile = data.image instanceof File;
      let payload = data;
      let headers = {};

      if (isFile) {
        const formData = new FormData();
        formData.append("name", String(data.name || ""));
        formData.append("vendor_id", String(data.vendor_id || ""));
        formData.append("category_type_id", String(data.category_type_id || ""));
        formData.append("description", String(data.description || ""));

        if (data.image instanceof File) {
          formData.append("image", data.image);
        }

        // Gửi attributes dạng JSON string
        if (Array.isArray(data.attributes) && data.attributes.length > 0) {
          formData.append("attributes", JSON.stringify(data.attributes));
        }

        payload = formData;
        headers["Content-Type"] = "multipart/form-data";
      }

      const res = await axios.post(`${API}equipment`, payload, { headers });
      return res.data;
    } catch (err) {
      console.error("❌ Lỗi khi tạo equipment:", err.response?.data || err.message);
      throw err.response?.data || err;
    }
  },

  /**
   * Cập nhật equipment (chỉ admin, super-admin)
   * PUT /equipment/:id
   */
  async update(id, data) {
    try {
      const formData = new FormData();

      formData.append("name", data.name);
      formData.append("description", data.description || "");
      formData.append("vendor_id", data.vendor_id || "");
      formData.append("category_type_id", data.category_type_id || "");

      // ⚙️ Nếu có file ảnh mới
      if (data.image instanceof File) {
        formData.append("image", data.image);
      } else if (typeof data.image === "string") {
        // giữ ảnh cũ
        formData.append("image", data.image);
      }

      // ⚙️ Attributes: gửi JSON string
      if (Array.isArray(data.attributes)) {
        formData.append("attributes", JSON.stringify(data.attributes));
      }

      const res = await axios.put(`${API}equipment/${id}`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      return res.data;
    } catch (err) {
      console.error("❌ Lỗi khi cập nhật equipment:", err.response?.data || err.message);
      throw err.response?.data || err;
    }
  },

  /**
   * Xóa equipment (chỉ admin, super-admin)
   * DELETE /equipment/:id
   */
  async delete(id) {
    try {
      const res = await axios.delete(`${API}equipment/${id}`);
      return res.data;
    } catch (err) {
      console.error("❌ Lỗi khi xóa equipment:", err.response?.data || err.message);
      throw err.response?.data || err;
    }
  },
};

export default EquipmentService;
