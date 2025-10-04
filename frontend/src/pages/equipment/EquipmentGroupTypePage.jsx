import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import EquipmentGroupSection from "../../components/layouts/equipment/EquipmentGroupSection";
import EquipmentTypeSection from "../../components/layouts/equipment/EquipmentTypeSection";
import CategoryMainService from "@/services/categoryMainService";
import CategoryTypeService from "@/services/categoryTypeService";

export default function EquipmentGroupTypePage() {
  const [tab, setTab] = useState("group");
  const [groups, setGroups] = useState([]);
  const [types, setTypes] = useState([]);
  const [loading, setLoading] = useState(true);

  // Load dữ liệu từ API
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [groupData, typeData] = await Promise.all([
          CategoryMainService.getAll(),
          CategoryTypeService.getAllWithDisplayName(),
        ]);
        setGroups(groupData);
        setTypes(typeData);
      } catch (err) {
        console.error("❌ Lỗi khi load nhóm/loại:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-40 text-gray-500">
        Đang tải dữ liệu...
      </div>
    );
  }

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
            <EquipmentTypeSection
              types={types}
              setTypes={setTypes}
              groups={groups}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
