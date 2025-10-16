import useSWR, { mutate } from "swr";
import axios from "@/config/axiosConfig";
import { API } from "@/config/url";

/**
 * 🧠 Fetcher mặc định
 * Dùng axios interceptor → tự gắn token, refresh, retry khi 401
 */
const fetcher = async (url) => {
  const res = await axios.get(url);
  return res.data;
};

/**
 * ⚙️ Hook: useEquipmentGroupData
 * Lấy dữ liệu CategoryMain (nhóm thiết bị) & Equipment có cache + refresh linh hoạt
 */
export function useEquipmentData() {
  // --- Category Main ---
  const {
    data: groups,
    error: groupErr,
    isLoading: groupLoading,
  } = useSWR(`${API}categoryMain`, fetcher, {
    revalidateOnFocus: true, // tự fetch lại khi quay lại tab
    dedupingInterval: 300000, // cache 5 phút
  });

  // --- Equipment ---
  const {
    data: equipments,
    error: eqErr,
    isLoading: eqLoading,
  } = useSWR(`${API}equipment`, fetcher, {
    revalidateOnFocus: true,
    dedupingInterval: 300000,
  });

  // --- Refresh thủ công ---
  const refreshGroups = () => mutate(`${API}categoryMain`);
  const refreshEquipments = () => mutate(`${API}equipment`);

  return {
    // 📦 Dữ liệu
    groups,
    groupErr,
    groupLoading,
    equipments,
    eqErr,
    eqLoading,
    // ⚡ Tiện ích
    refreshGroups,
    refreshEquipments,
  };
}
