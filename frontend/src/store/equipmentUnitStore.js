import { create } from "zustand";
import axios from "@/config/axiosConfig";
import { API } from "@/config/url";

const useEquipmentStore = create((set, get) => ({
  eqUnits: null,
  cats: null,
  loading: false,

  preload: async () => {
    if (get().loading) return;
    set({ loading: true });
    try {
      const [unitRes, catRes] = await Promise.all([
        axios.get(`${API}equipmentUnit`),
        axios.get(`${API}categoryMain`),
      ]);
      set({
        eqUnits: unitRes.data,
        cats: catRes.data,
        loading: false,
      });
      console.log("✅ Preloaded data via Zustand");
    } catch (err) {
      console.error("❌ Preload failed:", err);
      set({ loading: false });
    }
  },
}));

export default useEquipmentStore;
