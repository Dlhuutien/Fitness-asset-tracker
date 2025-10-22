import useSWR, { mutate } from "swr";
import axios from "@/config/axiosConfig";
import { API } from "@/config/url";
import useEquipmentStore from "@/store/equipmentStore";

const fetcher = (url) => axios.get(url).then((res) => res.data);

/**
 * ⚙️ Hook: useEquipmentData
 * Lấy dữ liệu CategoryMain (nhóm thiết bị) & Equipment
 * → fallback từ Zustand store để hiển thị nhanh
 */
export function useEquipmentData() {
  const { catMains: storeGroups, equipments: storeEquipments } = useEquipmentStore();

  const {
    data: groups,
    error: groupErr,
    isLoading: groupLoading,
  } = useSWR(`${API}categoryMain`, fetcher, {
    fallbackData: storeGroups,
    revalidateOnFocus: true,
    dedupingInterval: 300000,
  });

  const {
    data: equipments,
    error: eqErr,
    isLoading: eqLoading,
  } = useSWR(`${API}equipment`, fetcher, {
    fallbackData: storeEquipments,
    revalidateOnMount: false,
    revalidateOnFocus: true,
    dedupingInterval: 300000,
  });

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
