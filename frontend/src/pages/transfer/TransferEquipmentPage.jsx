import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import TransferCreateSection from "@/components/layouts/transfer/TransferCreateSection";
import TransferPendingSection from "@/components/layouts/transfer/TransferPendingSection";
import TransferHistorySection from "@/components/layouts/transfer/TransferHistorySection"; 

export default function TransferEquipmentPage() {
  const [tab, setTab] = useState("create");

  const tabs = [
    { key: "create", label: "📦 Tạo yêu cầu vận chuyển" },
    { key: "pending", label: "🚚 Phiếu đang vận chuyển" },
    { key: "history", label: "📜 Lịch sử vận chuyển" },
  ];

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
        {tab === "create" && (
          <motion.div
            key="create-tab"
            initial={{ opacity: 0, x: -40 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 40 }}
            transition={{ duration: 0.3 }}
          >
            <TransferCreateSection />
          </motion.div>
        )}

        {tab === "pending" && (
          <motion.div
            key="pending-tab"
            initial={{ opacity: 0, x: 40 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -40 }}
            transition={{ duration: 0.3 }}
          >
            <TransferPendingSection />
          </motion.div>
        )}

        {tab === "history" && (
          <motion.div
            key="history-tab"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
          >
            <TransferHistorySection />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
