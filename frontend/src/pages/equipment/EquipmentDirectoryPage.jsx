import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import EquipmentGroup from "@/components/layouts/equipmentList/EquipmentGroupSection";
import EquipmentUnitList from "@/components/layouts/equipmentList/EquipmentUnitListSection";
import EquipmentImportPage from "./EquipmentImportPage";

export default function EquipmentDirectoryPage() {
  const [tab, setTab] = useState("unit");
  const [waitingNewUnits, setWaitingNewUnits] = useState(false);
  const eventBuffer = useRef(new Set());

  // 🧠 Lắng nghe sự kiện từ UnitList (chạy mọi lúc, kể cả khi đổi tab)
  useEffect(() => {
    const handleUnitsUpdated = (e) => {
      console.log("📩 Nhận event fitx-units-updated:", e.detail);
      setWaitingNewUnits(false);
      setTab("unit");
    };

    window.addEventListener("fitx-units-updated", handleUnitsUpdated);

    // 🧹 cleanup khi unmount
    return () => {
      window.removeEventListener("fitx-units-updated", handleUnitsUpdated);
    };
  }, [waitingNewUnits]);

  return (
    <div className="space-y-6">
      {/* Tabs */}
      <div className="flex gap-4 border-b pb-2 dark:border-gray-700">
        {[
          { key: "group", label: "📦 Nhóm thiết bị" },
          { key: "unit", label: "🧾 Danh sách từng thiết bị" },
          { key: "import", label: "📥 Nhập thiết bị" },
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
            <EquipmentUnitList
              waitingNewUnits={waitingNewUnits}
              setWaitingNewUnits={setWaitingNewUnits}
            />
          </motion.div>
        )}

        {tab === "import" && (
          <motion.div
            key="import-tab"
            initial={{ opacity: 0, x: 40 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -40 }}
            transition={{ duration: 0.3 }}
          >
            <EquipmentImportPage
              onStartImport={() => {
                setWaitingNewUnits(true);
                eventBuffer.current.clear();
              }}
              onImportDone={() => {
                setTab("unit");
              }}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
