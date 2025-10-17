import { useState } from "react";
import { toast } from "sonner";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/buttonn";
import { Loader2 } from "lucide-react";
import CategoryMainService from "@/services/categoryMainService";
import { Label } from "@/components/ui/label";

export default function EquipmentGroupQuickAdd({ open, onClose, onSuccess }) {
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    name: "",
    description: "",
    image: null,
    preview: "",
  });

  // 📷 Upload ảnh
  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const previewURL = URL.createObjectURL(file);
      setForm((prev) => ({ ...prev, image: file, preview: previewURL }));
    }
  };

  // 💾 Lưu nhóm mới
  const handleSubmit = async () => {
    if (!form.name || !form.description) {
      toast.warning("⚠️ Vui lòng nhập đủ tên và mô tả nhóm!");
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
      setForm({ name: "", description: "", image: null, preview: "" });
      onClose();
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
          <Input
            placeholder="Tên nhóm VD: Cardio"
            value={form.name}
            onChange={(e) =>
              setForm((prev) => ({ ...prev, name: e.target.value }))
            }
            className="dark:bg-gray-700 dark:text-white"
          />
          <Input
            placeholder="Mô tả nhóm"
            value={form.description}
            onChange={(e) =>
              setForm((prev) => ({ ...prev, description: e.target.value }))
            }
            className="dark:bg-gray-700 dark:text-white"
          />

          {/* Upload ảnh */}
          <div>
            <Label className="text-xs">Ảnh nhóm (tùy chọn)</Label>
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

          <div className="flex justify-start pt-4">
            <Button
              onClick={handleSubmit}
              disabled={loading}
              className="bg-emerald-500 hover:bg-emerald-600 text-white flex items-center gap-2 px-6"
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
