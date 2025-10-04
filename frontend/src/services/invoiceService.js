import axios from "axios";
import { API } from "@/config/url";
import AuthService from "./AuthService";

const InvoiceService = {
  /**
   * Tạo invoice mới
   * POST /invoice
   * data = { items: [{ equipment_id, branch_id, quantity, cost }] }
   */
  async create(data) {
    const auth = AuthService.getAuth();
    if (!auth?.accessToken) throw new Error("Chưa đăng nhập");

    try {
      const res = await axios.post(`${API}invoice`, data, {
        headers: { Authorization: `Bearer ${auth.accessToken}` },
      });
      return res.data;
    } catch (err) {
      console.error("Lỗi khi tạo invoice:", err.response?.data || err.message);
      throw err.response?.data || err;
    }
  },

  /** Lấy danh sách invoices */
  async getAll() {
    try {
      const res = await axios.get(`${API}invoice`);
      return res.data;
    } catch (err) {
      console.error("Lỗi khi getAll invoices:", err.response?.data || err.message);
      throw err.response?.data || err;
    }
  },

  /** Lấy chi tiết invoice theo id */
  async getById(id) {
    try {
      const res = await axios.get(`${API}invoice/${id}`);
      return res.data;
    } catch (err) {
      console.error("Lỗi khi get invoice by id:", err.response?.data || err.message);
      throw err.response?.data || err;
    }
  },

  /** Lấy invoice kèm details */
  async getDetails(id) {
    try {
      const res = await axios.get(`${API}invoice/${id}/details`);
      return res.data;
    } catch (err) {
      console.error("Lỗi khi get invoice details:", err.response?.data || err.message);
      throw err.response?.data || err;
    }
  },
};

export default InvoiceService;
