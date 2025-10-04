import axios from "axios";
import { API } from "@/config/url";
import AuthService from "./AuthService";

const CategoryMainService = {
  /**
   * Lấy tất cả category main
   */
  async getAll() {
    try {
      const res = await axios.get(`${API}categoryMain`);
      return res.data;
    } catch (err) {
      console.error(
        "Lỗi khi lấy category main:",
        err.response?.data || err.message
      );
      throw err.response?.data || err;
    }
  },

  /**
   * Lấy chi tiết category main theo id
   */
  async getById(id) {
    try {
      const res = await axios.get(`${API}categoryMain/${id}`);
      return res.data;
    } catch (err) {
      console.error(
        "Lỗi khi lấy chi tiết category main:",
        err.response?.data || err.message
      );
      throw err.response?.data || err;
    }
  },

  /**
   * Tạo category main (admin, super-admin)
   */
  async create(data) {
    const auth = AuthService.getAuth();
    if (!auth?.accessToken) throw new Error("Chưa đăng nhập");

    try {
      const formData = new FormData();
      formData.append("id", data.id);
      formData.append("name", data.name);
      formData.append("description", data.description);
      if (data.image instanceof File) formData.append("image", data.image);

      const res = await axios.post(`${API}categoryMain`, formData, {
        headers: {
          Authorization: `Bearer ${auth.accessToken}`,
          "Content-Type": "multipart/form-data",
        },
      });
      return res.data;
    } catch (err) {
      console.error(
        "Lỗi khi tạo category main:",
        err.response?.data || err.message
      );
      throw err.response?.data || err;
    }
  },

  /**
   * Cập nhật category main (admin, super-admin)
   */
  async update(id, data) {
    const auth = AuthService.getAuth();
    if (!auth?.accessToken) throw new Error("Chưa đăng nhập");

    try {
      const formData = new FormData();
      formData.append("name", data.name);
      formData.append("description", data.description);

      // Nếu người dùng không chọn ảnh mới, gửi lại URL ảnh cũ để backend giữ nguyên
      if (data.image instanceof File) {
        formData.append("image", data.image);
      }

      const res = await axios.put(`${API}categoryMain/${id}`, formData, {
        headers: {
          Authorization: `Bearer ${auth.accessToken}`,
          "Content-Type": "multipart/form-data",
        },
      });
      return res.data;
    } catch (err) {
      console.error(
        "Lỗi khi cập nhật category main:",
        err.response?.data || err.message
      );
      throw err.response?.data || err;
    }
  },

  /**
   * Xóa category main (admin, super-admin)
   */
  async delete(id) {
    const auth = AuthService.getAuth();
    if (!auth?.accessToken) throw new Error("Chưa đăng nhập");

    try {
      const res = await axios.delete(`${API}categoryMain/${id}`, {
        headers: { Authorization: `Bearer ${auth.accessToken}` },
      });
      return res.data;
    } catch (err) {
      console.error(
        "Lỗi khi xóa category main:",
        err.response?.data || err.message
      );
      throw err.response?.data || err;
    }
  },
};

export default CategoryMainService;
