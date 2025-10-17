import axios from "@/config/axiosConfig";
import { API } from "@/config/url";

const InvoiceService = {
  /**
   * Tạo invoice mới
   * POST /invoice
   * data = { items: [{ equipment_id, branch_id, quantity, cost }] }
   */
async create(data, signal) {
  try {
    console.log("📡 Gửi request tạo invoice với signal:", signal);
    const res = await axios.post(`${API}invoice`, data, { signal });
    return res.data;
  } catch (err) {
    console.log("❌ Lỗi khi tạo invoice:", err);

    // ✅ Cách kiểm tra hủy đúng chuẩn Axios 1.x
    if (err.name === "CanceledError" || err.code === "ERR_CANCELED") {
      console.warn("⚠️ Request tạo invoice đã bị hủy!");
      throw new Error("RequestCanceled");
    }

    console.error("❌ Lỗi khi tạo invoice:", err.response?.data || err.message);
    throw err.response?.data || err;
  }
},


  /**
   * Lấy danh sách invoices
   * GET /invoice
   */
  async getAll() {
    try {
      const res = await axios.get(`${API}invoice`);
      return res.data;
    } catch (err) {
      console.error("❌ Lỗi khi getAll invoices:", err.response?.data || err.message);
      throw err.response?.data || err;
    }
  },

  /**
   * Lấy chi tiết invoice theo id
   * GET /invoice/:id
   */
  async getById(id) {
    try {
      const res = await axios.get(`${API}invoice/${id}`);
      return res.data;
    } catch (err) {
      console.error("❌ Lỗi khi get invoice by id:", err.response?.data || err.message);
      throw err.response?.data || err;
    }
  },

  /**
   * Lấy invoice kèm details
   * GET /invoice/:id/details
   */
  async getDetails(id) {
    try {
      const res = await axios.get(`${API}invoice/${id}/details`);
      return res.data;
    } catch (err) {
      console.error("❌ Lỗi khi get invoice details:", err.response?.data || err.message);
      throw err.response?.data || err;
    }
  },

  /**
   * Lấy toàn bộ chi tiết của mọi invoice
   * GET /invoice/details
   */
  async getAllDetails() {
    try {
      const res = await axios.get(`${API}invoice/details`);
      return res.data;
    } catch (err) {
      console.error("❌ Lỗi khi get all invoice details:", err.response?.data || err.message);
      throw err.response?.data || err;
    }
  },
};

export default InvoiceService;
