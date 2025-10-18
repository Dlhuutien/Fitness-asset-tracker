import { motion } from "framer-motion";
import { ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/buttonn";
import { toast } from "sonner";
import NotificationService from "@/services/NotificationService";

// 🎨 Xác định màu theo loại thông báo
const getColorByType = (title, type) => {
  if (type === "invoice")
    return "border-purple-300 bg-purple-50 text-purple-800 dark:border-purple-800 dark:bg-purple-900/30 dark:text-purple-200";

  if (type === "maintenance") {
    if (title.includes("Tạo"))
      return "border-blue-300 bg-blue-50 text-blue-800 dark:border-blue-800 dark:bg-blue-900/30 dark:text-blue-200";
    if (title.includes("tiến hành"))
      return "border-amber-300 bg-amber-50 text-amber-800 dark:border-amber-800 dark:bg-amber-900/30 dark:text-amber-200";
    if (title.includes("Hoàn tất"))
      return "border-emerald-300 bg-emerald-50 text-emerald-800 dark:border-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-200";
  }

  if (type === "transfer" || title.includes("Vận chuyển thiết bị")) {
    if (title.includes("Hoàn tất"))
      return "border-cyan-400 bg-cyan-50 text-cyan-800 dark:border-cyan-800 dark:bg-cyan-900/30 dark:text-cyan-200";
    return "border-sky-400 bg-sky-50 text-sky-800 dark:border-sky-800 dark:bg-sky-900/30 dark:text-sky-200";
  }

  return "border-gray-200 bg-gray-50 text-gray-700 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300";
};

export default function NotificationScreen() {
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sortOrder, setSortOrder] = useState("desc");

  // Bộ lọc nâng cao
  const [filterType, setFilterType] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  useEffect(() => {
    (async () => {
      try {
        const res = await NotificationService.getAll();
        const sorted = [...(res || [])].sort(
          (a, b) => new Date(b.created_at) - new Date(a.created_at)
        );
        setNotifications(sorted);
      } catch (err) {
        console.error("❌ Lỗi khi tải thông báo:", err);
        toast.error("Không thể tải danh sách thông báo!");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  // 🎯 Áp dụng filter
  const filteredNotifications = notifications.filter((n) => {
    const title = n.title?.toLowerCase() || "";
    const created = new Date(n.created_at);

    // Loại
    if (filterType !== "all" && n.type !== filterType) return false;

    // Trạng thái con
    if (filterStatus !== "all") {
      if (filterStatus === "create" && !title.includes("tạo")) return false;
      if (filterStatus === "progress" && !title.includes("tiến hành"))
        return false;
      if (filterStatus === "done" && !title.includes("hoàn tất")) return false;
      if (filterStatus === "moving" && !title.includes("vận chuyển"))
        return false;
    }

    // Khoảng thời gian
    if (startDate && created < new Date(startDate)) return false;
    if (endDate && created > new Date(endDate + "T23:59:59")) return false;

    return true;
  });

  // Sắp xếp theo thời gian
  const sortedList = [...filteredNotifications].sort((a, b) =>
    sortOrder === "asc"
      ? new Date(a.created_at) - new Date(b.created_at)
      : new Date(b.created_at) - new Date(a.created_at)
  );

  // 🧭 Hàm điều hướng theo loại thông báo
  const handleNavigateByNotification = (n) => {
    const type = n.type?.toLowerCase() || "";
    const title = n.title?.toLowerCase() || "";

    if (type === "invoice") {
      // 🔗 Bắt chuỗi UUID (hóa đơn) trong message
      const match = n.message?.match(
        /\b[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\b/i
      );

      if (match && match[0]) {
        // Điều hướng đến đúng invoiceId lấy từ message
        navigate(`/app/invoice?invoiceId=${match[0]}`);
      } else if (n.ref_id) {
        // Nếu backend có ref_id thì dùng
        navigate(`/app/invoice?invoiceId=${n.ref_id}`);
      } else {
        // fallback an toàn
        navigate("/app/invoice");
      }
      return;
    }

    if (type === "maintenance") {
      if (title.includes("hoàn tất"))
        navigate("/app/maintenance?status=completed");
      else if (title.includes("tiến hành"))
        navigate("/app/maintenance?status=progress");
      else if (title.includes("tạo"))
        navigate("/app/maintenance?status=pending");
      else navigate("/app/maintenance");
      return;
    }

    if (type === "transfer" || title.includes("vận chuyển thiết bị")) {
      if (title.includes("hoàn tất"))
        navigate("/app/equipment/transfer?tab=completed");
      else navigate("/app/equipment/transfer");
      return;
    }

    // Mặc định: quay về dashboard
    navigate("/app");
  };

  if (loading)
    return (
      <div className="p-6 text-gray-500 dark:text-gray-300 animate-pulse">
        Đang tải danh sách thông báo...
      </div>
    );

  return (
    <motion.div
      className="p-6 space-y-6 font-jakarta transition-colors duration-300"
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <Button
          variant="outline"
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 border-gray-300 dark:border-gray-700 dark:hover:bg-gray-800"
        >
          <ArrowLeft size={16} />
          Quay lại
        </Button>
        <h1 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
          Thông báo hệ thống
        </h1>
      </div>
      {/* Bộ lọc */}
      <div className="flex flex-wrap items-center gap-3 bg-white dark:bg-gray-900 p-4 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm">
        {/* Loại thông báo */}
        <select
          value={filterType}
          onChange={(e) => {
            setFilterType(e.target.value);
            setFilterStatus("all");
          }}
          className="px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md bg-gray-50 dark:bg-gray-800 text-sm"
        >
          <option value="all">Tất cả loại</option>
          <option value="invoice">Hóa đơn</option>
          <option value="maintenance">Bảo trì</option>
          <option value="transfer">Vận chuyển</option>
        </select>

        {/* Trạng thái con */}
        {filterType !== "all" && (
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md bg-gray-50 dark:bg-gray-800 text-sm"
          >
            <option value="all">Tất cả trạng thái</option>
            {filterType === "maintenance" && (
              <>
                <option value="create">Tạo bảo trì</option>
                <option value="progress">Đang bảo trì</option>
                <option value="done">Hoàn tất bảo trì</option>
              </>
            )}
            {filterType === "transfer" && (
              <>
                <option value="moving">Vận chuyển thiết bị</option>
                <option value="done">Hoàn tất chuyển thiết bị</option>
              </>
            )}
          </select>
        )}

        {/* Ngày bắt đầu - kết thúc */}
        <div className="flex items-center gap-2">
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md bg-gray-50 dark:bg-gray-800 text-sm"
          />
          <span className="text-gray-500">→</span>
          <input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md bg-gray-50 dark:bg-gray-800 text-sm"
          />
        </div>

        {/* Nút sắp xếp */}
        <Button
          size="sm"
          variant="outline"
          onClick={() =>
            setSortOrder((prev) => (prev === "desc" ? "asc" : "desc"))
          }
          className={`ml-auto text-xs border-gray-300 dark:border-gray-700 dark:text-gray-200 transition-colors
    ${
      sortOrder === "desc"
        ? "bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800"
        : "bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 border-gray-300 dark:border-gray-600"
    }`}
        >
          {sortOrder === "desc" ? "⬇️ Mới nhất" : "⬆️ Cũ nhất"}
        </Button>
      </div>

      {/* Danh sách thông báo */}
      <div className="space-y-4">
        {sortedList.length > 0 ? (
          sortedList.map((n) => (
            <motion.div
              key={n.id}
              whileHover={{ scale: 1.005 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => handleNavigateByNotification(n)}
              className={`cursor-pointer border-l-4 rounded-md p-4 shadow-sm hover:shadow-md transition-all ${getColorByType(
                n.title,
                n.type
              )}`}
            >
              <div className="flex justify-between items-start mb-2">
                <h3 className="font-semibold text-base">{n.title}</h3>
                <span className="text-xs opacity-60">
                  {new Date(n.created_at).toLocaleString("vi-VN")}
                </span>
              </div>
              <pre className="whitespace-pre-wrap text-sm leading-relaxed">
                {n.message}
              </pre>
            </motion.div>
          ))
        ) : (
          <div className="text-center text-gray-500 dark:text-gray-400 italic py-6">
            Hiện chưa có thông báo
          </div>
        )}
      </div>
    </motion.div>
  );
}
