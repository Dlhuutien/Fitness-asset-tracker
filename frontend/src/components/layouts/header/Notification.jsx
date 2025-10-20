import { motion, useAnimation } from "framer-motion";
import { Bell } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useEffect, useRef, useState } from "react";
import NotificationService from "@/services/NotificationService";

// Key lưu mốc đã xem lần cuối
const LAST_SEEN_KEY = "fitx_last_seen_notitime";

// Animation rung mạnh, mượt
const ringOnce = {
  rotate: [0, -32, 26, -18, 12, -6, 0],
  transition: { duration: 1.05, ease: "easeInOut" },
};

export default function Notification() {
  const navigate = useNavigate();
  const controls = useAnimation();

  const [hasNew, setHasNew] = useState(false);
  const latestRemoteTsRef = useRef(null); // ✅ sửa ở đây
  const pollingRef = useRef(null);        // ✅ sửa ở đây
  const isFetchingRef = useRef(false);    // ✅ sửa ở đây


  // Lấy mốc đã xem từ localStorage (mặc định 0)
  const getLastSeen = () => {
    const raw = localStorage.getItem(LAST_SEEN_KEY);
    return raw ? new Date(raw).getTime() : 0;
  };

  // Cập nhật mốc đã xem (khi user mở trang notifications)
  const setLastSeenToLatest = () => {
    if (latestRemoteTsRef.current) {
      localStorage.setItem(
        LAST_SEEN_KEY,
        new Date(latestRemoteTsRef.current).toISOString()
      );
    }
  };

  // Gọi API và kiểm tra có noti mới hơn mốc đã xem không
  const fetchAndCheck = async () => {
    if (isFetchingRef.current) return;
    isFetchingRef.current = true;

    try {
      const res = await NotificationService.getAll();
      if (!Array.isArray(res) || res.length === 0) {
        isFetchingRef.current = false;
        return;
      }

      // Tìm created_at mới nhất (phòng trường hợp backend không sort sẵn)
      const newest = res.reduce((acc, cur) => {
        const t = new Date(cur.created_at).getTime();
        return t > acc ? t : acc;
      }, 0);

      latestRemoteTsRef.current = newest;

      const lastSeen = getLastSeen();
      const isNew = newest > lastSeen;

      if (isNew) {
        setHasNew(true);
        // rung một nhịp mạnh
        controls.start(ringOnce);
      }
    } catch (err) {
      // im lặng, tránh làm ồn UI
      // console.error("Noti poll error", err);
    } finally {
      isFetchingRef.current = false;
    }
  };

  // Polling + focus/visibility re-check
  useEffect(() => {
    // chạy ngay lần đầu
    fetchAndCheck();

    // polling mỗi 6s
    pollingRef.current = window.setInterval(fetchAndCheck, 6000);

    // Khi tab visible/focus lại → check ngay
    const onFocus = () => fetchAndCheck();
    const onVisibility = () => {
      if (document.visibilityState === "visible") fetchAndCheck();
    };
    window.addEventListener("focus", onFocus);
    document.addEventListener("visibilitychange", onVisibility);

    return () => {
      if (pollingRef.current) clearInterval(pollingRef.current);
      window.removeEventListener("focus", onFocus);
      document.removeEventListener("visibilitychange", onVisibility);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Click chuông → tắt hiệu ứng + đánh dấu đã xem + điều hướng
  const handleClick = () => {
    setHasNew(false);
    controls.stop();
    controls.set({ rotate: 0 });
    setLastSeenToLatest();
    navigate("/notifications");
  };

  return (
    <motion.button
      whileHover={{ scale: 1.2 }}
      whileTap={{ scale: 0.9 }}
      onClick={handleClick}
      className="relative p-2 rounded-full bg-gray-100 dark:bg-gray-800 hover:shadow-md transition-all"
      aria-label="Notifications"
    >
      <motion.div animate={controls}>
        <Bell
          className={`w-6 h-6 transition-all ${
            hasNew
              ? "text-emerald-500 drop-shadow-[0_0_8px_rgba(16,185,129,0.6)]"
              : "text-gray-600 dark:text-gray-300"
          }`}
        />
      </motion.div>

      {hasNew && (
        <span className="absolute top-1 right-1 w-3 h-3 bg-red-500 rounded-full shadow-[0_0_8px_rgba(239,68,68,0.8)] animate-ping" />
      )}
    </motion.button>
  );
}
