import axios from "@/config/axiosConfig";
import { API } from "@/config/url";

const EquipmentService = {
  // === Lấy toàn bộ thiết bị ===
  async getAll() {
    try {
      const res = await axios.get(`${API}equipment`);
      return res.data;
    } catch (err) {
      console.error("❌ Lỗi khi lấy danh sách equipment:", err.response?.data || err.message);
      throw err.response?.data || err;
    }
  },

  // === Lấy chi tiết theo ID (kèm attributes) ===
  async getById(id) {
    try {
      const res = await axios.get(`${API}equipment/attribute/${id}`);
      return res.data;
    } catch (err) {
      console.error("❌ Lỗi khi lấy chi tiết equipment:", err.response?.data || err.message);
      throw err.response?.data || err;
    }
  },

  // === Tạo mới thiết bị ===
  async create(data) {
    try {
      const isFile = data.image instanceof File;
      let payload = data;
      let headers = {};

      if (isFile) {
        const formData = new FormData();
        formData.append("name", data.name || "");
        formData.append("vendor_id", data.vendor_id || "");
        formData.append("category_type_id", data.category_type_id || "");
        formData.append("description", data.description || "");

        // 🖼️ Ảnh
        formData.append("image", data.image);

        // 🧩 Attributes
        if (Array.isArray(data.attributes) && data.attributes.length > 0)
          formData.append("attributes", JSON.stringify(data.attributes));

        // 🆕 Bảo trì định kỳ
        if (data.periodic_maintenance_date)
          formData.append("periodic_maintenance_date", data.periodic_maintenance_date);
        if (data.periodic_frequency_type)
          formData.append("periodic_frequency_type", data.periodic_frequency_type);
        if (data.periodic_frequency_interval)
          formData.append("periodic_frequency_interval", String(data.periodic_frequency_interval));

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

  // === Cập nhật thiết bị ===
  async update(id, data) {
    try {
      const isFile = data.image instanceof File;
      let payload;
      let headers = {};

      // ⚙️ Nếu có file ảnh thì dùng FormData
      if (isFile) {
        const formData = new FormData();

        formData.append("name", data.name || "");
        formData.append("description", data.description || "");
        formData.append("vendor_id", data.vendor_id || "");
        formData.append("category_type_id", data.category_type_id || "");

        formData.append("image", data.image);

        if (Array.isArray(data.attributes))
          formData.append("attributes", JSON.stringify(data.attributes));

        // 🆕 Các trường bảo trì định kỳ
        if (data.periodic_maintenance_date)
          formData.append("periodic_maintenance_date", data.periodic_maintenance_date);
        if (data.periodic_frequency_type)
          formData.append("periodic_frequency_type", data.periodic_frequency_type);
        if (data.periodic_frequency_interval)
          formData.append("periodic_frequency_interval", String(data.periodic_frequency_interval));

        payload = formData;
        headers["Content-Type"] = "multipart/form-data";
      } else {
        // Nếu không có ảnh mới => gửi JSON thuần
        payload = {
          name: data.name,
          description: data.description,
          vendor_id: data.vendor_id,
          category_type_id: data.category_type_id,
          attributes: data.attributes || [],
          periodic_maintenance_date: data.periodic_maintenance_date || null,
          periodic_frequency_type: data.periodic_frequency_type || null,
          periodic_frequency_interval: data.periodic_frequency_interval || null,
          image: typeof data.image === "string" ? data.image : undefined, // giữ nguyên ảnh cũ
        };
        headers["Content-Type"] = "application/json";
      }

      const res = await axios.put(`${API}equipment/${id}`, payload, { headers });
      return res.data;
    } catch (err) {
      console.error("❌ Lỗi khi cập nhật equipment:", err.response?.data || err.message);
      throw err.response?.data || err;
    }
  },

  // === Xóa thiết bị ===
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
