import { motion } from "framer-motion";
import {
  Bell,
  Wrench,
  Package,
  Dumbbell,
  FileText,
  AlertCircle,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useEffect, useRef, useState } from "react";
import NotificationService from "@/services/NotificationService";

const LAST_SEEN_KEY = "fitx_last_seen_notitime";

/* 🔔 Hiệu ứng rung chuông 1 lần – mượt */
const ringOnce = {
  rotate: [0, -26, 20, -12, 6, -3, 0],
  transition: { duration: 0.9, ease: "easeInOut" },
};

/* 🎨 Icon theo loại thông báo */
const typeIcon = {
  maintenance: <Wrench className="w-4 h-4 text-amber-500" />,
  equipment: <Dumbbell className="w-4 h-4 text-emerald-500" />,
  invoice: <FileText className="w-4 h-4 text-blue-500" />,
  import: <Package className="w-4 h-4 text-indigo-500" />,
  default: <AlertCircle className="w-4 h-4 text-gray-400" />,
};

export default function Notification() {
  const navigate = useNavigate();

  const [hasNew, setHasNew] = useState(false);
  const [shouldRing, setShouldRing] = useState(false);
  const [previewNotis, setPreviewNotis] = useState([]);
  const [showPopup, setShowPopup] = useState(false);

  const latestRemoteTsRef = useRef(null);
  const pollingRef = useRef(null);
  const isFetchingRef = useRef(false);

  /* ===== Helpers ===== */
  const getLastSeen = () => {
    const raw = localStorage.getItem(LAST_SEEN_KEY);
    return raw ? new Date(raw).getTime() : 0;
  };

  const setLastSeenToLatest = () => {
    if (latestRemoteTsRef.current) {
      localStorage.setItem(
        LAST_SEEN_KEY,
        new Date(latestRemoteTsRef.current).toISOString()
      );
    }
  };

  /* ===== Fetch & check notification ===== */
  const fetchAndCheck = async () => {
    if (isFetchingRef.current) return;
    isFetchingRef.current = true;

    try {
      const res = await NotificationService.getAll();
      if (!Array.isArray(res) || res.length === 0) return;

      const sorted = [...res].sort(
        (a, b) => new Date(b.created_at) - new Date(a.created_at)
      );

      setPreviewNotis(sorted.slice(0, 6));

      const newestTs = new Date(sorted[0].created_at).getTime();
      latestRemoteTsRef.current = newestTs;

      const lastSeen = getLastSeen();

      if (newestTs > lastSeen && !hasNew) {
        setHasNew(true);
        setShouldRing(true); // ✅ CHỈ SET STATE – KHÔNG GỌI ANIMATION TRỰC TIẾP
      }
    } catch (e) {
      console.error("❌ Notification fetch error:", e);
    } finally {
      isFetchingRef.current = false;
    }
  };

  /* ===== Lifecycle ===== */
  useEffect(() => {
    fetchAndCheck();
    pollingRef.current = setInterval(fetchAndCheck, 8000);

    const onFocus = () => fetchAndCheck();
    const onVisibility = () => {
      if (document.visibilityState === "visible") fetchAndCheck();
    };

    window.addEventListener("focus", onFocus);
    document.addEventListener("visibilitychange", onVisibility);

    return () => {
      clearInterval(pollingRef.current);
      window.removeEventListener("focus", onFocus);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, []);

  /* ===== Handlers ===== */
  const handleHoverBell = () => {
    setHasNew(false);
    setShouldRing(false);
    setLastSeenToLatest();
    setShowPopup(true);
  };

  const handleClickAll = () => {
    handleHoverBell();
    navigate("/notifications");
  };

  const lastSeen = getLastSeen();

  return (
    <div className="relative">
      {/* 🔔 Notification Bell */}
      <motion.button
        whileHover={{ scale: 1.15 }}
        whileTap={{ scale: 0.9 }}
        onMouseEnter={handleHoverBell}
        className="
          relative p-2 rounded-full
          bg-gradient-to-br from-white to-gray-100
          dark:from-gray-800 dark:to-gray-900
          border border-gray-300/70 dark:border-gray-700/70
          shadow-[0_3px_12px_rgba(0,0,0,0.15)]
          hover:shadow-[0_6px_18px_rgba(0,0,0,0.25)]
          transition-all
        "
      >
        <motion.div
          animate={shouldRing ? ringOnce : { rotate: 0 }}
          onAnimationComplete={() => setShouldRing(false)}
        >
          <Bell
            className={`w-6 h-6 ${
              hasNew
                ? "text-emerald-500 drop-shadow-[0_0_10px_rgba(16,185,129,0.7)]"
                : "text-gray-700 dark:text-gray-300"
            }`}
          />
        </motion.div>

        {/* 🔴 Dot báo có thông báo mới */}
        {hasNew && (
          <span
            className="
              absolute top-1 right-1 w-2.5 h-2.5
              bg-gradient-to-r from-red-500 to-pink-500
              rounded-full shadow-[0_0_8px_rgba(239,68,68,0.9)]
            "
          />
        )}
      </motion.button>

      {/* 📌 Popup preview */}
      {showPopup && (
        <motion.div
          onMouseEnter={() => setShowPopup(true)}
          onMouseLeave={() => setShowPopup(false)}
          initial={{ opacity: 0, y: -10, scale: 0.97 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -10, scale: 0.95 }}
          transition={{ duration: 0.22, ease: "easeOut" }}
          className="
            absolute right-0 mt-4 w-[380px] rounded-2xl
            border border-gray-300/60 dark:border-gray-700/60
            bg-white/90 dark:bg-gray-900/90
            backdrop-blur-2xl
            shadow-[0_10px_30px_rgba(0,0,0,0.25)]
            overflow-hidden z-50
          "
        >
          {/* Header */}
          <div
            className="
              px-4 py-3 border-b border-gray-200/70 dark:border-gray-700/60
              font-semibold text-gray-800 dark:text-gray-100
              flex justify-between items-center
            "
          >
            <span>🔔 Thông báo gần đây</span>
            <button
              onClick={handleClickAll}
              className="text-emerald-600 dark:text-emerald-400 text-xs font-semibold hover:underline"
            >
              Xem tất cả
            </button>
          </div>

          {/* List */}
          <ul className="max-h-80 overflow-y-auto divide-y divide-gray-200/80 dark:divide-gray-800/60">
            {previewNotis.length === 0 ? (
              <li className="p-5 text-center text-gray-500 text-sm">
                Không có thông báo
              </li>
            ) : (
              previewNotis.map((n, i) => {
                const isNew = new Date(n.created_at).getTime() > lastSeen;
                const icon =
                  typeIcon[n.type?.toLowerCase()] || typeIcon.default;

                return (
                  <li
                    key={i}
                    onClick={() => {
                      setLastSeenToLatest();
                      navigate("/notifications");
                    }}
                    className={`
                      flex items-start gap-3 px-4 py-3 cursor-pointer
                      transition-all
                      ${
                        isNew
                          ? "bg-emerald-50/70 dark:bg-emerald-900/30"
                          : "hover:bg-gray-100/80 dark:hover:bg-gray-800/40"
                      }
                    `}
                  >
                    <div className="mt-1">{icon}</div>
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold truncate">
                        {n.title || "Thông báo mới"}
                      </div>
                      <div className="text-xs text-gray-600 dark:text-gray-400 truncate">
                        {n.message || "Không có nội dung"}
                      </div>
                      <div className="text-[10px] text-gray-400 mt-1">
                        {new Date(n.created_at).toLocaleString("vi-VN")}
                      </div>
                    </div>
                  </li>
                );
              })
            )}
          </ul>
        </motion.div>
      )}
    </div>
  );
}
