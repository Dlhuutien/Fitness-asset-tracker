import useSWR, { useSWRConfig } from "swr";
import axios from "@/config/axiosConfig";
import { useEffect, useRef } from "react";
import { API } from "@/config/url";
import useEquipmentUnitStore from "@/store/equipmentUnitStore";

const KEY_UNIT = `${API}equipmentUnit`;
const KEY_CAT = `${API}categoryMain`;

const fetcher = async (url) => (await axios.get(url)).data;

export function useEquipmentData() {
  const { mutate } = useSWRConfig();
  const { eqUnits: storeUnits, cats: storeCats } = useEquipmentUnitStore();

  // 🧠 Sử dụng dữ liệu từ Zustand làm fallback cho SWR
  const {
    data: eqUnits,
    error: eqErr,
    isLoading: unitLoading,
  } = useSWR(KEY_UNIT, fetcher, {
    fallbackData: storeUnits,
    revalidateOnMount: false,
    revalidateOnFocus: true,
    dedupingInterval: 300000,
  });

  const {
    data: cats,
    error: catErr,
    isLoading: catLoading,
  } = useSWR(KEY_CAT, fetcher, {
    fallbackData: storeCats,
    revalidateOnFocus: true,
    dedupingInterval: 300000,
  });

  const refreshEquipmentUnits = () => mutate(KEY_UNIT);
  const refreshCategories = () => mutate(KEY_CAT);

  // --- Lắng nghe thiết bị mới ---
  const prevSignatureRef = useRef("");
  useEffect(() => {
    if (!Array.isArray(eqUnits)) return;
    const newUnits = eqUnits.filter(
      (u) =>
        (u.status && String(u.status).toUpperCase() === "NEW") ||
        (u.badge && String(u.badge).toUpperCase() === "NEW")
    );

    const ids = newUnits.map((u) => u.id || u.equipmentCode).filter(Boolean);
    const signature = ids.sort().join(",");
    if (signature !== prevSignatureRef.current) {
      prevSignatureRef.current = signature;
      setTimeout(() => {
        window.dispatchEvent(
          new CustomEvent("fitx-units-updated", { detail: { newIds: ids } })
        );
      }, 300);
    }
  }, [eqUnits]);

  return {
    eqUnits,
    eqErr,
    unitLoading,
    cats,
    catErr,
    catLoading,
    refreshEquipmentUnits,
    refreshCategories,
  };
}
