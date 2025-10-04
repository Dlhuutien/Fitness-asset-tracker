import useSWR, { mutate } from "swr";
import axios from "axios";
import { API } from "@/config/url";

/**
 * Fetcher mặc định
 */
const fetcher = (url) => axios.get(url).then((res) => res.data);

/**
 * Hook: useEquipmentGroupData
 * Lấy dữ liệu CategoryMain và Equipment, có cache + refresh linh hoạt
 */
export function useEquipmentGroupData() {
  // ⚡ Fetch Category Main (nhóm thiết bị)
  const {
    data: groups,
    error: groupErr,
    isLoading: groupLoading,
  } = useSWR(`${API}categoryMain`, fetcher, {
    revalidateOnFocus: true, // tự fetch lại khi quay lại tab
    dedupingInterval: 300000, // cache 5 phút
  });

  // ⚡ Fetch Equipment
  const {
    data: equipments,
    error: eqErr,
    isLoading: eqLoading,
  } = useSWR(`${API}equipment`, fetcher, {
    revalidateOnFocus: true,
    dedupingInterval: 300000,
  });

  /**
   * Hàm refresh thủ công (nếu cần revalidate ngay sau khi update)
   * dùng trong màn hình khác: mutate(`${API}equipment`) hoặc mutate(`${API}categoryMain`)
   */
  const refreshGroups = () => mutate(`${API}categoryMain`);
  const refreshEquipments = () => mutate(`${API}equipment`);

  return {
    // Dữ liệu
    groups,
    groupErr,
    groupLoading,
    equipments,
    eqErr,
    eqLoading,
    // Hàm tiện ích
    refreshGroups,
    refreshEquipments,
  };
}
