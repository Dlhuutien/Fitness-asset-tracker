// src/components/panel/importEquipment/BranchSelector.jsx
import { Button } from "@/components/ui/buttonn";
import { RefreshCw } from "lucide-react";
import { toast } from "sonner";
import BranchService from "@/services/branchService";

export default function BranchSelector({
  branches,
  selectedBranch,
  setSelectedBranch,
  isSuperAdmin,
  branchId,
}) {
  return (
    <div className="bg-white dark:bg-gray-800 p-5 rounded-lg shadow space-y-3">
      <h3 className="font-semibold text-emerald-600 text-lg">
        🏬 Chi nhánh nhập hàng
      </h3>

      {isSuperAdmin ? (
        <div className="flex items-center gap-2">
          <select
            value={selectedBranch}
            onChange={(e) => setSelectedBranch(e.target.value)}
            className="border rounded-md p-2 w-full dark:bg-gray-700 dark:text-white text-sm"
          >
            <option value="">-- Chọn chi nhánh --</option>
            {branches.map((b) => (
              <option key={b.id} value={b.id}>
                {b.name} ({b.id})
              </option>
            ))}
          </select>
          <Button
            size="icon"
            variant="outline"
            onClick={async () => {
              const data = await BranchService.getAll();
              toast.success("🔄 Danh sách chi nhánh đã làm mới!");
            }}
          >
            <RefreshCw size={16} />
          </Button>
        </div>
      ) : (
        <div className="flex items-center justify-between">
          <p className="text-sm font-semibold text-emerald-600">
            Bạn đang nhập hàng cho chi nhánh:
          </p>
          <span className="px-3 py-1 rounded-lg bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300 font-semibold text-sm border border-emerald-400/50">
            {branches.find((b) => b.id === branchId)?.name || branchId}
          </span>
        </div>
      )}
    </div>
  );
}
