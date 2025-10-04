import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import EquipmentGroupSection from "../../components/layouts/equipment/EquipmentGroupSection";
import EquipmentTypeSection from "../../components/layouts/equipment/EquipmentTypeSection";

const initialGroups = [
  { id: 1, code: "CAO", name: "Cardio", desc: "Cardio Machines", createdAt: "27/08/2025", updatedAt: "27/08/2025", img: "" },
  { id: 2, code: "STH", name: "Kháng lực", desc: "Strength Machines", createdAt: "27/08/2025", updatedAt: "27/08/2025", img: "" },
];
const initialTypes = [
  { id: 1, code: "TM", name: "Treadmill", groupCode: "CAO", groupName: "Cardio", desc: "Máy chạy bộ", createdAt: "27/08/2025", updatedAt: "27/08/2025" },
];

export default function EquipmentGroupTypePage() {
  const [tab, setTab] = useState("group");
  const [groups, setGroups] = useState(initialGroups);
  const [types, setTypes] = useState(initialTypes);

  return (
    <div className="space-y-6">
      {/* Tabs */}
      <div className="flex gap-4 border-b pb-2 dark:border-gray-700">
        {[
          { key: "group", label: "📂 Tạo Nhóm" },
          { key: "type", label: "🏷️ Tạo Loại" },
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

      {/* Animate Presence */}
      <AnimatePresence mode="wait">
        {tab === "group" && (
          <motion.div
            key="group-section"
            initial={{ opacity: 0, x: -40 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 40 }}
            transition={{ duration: 0.3 }}
          >
            <EquipmentGroupSection groups={groups} setGroups={setGroups} />
          </motion.div>
        )}
        {tab === "type" && (
          <motion.div
            key="type-section"
            initial={{ opacity: 0, x: 40 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -40 }}
            transition={{ duration: 0.3 }}
          >
            <EquipmentTypeSection types={types} setTypes={setTypes} groups={groups} />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
