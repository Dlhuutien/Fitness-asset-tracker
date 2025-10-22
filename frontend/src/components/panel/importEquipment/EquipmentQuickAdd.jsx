import { useState, useEffect } from "react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/buttonn";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Upload, RotateCcw } from "lucide-react";
import { toast } from "sonner";
import { useSWRConfig } from "swr";
import { API } from "@/config/url";

import CategoryMainService from "@/services/categoryMainService";
import CategoryTypeService from "@/services/categoryTypeService";
import VendorService from "@/services/vendorService";
import EquipmentService from "@/services/equipmentService";

import EquipmentGroupQuickAdd from "@/components/panel/addCardEquipment/EquipmentGroupQuickAdd";
import EquipmentTypeQuickAdd from "@/components/panel/addCardEquipment/EquipmentTypeQuickAdd";
import VendorQuickAdd from "@/components/panel/vendor/VendorQuickAdd";

export default function EquipmentQuickAdd({ open, onClose, onSuccess }) {
  const { mutate } = useSWRConfig();

  const [formData, setFormData] = useState({
    group: "",
    type: "",
    vendor: "",
    name: "",
    description: "",
    image: null,
    preview: "",
  });

  const [vendors, setVendors] = useState([]);
  const [groups, setGroups] = useState([]);
  const [types, setTypes] = useState([]);
  const [loading, setLoading] = useState(false);

  const [searchVendor, setSearchVendor] = useState("");
  const [searchGroup, setSearchGroup] = useState("");
  const [searchType, setSearchType] = useState("");

  const [openQuickAddVendor, setOpenQuickAddVendor] = useState(false);
  const [openQuickAddGroup, setOpenQuickAddGroup] = useState(false);
  const [openQuickAddType, setOpenQuickAddType] = useState(false);

  // 🔄 Fetch dữ liệu
  useEffect(() => {
    if (!open) return;
    const fetchAll = async () => {
      try {
        const [groupList, typeList, vendorList] = await Promise.all([
          CategoryMainService.getAll(),
          CategoryTypeService.getAllWithDisplayName(),
          VendorService.getAll(),
        ]);
        setGroups(groupList);
        setTypes(typeList);
        setVendors(vendorList);
      } catch (e) {
        console.error("❌ Lỗi khi tải dữ liệu:", e);
        toast.error("Không thể tải dữ liệu!");
      }
    };
    fetchAll();
  }, [open]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((p) => ({ ...p, [name]: value }));
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const previewURL = URL.createObjectURL(file);
      setFormData((p) => ({ ...p, image: file, preview: previewURL }));
    }
  };

  // 🧾 Gửi API
  const handleSubmit = async () => {
    if (!formData.vendor)
      return toast.warning("⚠️ Vui lòng chọn nhà cung cấp!");
    if (!formData.group)
      return toast.warning("⚠️ Vui lòng chọn nhóm thiết bị!");
    if (!formData.type)
      return toast.warning("⚠️ Vui lòng chọn loại thiết bị!");
    if (!formData.name) return toast.warning("⚠️ Nhập tên thiết bị!");

    try {
      setLoading(true);

      const payload = {
        name: formData.name,
        vendor_id: formData.vendor,
        category_type_id: formData.type,
        description: formData.description,
        image: formData.image || null,
        attributes: [],
      };

      const res = await EquipmentService.create(payload);

      toast.success(`✅ Đã thêm "${res.name}" thành công!`);
      mutate(`${API}equipment`);
      onSuccess?.(res);
      onClose();
    } catch (err) {
      console.error("❌ Lỗi khi thêm thiết bị:", err);
      const msg =
        err?.response?.data?.error ||
        err?.response?.data?.message ||
        "Không thể thêm thiết bị mới!";
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Sheet open={open} onOpenChange={onClose}>
      <SheetContent
        side="right"
        className={`!w-[750px] !max-w-none bg-white dark:bg-gray-800 border-l border-gray-200 dark:border-gray-700 p-6 overflow-y-auto ${
          open ? "animate-slide-in" : "animate-slide-out"
        }`}
      >
        <SheetHeader>
          <SheetTitle className="text-lg font-semibold text-emerald-600">
            ➕ Thêm thiết bị nhanh
          </SheetTitle>
        </SheetHeader>

        <div className="mt-4 space-y-4 bg-white dark:bg-gray-800 rounded-lg shadow p-4">
          {/* ================== NHÀ CUNG CẤP ================== */}
          <div className="bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg p-4 space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="font-semibold text-emerald-600 text-base flex items-center gap-1">
                🏢 Nhà cung cấp
              </h4>
              {formData.vendor && (
                <span className="text-xs text-gray-500">
                  Đã chọn:{" "}
                  <b>
                    {vendors.find((v) => v.id === formData.vendor)?.name ||
                      formData.vendor}
                  </b>
                </span>
              )}
            </div>

            <div className="flex items-center gap-2">
              <Input
                placeholder="🔍 Tìm theo tên, mã hoặc quốc gia..."
                value={searchVendor}
                onChange={(e) => setSearchVendor(e.target.value)}
                className="flex-1 h-9 text-sm"
              />
              <Button
                size="icon"
                variant="outline"
                onClick={async () => {
                  const data = await VendorService.getAll();
                  setVendors(data || []);
                  toast.success("🔄 Danh sách nhà cung cấp đã làm mới!");
                }}
              >
                <RotateCcw size={16} />
              </Button>
              <Button
                onClick={() => setOpenQuickAddVendor(true)}
                className="bg-emerald-500 hover:bg-emerald-600 text-white text-sm px-4"
              >
                ➕ Thêm mới
              </Button>
            </div>

            <div className="max-h-[200px] overflow-y-auto border rounded-md divide-y dark:divide-gray-700">
              {vendors
                .filter((v) => {
                  const q = searchVendor.toLowerCase();
                  return (
                    v.name.toLowerCase().includes(q) ||
                    v.id.toLowerCase().includes(q) ||
                    (v.origin || "").toLowerCase().includes(q)
                  );
                })
                .map((v) => (
                  <div
                    key={v.id}
                    onClick={() =>
                      setFormData((prev) => ({ ...prev, vendor: v.id }))
                    }
                    className={`p-3 cursor-pointer transition ${
                      formData.vendor === v.id
                        ? "bg-emerald-50 dark:bg-gray-700"
                        : "hover:bg-emerald-50 dark:hover:bg-gray-800"
                    }`}
                  >
                    <p className="font-semibold text-emerald-600 text-sm">
                      {v.name}
                    </p>
                    <p className="text-xs text-gray-500">
                      Mã: {v.id} • Quốc gia: {v.origin}
                    </p>
                  </div>
                ))}
            </div>
          </div>

          {/* ================== NHÓM THIẾT BỊ ================== */}
          <div className="bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg p-4 space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="font-semibold text-emerald-600 text-base flex items-center gap-1">
                🧩 Nhóm thiết bị
              </h4>
            </div>

            <div className="flex items-center gap-2">
              <Input
                placeholder="🔍 Tìm theo tên hoặc mã nhóm..."
                value={searchGroup}
                onChange={(e) => setSearchGroup(e.target.value)}
                className="flex-1 h-9 text-sm"
              />
              <Button
                size="icon"
                variant="outline"
                onClick={async () => {
                  const data = await CategoryMainService.getAll();
                  setGroups(data || []);
                  toast.success("🔄 Danh sách nhóm thiết bị đã làm mới!");
                }}
              >
                <RotateCcw size={16} />
              </Button>
              <Button
                onClick={() => setOpenQuickAddGroup(true)}
                className="bg-emerald-500 hover:bg-emerald-600 text-white text-sm px-4"
              >
                ➕ Thêm mới
              </Button>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 max-h-[220px] overflow-y-auto mt-2 pt-5">
              {groups
                .filter((g) => {
                  const q = searchGroup.toLowerCase();
                  return (
                    g.name.toLowerCase().includes(q) ||
                    g.id.toLowerCase().includes(q)
                  );
                })
                .map((g) => (
                  <div
                    key={g.id}
                    onClick={() =>
                      setFormData((prev) => ({ ...prev, group: g.id, type: "" }))
                    }
                    className={`border rounded-lg overflow-hidden cursor-pointer transition-all shadow-sm hover:shadow-md ${
                      formData.group === g.id
                        ? "border-emerald-500 ring-2 ring-emerald-300"
                        : "border-gray-200 dark:border-gray-700"
                    }`}
                  >
                    <div className="w-full h-16 bg-gray-100 dark:bg-gray-800 flex items-center justify-center overflow-hidden">
                      {g.image ? (
                        <img
                          src={g.image}
                          alt={g.name}
                          className="object-cover max-w-[90px] h-full"
                        />
                      ) : (
                        <span className="text-[10px] text-gray-400">
                          Không có ảnh
                        </span>
                      )}
                    </div>
                    <div className="p-1.5 text-center">
                      <p className="font-medium text-[13px] text-emerald-600 truncate">
                        {g.name}
                      </p>
                      <p className="text-[11px] text-gray-500 truncate">
                        Mã: {g.id}
                      </p>
                    </div>
                  </div>
                ))}
            </div>
          </div>

          {/* ================== LOẠI THIẾT BỊ ================== */}
          <div className="bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg p-4 space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="font-semibold text-emerald-600 text-base flex items-center gap-1">
                ⚙️ Loại thiết bị cụ thể
              </h4>
            </div>

            <div className="flex items-center gap-2">
              <Input
                placeholder="🔍 Tìm loại theo tên, mã hoặc nhóm..."
                value={searchType}
                onChange={(e) => setSearchType(e.target.value)}
                className="flex-1 h-9 text-sm"
                disabled={!formData.group}
              />
              <Button
                size="icon"
                variant="outline"
                onClick={async () => {
                  const data = await CategoryTypeService.getAllWithDisplayName();
                  setTypes(data || []);
                  toast.success("🔄 Danh sách loại thiết bị đã làm mới!");
                }}
                disabled={!formData.group}
              >
                <RotateCcw size={16} />
              </Button>
              <Button
                onClick={() => setOpenQuickAddType(true)}
                disabled={!formData.group}
                className="bg-emerald-500 hover:bg-emerald-600 text-white text-sm px-4 disabled:opacity-60"
              >
                ➕ Thêm mới
              </Button>
            </div>

            {!formData.group && (
              <p className="text-center text-gray-400 text-sm py-6">
                ⚠️ Vui lòng chọn <b>nhóm thiết bị</b> trước khi chọn loại.
              </p>
            )}

            {formData.group && (
              <div className="max-h-[220px] overflow-y-auto border rounded-md divide-y dark:divide-gray-700 mt-2">
                {types
                  .filter(
                    (t) =>
                      t.category_main_id === formData.group &&
                      t.name.toLowerCase().includes(searchType.toLowerCase())
                  )
                  .map((t) => (
                    <div
                      key={t.id}
                      onClick={() =>
                        setFormData((prev) => ({ ...prev, type: t.id }))
                      }
                      className={`p-3 cursor-pointer transition ${
                        formData.type === t.id
                          ? "bg-emerald-50 dark:bg-gray-700"
                          : "hover:bg-emerald-50 dark:hover:bg-gray-800"
                      }`}
                    >
                      <p className="font-semibold text-emerald-600 text-sm">
                        {t.name}
                      </p>
                      <p className="text-xs text-gray-500">
                        Mã: {t.id} • Nhóm: {t.main_name || "Không xác định"}
                      </p>
                    </div>
                  ))}
              </div>
            )}
          </div>

          {/* ================== TÊN, MÔ TẢ, BẢO HÀNH, ẢNH ================== */}
          <div>
            <Label className="text-sm">Tên thiết bị</Label>
            <Input
              name="name"
              placeholder="Nhập tên thiết bị"
              value={formData.name}
              onChange={handleChange}
              className="h-9"
            />
          </div>

          <div>
            <Label className="text-sm">Mô tả</Label>
            <Textarea
              name="description"
              placeholder="Nhập mô tả"
              value={formData.description}
              onChange={handleChange}
              className="text-sm"
            />
          </div>

          <div>
            <Label className="text-sm">Hình ảnh</Label>
            <div className="w-48 h-48 border-2 border-dashed rounded-md flex items-center justify-center relative overflow-hidden">
              {formData.image ? (
                <img
                  src={formData.preview || URL.createObjectURL(formData.image)}
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
          </div>

          {/* Submit */}
          <div className="flex justify-end pt-4">
            <Button
              onClick={handleSubmit}
              disabled={loading}
              className="bg-emerald-500 hover:bg-emerald-600 text-white flex items-center gap-2 px-6"
            >
              {loading ? (
                <>
                  <Upload className="w-4 h-4 animate-spin" /> Đang lưu...
                </>
              ) : (
                "Lưu thiết bị"
              )}
            </Button>
          </div>
        </div>

        {/* QuickAdd popup phụ */}
        <VendorQuickAdd
          open={openQuickAddVendor}
          onClose={() => setOpenQuickAddVendor(false)}
          onSuccess={(v) => {
            setVendors((prev) => [...prev, v]);
            setFormData((p) => ({ ...p, vendor: v.id }));
            toast.success(`🎉 Đã thêm nhà cung cấp "${v.name}"!`);
          }}
        />

        <EquipmentGroupQuickAdd
          open={openQuickAddGroup}
          onClose={() => setOpenQuickAddGroup(false)}
          onSuccess={(g) => {
            setGroups((prev) => [...prev, g]);
            setFormData((p) => ({ ...p, group: g.id }));
            toast.success(`🎉 Đã thêm nhóm "${g.name}"!`);
          }}
        />

        <EquipmentTypeQuickAdd
          open={openQuickAddType}
          onClose={() => setOpenQuickAddType(false)}
          onSuccess={(t) => {
            setTypes((prev) => [...prev, t]);
            setFormData((p) => ({ ...p, type: t.id }));
            toast.success(`🎉 Đã thêm loại "${t.name}"!`);
          }}
        />
      </SheetContent>
    </Sheet>
  );
}
