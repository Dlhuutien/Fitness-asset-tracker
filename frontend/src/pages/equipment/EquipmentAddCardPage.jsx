import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/Button";
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

// Loại + Nhóm
const types = [
  { group: "Cardio", code: "CAO", type: "Treadmill", short: "TM" },
  { group: "Cardio", code: "CAO", type: "Stationary Bike", short: "SB" },
  { group: "Cardio", code: "CAO", type: "Elliptical Trainer", short: "ET" },
  { group: "Strength", code: "STH", type: "Chest Press", short: "CP" },
  { group: "Weights", code: "WEI", type: "Kettlebell", short: "KB" },
  { group: "Accessories", code: "ACE", type: "Yoga Ball", short: "YB" },
];

// Vendor mapping với mã
const vendors = [
  { name: "Technogym", code: "TG" },
  { name: "Life Fitness", code: "LF" },
  { name: "Matrix Fitness", code: "MT" },
  { name: "Johnson", code: "JS" },
];

// Mapping thông số theo loại
const attributesByType = {
  Treadmill: [
    "Độ dốc",
    "Kích thước",
    "Băng tải",
    "Kích thước băng tải",
    "Công suất",
    "Điện áp",
    "Trọng lượng",
    "Tải trọng tối đa",
    "Chất liệu",
    "Độ ồn",
  ],
  "Stationary Bike": [
    "Kháng lực",
    "Loại bàn đạp",
    "Độ ồn",
    "Màn hình",
    "Chất liệu",
    "Kích thước",
    "Trọng lượng",
    "Xuất xứ",
  ],
  "Elliptical Trainer": [
    "Kháng lực",
    "Loại bàn đạp",
    "Chiều dài sải chân",
    "Màn hình",
    "Chương trình tập",
  ],
  "Chest Press": [
    "Trọng lượng",
    "Khung máy",
    "Kích thước",
    "Số chương trình tập",
    "Xuất xứ",
  ],
  Kettlebell: ["Trọng lượng", "Chất liệu", "Màu sắc", "Xuất xứ"],
  "Yoga Ball": ["Kích thước", "Màu sắc", "Chất liệu", "Tải trọng tối đa"],
};

export default function EquipmentAddCardPage() {
  const [formData, setFormData] = useState({
    type: "",
    vendor: "",
    code: "",
    name: "",
    description: "",
    warranty: "2",
    image: null,
  });

  const [selectedAttrs, setSelectedAttrs] = useState({});
  const [attributes, setAttributes] = useState([]);
  const [newAttr, setNewAttr] = useState("");
  const [showAddAttr, setShowAddAttr] = useState(false);

  const [spinClearChecked, setSpinClearChecked] = useState(false);
  const [spinClearInputs, setSpinClearInputs] = useState(false);

  // Generate mã thiết bị
  useEffect(() => {
    if (formData.type && formData.vendor) {
      const selectedType = types.find((t) => t.type === formData.type);
      const vendorCode =
        vendors.find((v) => v.name === formData.vendor)?.code || "";
      if (selectedType) {
        setFormData((prev) => ({
          ...prev,
          code: `${selectedType.code}${selectedType.short}${vendorCode}`.toUpperCase(),
        }));
      }
    }
  }, [formData.type, formData.vendor]);

  // Khi chọn loại thì load attribute tương ứng
  useEffect(() => {
    if (formData.type) {
      setAttributes(attributesByType[formData.type] || []);
      setSelectedAttrs({});
    }
  }, [formData.type]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) setFormData((prev) => ({ ...prev, image: file }));
  };

  const toggleAttr = (attr) => {
    setSelectedAttrs((prev) => {
      const newAttrs = { ...prev };
      if (newAttrs[attr] !== undefined) {
        delete newAttrs[attr];
      } else {
        newAttrs[attr] = "";
      }
      return newAttrs;
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

  const addNewAttribute = () => {
    if (!formData.type || !newAttr.trim()) return;
    setAttributes((prev) => [...prev, newAttr.trim()]);
    setNewAttr("");
    setShowAddAttr(false);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log("Submit:", { ...formData, specs: selectedAttrs });
  };

  return (
    <div className="p-6 h-[calc(100vh-80px)] overflow-y-auto">
      <form
        onSubmit={handleSubmit}
        className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start"
      >
        {/* Cột trái */}
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
              <SelectContent
                position="popper"
                className="z-[9999] bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-lg rounded-md"
              >
                {types.map((t) => (
                  <SelectItem
                    key={t.type}
                    value={t.type}
                    className="cursor-pointer hover:bg-emerald-50 dark:hover:bg-gray-700"
                  >
                    {t.type} ({t.group})
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
              <SelectContent
                position="popper"
                className="z-[9999] bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-lg rounded-md"
              >
                {vendors.map((v) => (
                  <SelectItem
                    key={v.code}
                    value={v.name}
                    className="cursor-pointer hover:bg-emerald-50 dark:hover:bg-gray-700"
                  >
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

          {/* Tên */}
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

        {/* Cột phải */}
        <div className="space-y-4 bg-white dark:bg-gray-800 rounded-lg shadow p-4 h-full">
          <h3 className="font-semibold text-emerald-500 text-base mb-2">
            Thông số kỹ thuật
          </h3>

          {/* Checkbox list */}
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
                />{" "}
                Clear Checked
              </Button>
            </div>
            <div className="grid grid-cols-2 gap-2 max-h-40 overflow-y-auto border rounded-md p-3">
              {attributes.map((attr) => (
                <label
                  key={attr}
                  className={`flex items-center gap-2 text-sm px-2 py-1 rounded cursor-pointer ${
                    selectedAttrs[attr] !== undefined
                      ? "bg-emerald-50 dark:bg-gray-700"
                      : ""
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={selectedAttrs[attr] !== undefined}
                    onChange={() => toggleAttr(attr)}
                  />
                  {attr}
                </label>
              ))}
            </div>
          </div>

          {/* Input values */}
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
                />{" "}
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

          {/* Thêm thông số mới */}
          <div className="pt-2 border-t">
            {!showAddAttr ? (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                disabled={!formData.type}
                onClick={() => setShowAddAttr(true)}
                className="flex items-center gap-2 text-sm"
              >
                <PlusCircle className="w-4 h-4" /> Thêm thông số mới
              </Button>
            ) : (
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
                  className="h-9 text-sm bg-emerald-500 hover:bg-emerald-600"
                >
                  Thêm
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
            )}
          </div>
        </div>

        {/* Submit */}
        <div className="col-span-6 flex justify-end mt-3">
          <Button
            type="submit"
            className="bg-emerald-500 hover:bg-emerald-600 h-10 text-sm"
          >
            TẠO LOẠI THIẾT BỊ CỤ THỂ
          </Button>
        </div>
      </form>
    </div>
  );
}
