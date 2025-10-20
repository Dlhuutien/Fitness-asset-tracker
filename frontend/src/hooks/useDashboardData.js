import useSWR, { mutate } from "swr";
import axios from "@/config/axiosConfig";
import { API } from "@/config/url";

/**
 * 🧠 Fetcher mặc định dùng axios interceptor
 */
const fetcher = async (url) => {
  const res = await axios.get(url);
  return res.data;
};

/**
 * 📊 Hook: useDashboardData
 * Lấy dữ liệu thống kê tổng hợp + biểu đồ xu hướng + cấu trúc thiết bị
 */
export function useDashboardData({ type = "month", year, month, quarter, week, branch_id } = {}) {
  // 🔹 Chuẩn hoá query params
  const params = new URLSearchParams();
  if (type) params.append("type", type);
  if (year) params.append("year", year);
  if (month) params.append("month", month);
  if (quarter) params.append("quarter", quarter);
  if (week) params.append("week", week);
  if (branch_id) params.append("branch_id", branch_id);

  const statUrl = `${API}dashboard/statistics?${params.toString()}`;
  const trendUrl = `${API}dashboard/statistics/trend?${params.toString()}`;
  const hierarchyUrl = `${API}dashboard/equipment-hierarchy${branch_id ? `?branch_id=${branch_id}` : ""}`;

  // --- Tổng hợp thống kê (summary)
  const {
    data: statistics,
    error: statErr,
    isLoading: statLoading,
  } = useSWR(statUrl, fetcher, {
    revalidateOnFocus: false,
    dedupingInterval: 300000, // cache 5 phút
  });

  // --- Biểu đồ xu hướng
  const {
    data: trend,
    error: trendErr,
    isLoading: trendLoading,
  } = useSWR(trendUrl, fetcher, {
    revalidateOnFocus: false,
    dedupingInterval: 300000,
  });

  // --- Cấu trúc thiết bị nhóm → loại → dòng
  const {
    data: hierarchy,
    error: hierarchyErr,
    isLoading: hierarchyLoading,
  } = useSWR(hierarchyUrl, fetcher, {
    revalidateOnFocus: false,
    dedupingInterval: 600000,
  });

  // --- Refresh thủ công ---
  const refreshDashboard = () => mutate(statUrl);
  const refreshTrend = () => mutate(trendUrl);
  const refreshHierarchy = () => mutate(hierarchyUrl);

  return {
    // 📦 Dữ liệu
    statistics,
    trend,
    hierarchy,
    // ⚠️ Lỗi
    statErr,
    trendErr,
    hierarchyErr,
    // ⏳ Loading
    statLoading,
    trendLoading,
    hierarchyLoading,
    // ⚡ Refresh
    refreshDashboard,
    refreshTrend,
    refreshHierarchy,
  };
}
