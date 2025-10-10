import { motion } from "framer-motion";
import { ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/buttonn";
import { toast } from "sonner";
import NotificationService from "@/services/NotificationService";

// 🎨 Xác định màu theo loại thông báo
const getColorByType = (title, type) => {
  // Ưu tiên theo type trước
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
  // Mặc định
  return "border-gray-200 bg-gray-50 text-gray-700 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300";
};

export default function NotificationScreen() {
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const res = await NotificationService.getAll();
        setNotifications(res || []);
      } catch (err) {
        console.error("❌ Lỗi khi tải thông báo:", err);
        toast.error("Không thể tải danh sách thông báo!");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

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

      {/* Danh sách thông báo */}
      <div className="space-y-4">
        {notifications.length > 0 ? (
          notifications.map((n) => (
            <motion.div
              key={n.id}
              whileHover={{ scale: 1.005 }}
              className={`border-l-4 rounded-md p-4 shadow-sm ${getColorByType(
                n.title,
                n.type
              )} transition-all`}
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
            Không có thông báo nào
          </div>
        )}
      </div>
    </motion.div>
  );
}
