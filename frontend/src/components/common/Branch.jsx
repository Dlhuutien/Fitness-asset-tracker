// src/components/common/BranchTag.jsx
const branchStyles = {
  GV: "bg-emerald-500/15 text-emerald-700 border border-emerald-400 dark:bg-emerald-500/20 dark:text-emerald-300 dark:border-emerald-500",
  Q3: "bg-blue-500/15 text-blue-700 border border-blue-400 dark:bg-blue-500/20 dark:text-blue-300 dark:border-blue-600",
  G3: "bg-orange-500/15 text-orange-700 border border-orange-400 dark:bg-orange-500/20 dark:text-orange-300 dark:border-orange-600",
};

const branchNames = {
  GV: "FitX Gym GV",
  Q3: "FitX Gym G3",
  G3: "FitX Gym G3",
};

export default function Branch({ id }) {
  const style =
    branchStyles[id] ||
    "bg-gray-300/20 text-gray-700 border border-gray-400 dark:bg-gray-700/20 dark:text-gray-200 dark:border-gray-600";
  const name = branchNames[id] || `Chi nhánh ${id}`;

  return (
    <span
      className={`inline-flex items-center px-3 py-1 text-xs font-semibold rounded-lg whitespace-nowrap ${style}`}
    >
      {name}
    </span>
  );
}
