import { useRef, useState } from "react";
import { toast } from "sonner";
import { exportToExcel, importFromExcel } from "@/services/Files";

/**
 * 🧩 useImexHook — Dùng cho Import / Export / Template
 * (FE-only, không phụ thuộc backend)
 */
export default function useImexHook({
  getExportData,
  exportFileName = "export",
  templateHeaders = [],
  onImported,
} = {}) {
  const fileInputRef = useRef(null);
  const [previewRows, setPreviewRows] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);

  /** 📂 Mở dialog chọn file */
  const openFilePicker = () => fileInputRef.current?.click();

  /** 📥 Xử lý import Excel */
  const handleFileChange = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;

    try {
      const json = await importFromExcel(file);

      if (!Array.isArray(json) || json.length === 0) {
        toast.warning("⚠️ File Excel không có dữ liệu!");
        return;
      }

      setPreviewRows(json.slice(0, 50));
      setIsModalOpen(true);
      toast.success(`📊 Đọc được ${json.length} dòng từ file Excel`);

      // 🔹 callback tuỳ chỉnh (nếu có)
      if (typeof onImported === "function") {
        await onImported(json);
      }
    } catch (err) {
      console.error("❌ Lỗi import Excel:", err);
      toast.error("❌ Không thể đọc file Excel!");
    }
  };

  /** 📤 Export Excel */
  const exportNow = () => {
    try {
      const data = typeof getExportData === "function" ? getExportData() : [];
      if (!data.length) {
        toast.warning("⚠️ Không có dữ liệu để xuất!");
        return;
      }
      exportToExcel(data, exportFileName);
      toast.success(`✅ Đã xuất ${data.length} bản ghi!`);
    } catch (err) {
      console.error("❌ Lỗi export:", err);
      toast.error("❌ Xuất file thất bại!");
    }
  };

  /** 📄 Tải template mẫu */
  const downloadTemplate = () => {
    try {
      if (!templateHeaders.length) {
        toast.warning("⚠️ Chưa cấu hình templateHeaders!");
        return;
      }
      const row = Object.fromEntries(templateHeaders.map((h) => [h, ""]));
      exportToExcel([row], `${exportFileName}_TEMPLATE`);
      toast.info("📄 Đã tải file template mẫu!");
    } catch (err) {
      console.error("❌ Template error:", err);
      toast.error("❌ Không thể tải file mẫu!");
    }
  };

  return {
    fileInputRef,
    handleImportClick: openFilePicker,
    handleFileChange,
    handleExport: exportNow,
    handleTemplate: downloadTemplate,
    isModalOpen,
    setIsModalOpen,
    previewRows,
  };
}
