import { motion } from "framer-motion";
import {
  ArrowLeft,
  Bell,
  Wrench,
  Package,
  FileText,
  Filter,
  CalendarRange,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/buttonn";
import { toast } from "sonner";
import NotificationService from "@/services/NotificationService";

// 🎨 Màu nền + viền theo loại + trạng thái
const getColorByType = (title = "", type = "") => {
  const t = (type || "").toLowerCase();
  const ttl = (title || "").toLowerCase();

  // invoice
  if (t === "invoice") {
    return `
      border border-purple-300/70 dark:border-purple-700/70
      bg-gradient-to-br from-purple-50/80 via-white/80 to-indigo-50/70
      dark:from-purple-950/50 dark:via-slate-950/40 dark:to-indigo-950/40
      text-slate-800 dark:text-slate-100
    `;
  }

  // maintenance
  if (t === "maintenance") {
    if (ttl.includes("tạo")) {
      return `
        border border-blue-300/70 dark:border-blue-700/70
        bg-gradient-to-br from-blue-50/80 via-white/80 to-sky-50/70
        dark:from-blue-950/50 dark:via-slate-950/40 dark:to-sky-950/40
        text-slate-800 dark:text-slate-100
      `;
    }
    if (ttl.includes("tiến hành")) {
      return `
        border border-amber-300/80 dark:border-amber-700/70
        bg-gradient-to-br from-amber-50/80 via-white/80 to-orange-50/70
        dark:from-amber-950/50 dark:via-slate-950/40 dark:to-orange-950/40
        text-slate-800 dark:text-slate-100
      `;
    }
    if (ttl.includes("hoàn tất")) {
      return `
        border border-emerald-300/80 dark:border-emerald-700/70
        bg-gradient-to-br from-emerald-50/80 via-white/80 to-teal-50/70
        dark:from-emerald-950/50 dark:via-slate-950/40 dark:to-teal-950/40
        text-slate-800 dark:text-slate-100
      `;
    }
  }

  // transfer
  if (t === "transfer" || ttl.includes("vận chuyển thiết bị")) {
    if (ttl.includes("hoàn tất")) {
      return `
        border border-cyan-300/80 dark:border-cyan-700/70
        bg-gradient-to-br from-cyan-50/80 via-white/80 to-teal-50/70
        dark:from-cyan-950/50 dark:via-slate-950/40 dark:to-teal-950/40
        text-slate-800 dark:text-slate-100
      `;
    }
    return `
      border border-sky-300/80 dark:border-sky-700/70
      bg-gradient-to-br from-sky-50/80 via-white/80 to-cyan-50/70
      dark:from-sky-950/50 dark:via-slate-950/40 dark:to-cyan-950/40
      text-slate-800 dark:text-slate-100
    `;
  }

  // default
  return `
    border border-slate-200/80 dark:border-slate-700/80
    bg-gradient-to-br from-slate-50/80 via-white/80 to-zinc-50/70
    dark:from-slate-950/50 dark:via-slate-950/40 dark:to-zinc-950/40
    text-slate-800 dark:text-slate-100
  `;
};

// Icon + chip label theo type
const getMetaByType = (title = "", type = "") => {
  const t = (type || "").toLowerCase();
  const ttl = (title || "").toLowerCase();

  let icon = <Bell className="w-5 h-5 text-slate-400" />;
  let chip = { text: "Hệ thống", className: "bg-slate-200/70 text-slate-700" };

  if (t === "invoice") {
    icon = (
      <FileText className="w-5 h-5 text-purple-500 drop-shadow-[0_0_12px_rgba(168,85,247,0.6)]" />
    );
    chip = {
      text: "Nhập thiết bị",
      className: "bg-purple-100/80 text-purple-700 border border-purple-200/70",
    };
  } else if (t === "maintenance") {
    icon = (
      <Wrench className="w-5 h-5 text-amber-500 drop-shadow-[0_0_12px_rgba(245,158,11,0.6)]" />
    );
    if (ttl.includes("tạo")) {
      chip = {
        text: "Tạo bảo trì",
        className: "bg-blue-100/80 text-blue-700 border border-blue-200/70",
      };
    } else if (ttl.includes("tiến hành")) {
      chip = {
        text: "Đang bảo trì",
        className:
          "bg-amber-100/80 text-amber-700 border border-amber-200/70",
      };
    } else if (ttl.includes("hoàn tất")) {
      chip = {
        text: "Hoàn tất bảo trì",
        className:
          "bg-emerald-100/80 text-emerald-700 border border-emerald-200/70",
      };
    } else {
      chip = {
        text: "Bảo trì",
        className: "bg-amber-100/80 text-amber-700 border border-amber-200/70",
      };
    }
  } else if (t === "transfer" || ttl.includes("vận chuyển thiết bị")) {
    icon = (
      <Package className="w-5 h-5 text-cyan-500 drop-shadow-[0_0_12px_rgba(6,182,212,0.6)]" />
    );
    if (ttl.includes("hoàn tất")) {
      chip = {
        text: "Hoàn tất vận chuyển",
        className: "bg-cyan-100/80 text-cyan-700 border border-cyan-200/70",
      };
    } else {
      chip = {
        text: "Vận chuyển thiết bị",
        className: "bg-sky-100/80 text-sky-700 border border-sky-200/70",
      };
    }
  }

  return { icon, chip };
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

  // 🧭 Điều hướng theo loại thông báo – GIỮ NGUYÊN LOGIC CỦA BẠN
  const handleNavigateByNotification = (n) => {
    const type = n.type?.toLowerCase() || "";
    const title = n.title?.toLowerCase() || "";

    if (type === "invoice") {
      const match = n.message?.match(
        /\b[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\b/i
      );

      if (match && match[0]) {
        navigate(`/app/invoice?invoiceId=${match[0]}`);
      } else if (n.ref_id) {
        navigate(`/app/invoice?invoiceId=${n.ref_id}`);
      } else {
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
      className="
        min-h-[calc(100vh-80px)]
        p-6 md:p-8 space-y-8 font-jakarta
        bg-gradient-to-br from-slate-50 via-emerald-50/40 to-sky-50
        dark:from-slate-950 dark:via-slate-900 dark:to-slate-950
      "
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
    >
      {/* ===== HEADER ===== */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            onClick={() => navigate(-1)}
            className="
              flex items-center gap-2 rounded-xl px-4 py-2
              border border-slate-300/70 dark:border-slate-700/70
              bg-white/70 dark:bg-slate-900/70
              hover:bg-slate-100/90 dark:hover:bg-slate-800/90
              shadow-sm
            "
          >
            <ArrowLeft size={16} />
            Quay lại
          </Button>

          <div>
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-50">
              Trung tâm thông báo
            </h1>
            <p className="text-xs md:text-sm text-slate-500 dark:text-slate-400 mt-1">
              Xem lịch sử toàn bộ hoạt động bảo trì, nhập thiết bị và vận
              chuyển trong hệ thống.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 text-xs md:text-sm text-slate-500 dark:text-slate-400">
          <Bell className="w-4 h-4 text-emerald-500" />
          <span>
            Tổng:{" "}
            <span className="font-semibold text-emerald-600 dark:text-emerald-300">
              {sortedList.length}
            </span>{" "}
            thông báo đang hiển thị
          </span>
        </div>
      </div>

      {/* ===== FILTER BAR – GLASSMORPHISM ===== */}
      <div
        className="
          bg-white/80 dark:bg-slate-950/80
          border border-slate-200/80 dark:border-slate-800/80
          rounded-3xl px-5 py-4 md:px-6 md:py-5
          shadow-[0_18px_45px_rgba(15,23,42,0.12)]
          backdrop-blur-2xl
          flex flex-col md:flex-row md:items-end gap-4 md:gap-6
        "
      >
        {/* Loại thông báo */}
        <div className="flex-1 min-w-[180px]">
          <div className="flex items-center gap-2 mb-1">
            <Filter className="w-4 h-4 text-slate-400" />
            <span className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
              Loại thông báo
            </span>
          </div>
          <select
            value={filterType}
            onChange={(e) => {
              setFilterType(e.target.value);
              setFilterStatus("all");
            }}
            className="
              w-full px-3 py-2 rounded-xl
              bg-slate-50/80 dark:bg-slate-900/80
              border border-slate-200/80 dark:border-slate-700/80
              text-sm text-slate-800 dark:text-slate-100
              focus:outline-none focus:ring-2 focus:ring-emerald-400/70
            "
          >
            <option value="all">Tất cả loại</option>
            <option value="invoice">Nhập thiết bị</option>
            <option value="maintenance">Bảo trì</option>
            <option value="transfer">Vận chuyển</option>
          </select>
        </div>

        {/* Trạng thái con */}
        <div className="flex-1 min-w-[180px]">
          <div className="flex items-center gap-2 mb-1">
            <span className="w-2 h-2 rounded-full bg-emerald-400/80" />
            <span className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
              Trạng thái
            </span>
          </div>
          {filterType !== "all" ? (
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="
                w-full px-3 py-2 rounded-xl
                bg-slate-50/80 dark:bg-slate-900/80
                border border-slate-200/80 dark:border-slate-700/80
                text-sm text-slate-800 dark:text-slate-100
                focus:outline-none focus:ring-2 focus:ring-emerald-400/70
              "
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
          ) : (
            <div className="text-xs text-slate-400 italic pt-2">
              Chọn loại để lọc theo trạng thái
            </div>
          )}
        </div>

        {/* Khoảng thời gian */}
        <div className="flex-[1.3] min-w-[220px]">
          <div className="flex items-center gap-2 mb-1">
            <CalendarRange className="w-4 h-4 text-slate-400" />
            <span className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
              Khoảng thời gian
            </span>
          </div>
          <div className="flex items-center gap-2">
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="
                flex-1 px-3 py-2 rounded-xl
                bg-slate-50/80 dark:bg-slate-900/80
                border border-slate-200/80 dark:border-slate-700/80
                text-sm text-slate-800 dark:text-slate-100
                focus:outline-none focus:ring-2 focus:ring-emerald-400/70
              "
            />
            <span className="text-xs text-slate-400">→</span>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="
                flex-1 px-3 py-2 rounded-xl
                bg-slate-50/80 dark:bg-slate-900/80
                border border-slate-200/80 dark:border-slate-700/80
                text-sm text-slate-800 dark:text-slate-100
                focus:outline-none focus:ring-2 focus:ring-emerald-400/70
              "
            />
          </div>
        </div>

        {/* Sắp xếp */}
        <div className="flex md:flex-col items-end md:items-end gap-2 md:gap-1">
          <span className="hidden md:inline text-[11px] uppercase tracking-wide text-slate-500 dark:text-slate-400">
            Sắp xếp
          </span>
          <Button
            size="sm"
            variant="outline"
            onClick={() =>
              setSortOrder((prev) => (prev === "desc" ? "asc" : "desc"))
            }
            className={`
              px-4 py-2 rounded-xl text-xs font-medium
              border border-emerald-400/70
              shadow-sm
              ${
                sortOrder === "desc"
                  ? "bg-emerald-500 text-white hover:bg-emerald-600"
                  : "bg-white dark:bg-slate-900 text-emerald-600 dark:text-emerald-300 hover:bg-emerald-50/80 dark:hover:bg-slate-800"
              }
            `}
          >
            {sortOrder === "desc" ? "⬇️ Mới nhất" : "⬆️ Cũ nhất"}
          </Button>
        </div>
      </div>

      {/* ===== LIST – TIMELINE STYLE ===== */}
      <div className="relative space-y-4 md:space-y-5">
        {/* Dòng timeline mờ ở bên trái trên màn hình to */}
        <div className="hidden md:block absolute left-[14px] top-0 bottom-0 w-px bg-gradient-to-b from-emerald-300/40 via-slate-300/30 to-transparent" />

        {sortedList.length > 0 ? (
          sortedList.map((n, index) => {
            const { icon, chip } = getMetaByType(n.title, n.type);
            const colorClass = getColorByType(n.title, n.type);

            return (
              <motion.div
                key={n.id}
                whileHover={{ scale: 1.01, y: -2 }}
                whileTap={{ scale: 0.985 }}
                onClick={() => handleNavigateByNotification(n)}
                className={`
                  relative pl-7 md:pl-10
                `}
              >
                {/* Dot timeline */}
                <div className="absolute left-[4px] md:left-[9px] top-5 w-2.5 h-2.5 rounded-full bg-emerald-400 shadow-[0_0_0_4px_rgba(16,185,129,0.25)]" />

                {/* Card */}
                <div
                  className={`
                    cursor-pointer rounded-3xl px-4 py-4 md:px-6 md:py-5
                    transition-all
                    shadow-[0_14px_40px_rgba(15,23,42,0.12)]
                    hover:shadow-[0_18px_60px_rgba(15,23,42,0.18)]
                    hover:-translate-y-[1px]
                    ${colorClass}
                  `}
                >
                  {/* Header của card */}
                  <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-3">
                    <div className="flex items-start gap-3 md:gap-4">
                      <div
                        className="
                          w-10 h-10 rounded-2xl flex items-center justify-center
                          bg-white/60 dark:bg-slate-900/60
                          shadow-[0_5px_14px_rgba(15,23,42,0.18)]
                        "
                      >
                        {icon}
                      </div>

                        <div>
                          <div className="flex flex-wrap items-center gap-2">
                            <h3 className="text-sm md:text-base font-semibold leading-snug">
                              {n.title}
                            </h3>
                            <span
                              className={`
                              inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-medium
                              ${chip.className}
                            `}
                            >
                              {chip.text}
                            </span>
                          </div>
                          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                            #{index + 1} •{" "}
                            {new Date(n.created_at).toLocaleString("vi-VN")}
                          </p>
                        </div>
                      </div>

                    <div className="hidden md:flex flex-col items-end gap-1 text-right text-[11px] text-slate-500 dark:text-slate-400">
                      <span>
                        {new Date(n.created_at).toLocaleDateString("vi-VN")}
                      </span>
                      <span className="opacity-80">
                        {new Date(n.created_at).toLocaleTimeString("vi-VN")}
                      </span>
                    </div>
                  </div>

                  {/* Content */}
                  <p className="mt-3 text-xs md:text-sm leading-relaxed text-slate-700 dark:text-slate-200 whitespace-pre-wrap">
                    {n.message}
                  </p>
                </div>
              </motion.div>
            );
          })
        ) : (
          <div className="text-center text-slate-500 dark:text-slate-400 italic py-10">
            Hiện chưa có thông báo nào phù hợp bộ lọc.
          </div>
        )}
      </div>
    </motion.div>
  );
}
