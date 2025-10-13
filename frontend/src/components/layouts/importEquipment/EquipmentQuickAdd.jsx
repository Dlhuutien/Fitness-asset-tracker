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

export default function EquipmentQuickAdd({ open, onClose, onSuccess }) {
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

  // 🧮 Tự sinh mã thiết bị
  useEffect(() => {
    if (form.category_type_id && form.vendor_id) {
      const selectedType = types.find((t) => t.id === form.category_type_id);
      const vendorCode = vendors.find((v) => v.id === form.vendor_id)?.id || "";
      if (selectedType && vendorCode) {
        setForm((prev) => ({
          ...prev,
          code: `${selectedType.category_main_id}${selectedType.id}${vendorCode}`.toUpperCase(),
        }));
      }
    }
  }, [form.category_type_id, form.vendor_id, types, vendors]);

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
    if (!form.name || !form.vendor_id || !form.category_type_id) {
      toast.warning("⚠️ Vui lòng nhập tên và chọn loại + nhà cung cấp!");
      return;
    }

    try {
      setLoading(true);

      const payload = {
        name: form.name,
        vendor_id: form.vendor_id,
        category_type_id: form.category_type_id,
        warranty_duration: Number(form.warranty_duration),
        description: form.description,
        image: form.image || null,
        attributes: [], // ❌ bỏ attribute
      };

      const newEquipment = await EquipmentService.create(payload);

      toast.success(`✅ Đã thêm thiết bị "${form.name}" thành công!`);
      mutate(`${API}equipment`);
      onSuccess?.(newEquipment);
      onClose();
    } catch (err) {
      console.error("❌ Lỗi khi thêm thiết bị:", err);
      toast.error("Không thể thêm thiết bị mới!");
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
                onValueChange={(val) =>
                  setForm((prev) => ({ ...prev, category_type_id: val, code: "" }))
                }
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
                onValueChange={(val) =>
                  setForm((prev) => ({ ...prev, vendor_id: val, code: "" }))
                }
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
            </div>

            <div>
              <Label className="text-sm">Mã thiết bị (tự sinh)</Label>
              <Input value={form.code} readOnly className="h-9 dark:bg-gray-700" />
            </div>

            <div>
              <Label className="text-sm">Bảo hành (năm)</Label>
              <Input
                type="number"
                min="1"
                value={form.warranty_duration}
                onChange={(e) => handleChange("warranty_duration", e.target.value)}
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
