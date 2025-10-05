import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/buttonn";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { Upload, RotateCcw, PlusCircle } from "lucide-react";

import CategoryTypeService from "@/services/categoryTypeService";
import VendorService from "@/services/vendorService";
import AttributeService from "@/services/attributeService";
import EquipmentService from "@/services/equipmentService";
import { toast } from "sonner";
import { useSWRConfig } from "swr";
import { API } from "@/config/url";


export default function EquipmentAddCardPage() {
  const { mutate } = useSWRConfig(); // Lấy mutate toàn cục
  const [formData, setFormData] = useState({
    type: "",
    vendor: "",
    code: "",
    name: "",
    description: "",
    warranty: "2",
    image: null,
    preview: "",
  });

  const [selectedAttrs, setSelectedAttrs] = useState({});
  const [newAttr, setNewAttr] = useState("");
  const [showAddAttr, setShowAddAttr] = useState(false);
  const [spinClearChecked, setSpinClearChecked] = useState(false);
  const [spinClearInputs, setSpinClearInputs] = useState(false);

  const [types, setTypes] = useState([]);
  const [vendors, setVendors] = useState([]);
  const [attributes, setAttributes] = useState([]);

  const [loadingAdd, setLoadingAdd] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  // ===== Fetch dữ liệu từ API =====
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [typeList, vendorList, attrList] = await Promise.all([
          CategoryTypeService.getAllWithDisplayName(),
          VendorService.getAll(),
          AttributeService.getAll(),
        ]);
        setTypes(typeList);
        setVendors(vendorList);
        setAttributes(attrList);
      } catch (err) {
        console.error("Lỗi khi load dữ liệu:", err);
      }
    };
    fetchData();
  }, []);

  // ===== Sinh mã thiết bị =====
  useEffect(() => {
    if (formData.type && formData.vendor) {
      const selectedType = types.find((t) => t.id === formData.type);
      const vendorCode =
        vendors.find((v) => v.id === formData.vendor)?.id || "";
      if (selectedType && vendorCode) {
        setFormData((prev) => ({
          ...prev,
          code: `${selectedType.category_main_id}${selectedType.id}${vendorCode}`.toUpperCase(),
        }));
      }
    }
  }, [formData.type, formData.vendor, types, vendors]);

  // ===== Handlers =====
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const previewURL = URL.createObjectURL(file);
      setFormData((prev) => ({ ...prev, image: file, preview: previewURL }));
    }
  };

  const toggleAttr = (attrName) => {
    setSelectedAttrs((prev) => {
      const updated = { ...prev };
      if (updated[attrName] !== undefined) {
        delete updated[attrName];
      } else {
        updated[attrName] = "";
      }
      return updated;
    });
  };

  const clearAllChecked = () => {
    setSpinClearChecked(true);
    setSelectedAttrs({});
    setTimeout(() => setSpinClearChecked(false), 600);
  };

  const clearAllInputs = () => {
    setSpinClearInputs(true);
    setSelectedAttrs((prev) =>
      Object.fromEntries(Object.keys(prev).map((k) => [k, ""]))
    );
    setTimeout(() => setSpinClearInputs(false), 600);
  };

  // ===== Thêm attribute mới (với check trùng + gọi API) =====
  const addNewAttribute = async () => {
    const trimmed = newAttr.trim().toLowerCase();
    if (!trimmed) {
      setErrorMsg("Vui lòng nhập tên thông số.");
      return;
    }

    // check trùng
    const exists = attributes.some((a) => a.name.toLowerCase() === trimmed);
    if (exists) {
      setErrorMsg(`Thông số "${newAttr}" đã tồn tại.`);
      return;
    }

    setLoadingAdd(true);
    setErrorMsg("");
    setSuccessMsg("");

    try {
      const created = await AttributeService.create({ name: newAttr });
      setAttributes((prev) => [...prev, created]);
      setSuccessMsg(`Đã thêm thông số "${newAttr}" thành công.`);
      setNewAttr("");
      setShowAddAttr(false);
    } catch (err) {
      console.error("Lỗi khi thêm attribute:", err);
      setErrorMsg(
        typeof err === "string" ? err : "Không thể thêm thông số mới."
      );
    } finally {
      setLoadingAdd(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    setErrorMsg("");
    setSuccessMsg("");
    setLoadingAdd(true);

    try {
      // Convert thông số selectedAttrs -> [{ attribute_id, value }]
      const attrArray = Object.entries(selectedAttrs)
        .map(([attrName, value]) => {
          const attrObj = attributes.find((a) => a.name === attrName);
          return attrObj ? { attribute_id: attrObj.id, value } : null;
        })
        .filter(Boolean);

      const payload = {
        name: formData.name,
        vendor_id: formData.vendor,
        category_type_id: formData.type,
        description: formData.description,
        warranty_duration: Number(formData.warranty),
        image: formData.image, // Có thể là File hoặc null
        attributes: attrArray,
      };

      // 🔎 In ra payload để debug
      console.log("🚀 Payload gửi API:", payload);
      if (payload.image instanceof File) {
        console.log(
          "📷 Ảnh chọn:",
          payload.image.name,
          payload.image.type,
          payload.image.size
        );
      }
      console.log("🧩 Attributes:", attrArray);

      // Gọi API
      const res = await EquipmentService.create(payload);
      console.log("✅ Response từ server:", res);

      setSuccessMsg(`✅ Đã tạo thiết bị "${res.name}" thành công!`);
      toast({
        title: "Tạo thành công 🎉",
        description: `Thiết bị "${res.name}" đã được thêm.`,
        variant: "success",
      });
      
      // 🔄 Cập nhật cache ngay lập tức cho tất cả các trang liên quan
      mutate(`${API}equipment`);

      setFormData({
        type: "",
        vendor: "",
        code: "",
        name: "",
        description: "",
        warranty: "2",
        image: null,
      });
      setSelectedAttrs({});
    } catch (err) {
      console.error("❌ Lỗi khi tạo thiết bị:", err);
      console.log("📩 Response error data:", err.response?.data);
      const msg =
        typeof err === "string"
          ? err
          : err?.error || "❌ Có lỗi xảy ra khi tạo thiết bị.";
      setErrorMsg(msg);
      toast({
        title: "Thêm thất bại ❌",
        description: msg,
        variant: "destructive",
      });
    } finally {
      setLoadingAdd(false);
    }
  };

  // ===== Giao diện =====
  return (
    <div className="p-6 h-[calc(100vh-80px)] overflow-y-auto">
      <form
        onSubmit={handleSubmit}
        className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start"
      >
        {/* ================== CỘT TRÁI ================== */}
        <div className="space-y-4 bg-white dark:bg-gray-800 rounded-lg shadow p-4">
          <h3 className="font-semibold text-emerald-500 text-base mb-2">
            Thêm loại thiết bị cụ thể
          </h3>

          {/* Loại */}
          <div>
            <Label className="text-sm">Loại thiết bị cụ thể</Label>
            <Select
              onValueChange={(val) =>
                setFormData((prev) => ({ ...prev, type: val, code: "" }))
              }
            >
              <SelectTrigger className="h-9 text-sm bg-white dark:bg-gray-700 dark:text-gray-100">
                <SelectValue placeholder="Chọn loại thiết bị" />
              </SelectTrigger>
              <SelectContent className="z-[9999] bg-white dark:bg-gray-800 border rounded-md">
                {types.map((t) => (
                  <SelectItem key={t.id} value={t.id}>
                    {t.displayName}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Vendor */}
          <div>
            <Label className="text-sm">Nhà cung cấp</Label>
            <Select
              onValueChange={(val) =>
                setFormData((prev) => ({ ...prev, vendor: val }))
              }
            >
              <SelectTrigger className="h-9 text-sm bg-white dark:bg-gray-700 dark:text-gray-100">
                <SelectValue placeholder="Chọn nhà cung cấp" />
              </SelectTrigger>
              <SelectContent className="z-[9999] bg-white dark:bg-gray-800 border rounded-md">
                {vendors.map((v) => (
                  <SelectItem key={v.id} value={v.id}>
                    {v.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Mã phát sinh */}
          <div>
            <Label className="text-sm">Mã thiết bị tự phát sinh</Label>
            <Input name="code" value={formData.code} readOnly className="h-9" />
          </div>

          {/* Tên thiết bị */}
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

          {/* Mô tả */}
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

          {/* Bảo hành */}
          <div>
            <Label className="text-sm">Bảo hành (năm)</Label>
            <Input
              type="number"
              name="warranty"
              value={formData.warranty}
              onChange={handleChange}
              className="h-9"
            />
          </div>

          {/* Upload ảnh */}
          <div>
            <Label className="text-sm">Hình ảnh</Label>
            <div className="w-48 h-48 border-2 border-dashed rounded-md flex items-center justify-center relative overflow-hidden">
              {formData.image ? (
                <img
                  src={URL.createObjectURL(formData.image)}
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
        </div>

        {/* ================== CỘT PHẢI ================== */}
        <div className="space-y-4 bg-white dark:bg-gray-800 rounded-lg shadow p-4 h-full">
          <h3 className="font-semibold text-emerald-500 text-base mb-2">
            Thông số kỹ thuật
          </h3>

          {/* Checkbox attributes */}
          <div>
            <div className="flex justify-between items-center mb-2">
              <h4 className="text-sm font-medium">Chọn thông số</h4>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={clearAllChecked}
                className="text-xs flex items-center gap-1"
              >
                <RotateCcw
                  className={`w-4 h-4 ${
                    spinClearChecked ? "animate-spin" : ""
                  }`}
                />
                Clear Checked
              </Button>
            </div>

            <div className="grid grid-cols-2 gap-2 max-h-40 overflow-y-auto border rounded-md p-3">
              {attributes.map((attr) => (
                <label
                  key={attr.id}
                  className={`flex items-center gap-2 text-sm px-2 py-1 rounded cursor-pointer ${
                    selectedAttrs[attr.name] !== undefined
                      ? "bg-emerald-50 dark:bg-gray-700"
                      : ""
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={selectedAttrs[attr.name] !== undefined}
                    onChange={() => toggleAttr(attr.name)}
                  />
                  {attr.name}
                </label>
              ))}
            </div>
          </div>

          {/* Input giá trị thông số */}
          <div>
            <div className="flex justify-between items-center mb-2">
              <h4 className="text-sm font-medium">Giá trị thông số</h4>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={clearAllInputs}
                className="text-xs flex items-center gap-1"
              >
                <RotateCcw
                  className={`w-4 h-4 ${spinClearInputs ? "animate-spin" : ""}`}
                />
                Clear Inputs
              </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-[400px] overflow-y-auto p-2 border rounded-md">
              {Object.entries(selectedAttrs).map(([attr, val]) => (
                <div key={attr}>
                  <Label className="text-sm">{attr}</Label>
                  <Input
                    placeholder={`Nhập ${attr}`}
                    value={val}
                    onChange={(e) =>
                      setSelectedAttrs((prev) => ({
                        ...prev,
                        [attr]: e.target.value,
                      }))
                    }
                    className="h-9 text-sm"
                  />
                </div>
              ))}
            </div>
          </div>

          {/* Thêm attribute mới */}
          <div className="pt-2 border-t">
            {!showAddAttr ? (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setShowAddAttr(true)}
                className="flex items-center gap-2 text-sm"
              >
                <PlusCircle className="w-4 h-4" /> Thêm thông số mới
              </Button>
            ) : (
              <div className="flex flex-col gap-2">
                <div className="flex gap-2 items-center">
                  <Input
                    placeholder="Nhập tên thông số"
                    value={newAttr}
                    onChange={(e) => setNewAttr(e.target.value)}
                    className="h-9 text-sm"
                  />
                  <Button
                    type="button"
                    onClick={addNewAttribute}
                    disabled={loadingAdd}
                    className="h-9 text-sm bg-emerald-500 hover:bg-emerald-600"
                  >
                    {loadingAdd ? "Đang thêm..." : "Thêm"}
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setShowAddAttr(false);
                      setNewAttr("");
                    }}
                  >
                    Hủy
                  </Button>
                </div>

                {errorMsg && <p className="text-red-500 text-xs">{errorMsg}</p>}
                {successMsg && (
                  <p className="text-emerald-500 text-xs">{successMsg}</p>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Submit */}
        <div className="col-span-6 flex justify-end mt-3">
        <Button
          type="submit"
          disabled={loadingAdd}
          className="bg-emerald-500 hover:bg-emerald-600 h-10 text-sm flex items-center gap-2"
        >
          {loadingAdd && (
            <span className="animate-spin border-2 border-white border-t-transparent rounded-full w-4 h-4"></span>
          )}
          {loadingAdd ? "Đang tạo..." : "TẠO LOẠI THIẾT BỊ CỤ THỂ"}
        </Button>
        </div>
      </form>
      {successMsg && (
        <div className="mb-3 p-3 rounded bg-emerald-50 text-emerald-600 text-sm border border-emerald-200">
          {successMsg}
        </div>
      )}
      {errorMsg && (
        <div className="mb-3 p-3 rounded bg-red-50 text-red-600 text-sm border border-red-200">
          {errorMsg}
        </div>
      )}
    </div>
  );
}
