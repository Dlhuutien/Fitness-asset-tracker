import useSWR, { useSWRConfig } from "swr";
import axios from "axios";
import { API } from "@/config/url";

// Hàm fetcher chung cho SWR
const fetcher = (url) => axios.get(url).then((res) => res.data);

export function useEquipmentData() {
  // 🧠 Lấy mutate toàn cục từ SWR (cho phép refresh thủ công)
  const { mutate } = useSWRConfig();

  // ⚙️ Lấy dữ liệu danh sách unit thiết bị
  const {
    data: eqUnits,
    error: eqErr,
    isLoading: unitLoading,
  } = useSWR(`${API}equipmentUnit`, fetcher, {
    revalidateOnFocus: true, // Tự refetch khi quay lại tab
    dedupingInterval: 300000, // Cache 5 phút
  });

  // ⚙️ Lấy dữ liệu nhóm thiết bị (main category)
  const {
    data: cats,
    error: catErr,
    isLoading: catLoading,
  } = useSWR(`${API}categoryMain`, fetcher, {
    revalidateOnFocus: true,
    dedupingInterval: 300000,
  });

  // ⚡ Hàm refresh thủ công (gọi ở nơi khác khi cần)
  const refreshEquipmentUnits = () => mutate(`${API}equipmentUnit`);
  const refreshCategories = () => mutate(`${API}categoryMain`);

  return {
    eqUnits,
    eqErr,
    unitLoading,
    cats,
    catErr,
    catLoading,
    mutate, // mutate toàn cục
    refreshEquipmentUnits, // mutate riêng cho equipmentUnit
    refreshCategories, // mutate riêng cho categoryMain
  };
}

