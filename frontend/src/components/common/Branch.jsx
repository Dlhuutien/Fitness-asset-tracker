const branchColors = {
  // Hồ Chí Minh
  "Chi nhánh Quận 1":
    "bg-teal-500/15 text-teal-700 border border-teal-400 dark:bg-teal-500/30 dark:text-teal-300 dark:border-teal-600",
  "Chi nhánh Quận 3":
    "bg-cyan-500/15 text-cyan-700 border border-cyan-400 dark:bg-cyan-500/30 dark:text-cyan-300 dark:border-cyan-600",
  "Chi nhánh Quận 7":
    "bg-pink-500/15 text-pink-700 border border-pink-400 dark:bg-pink-500/30 dark:text-pink-300 dark:border-pink-600",
  "Chi nhánh Quận 10":
    "bg-indigo-500/15 text-indigo-700 border border-indigo-400 dark:bg-indigo-500/30 dark:text-indigo-300 dark:border-indigo-600",
  "Chi nhánh Quận Gò Vấp":
    "bg-purple-500/15 text-purple-700 border border-purple-400 dark:bg-purple-500/30 dark:text-purple-300 dark:border-purple-600",

  // Các thành phố khác
  "Chi nhánh HCM":
    "bg-amber-500/15 text-amber-700 border border-amber-400 dark:bg-amber-500/30 dark:text-amber-300 dark:border-amber-600",
  "Chi nhánh Hà Nội":
    "bg-blue-500/15 text-blue-700 border border-blue-400 dark:bg-blue-500/30 dark:text-blue-300 dark:border-blue-600",
  "Chi nhánh Đà Nẵng":
    "bg-lime-500/15 text-lime-700 border border-lime-400 dark:bg-lime-500/30 dark:text-lime-300 dark:border-lime-600",
  "Chi nhánh Cần Thơ":
    "bg-rose-500/15 text-rose-700 border border-rose-400 dark:bg-rose-500/30 dark:text-rose-300 dark:border-rose-600",
};

export default function Branch({ branch }) {
  return (
    <span
      className={`inline-block px-3 py-1 text-xs font-semibold rounded-lg whitespace-nowrap 
      ${
        branchColors[branch] ||
        "bg-gray-200 text-gray-700 border border-gray-400 dark:bg-gray-600 dark:text-gray-200 dark:border-gray-500"
      }`}
    >
      {branch}
    </span>
  );
}
