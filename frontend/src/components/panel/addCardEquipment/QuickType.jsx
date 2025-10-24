import { useEffect, useState, useMemo } from "react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/buttonn";
import { Label } from "@/components/ui/label";
import { Loader2, Plus, AlertTriangle, FolderTree } from "lucide-react";
import CategoryTypeService from "@/services/categoryTypeService";
import CategoryMainService from "@/services/categoryMainService";
import { toast } from "sonner";

export default function EquipmentTypeQuickAdd({ open, onClose, onSuccess }) {
  const [types, setTypes] = useState([]);
  const [groups, setGroups] = useState([]);
  const [adding, setAdding] = useState(false);
  const [searchType, setSearchType] = useState("");
  const [form, setForm] = useState({ name: "", desc: "", group: "" });

  // 🔁 Load loại & nhóm
  useEffect(() => {
    if (!open) return;
    (async () => {
      try {
        const [typeList, groupList] = await Promise.all([
          CategoryTypeService.getAllWithDisplayName(),
          CategoryMainService.getAll(),
        ]);
        setTypes(typeList || []);
        setGroups(groupList || []);
      } catch (err) {
        console.error("❌ Lỗi khi tải loại:", err);
      }
    })();
  }, [open]);

  // 🔍 Lọc theo tìm kiếm
  const filteredTypes = useMemo(() => {
    const q = searchType.trim().toLowerCase();
    return q ? types.filter((t) => t.name.toLowerCase().includes(q)) : types;
  }, [searchType, types]);

  // 🚫 Kiểm tra trùng
  const isDuplicate = types.some(
    (t) =>
      t.name.toLowerCase().trim() === form.name.toLowerCase().trim() &&
      t.category_main_id === form.group
  );

  // 💾 Lưu loại mới
  const handleAddType = async () => {
    if (!form.group || !form.name || !form.desc) {
      toast.warning("⚠️ Vui lòng nhập đủ thông tin và chọn nhóm!");
      return;
    }
    // 🚫 Kiểm tra trùng tên loại (toàn hệ thống)
    const isDuplicate = types.some(
      (t) => t.name.toLowerCase().trim() === form.name.toLowerCase().trim()
    );

    setAdding(true);
    try {
      const created = await CategoryTypeService.create({
        name: form.name.trim(),
        description: form.desc.trim(),
        category_main_id: form.group,
      });
      toast.success(`✅ Đã thêm loại "${form.name}" thành công!`);
      setTypes((prev) => [...prev, created]);
      setForm({ name: "", desc: "", group: "" });
      if (onSuccess) onSuccess(created);
    } catch (err) {
      console.error("❌ Lỗi khi thêm loại:", err);
      toast.error("❌ Không thể thêm loại, vui lòng thử lại!");
    } finally {
      setAdding(false);
    }
  };

  return (
    <Sheet open={open} onOpenChange={onClose}>
      <SheetContent
        side="right"
        className="!w-[600px] !max-w-none bg-white dark:bg-gray-800 border-l border-gray-200 dark:border-gray-700 p-6 overflow-y-auto"
      >
        <SheetHeader>
          <SheetTitle className="text-lg font-semibold text-emerald-600 flex items-center gap-2">
            <Plus className="w-5 h-5" /> Thêm loại thiết bị
          </SheetTitle>
        </SheetHeader>

        {/* 🧩 Form thêm loại */}
        <div className="mt-6 space-y-4">
          <div>
            <Label className="text-sm text-gray-600 dark:text-gray-300">
              Nhóm thiết bị
            </Label>
            <select
              className="w-full h-10 mt-1 rounded-md border dark:bg-gray-700 dark:text-white px-2 text-sm"
              value={form.group}
              onChange={(e) =>
                setForm((prev) => ({ ...prev, group: e.target.value }))
              }
            >
              <option value="">-- Chọn nhóm thiết bị --</option>
              {groups.map((g) => (
                <option key={g.id} value={g.id}>
                  {g.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <Label className="text-sm text-gray-600 dark:text-gray-300">
              Tên loại
            </Label>
            <Input
              placeholder="VD: Treadmill"
              value={form.name}
              onChange={(e) =>
                setForm((prev) => ({ ...prev, name: e.target.value }))
              }
              className={`mt-1 dark:bg-gray-700 dark:text-white ${
                isDuplicate ? "border-red-500 focus-visible:ring-red-500" : ""
              }`}
            />
          </div>

          <div>
            <Label className="text-sm text-gray-600 dark:text-gray-300">
              Mô tả loại
            </Label>
            <Input
              placeholder="VD: Dành cho thiết bị chạy bộ, xe đạp, ..."
              value={form.desc}
              onChange={(e) =>
                setForm((prev) => ({ ...prev, desc: e.target.value }))
              }
              className="mt-1 dark:bg-gray-700 dark:text-white"
            />
          </div>

          {isDuplicate && (
            <p className="text-xs text-red-500 flex items-center gap-1 mt-1">
              <AlertTriangle className="w-3.5 h-3.5" />
              Tên loại này đã tồn tại trong hệ thống!
            </p>
          )}
        </div>

        {/* 🧾 Danh sách loại hiện có */}
        <div className="mt-6 border-t border-gray-200 dark:border-gray-700 pt-4">
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-sm font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-2">
              <FolderTree className="w-4 h-4" /> Loại hiện có
              <span className="text-xs text-gray-500 dark:text-gray-400">
                ({types.length})
              </span>
            </h4>

            <Input
              placeholder="Tìm loại..."
              value={searchType}
              onChange={(e) => setSearchType(e.target.value)}
              className="h-8 w-40 text-xs dark:bg-gray-700 dark:text-white"
            />
          </div>

          <div className="max-h-[220px] overflow-y-auto border rounded-lg dark:border-gray-700 bg-gray-50/70 dark:bg-gray-900/60 divide-y divide-gray-200 dark:divide-gray-700">
            {filteredTypes.length > 0 ? (
              filteredTypes.map((t) => (
                <div
                  key={t.id}
                  className="px-3 py-2 flex justify-between items-start hover:bg-white/90 dark:hover:bg-gray-800/70 transition-all"
                >
                  <div>
                    <p className="text-sm font-medium text-gray-800 dark:text-gray-100">
                      {t.name}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      Mã: {t.id} —{" "}
                      <span className="text-gray-500">
                        Nhóm: {t.main_name || "Không xác định"}
                      </span>
                    </p>
                    {t.description && (
                      <p className="text-xs text-gray-400 italic mt-0.5 line-clamp-2">
                        {t.description}
                      </p>
                    )}
                  </div>
                  <div className="w-2 h-2 rounded-full bg-emerald-400/80" />
                </div>
              ))
            ) : (
              <div className="text-center text-xs text-gray-500 dark:text-gray-400 py-4">
                Không có loại thiết bị nào.
              </div>
            )}
          </div>
        </div>

        {/* 🔘 Nút lưu */}
        <div className="flex justify-start pt-6">
          <Button
            onClick={handleAddType}
            disabled={adding || isDuplicate}
            className={`bg-emerald-500 hover:bg-emerald-600 text-white flex items-center gap-2 px-6 ${
              isDuplicate ? "opacity-60 cursor-not-allowed" : ""
            }`}
          >
            {adding ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" /> Đang lưu...
              </>
            ) : (
              "Lưu loại"
            )}
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
