import useSWR, { useSWRConfig } from "swr";
import axios from "@/config/axiosConfig";
import { useEffect, useRef } from "react";
import { API } from "@/config/url";
import useAuthRole from "@/hooks/useAuthRole"; // 🧠 Thêm hook phân quyền

const KEY_UNIT = `${API}equipmentUnit`;
const KEY_CAT = `${API}categoryMain`;
const KEY_HISTORY = `${API}equipmentUnit/transfer-history`; // 🆕 API lấy thiết bị từng thuộc chi nhánh

/**
 * Fetcher sử dụng axios interceptor (tự động gắn token, refresh, retry)
 */
const fetcher = async (url) => {
  const res = await axios.get(url);
  return res.data;
};

export function useEquipmentData() {
  const { mutate } = useSWRConfig();
  const { isSuperAdmin } = useAuthRole(); // 🧠 Lấy quyền user hiện tại

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

  // 🆕 --- Equipment Units đã chuyển đi (chỉ dành cho admin, operator, technician) ---
  const {
    data: historyUnits,
    error: historyErr,
    isLoading: historyLoading,
  } = useSWR(isSuperAdmin ? null : KEY_HISTORY, fetcher, {
    revalidateOnFocus: false,
    dedupingInterval: 300000,
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

  // --- 🆕 Refresh tất cả ---
  const refreshEquipmentUnits = () => {
    mutate(KEY_UNIT);
    if (!isSuperAdmin) mutate(KEY_HISTORY); // 🆕 refresh luôn danh sách transfer-history nếu có
  };
  const refreshCategories = () => mutate(KEY_CAT);

  // --- 🆕 Merge 2 danh sách ---
  const mergedUnits =
    isSuperAdmin || !Array.isArray(historyUnits)
      ? eqUnits || []
      : [
          ...(eqUnits || []),
          ...(historyUnits || []).map((u) => ({
            ...u,
            __transferred: true, // flag đánh dấu thiết bị đã rời chi nhánh
          })),
        ];

  // --- Phát sự kiện khi có thiết bị mới ---
  const prevSignatureRef = useRef("");

  useEffect(() => {
    if (!Array.isArray(mergedUnits)) return; // 🆕 đổi eqUnits -> mergedUnits để lắng nghe cả 2 danh sách

    // Lọc record có status NEW
    const newUnits = mergedUnits.filter(
      (u) =>
        (u.status && String(u.status).toUpperCase() === "NEW") ||
        (u.badge && String(u.badge).toUpperCase() === "NEW")
    );

    console.log("👀 SWR equipmentUnit fetched:", mergedUnits.length, "items");
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
  }, [mergedUnits]);

  return {
    eqUnits: mergedUnits, // 🆕 thay vì eqUnits gốc
    eqErr: eqErr || historyErr, // 🆕 gộp lỗi
    unitLoading: unitLoading || historyLoading, // 🆕 gộp trạng thái loading
    cats,
    catErr,
    catLoading,
    refreshEquipmentUnits,
    refreshCategories,
  };
}
