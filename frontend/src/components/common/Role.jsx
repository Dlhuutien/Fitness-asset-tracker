const roleColors = {
  "Người quản lý":
    "bg-cyan-500/15 text-cyan-700 border border-cyan-400 dark:bg-cyan-500/25 dark:text-cyan-300 dark:border-cyan-600",
  "Người quản trị":
    "bg-fuchsia-500/15 text-fuchsia-700 border border-fuchsia-400 dark:bg-fuchsia-500/25 dark:text-fuchsia-300 dark:border-fuchsia-600",
  "Nhân viên trực phòng":
    "bg-teal-500/15 text-teal-700 border border-teal-400 dark:bg-teal-500/25 dark:text-teal-300 dark:border-teal-600",
  "Nhân viên kĩ thuật":
    "bg-amber-500/15 text-amber-700 border border-amber-400 dark:bg-amber-500/25 dark:text-amber-300 dark:border-amber-600",
  // fallback
  "Khác":
    "bg-gray-300 text-gray-700 border border-gray-400 dark:bg-gray-600 dark:text-gray-200 dark:border-gray-500",
};

export default function Role({ role }) {
  return (
    <span
      className={`inline-block px-3 py-1 text-xs font-semibold rounded-lg whitespace-nowrap ${
        roleColors[role] || roleColors["Khác"]
      }`}
    >
      {role}
    </span>
  );
}
