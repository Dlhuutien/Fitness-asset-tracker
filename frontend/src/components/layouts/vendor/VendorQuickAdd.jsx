import { useEffect, useState } from "react";
import { toast } from "sonner";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/buttonn";
import VendorService from "@/services/vendorService";
import { Loader2 } from "lucide-react";

export default function VendorQuickAdd({ open, onClose, onSuccess }) {
  const [form, setForm] = useState({
    id: "",
    name: "",
    origin: "",
    description: "",
  });
  const [loading, setLoading] = useState(false);

  const handleChange = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const resetForm = () => {
    setForm({ id: "", name: "", origin: "", description: "" });
  };

  const handleSubmit = async () => {
    if (!form.id || !form.name || !form.origin) {
      toast.warning("⚠️ Vui lòng nhập đầy đủ Mã, Tên và Quốc gia!");
      return;
    }

    try {
      setLoading(true);
      const newVendor = await VendorService.create({
        id: form.id.trim().toUpperCase(),
        name: form.name.trim(),
        origin: form.origin.trim().toUpperCase(),
        description: form.description.trim(),
      });

      toast.success(`✅ Đã thêm nhà cung cấp "${form.name}" thành công!`);
      resetForm();
      if (onSuccess) onSuccess(newVendor); // truyền ngược lại cho page
      onClose();
    } catch (err) {
      console.error("❌ Lỗi khi thêm vendor:", err);
      toast.error("❌ Không thể thêm nhà cung cấp, vui lòng thử lại!");
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
            ➕ Thêm nhà cung cấp mới
          </SheetTitle>
        </SheetHeader>

        <div className="mt-6 space-y-4">
          <Input
            placeholder="Mã nhà cung cấp (VD: MT)"
            value={form.id}
            onChange={(e) => handleChange("id", e.target.value.toUpperCase())}
            className="dark:bg-gray-700 dark:text-white"
          />
          <Input
            placeholder="Tên nhà cung cấp"
            value={form.name}
            onChange={(e) => handleChange("name", e.target.value)}
            className="dark:bg-gray-700 dark:text-white"
          />
          <Input
            placeholder="Quốc gia (VD: USA, JPN, VN)"
            value={form.origin}
            onChange={(e) =>
              handleChange("origin", e.target.value.toUpperCase())
            }
            className="dark:bg-gray-700 dark:text-white"
          />
          <Input
            placeholder="Mô tả (tùy chọn)"
            value={form.description}
            onChange={(e) => handleChange("description", e.target.value)}
            className="dark:bg-gray-700 dark:text-white"
          />

          <div className="flex justify-end">
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
                "Lưu"
              )}
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
