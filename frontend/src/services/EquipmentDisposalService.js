import axios from "@/config/axiosConfig";
import { API } from "@/config/url";
import { mutate } from "swr";

const KEY_UNIT = `${API}equipmentUnit`;

const EquipmentDisposalService = {
  /** ♻️ Tạo đợt thanh lý */
  async create(data) {
    try {
      const res = await axios.post(`${API}disposal`, data);
      mutate(KEY_UNIT);
      return res.data;
    } catch (err) {
      console.error("❌ Lỗi tạo đợt thanh lý:", err.response?.data || err);
      throw err.response?.data || err;
    }
  },

  /** 📋 Lấy danh sách đợt thanh lý */
  async getAll() {
    try {
      const res = await axios.get(`${API}disposal`);
      return res.data;
    } catch (err) {
      console.error("❌ Lỗi lấy danh sách thanh lý:", err.response?.data || err);
      throw err.response?.data || err;
    }
  },
};

export default EquipmentDisposalService;
