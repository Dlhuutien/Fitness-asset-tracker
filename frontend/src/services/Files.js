// src/services/Files.js
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";

/**
 * 📤 Xuất dữ liệu ra file Excel (.xlsx)
 * @param {Array} data - Dữ liệu JSON cần export
 * @param {String} fileName - Tên file (không cần .xlsx)
 */
export const exportToExcel = (data, fileName = "export") => {
  try {
    if (!data || !Array.isArray(data) || data.length === 0) {
      console.warn("⚠️ Không có dữ liệu để export!");
      return;
    }

    // Tạo worksheet & workbook
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Sheet1");

    // Ghi ra file Excel
    const wbout = XLSX.write(wb, { bookType: "xlsx", type: "array" });
    const blob = new Blob([wbout], {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    });

    // Tên file kèm ngày xuất
    const date = new Date().toISOString().slice(0, 10);
    const safeFileName = fileName.replace(/[^\w\-]/g, "_");
    saveAs(blob, `${safeFileName}_${date}.xlsx`);
  } catch (err) {
    console.error("❌ Lỗi khi export file Excel:", err);
  }
};

/**
 * 📥 Đọc file Excel và chuyển về dạng JSON
 * @param {File} file - File Excel được upload (.xlsx, .csv)
 * @returns {Promise<Array>} - Promise trả về mảng object JSON
 */
export const importFromExcel = (file) =>
  new Promise((resolve, reject) => {
    if (!file) {
      reject(new Error("Không có file để đọc!"));
      return;
    }

    try {
      const reader = new FileReader();

      reader.onload = (e) => {
        try {
          const data = new Uint8Array(e.target.result);
          const workbook = XLSX.read(data, { type: "array" });
          const sheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[sheetName];
          const json = XLSX.utils.sheet_to_json(worksheet, {
            defval: "", // giữ cột trống
          });
          resolve(json);
        } catch (parseErr) {
          console.error("❌ Lỗi khi parse Excel:", parseErr);
          reject(parseErr);
        }
      };

      reader.onerror = (err) => {
        console.error("❌ Lỗi khi đọc file Excel:", err);
        reject(err);
      };

      reader.readAsArrayBuffer(file);
    } catch (err) {
      console.error("❌ Lỗi không xác định khi đọc file:", err);
      reject(err);
    }
  });
