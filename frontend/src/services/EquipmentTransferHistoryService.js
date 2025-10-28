import axios from "@/config/axiosConfig";
import { API } from "@/config/url";

const EquipmentTransferHistoryService = {
  /** 🔍 Lấy lịch sử điều chuyển của 1 thiết bị cụ thể */
  async getByUnitId(equipment_unit_id) {
    try {
      const res = await axios.get(
        `${API}equipment-transfer-history/${equipment_unit_id}`
      );
      return res.data;
    } catch (err) {
      console.error(
        "❌ Lỗi lấy lịch sử điều chuyển theo thiết bị:",
        err.response?.data || err
      );
      throw err.response?.data || err;
    }
  },
};

export default EquipmentTransferHistoryService;
