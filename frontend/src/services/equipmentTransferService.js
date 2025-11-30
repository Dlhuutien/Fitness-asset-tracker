import axios from "@/config/axiosConfig";
import { API } from "@/config/url";
import { mutate } from "swr";

const KEY_UNIT = `${API}equipmentUnit`;

const EquipmentTransferService = {
  /** Tạo yêu cầu chuyển thiết bị */
  async create(data) {
    try {
      const res = await axios.post(`${API}equipmentTransfer`, data);
      mutate(KEY_UNIT);
      return res.data;
    } catch (err) {
      console.error(
        "Lỗi tạo yêu cầu chuyển thiết bị:",
        err.response?.data || err
      );
      throw err.response?.data || err;
    }
  },

  /** Lấy toàn bộ yêu cầu chuyển thiết bị */
  async getAll() {
    try {
      const res = await axios.get(`${API}equipmentTransfer`);
      return res.data;
    } catch (err) {
      console.error(
        "Lỗi lấy danh sách chuyển thiết bị:",
        err.response?.data || err
      );
      throw err.response?.data || err;
    }
  },

  /** Lấy chi tiết 1 yêu cầu */
  async getById(id) {
    try {
      const res = await axios.get(`${API}equipmentTransfer/${id}`);
      return res.data;
    } catch (err) {
      console.error("Lỗi lấy chi tiết yêu cầu:", err.response?.data || err);
      throw err.response?.data || err;
    }
  },

  /** Hoàn tất yêu cầu chuyển */
  async complete(id, move_receive_date) {
    try {
      const res = await axios.put(`${API}equipmentTransfer/${id}/complete`, {
        move_receive_date,
      });
      mutate(KEY_UNIT);
      return res.data;
    } catch (err) {
      console.error(
        "Lỗi hoàn tất chuyển thiết bị:",
        err.response?.data || err
      );
      throw err.response?.data || err;
    }
  },

  /** Hủy yêu cầu */
  async cancel(id, description) {
    try {
      const res = await axios.put(`${API}equipmentTransfer/${id}/cancel`, {
        description,
      });
      mutate(KEY_UNIT);
      return res.data;
    } catch (err) {
      console.error("Lỗi hủy chuyển thiết bị:", err.response?.data || err);
      throw err.response?.data || err;
    }
  },

    /** Xác nhận hủy yêu cầu chuyển (chi nhánh gửi xác nhận) */
  async confirmCancel(id) {
    try {
      const res = await axios.put(`${API}equipmentTransfer/${id}/cancel/confirm`);
      mutate(KEY_UNIT);
      return res.data;
    } catch (err) {
      console.error("Lỗi xác nhận hủy chuyển thiết bị:", err.response?.data || err);
      throw err.response?.data || err;
    }
  },


  /** Lấy các phiếu chuyển đã hoàn tất */
  async getByStatus(status) {
    try {
      const res = await axios.get(`${API}equipmentTransfer/status/${status}`);
      return res.data;
    } catch (err) {
      console.error(
        "Lỗi lấy danh sách theo trạng thái:",
        err.response?.data || err
      );
      throw err.response?.data || err;
    }
  },
};

export default EquipmentTransferService;
