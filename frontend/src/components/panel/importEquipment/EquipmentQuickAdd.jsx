import { useState, useEffect } from "react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/buttonn";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, Upload } from "lucide-react";
import { toast } from "sonner";
import { useSWRConfig } from "swr";
import { API } from "@/config/url";

import EquipmentService from "@/services/equipmentService";
import VendorService from "@/services/vendorService";
import CategoryTypeService from "@/services/categoryTypeService";

export default function EquipmentQuickAdd({
  open,
  onClose,
  onSuccess,
  vendorId,
}) {
  const { mutate } = useSWRConfig();

  const [form, setForm] = useState({
    name: "",
    category_type_id: "",
    vendor_id: "",
    description: "",
    warranty_duration: 2,
    image: null,
    preview: "",
    code: "",
  });

  const [vendors, setVendors] = useState([]);
  const [types, setTypes] = useState([]);
  const [loading, setLoading] = useState(false);

  // 🧭 Load danh sách vendor + loại thiết bị
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [vendorList, typeList] = await Promise.all([
          VendorService.getAll(),
          CategoryTypeService.getAllWithDisplayName(),
        ]);
        setVendors(vendorList);
        setTypes(typeList);
      } catch (err) {
        console.error("❌ Lỗi khi tải vendor/type:", err);
        toast.error("Không thể tải danh sách nhà cung cấp hoặc loại thiết bị!");
      }
    };
    if (open) fetchData();
  }, [open]);

  // ✅ Khi mở popup và có vendorId → tự set vào form
  useEffect(() => {
    if (open && vendorId) {
      setForm((prev) => ({ ...prev, vendor_id: vendorId }));
    }
  }, [open, vendorId]);

  const handleChange = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const previewURL = URL.createObjectURL(file);
      setForm((prev) => ({ ...prev, image: file, preview: previewURL }));
    }
  };

  // 🧾 Gửi API
  const handleSubmit = async () => {
    if (!form.name) return toast.warning("⚠️ Nhập tên thiết bị!");
    if (!form.vendor_id) return toast.warning("⚠️ Chưa có nhà cung cấp!");
    if (!form.category_type_id)
      return toast.warning("⚠️ Chưa chọn loại thiết bị!");

    try {
      setLoading(true);

      const payload = {
        name: form.name,
        vendor_id: form.vendor_id,
        category_type_id: form.category_type_id,
        warranty_duration: Number(form.warranty_duration),
        description: form.description,
        image: form.image || null,
        attributes: [], // Giữ nguyên
      };

      const newEquipment = await EquipmentService.create(payload);

      toast.success(`✅ Đã thêm thiết bị "${form.name}" thành công!`);
      mutate(`${API}equipment/all`); // refresh đúng key SWR
      onSuccess?.(newEquipment);
      onClose();
    } catch (err) {
      console.error("❌ Lỗi khi thêm thiết bị:", err);
      const msg =
        err?.response?.data?.message || "Không thể thêm thiết bị mới!";
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Sheet open={open} onOpenChange={onClose}>
      <SheetContent
        side="right"
        className="!w-[700px] !max-w-none bg-white dark:bg-gray-800 border-l border-gray-200 dark:border-gray-700 p-6 overflow-y-auto"
      >
        <SheetHeader>
          <SheetTitle className="text-lg font-semibold text-emerald-600">
            ➕ Thêm thiết bị mới
          </SheetTitle>
        </SheetHeader>

        <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Cột trái */}
          <div className="space-y-4">
            <div>
              <Label className="text-sm">Tên thiết bị</Label>
              <Input
                placeholder="VD: Máy chạy bộ mini"
                value={form.name}
                onChange={(e) => handleChange("name", e.target.value)}
                className="dark:bg-gray-700 dark:text-white"
              />
            </div>

            <div>
              <Label className="text-sm">Loại thiết bị</Label>
              <Select
                value={form.category_type_id}
                onValueChange={(val) => handleChange("category_type_id", val)}
              >
                <SelectTrigger className="h-9 text-sm dark:bg-gray-700 dark:text-white">
                  <SelectValue placeholder="Chọn loại thiết bị" />
                </SelectTrigger>
                <SelectContent className="bg-white dark:bg-gray-800 border">
                  {types.map((t) => (
                    <SelectItem key={t.id} value={t.id}>
                      {t.displayName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label className="text-sm">Nhà cung cấp</Label>
              <Select
                value={form.vendor_id}
                disabled={!!vendorId}
                onValueChange={(val) => handleChange("vendor_id", val)}
              >
                <SelectTrigger className="h-9 text-sm dark:bg-gray-700 dark:text-white">
                  <SelectValue placeholder="Chọn nhà cung cấp" />
                </SelectTrigger>
                <SelectContent className="bg-white dark:bg-gray-800 border">
                  {vendors.map((v) => (
                    <SelectItem key={v.id} value={v.id}>
                      {v.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {vendorId && (
                <p className="text-xs text-emerald-500 mt-1 italic">
                  (Lấy từ nhà cung cấp đang nhập hàng)
                </p>
              )}
            </div>

            <div>
              <Label className="text-sm">Bảo hành (năm)</Label>
              <Input
                type="number"
                min="1"
                value={form.warranty_duration}
                onChange={(e) =>
                  handleChange("warranty_duration", e.target.value)
                }
                className="h-9 dark:bg-gray-700 dark:text-white"
              />
            </div>

            <div>
              <Label className="text-sm">Mô tả</Label>
              <Textarea
                placeholder="Nhập mô tả thiết bị..."
                value={form.description}
                onChange={(e) => handleChange("description", e.target.value)}
                className="text-sm dark:bg-gray-700 dark:text-white"
              />
            </div>
          </div>

          {/* Cột phải */}
          <div className="space-y-4">
            <Label className="text-sm">Hình ảnh</Label>
            <div className="w-48 h-48 border-2 border-dashed rounded-md flex items-center justify-center relative overflow-hidden">
              {form.image ? (
                <img
                  src={form.preview || URL.createObjectURL(form.image)}
                  alt="preview"
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="flex flex-col items-center text-gray-500 text-sm">
                  <Upload className="h-6 w-6 mb-1" />
                  Chọn ảnh
                </div>
              )}
              <input
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                className="absolute inset-0 opacity-0 cursor-pointer"
              />
            </div>

            <div className="flex justify-end pt-4">
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
                  "Lưu thiết bị"
                )}
              </Button>
            </div>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
