import { create } from "zustand";

export const useEquipmentStore = create((set) => ({
  units: [],
  setUnits: (units) => set({ units }),
}));
