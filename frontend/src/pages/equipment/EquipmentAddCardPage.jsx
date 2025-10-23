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

import CategoryMainService from "@/services/categoryMainService";
import EquipmentGroupQuickAdd from "@/components/panel/addCardEquipment/EquipmentGroupQuickAdd";
import CategoryTypeService from "@/services/categoryTypeService";
import EquipmentTypeQuickAdd from "@/components/panel/addCardEquipment/EquipmentTypeQuickAdd";
import VendorService from "@/services/vendorService";
import VendorQuickAdd from "@/components/panel/vendor/VendorQuickAdd";
import AttributeService from "@/services/attributeService";
import TypeAttributeService from "@/services/typeAttributeService";
import EquipmentService from "@/services/equipmentService";
import { toast } from "sonner";
import { useSWRConfig } from "swr";
import { API } from "@/config/url";

export default function EquipmentAddCardPage({ onSuccessAdd }) {
  const { mutate } = useSWRConfig(); // Lấy mutate toàn cục
  const [formData, setFormData] = useState({
    type: "",
    vendor: "",
    name: "",
    description: "",
    image: null,
    preview: "",
  });

  const [searchVendor, setSearchVendor] = useState("");
  const [openQuickAdd, setOpenQuickAdd] = useState(false);

  const [searchGroup, setSearchGroup] = useState("");
  const [openQuickAddGroup, setOpenQuickAddGroup] = useState(false);

  const [searchType, setSearchType] = useState("");
  const [openQuickAddType, setOpenQuickAddType] = useState(false);

  const [selectedAttrs, setSelectedAttrs] = useState({});
  const [newAttr, setNewAttr] = useState("");
  const [showAddAttr, setShowAddAttr] = useState(false);
  const [spinClearChecked, setSpinClearChecked] = useState(false);
  const [spinClearInputs, setSpinClearInputs] = useState(false);

  const [groups, setGroups] = useState([]);
  const [types, setTypes] = useState([]);
  const [vendors, setVendors] = useState([]);
  const [attributes, setAttributes] = useState([]);

  const [loadingAdd, setLoadingAdd] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [searchAttr, setSearchAttr] = useState("");

  const [typeAttributes, setTypeAttributes] = useState([]);

  // ===== Fetch dữ liệu từ API =====
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [groupList, typeList, vendorList, attrList] = await Promise.all([
          CategoryMainService.getAll(),
          CategoryTypeService.getAllWithDisplayName(),
          VendorService.getAll(),
          AttributeService.getAll(),
        ]);
        setGroups(groupList);
        setTypes(typeList);
        setVendors(vendorList);
        setAttributes(attrList);
      } catch (err) {
        console.error("Lỗi khi load dữ liệu:", err);
      }
    };
    fetchData();
  }, []);

  // ===== Khi chọn loại thiết bị => load các attribute mặc định =====
  useEffect(() => {
    if (!formData.type) {
      setTypeAttributes([]); // chưa chọn loại => clear
      setSelectedAttrs({}); // clear phần nhập
      return;
    }

    const fetchTypeAttributes = async () => {
      try {
        const data = await TypeAttributeService.getAttributesByType(
          formData.type
        );
        setTypeAttributes(data || []);
        // Khi đổi loại, reset phần nhập
        setSelectedAttrs({});
      } catch (err) {
        console.error("❌ Lỗi khi tải attribute theo loại:", err);
        toast.error("Không thể tải thông số kỹ thuật cho loại này.");
      }
    };

    fetchTypeAttributes();
  }, [formData.type]);

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

  // ===== Thêm attribute mới (check trùng + auto link vào Type nếu có) =====
  const addNewAttribute = async () => {
    const trimmed = newAttr.trim();
    if (!trimmed) {
      setErrorMsg("Vui lòng nhập tên thông số.");
      return;
    }

    const lower = trimmed.toLowerCase();
    setLoadingAdd(true);
    setErrorMsg("");
    setSuccessMsg("");

    try {
      // 🔍 Kiểm tra xem attribute đã tồn tại chưa
      const existingAttr = attributes.find(
        (a) => a.name.toLowerCase() === lower
      );

      let attrToUse = existingAttr;

      // ✅ Nếu chưa tồn tại → tạo mới attribute
      if (!existingAttr) {
        const created = await AttributeService.create({ name: trimmed });
        setAttributes((prev) => [...prev, created]);
        attrToUse = created;
        console.log("✅ Đã tạo Attribute mới:", created);
      } else {
        console.log("ℹ️ Attribute đã tồn tại, dùng lại:", existingAttr);
      }

      // ✅ Nếu có chọn loại → gắn attribute này vào loại
      if (formData.type && attrToUse) {
        try {
          await TypeAttributeService.addAttributeToType(
            formData.type,
            attrToUse.id
          );
          const updatedTypeAttrs =
            await TypeAttributeService.getAttributesByType(formData.type);
          setTypeAttributes(updatedTypeAttrs || []);
          setSuccessMsg(
            existingAttr
              ? `Đã gắn thông số "${trimmed}" vào loại thiết bị.`
              : `Đã thêm và gắn thông số "${trimmed}" vào loại thiết bị.`
          );
        } catch (linkErr) {
          console.error("❌ Lỗi khi gắn attribute vào loại:", linkErr);
          setSuccessMsg(
            existingAttr
              ? `Đã có thông số "${trimmed}" nhưng gắn vào loại thất bại.`
              : `Đã thêm "${trimmed}" nhưng chưa gắn vào loại do lỗi.`
          );
        }
      } else if (!formData.type) {
        setSuccessMsg(
          existingAttr
            ? `Thông số "${trimmed}" đã tồn tại (chưa gắn vì chưa chọn loại).`
            : `Đã thêm thông số "${trimmed}" thành công.`
        );
      }

      setNewAttr("");
      setShowAddAttr(false);
    } catch (err) {
      console.error("❌ Lỗi khi thêm attribute:", err);
      setErrorMsg(
        typeof err === "string"
          ? err
          : err?.message || "Không thể thêm thông số mới."
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
        image: formData.image instanceof File ? formData.image : null,
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

      // 📢 Gọi callback báo về parent
      if (onSuccessAdd) onSuccessAdd(res);

      setFormData({
        group: "",
        type: "",
        vendor: "",
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

  const filteredAttributes = attributes.filter((a) =>
    a.name.toLowerCase().includes(searchAttr.toLowerCase())
  );

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

          {/* ========== SECTION: NHÀ CUNG CẤP ========== */}
          <div className="bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg p-4 shadow-sm space-y-3">
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

            {/* Thanh tìm kiếm + nút hành động */}
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
                onClick={() => setOpenQuickAdd(true)}
                className="bg-emerald-500 hover:bg-emerald-600 text-white text-sm px-4"
              >
                ➕ Thêm mới
              </Button>
            </div>

            {/* Danh sách vendor dạng list cuộn */}
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

          {/* ========== SECTION: NHÓM THIẾT BỊ ========== */}
          <div className="bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg p-4 shadow-sm space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="font-semibold text-emerald-600 text-base flex items-center gap-1">
                🧩 Nhóm thiết bị
              </h4>
              {formData.group && (
                <span className="text-xs text-gray-500">
                  Đã chọn:{" "}
                  <b>
                    {groups.find((g) => g.id === formData.group)?.name ||
                      formData.group}
                  </b>
                </span>
              )}
            </div>

            {/* Thanh tìm kiếm + nút hành động */}
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

            {/* Danh sách nhóm dạng card (hình + tên + mã) */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 max-h-[220px] overflow-y-auto mt-2 pt-5">
              {groups
                .filter((g) => {
                  const q = searchGroup.toLowerCase();
                  return (
                    g.name.toLowerCase().includes(q) ||
                    g.id.toLowerCase().includes(q) ||
                    (g.description || "").toLowerCase().includes(q)
                  );
                })
                .map((g) => (
                  <div
                    key={g.id}
                    onClick={() =>
                      setFormData((prev) => ({
                        ...prev,
                        group: g.id,
                        type: "",
                      }))
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

            {groups.length === 0 && (
              <p className="text-center text-gray-400 text-sm py-4">
                Không có nhóm nào.
              </p>
            )}
          </div>

          {/* ========== SECTION: LOẠI THIẾT BỊ CỤ THỂ ========== */}
          <div className="bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg p-4 shadow-sm space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="font-semibold text-emerald-600 text-base flex items-center gap-1">
                ⚙️ Loại thiết bị cụ thể
              </h4>
              {formData.type && (
                <span className="text-xs text-gray-500">
                  Đã chọn:{" "}
                  <b>
                    {types.find((t) => t.id === formData.type)?.name ||
                      formData.type}
                  </b>
                </span>
              )}
            </div>

            {/* Thanh tìm kiếm + nút hành động */}
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
                  const data =
                    await CategoryTypeService.getAllWithDisplayName();
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

            {/* Nếu chưa chọn nhóm */}
            {!formData.group && (
              <p className="text-center text-gray-400 text-sm py-6">
                ⚠️ Vui lòng chọn <b>nhóm thiết bị</b> trước khi chọn loại.
              </p>
            )}

            {/* Danh sách loại dạng list cuộn */}
            {formData.group && (
              <div className="max-h-[220px] overflow-y-auto border rounded-md divide-y dark:divide-gray-700 mt-2">
                {types
                  .filter((t) => {
                    const q = searchType.toLowerCase();
                    return (
                      t.category_main_id === formData.group &&
                      (t.name.toLowerCase().includes(q) ||
                        t.id.toLowerCase().includes(q) ||
                        (t.main_name || "").toLowerCase().includes(q))
                    );
                  })
                  .map((t) => (
                    <div
                      key={t.id}
                      onClick={() =>
                        setFormData((prev) => ({
                          ...prev,
                          type: t.id,
                        }))
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

                {/* Nếu không có loại nào */}
                {types.filter((t) => t.category_main_id === formData.group)
                  .length === 0 && (
                  <p className="text-center text-gray-400 text-sm py-4">
                    Không có loại nào thuộc nhóm này.
                  </p>
                )}
              </div>
            )}
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

          {formData.type ? (
            <>
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

                {/* Thanh tìm kiếm & nút chọn tất cả */}
                <div className="flex items-center gap-2 mb-3">
                  <Input
                    placeholder="Tìm kiếm thông số..."
                    value={searchAttr}
                    onChange={(e) => setSearchAttr(e.target.value)}
                    className="h-8 text-sm flex-1"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      setSelectedAttrs(
                        Object.fromEntries(
                          (formData.type
                            ? typeAttributes
                            : filteredAttributes
                          ).map((a) => [a.name, ""])
                        )
                      )
                    }
                    className="text-xs"
                  >
                    Chọn tất cả
                  </Button>
                </div>

                <div className="grid grid-cols-2 gap-2 max-h-40 overflow-y-auto border rounded-md p-3">
                  {(formData.type ? typeAttributes : filteredAttributes).map(
                    (attr) => (
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
                    )
                  )}
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
                      className={`w-4 h-4 ${
                        spinClearInputs ? "animate-spin" : ""
                      }`}
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

                    {errorMsg && (
                      <p className="text-red-500 text-xs">{errorMsg}</p>
                    )}
                    {successMsg && (
                      <p className="text-emerald-500 text-xs">{successMsg}</p>
                    )}
                  </div>
                )}
              </div>
            </>
          ) : (
            <p className="text-gray-400 text-center text-sm py-10">
              ⚙️ Hãy chọn <b>loại thiết bị</b> để hiển thị thông số kỹ thuật
              tương ứng.
            </p>
          )}
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
      {/* QuickAdd Vendor */}
      <VendorQuickAdd
        open={openQuickAdd}
        onClose={() => setOpenQuickAdd(false)}
        onSuccess={(newVendor) => {
          setVendors((prev) => [...prev, newVendor]);
          setFormData((prev) => ({ ...prev, vendor: newVendor.id }));
          toast.success("🎉 Đã thêm nhà cung cấp mới!");
        }}
      />
      {/* QuickAdd Group */}
      <EquipmentGroupQuickAdd
        open={openQuickAddGroup}
        onClose={() => setOpenQuickAddGroup(false)}
        onSuccess={(newGroup) => {
          toast.success(`🎉 Đã thêm nhóm "${newGroup.name}"!`);
          setGroups((prev) => [...prev, newGroup]);
          setFormData((prev) => ({ ...prev, group: newGroup.id }));
        }}
      />
      {/* QuickAdd Type */}
      <EquipmentTypeQuickAdd
        open={openQuickAddType}
        onClose={() => setOpenQuickAddType(false)}
        onSuccess={(newType) => {
          toast.success(`🎉 Đã thêm loại "${newType.name}"!`);
          setTypes((prev) => [...prev, newType]);
          setFormData((prev) => ({ ...prev, type: newType.id }));
        }}
      />
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
