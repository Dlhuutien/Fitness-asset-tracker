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
import { Label } from "@/components/ui/label";
import { Loader2, AlertTriangle } from "lucide-react";
import VendorService from "@/services/vendorService";
import CountrySelect from "@/components/common/CountrySelect";
import countryList from "react-select-country-list";
import Flag from "react-world-flags";

export default function VendorQuickAdd({ open, onClose, onSuccess }) {
  const [vendors, setVendors] = useState([]);
  const [form, setForm] = useState({
    name: "",
    origin: "",
    description: "",
  });
  const [loading, setLoading] = useState(false);
  const [searchVendor, setSearchVendor] = useState("");

  const filteredVendors = vendors.filter((v) =>
    v.name.toLowerCase().includes(searchVendor.toLowerCase())
  );

  // 🧭 Load danh sách vendor hiện có khi mở
  useEffect(() => {
    if (open) {
      (async () => {
        try {
          const data = await VendorService.getAll();
          setVendors(data || []);
        } catch (err) {
          console.error("❌ Lỗi tải vendor:", err);
        }
      })();
    }
  }, [open]);

  const handleChange = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  // 🧩 Kiểm tra trùng tên
  const isDuplicate = vendors.some(
    (v) => v.name.toLowerCase().trim() === form.name.toLowerCase().trim()
  );

  const handleSubmit = async () => {
    if (!form.name.trim()) {
      toast.warning("⚠️ Vui lòng nhập tên nhà cung cấp!");
      return;
    }
    if (!form.origin) {
      toast.warning("⚠️ Vui lòng chọn quốc gia!");
      return;
    }
    if (isDuplicate) {
      toast.error("⚠️ Nhà cung cấp này đã tồn tại!");
      return;
    }

    setLoading(true);
    try {
      const newVendor = await VendorService.create({
        name: form.name.trim(),
        origin: form.origin.trim().toUpperCase(),
        description: form.description?.trim() || null,
      });

      toast.success(`✅ Đã thêm nhà cung cấp "${form.name}" thành công!`);
      if (onSuccess) onSuccess(newVendor);

      // Reset + reload danh sách
      setForm({ name: "", origin: "", description: "" });
      const updated = await VendorService.getAll();
      setVendors(updated || []);
    } catch (err) {
      console.error("❌ Lỗi khi thêm vendor:", err);
      toast.error("❌ Không thể thêm nhà cung cấp!");
    } finally {
      setLoading(false);
    }
  };

  // 🔹 Lấy mã quốc gia (cho Flag)
  const getCountryCode = (countryName) => {
    if (!countryName) return null;
    const countries = countryList().getData();
    const match = countries.find(
      (c) => c.label.toLowerCase() === countryName.toLowerCase()
    );
    return match ? match.value : null;
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
            ➕ Thêm nhà cung cấp
          </SheetTitle>
        </SheetHeader>

        {/* Form thêm nhanh */}
        <div className="mt-6 space-y-4">
          <div className="space-y-1">
            <Label className="text-sm font-semibold">Tên nhà cung cấp</Label>
            <Input
              placeholder="VD: Technogym, Matrix Fitness..."
              value={form.name}
              onChange={(e) => handleChange("name", e.target.value)}
              className={`dark:bg-gray-700 dark:text-white ${
                isDuplicate ? "border-red-500 focus-visible:ring-red-500" : ""
              }`}
            />
            {isDuplicate && (
              <p className="text-xs text-red-500 flex items-center gap-1 mt-1">
                <AlertTriangle className="w-3.5 h-3.5" /> Tên nhà cung cấp này
                đã tồn tại!
              </p>
            )}
          </div>

          <div className="space-y-1">
            <Label className="text-sm font-semibold">Quốc gia</Label>
            <CountrySelect
              value={form.origin}
              onChange={(val) => handleChange("origin", val)}
            />
          </div>

          <div className="space-y-1">
            <Label className="text-sm font-semibold">Mô tả</Label>
            <Input
              placeholder="VD: Nhà cung cấp thiết bị treadmill của Ý"
              value={form.description}
              onChange={(e) => handleChange("description", e.target.value)}
              className="dark:bg-gray-700 dark:text-white"
            />
          </div>

          {/* Danh sách vendor hiện có */}
          {vendors.length > 0 && (
            <div className="mt-8 border-t border-gray-200 dark:border-gray-700 pt-4">
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-sm font-semibold text-emerald-600 flex items-center gap-2">
                  🏢 Vendor hiện có
                  <span className="text-xs text-gray-500 dark:text-gray-400">
                    ({vendors.length})
                  </span>
                </h4>
                <Input
                  type="text"
                  placeholder="Tìm vendor..."
                  value={searchVendor}
                  onChange={(e) => setSearchVendor(e.target.value)}
                  className="h-8 w-40 text-xs dark:bg-gray-700 dark:text-white"
                />
              </div>

              <div className="max-h-[240px] overflow-y-auto border rounded-lg dark:border-gray-700 bg-gray-50/70 dark:bg-gray-900/60 divide-y divide-gray-200 dark:divide-gray-700">
                {filteredVendors.length > 0 ? (
                  filteredVendors.map((v) => (
                    <div
                      key={v.id}
                      className="flex items-center justify-between px-3 py-2 hover:bg-white/90 dark:hover:bg-gray-800/70 transition-all"
                    >
                      <div className="flex items-center gap-2">
                        {v.origin && (
                          <Flag
                            code={getCountryCode(v.origin)}
                            className="w-6 h-4 rounded-sm border border-gray-300 dark:border-gray-600 shadow-sm"
                          />
                        )}
                        <div>
                          <p className="text-sm font-medium text-gray-800 dark:text-gray-100">
                            {v.name}
                          </p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            Quốc gia: {v.origin || "—"}
                            {v.description && (
                              <span className="ml-2 italic text-gray-400">
                                — {v.description}
                              </span>
                            )}
                          </p>
                        </div>
                      </div>
                      <div className="w-2 h-2 rounded-full bg-emerald-400/70" />
                    </div>
                  ))
                ) : (
                  <div className="text-center text-xs text-gray-500 dark:text-gray-400 py-4">
                    Không tìm thấy vendor nào phù hợp.
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
                "Lưu nhà cung cấp"
              )}
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
