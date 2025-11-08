import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import MaintenanceUrgentSection from "@/components/layouts/maintenance/MaintenanceUrgentSection";
import MaintenanceReadySection from "@/components/layouts/maintenance/MaintenanceReadySection";
// import MaintenanceScheduleSection from "@/components/layouts/maintenance/MaintenanceScheduleSection";
import useAuthRole from "@/hooks/useAuthRole";

export default function MaintenancePage() {
  const { isTechnician } = useAuthRole();

  // 🧭 Nếu là technician thì chỉ có tab urgent
  const tabs = isTechnician
    ? [{ key: "urgent", label: "🚨 Ngừng tạm thời" }]
    : [
        { key: "urgent", label: "🚨 Danh sách bảo trì" },
        { key: "ready", label: "🧾 Chờ phê duyệt" },
      ];

  const [tab, setTab] = useState(tabs[0].key);

  return (
    <div className="space-y-6">
      {/* 🧭 Tabs */}
      <div className="flex gap-4 border-b pb-2 dark:border-gray-700">
        {tabs.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`relative px-5 py-2 font-medium rounded-t-lg transition-all duration-300 ${
              tab === t.key
                ? "text-emerald-500 border-b-2 border-emerald-500 bg-emerald-50 dark:bg-emerald-900/30"
                : "text-gray-500 dark:text-gray-400 hover:text-emerald-400"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* 🪄 Tab nội dung */}
      <AnimatePresence mode="wait">
        {tab === "urgent" && (
          <motion.div
            key="urgent-section"
            initial={{ opacity: 0, x: -40 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 40 }}
            transition={{ duration: 0.3 }}
          >
            <MaintenanceUrgentSection />
          </motion.div>
        )}

        {tab === "ready" && (
          <motion.div
            key="ready-section"
            initial={{ opacity: 0, x: 40 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -40 }}
            transition={{ duration: 0.3 }}
          >
            <MaintenanceReadySection />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
