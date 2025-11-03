import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import PageContainer from "@/components/common/PageContainer";
import InvoiceImportSection from "@/components/layouts/invoice/InvoiceImportSection";
import InvoiceMaintenanceSection from "@/components/layouts/invoice/InvoiceMaintenanceSection";
import InvoiceDisposalSection from "@/components/layouts/invoice/InvoiceDisposalSection";

export default function InvoicePage() {
  const [tab, setTab] = useState("import");

  return (
    <PageContainer>
      <h1 className="text-xl font-bold mb-2">Danh sách phiếu & hóa đơn</h1>

      {/* Tabs */}
      <div className="flex gap-4 border-b pb-2 dark:border-gray-700">
        {[
          { key: "import", label: "📦 Phiếu đơn nhập" },
          { key: "maintenance", label: "🧰Phiếu bảo trì" },
          { key: "disposal", label: "♻️ Hóa đơn thanh lý" },
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

      {/* Nội dung từng tab */}
      <AnimatePresence mode="wait">
        {tab === "import" && (
          <motion.div
            key="import-tab"
            initial={{ opacity: 0, x: -40 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 40 }}
            transition={{ duration: 0.3 }}
          >
            <InvoiceImportSection />
          </motion.div>
        )}

        {tab === "maintenance" && (
          <motion.div
            key="maintenance-tab"
            initial={{ opacity: 0, x: 40 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -40 }}
            transition={{ duration: 0.3 }}
          >
            <InvoiceMaintenanceSection />
          </motion.div>
        )}
        {tab === "disposal" && (
          <motion.div
            key="disposal-tab"
            initial={{ opacity: 0, x: 40 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -40 }}
            transition={{ duration: 0.3 }}
          >
            <InvoiceDisposalSection />
          </motion.div>
        )}
      </AnimatePresence>
    </PageContainer>
  );
}
