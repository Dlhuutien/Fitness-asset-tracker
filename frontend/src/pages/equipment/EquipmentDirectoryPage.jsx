import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";

// 🧩 Các layout section
import EquipmentGroupList from "@/components/layouts/equipmentList/EquipmentGroupSection";
import EquipmentTypeSection from "@/components/layouts/equipmentList/EquipmentTypeSection";
import EquipmentSection from "@/components/layouts/equipmentList/EquipmentSection";
import EquipmentUnitList from "@/components/layouts/equipmentList/EquipmentUnitListSection";

// 🧠 Service
import CategoryMainService from "@/services/categoryMainService";
import CategoryTypeService from "@/services/categoryTypeService";

export default function EquipmentDirectoryPage() {
  const [tab, setTab] = useState("unit");
  const [waitingNewUnits, setWaitingNewUnits] = useState(false);
  const [groups, setGroups] = useState([]);
  const [types, setTypes] = useState([]);
  const [loading, setLoading] = useState(true);
  const eventBuffer = useRef(new Set());

  // 🧭 Load dữ liệu cho tab Nhóm + Loại
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

  // 🧠 Lắng nghe sự kiện cập nhật từ UnitList
  useEffect(() => {
    const handleUnitsUpdated = (e) => {
      console.log("📩 Nhận event fitx-units-updated:", e.detail);
      setWaitingNewUnits(false);
      setTab("unit");
    };

    window.addEventListener("fitx-units-updated", handleUnitsUpdated);
    return () =>
      window.removeEventListener("fitx-units-updated", handleUnitsUpdated);
  }, [waitingNewUnits]);

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
          { key: "group", label: "📂 Danh sách Nhóm" },
          { key: "type", label: "🏷️ Danh sách Loại" },
          { key: "equipment", label: "📦 Danh sách Dòng thiết bị" },
          { key: "unit", label: "🧾 Danh sách Từng thiết bị" },
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

      {/* Nội dung tab */}
      <AnimatePresence mode="wait">
        {tab === "group" && (
          <motion.div
            key="group-tab"
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -40 }}
            transition={{ duration: 0.3 }}
          >
            <EquipmentGroupList groups={groups} setGroups={setGroups} />
          </motion.div>
        )}

        {tab === "type" && (
          <motion.div
            key="type-tab"
            initial={{ opacity: 0, y: -40 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 40 }}
            transition={{ duration: 0.3 }}
          >
            <EquipmentTypeSection
              types={types}
              setTypes={setTypes}
              groups={groups}
            />
          </motion.div>
        )}
        
        {tab === "equipment" && (
          <motion.div
            key="equipment-tab"
            initial={{ opacity: 0, x: -40 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 40 }}
            transition={{ duration: 0.3 }}
          >
            <EquipmentSection />
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
            <EquipmentUnitList
              waitingNewUnits={waitingNewUnits}
              setWaitingNewUnits={setWaitingNewUnits}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
