import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import EquipmentGroup from "@/components/layouts/equipmentList/EquipmentGroupSection";
import EquipmentUnitList from "@/components/layouts/equipmentList/EquipmentUnitListSection";

export default function EquipmentDirectoryPage() {
  const [tab, setTab] = useState("unit");

  return (
    <div className="space-y-6">
      {/* 🧭 Tabs */}
      <div className="flex gap-4 border-b pb-2 dark:border-gray-700">
        {[
          { key: "group", label: "📦 Nhóm thiết bị" },
          { key: "unit", label: "🧾 Danh sách từng thiết bị" },
        ].map((t) => (
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

      {/* 🪄 Nội dung chuyển tab mượt */}
      <AnimatePresence mode="wait">
        {tab === "group" && (
          <motion.div
            key="group-tab"
            initial={{ opacity: 0, x: -40 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 40 }}
            transition={{ duration: 0.3 }}
          >
            <EquipmentGroup />
          </motion.div>
        )}

        {tab === "unit" && (
          <motion.div
            key="unit-tab"
            initial={{ opacity: 0, x: 40 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -40 }}
            transition={{ duration: 0.3 }}
          >
            <EquipmentUnitList />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
