import useSWR, { useSWRConfig } from "swr";
import axios from "axios";
import { useEffect } from "react";
import { API } from "@/config/url";
import { useEquipmentStore } from "@/store/equipmentUnitStore";

const fetcher = (url) => axios.get(url).then((res) => res.data);

export function useEquipmentData() {
  const { mutate } = useSWRConfig();
  const { setUnits } = useEquipmentStore();

  // 🧭 SWR fetch
  const {
    data: eqUnits,
    error: eqErr,
    isLoading: unitLoading,
  } = useSWR(`${API}equipmentUnit`, fetcher, {
    revalidateOnFocus: true, // tự refetch khi tab active lại
    dedupingInterval: 300000, // cache 5 phút
  });

  // 🧩 Đồng bộ dữ liệu SWR → Zustand
  useEffect(() => {
    if (eqUnits) setUnits(eqUnits);
  }, [eqUnits, setUnits]);

  // ⚡ Hàm refresh thủ công
  const refreshEquipmentUnits = async () => {
    await mutate(`${API}equipmentUnit`);
  };

  return { eqUnits, eqErr, unitLoading, refreshEquipmentUnits };
}
