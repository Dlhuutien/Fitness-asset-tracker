import useSWR, { useSWRConfig } from "swr";
import axios from "@/config/axiosConfig";
import { useEffect, useRef } from "react";
import { API } from "@/config/url";

const KEY_UNIT = `${API}equipmentUnit`;
const KEY_CAT = `${API}categoryMain`;

/**
 * Fetcher sử dụng axios interceptor (tự động gắn token, refresh, retry)
 */
const fetcher = async (url) => {
  const res = await axios.get(url);
  return res.data;
};

export function useEquipmentData() {
  const { mutate } = useSWRConfig();

  // --- Equipment Units ---
  const {
    data: eqUnits,
    error: eqErr,
    isLoading: unitLoading,
  } = useSWR(KEY_UNIT, fetcher, {
    revalidateOnFocus: true,
    dedupingInterval: 300000, // 5 phút
    refreshInterval: 0,
  });

  // --- Category Main ---
  const {
    data: cats,
    error: catErr,
    isLoading: catLoading,
  } = useSWR(KEY_CAT, fetcher, {
    revalidateOnFocus: true,
    dedupingInterval: 300000,
  });

  const refreshEquipmentUnits = () => mutate(KEY_UNIT);
  const refreshCategories = () => mutate(KEY_CAT);

  // --- Phát sự kiện khi có thiết bị mới ---
  const prevSignatureRef = useRef("");

  useEffect(() => {
    if (!Array.isArray(eqUnits)) return;

    // Lọc record có status NEW
    const newUnits = eqUnits.filter(
      (u) =>
        (u.status && String(u.status).toUpperCase() === "NEW") ||
        (u.badge && String(u.badge).toUpperCase() === "NEW")
    );

    console.log("👀 SWR equipmentUnit fetched:", eqUnits.length, "items");
    if (newUnits.length === 0) return;

    const ids = newUnits
      .map((u) => u.equipment_id || u.equipmentCode || u.id)
      .filter(Boolean);

    const signature = ids.sort().join(",");
    if (signature !== prevSignatureRef.current) {
      prevSignatureRef.current = signature;
      console.log("📦 fitx-units-updated fired:", ids);
      setTimeout(() => {
        // ✅ delay nhỏ để ImportPage kịp lắng nghe
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