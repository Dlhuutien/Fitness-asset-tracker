import { create } from "zustand";
import axios from "@/config/axiosConfig";
import { API } from "@/config/url";

/**
 * 🧱 Store: Equipment module
 * Lưu dữ liệu nhóm thiết bị (categoryMain) + thiết bị (equipment)
 * Có thể mở rộng thêm categoryType, vendor... sau này
 */
const useEquipmentStore = create((set, get) => ({
  catMains: null,    // CategoryMain - nhóm thiết bị
  equipments: null,  // Equipment - thiết bị cha
  loading: false,

  preload: async () => {
    if (get().loading) return;
    set({ loading: true });
    try {
      const [mainRes, eqRes] = await Promise.all([
        axios.get(`${API}categoryMain`),
        axios.get(`${API}equipment`),
      ]);

      set({
        catMains: mainRes.data,
        equipments: eqRes.data,
        loading: false,
      });
      console.log("✅ Preloaded CategoryMain + Equipment via Zustand");
    } catch (err) {
      console.error("❌ Preload equipment data failed:", err);
      set({ loading: false });
    }
  },

  refresh: async () => {
    await get().preload();
  },
}));

export default useEquipmentStore;
