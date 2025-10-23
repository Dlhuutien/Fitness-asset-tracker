import axios from "@/config/axiosConfig";
import { API } from "@/config/url";

const TypeAttributeService = {
  // ✅ Thêm attribute vào type
  async addAttributeToType(typeId, attributeId) {
    try {
      const res = await axios.post(`${API}type-attribute/${typeId}`, {
        attribute_id: attributeId, // ✅ đúng key backend yêu cầu
      });
      return res.data;
    } catch (err) {
      console.error("❌ Lỗi khi thêm attribute vào type:", err);
      throw err;
    }
  },

  // ✅ Lấy danh sách attribute theo type
  async getAttributesByType(typeId) {
    try {
      const res = await axios.get(`${API}type-attribute/${typeId}`);
      return res.data;
    } catch (err) {
      console.error("❌ Lỗi khi lấy attributes của type:", err);
      throw err;
    }
  },

  // ✅ Xóa attribute khỏi type
  async removeAttributeFromType(typeId, attrId) {
    try {
      const res = await axios.delete(`${API}type-attribute/${typeId}/${attrId}`);
      return res.data;
    } catch (err) {
      console.error("❌ Lỗi khi xóa attribute khỏi type:", err);
      throw err;
    }
  },
};

export default TypeAttributeService;
