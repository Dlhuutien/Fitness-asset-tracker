import { useEffect, useState } from "react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/buttonn";
import { Label } from "@/components/ui/label";
import { Loader2, Plus } from "lucide-react";
import CategoryTypeService from "@/services/categoryTypeService";
import CategoryMainService from "@/services/categoryMainService";
import { toast } from "sonner";

export default function EquipmentTypeQuickAdd({ open, onClose, onSuccess }) {
  const [types, setTypes] = useState([]);
  const [groups, setGroups] = useState([]);
  const [adding, setAdding] = useState(false);
  const [form, setForm] = useState({
    name: "",
    desc: "",
    group: "",
  });

  // 🔁 Load dữ liệu loại & nhóm
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

  // 💾 Thêm loại mới
  const handleAddType = async () => {
    if (!form.name || !form.desc || !form.group) {
      toast.warning("⚠️ Vui lòng nhập đủ thông tin và chọn nhóm!");
      return;
    }
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
        className={`!w-[600px] !max-w-none bg-white dark:bg-gray-800 border-l border-gray-200 dark:border-gray-700 p-6 overflow-y-auto ${
          open ? "animate-slide-in" : "animate-slide-out"
        }`}
      >
        <SheetHeader>
          <SheetTitle className="text-lg font-semibold text-emerald-600 flex items-center gap-2">
            🧩 Quản lý loại thiết bị
          </SheetTitle>
        </SheetHeader>

        {/* Danh sách loại hiện có */}
        <div className="mt-4 max-h-[300px] overflow-y-auto border rounded-lg divide-y dark:divide-gray-700">
          {types.length > 0 ? (
            types.map((t) => (
              <div
                key={t.id}
                onClick={() => {
                  if (onSuccess) onSuccess(t);
                  toast.success(`✅ Đã chọn loại "${t.name}"`);
                  onClose();
                }}
                className="p-3 hover:bg-emerald-50 dark:hover:bg-gray-700 cursor-pointer transition"
              >
                <p className="font-semibold text-emerald-600 text-sm">
                  {t.name} <span className="text-gray-400">({t.id})</span>
                </p>
                <p className="text-xs text-gray-500">
                  Thuộc nhóm: <b>{t.main_name || "Không xác định"}</b>
                </p>
              </div>
            ))
          ) : (
            <p className="text-center text-gray-500 text-sm py-4">
              Không có loại thiết bị nào.
            </p>
          )}
        </div>

        {/* Form thêm nhanh */}
        <div className="mt-6 border-t pt-4 space-y-3">
          <p className="font-semibold text-emerald-600 text-sm flex items-center gap-1">
            <Plus className="w-4 h-4" /> Thêm loại mới
          </p>

          <div className="grid grid-cols-2 gap-3">
            <select
              className="col-span-2 h-10 rounded-md border dark:bg-gray-700 dark:text-white px-2 text-sm"
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
            <Input
              placeholder="Tên loại VD: Treadmill"
              value={form.name}
              onChange={(e) =>
                setForm((prev) => ({ ...prev, name: e.target.value }))
              }
              className="dark:bg-gray-700 dark:text-white"
            />
            <Input
              placeholder="Mô tả loại"
              value={form.desc}
              onChange={(e) =>
                setForm((prev) => ({ ...prev, desc: e.target.value }))
              }
              className="dark:bg-gray-700 dark:text-white"
            />
          </div>

          <div className="flex justify-end pt-2">
            <Button
              onClick={handleAddType}
              disabled={adding}
              className="bg-emerald-500 hover:bg-emerald-600 text-white flex items-center gap-2 px-6"
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
        </div>
      </SheetContent>
    </Sheet>
  );
}
