// src/components/common/Status.jsx
const statusColors = {
  // Thiết bị
  "Hoạt động":
    "bg-emerald-500/15 text-emerald-700 border border-emerald-400 dark:bg-emerald-400/20 dark:text-emerald-300 dark:border-emerald-500",
  "Ngưng sử dụng":
    "bg-gray-400/20 text-gray-700 border border-gray-400 dark:bg-gray-500/30 dark:text-gray-300 dark:border-gray-600",
  "Ngừng tạm thời":
    "bg-gradient-to-r from-amber-300 to-yellow-400 text-gray-800 font-medium border-none shadow-sm",
  "Thiết bị trong kho":
    "bg-blue-500/15 text-blue-700 border border-blue-400 dark:bg-blue-500/30 dark:text-blue-300 dark:border-blue-600",

  // Bảo trì
  "Đang bảo trì":
    "bg-amber-500/15 text-amber-700 border border-amber-400 dark:bg-amber-500/30 dark:text-amber-300 dark:border-amber-600",
  "Bảo trì thành công":
    "bg-green-500/15 text-green-700 border border-green-400 dark:bg-green-500/30 dark:text-green-300 dark:border-green-600",
  "Bảo trì thất bại":
    "bg-rose-500/15 text-rose-700 border border-rose-400 dark:bg-rose-500/30 dark:text-rose-300 dark:border-rose-600",
  "Sửa thành công":
    "bg-green-100 text-green-700 border border-green-400 dark:bg-green-800/30 dark:text-green-300 dark:border-green-600",
  // 👉 đổi sang tím nhạt (violet) cho khác biệt
  "Sửa thất bại":
    "bg-violet-500/15 text-violet-700 border border-violet-400 dark:bg-violet-500/30 dark:text-violet-300 dark:border-violet-600",

  // Nhân sự
  "Đang làm":
    "bg-indigo-500/15 text-indigo-700 border border-indigo-400 dark:bg-indigo-500/30 dark:text-indigo-300 dark:border-indigo-600",
  "Đã nghỉ":
    "bg-orange-500/15 text-orange-700 border border-orange-400 dark:bg-orange-500/30 dark:text-orange-300 dark:border-orange-600",

  // Hạn bảo hành
  "Còn hạn":
    "bg-green-500/15 text-green-700 border border-green-400 dark:bg-green-500/30 dark:text-green-300 dark:border-green-600",
  "Hết hạn":
    "bg-red-500/15 text-red-700 border border-red-400 dark:bg-red-500/30 dark:text-red-300 dark:border-red-600",
};

export default function Status({ status }) {
  return (
    <span
      className={`inline-block px-3 py-1 text-xs font-semibold rounded-lg whitespace-nowrap ${
        statusColors[status] ||
        "bg-gray-200 text-gray-700 border border-gray-400 dark:bg-gray-600 dark:text-gray-200 dark:border-gray-500"
      }`}
    >
      {status}
    </span>
  );
}
