import axios from "@/config/axiosConfig";
import { API } from "@/config/url";

const NotificationService = {
  /**
   * 🔔 Lấy danh sách thông báo của user hiện tại
   * GET /notification
   */
  async getAll() {
    try {
      const res = await axios.get(`${API}notification`);
      return res.data;
    } catch (err) {
      console.error("❌ Lỗi khi lấy danh sách thông báo:", err.response?.data || err.message);
      throw err.response?.data || err;
    }
  },
};

export default NotificationService;
