import axios from "axios";
import { API } from "@/config/url";
import AuthService from "./AuthService";

const NotificationService = {
  async getAll() {
    const auth = AuthService.getAuth();
    if (!auth?.accessToken) throw new Error("⚠️ Chưa đăng nhập!");
    try {
      const res = await axios.get(`${API}notification`, {
        headers: { Authorization: `Bearer ${auth.accessToken}` },
      });
      return res.data;
    } catch (err) {
      console.error("❌ Lỗi khi lấy danh sách thông báo:", err.response?.data || err.message);
      throw err.response?.data || err;
    }
  },
};

export default NotificationService;
