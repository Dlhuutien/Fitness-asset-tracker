import useSWR, { useSWRConfig } from "swr";
import axios from "axios";
import { useEffect, useRef } from "react";
import { API } from "@/config/url";
import AuthService from "@/services/AuthService";

const KEY_UNIT = `${API}equipmentUnit`;
const KEY_CAT = `${API}categoryMain`;

const fetcher = async (url) => {
  const auth = AuthService.getAuth();
  if (!auth?.accessToken) throw new Error("Chưa đăng nhập");
  const res = await axios.get(url, {
    headers: { Authorization: `Bearer ${auth.accessToken}` },
  });
  return res.data;
};

export function useEquipmentData() {
  const { mutate } = useSWRConfig();

  const {
    data: eqUnits,
    error: eqErr,
    isLoading: unitLoading,
  } = useSWR(KEY_UNIT, fetcher, {
    revalidateOnFocus: true,
    dedupingInterval: 300000,
    refreshInterval: 0,
  });

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

  const prevSignatureRef = useRef("");

useEffect(() => {
  if (!Array.isArray(eqUnits)) return;

  // Lọc các record có status NEW
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
    setTimeout(() => { // ✅ thêm delay nhỏ để ImportPage kịp lắng nghe
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
