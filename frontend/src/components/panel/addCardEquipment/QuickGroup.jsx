import { useState, useEffect } from "react";
import { toast } from "sonner";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/buttonn";
import { Loader2, AlertTriangle } from "lucide-react";
import CategoryMainService from "@/services/categoryMainService";
import { Label } from "@/components/ui/label";

export default function EquipmentGroupQuickAdd({ open, onClose, onSuccess }) {
  const [loading, setLoading] = useState(false);
  const [groups, setGroups] = useState([]); // 🔹 danh sách nhóm hiện có
  const [form, setForm] = useState({
    name: "",
    description: "",
    image: null,
    preview: "",
  });

  const [errorMsg, setErrorMsg] = useState("");
  const [searchGroup, setSearchGroup] = useState("");

  const filteredGroups = groups.filter((g) =>
    g.name.toLowerCase().includes(searchGroup.toLowerCase())
  );

  // 🧭 Load danh sách nhóm hiện có khi mở form
  useEffect(() => {
    if (open) {
      (async () => {
        try {
          const data = await CategoryMainService.getAll();
          setGroups(data || []);
        } catch (err) {
          console.error("❌ Lỗi tải nhóm:", err);
        }
      })();
    }
  }, [open]);

  // 📷 Upload ảnh
  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const previewURL = URL.createObjectURL(file);
      setForm((prev) => ({ ...prev, image: file, preview: previewURL }));
    }
  };

  // 🧩 Kiểm tra trùng tên
  const isDuplicate = groups.some(
    (g) => g.name.toLowerCase().trim() === form.name.toLowerCase().trim()
  );

  // 💾 Lưu nhóm mới
  const handleSubmit = async () => {
    if (!form.name || !form.description) {
      toast.warning("⚠️ Vui lòng nhập đủ tên và mô tả nhóm!");
      return;
    }
    if (isDuplicate) {
      toast.error("⚠️ Nhóm này đã tồn tại, vui lòng nhập tên khác!");
      return;
    }

    setLoading(true);
    try {
      const created = await CategoryMainService.create({
        name: form.name.trim(),
        description: form.description.trim(),
        image: form.image,
      });

      toast.success(`✅ Đã thêm nhóm "${form.name}" thành công!`);
      if (onSuccess) onSuccess(created);

      // ✅ Chỉ reset form và reload danh sách — KHÔNG đóng sheet
      setForm({ name: "", description: "", image: null, preview: "" });

      // 🔁 Cập nhật danh sách ngay
      const updated = await CategoryMainService.getAll();
      setGroups(updated || []);
    } catch (err) {
      console.error("❌ Lỗi khi thêm nhóm:", err);
      toast.error("❌ Không thể thêm nhóm, vui lòng thử lại!");
    } finally {
      setLoading(false);
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
            ➕ Thêm nhóm thiết bị
          </SheetTitle>
        </SheetHeader>

        {/* Form thêm nhanh */}
        <div className="mt-6 space-y-4">
          <div className="space-y-1">
            <Label className="text-sm font-semibold">Tên nhóm</Label>
            <Input
              placeholder="VD: Cardio"
              value={form.name}
              onChange={(e) => {
                setForm((prev) => ({ ...prev, name: e.target.value }));
                setErrorMsg("");
              }}
              className={`dark:bg-gray-700 dark:text-white ${
                isDuplicate ? "border-red-500 focus-visible:ring-red-500" : ""
              }`}
            />
            {isDuplicate && (
              <p className="text-xs text-red-500 flex items-center gap-1 mt-1">
                <AlertTriangle className="w-3.5 h-3.5" /> Tên nhóm này đã tồn
                tại!
              </p>
            )}
          </div>

          <div className="space-y-1">
            <Label className="text-sm font-semibold">Mô tả nhóm</Label>
            <Input
              placeholder="VD: Dành cho thiết bị Cardio như máy chạy, xe đạp..."
              value={form.description}
              onChange={(e) =>
                setForm((prev) => ({ ...prev, description: e.target.value }))
              }
              className="dark:bg-gray-700 dark:text-white"
            />
          </div>

          {/* Upload ảnh */}
          <div>
            <Label className="text-sm font-semibold">Ảnh nhóm (tùy chọn)</Label>
            <div className="border-2 border-dashed rounded-md flex items-center justify-center w-40 h-40 mt-2 overflow-hidden cursor-pointer hover:border-emerald-500 transition relative">
              {form.preview ? (
                <img
                  src={form.preview}
                  alt="preview"
                  className="object-cover w-full h-full"
                />
              ) : (
                <span className="text-xs text-gray-400">Chọn ảnh...</span>
              )}
              <input
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                className="absolute inset-0 opacity-0 cursor-pointer"
              />
            </div>
          </div>

          {/* Danh sách nhóm hiện có */}
          {groups.length > 0 && (
            <div className="mt-8 border-t border-gray-200 dark:border-gray-700 pt-4">
              {/* Header + Search */}
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-sm font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-2">
                  🗂 Nhóm hiện có
                  <span className="text-xs text-gray-500 dark:text-gray-400">
                    ({groups.length})
                  </span>
                </h4>

                <Input
                  type="text"
                  placeholder="Tìm nhóm..."
                  value={searchGroup}
                  onChange={(e) => setSearchGroup(e.target.value)}
                  className="h-8 w-40 text-xs dark:bg-gray-700 dark:text-white"
                />
              </div>

              {/* Danh sách dạng list */}
              <div className="max-h-[240px] overflow-y-auto border rounded-lg dark:border-gray-700 bg-gray-50/70 dark:bg-gray-900/60 divide-y divide-gray-200 dark:divide-gray-700">
                {filteredGroups.length > 0 ? (
                  filteredGroups.map((g) => (
                    <div
                      key={g.id}
                      className="flex items-center justify-between px-3 py-2 hover:bg-white/90 dark:hover:bg-gray-800/70 transition-all"
                    >
                      <div>
                        <p className="text-sm font-medium text-gray-800 dark:text-gray-100">
                          {g.name}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          Mã: {g.id}
                          {g.description && (
                            <span className="ml-2 text-gray-400 italic">
                              — {g.description}
                            </span>
                          )}
                        </p>
                      </div>
                      <div className="w-2 h-2 rounded-full bg-emerald-400/70" />
                    </div>
                  ))
                ) : (
                  <div className="text-center text-xs text-gray-500 dark:text-gray-400 py-4">
                    Không tìm thấy nhóm nào phù hợp.
                  </div>
                )}
              </div>
            </div>
          )}

          <div className="flex justify-start pt-4">
            <Button
              onClick={handleSubmit}
              disabled={loading || isDuplicate}
              className={`flex items-center gap-2 px-6 ${
                isDuplicate
                  ? "bg-gray-400 cursor-not-allowed"
                  : "bg-emerald-500 hover:bg-emerald-600 text-white"
              }`}
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" /> Đang lưu...
                </>
              ) : (
                "Lưu nhóm"
              )}
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
