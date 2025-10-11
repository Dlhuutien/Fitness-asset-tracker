// src/services/Files.js
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";

/**
 * 📤 Xuất dữ liệu ra file Excel (.xlsx)
 * @param {Array} data - Dữ liệu JSON cần export
 * @param {String} fileName - Tên file (không cần .xlsx)
 */
export const exportToExcel = (data, fileName = "export") => {
  if (!data || data.length === 0) {
    console.warn("⚠️ Không có dữ liệu để export!");
    return;
  }

  const ws = XLSX.utils.json_to_sheet(data);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Sheet1");

  const wbout = XLSX.write(wb, { bookType: "xlsx", type: "array" });
  const blob = new Blob([wbout], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });
  saveAs(blob, `${fileName}_${new Date().toISOString().slice(0, 10)}.xlsx`);
};

/**
 * 📥 Đọc file Excel và chuyển về dạng JSON
 * @param {File} file - File Excel được upload
 * @returns {Promise<Array>} - Promise trả về mảng object
 */
export const importFromExcel = (file) =>
  new Promise((resolve, reject) => {
    try {
      const reader = new FileReader();
      reader.onload = (e) => {
        const data = new Uint8Array(e.target.result);
        const workbook = XLSX.read(data, { type: "array" });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const json = XLSX.utils.sheet_to_json(worksheet);
        resolve(json);
      };
      reader.onerror = reject;
      reader.readAsArrayBuffer(file);
    } catch (err) {
      reject(err);
    }
  });
