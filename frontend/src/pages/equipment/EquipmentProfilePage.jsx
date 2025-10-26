import { useEffect, useState, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/buttonn";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Loader2,
  RotateCcw,
  PlusCircle,
  ImagePlus,
  ArrowLeft,
} from "lucide-react";
import EquipmentService from "@/services/equipmentService";
import AttributeService from "@/services/attributeService";
import { toast } from "sonner";

const fmtDate = (d) => (d ? new Date(d).toLocaleString("vi-VN") : "—");

export default function EquipmentProfilePage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editing, setEditing] = useState(false);
  const [equipment, setEquipment] = useState(null);
  const [saveMessage, setSaveMessage] = useState({ type: "", text: "" });

  const [formData, setFormData] = useState({
    name: "",
    description: "",
    warranty_duration: "2",
    image: "",
    preview: "",
  });

  const [allAttributes, setAllAttributes] = useState([]);
  const [selectedAttrs, setSelectedAttrs] = useState({});
  const [searchAttr, setSearchAttr] = useState("");
  const [newAttrName, setNewAttrName] = useState("");
  const [addingAttr, setAddingAttr] = useState(false);
  const [spinClearChecked, setSpinClearChecked] = useState(false);
  const [spinClearInputs, setSpinClearInputs] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const [eq, attrs] = await Promise.all([
          EquipmentService.getById(id),
          AttributeService.getAll(),
        ]);
        setEquipment(eq);
        setFormData({
          name: eq.name || "",
          description: eq.description || "",
          warranty_duration: String(eq.warranty_duration ?? "2"),
          image: eq.image || "",
          preview: eq.image || "",
        });
        const init = {};
        (eq.attributes || []).forEach((a) => {
          if (a?.attribute) init[a.attribute] = a.value || "";
        });
        setSelectedAttrs(init);
        setAllAttributes(attrs || []);
      } catch (err) {
        toast.error("Không thể tải dữ liệu thiết bị!");
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);

  const filteredAttributes = useMemo(() => {
    const q = searchAttr.trim().toLowerCase();
    return (allAttributes || []).filter((a) =>
      a.name.toLowerCase().includes(q)
    );
  }, [allAttributes, searchAttr]);

  const handleChange = (key, val) => {
    setFormData((p) => ({ ...p, [key]: val }));
  };

  const handlePickImage = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const previewURL = URL.createObjectURL(file);
    setFormData((p) => ({ ...p, image: file, preview: previewURL }));
  };

  const toggleAttr = (name) => {
    setSelectedAttrs((prev) => {
      const next = { ...prev };
      if (next[name] !== undefined) delete next[name];
      else next[name] = "";
      return next;
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

  const handleAddNewAttribute = async () => {
    const trimmed = newAttrName.trim();
    if (!trimmed) return toast.error("Nhập tên thông số!");
    if (
      allAttributes.some((a) => a.name.toLowerCase() === trimmed.toLowerCase())
    )
      return toast.error(`Thông số "${trimmed}" đã tồn tại!`);
    try {
      setAddingAttr(true);
      const created = await AttributeService.create({ name: trimmed });
      setAllAttributes((prev) => [...prev, created]);
      setSelectedAttrs((prev) => ({ ...prev, [created.name]: "" }));
      setNewAttrName("");
      toast.success(`Đã thêm "${created.name}"`);
    } catch {
      toast.error("Không thể thêm thông số mới!");
    } finally {
      setAddingAttr(false);
    }
  };

  const handleSave = async () => {
    let timeoutId;
    try {
      setSaving(true);
      setSaveMessage({ type: "", text: "" });

      // Hiện "vui lòng chờ" nếu >5s
      timeoutId = setTimeout(() => {
        setSaveMessage({
          type: "loading",
          text: "⏳ Đang xử lý, vui lòng chờ thêm một chút...",
        });
      }, 5000);

      const attrArray = Object.entries(selectedAttrs)
        .map(([n, v]) => {
          const found = allAttributes.find((a) => a.name === n);
          if (!found) return null;
          return { attribute_id: found.id, value: v };
        })
        .filter(Boolean);

      await EquipmentService.update(equipment.id, {
        name: formData.name,
        description: formData.description,
        warranty_duration: formData.warranty_duration,
        image: formData.image,
        attributes: attrArray,
      });

      clearTimeout(timeoutId);
      toast.success("✅ Lưu thay đổi thành công!");
      setSaveMessage({ type: "success", text: "Đã lưu thay đổi thành công!" });

      // Tắt chế độ chỉnh sửa nhưng giữ message lại
      setTimeout(async () => {
        setEditing(false);
        const fresh = await EquipmentService.getById(id);
        setEquipment(fresh);
        const next = {};
        (fresh.attributes || []).forEach((a) => {
          if (a?.attribute) next[a.attribute] = a.value || "";
        });
        setSelectedAttrs(next);
      }, 1000);

      // Giữ message thêm 3s nữa rồi mới xóa
      setTimeout(() => {
        setSaveMessage({ type: "", text: "" });
      }, 4000);
    } catch {
      clearTimeout(timeoutId);
      toast.error("❌ Lỗi khi lưu thiết bị!");
      setSaveMessage({
        type: "error",
        text: "Lưu thay đổi thất bại, vui lòng thử lại.",
      });

      setTimeout(() => {
        setSaveMessage({ type: "", text: "" });
      }, 3000);
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setEditing(false);
    if (!equipment) return;
    setFormData({
      name: equipment.name || "",
      description: equipment.description || "",
      warranty_duration: String(equipment.warranty_duration ?? "2"),
      image: equipment.image || "",
      preview: equipment.image || "",
    });
    const init = {};
    (equipment.attributes || []).forEach((a) => {
      if (a?.attribute) init[a.attribute] = a.value || "";
    });
    setSelectedAttrs(init);
  };

  if (loading)
    return (
      <div className="flex items-center justify-center h-64 text-gray-500">
        <Loader2 className="animate-spin mr-2" /> Đang tải dữ liệu...
      </div>
    );

  if (!equipment)
    return (
      <div className="text-center text-red-500 p-10">
        Không tìm thấy thiết bị.
      </div>
    );

  return (
    <div className="p-6 font-jakarta space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <Button
          onClick={() => navigate(-1)}
          className="bg-gray-400 text-white hover:bg-gray-500 flex items-center gap-2"
        >
          <ArrowLeft size={16} /> Quay lại
        </Button>
        <div className="flex flex-col gap-2">
          {/* Nút hành động */}
          <div className="flex justify-end gap-3">
            {!editing ? (
              <Button
                onClick={() => setEditing(true)}
                className="bg-blue-600 hover:bg-blue-700 text-white flex items-center gap-2"
              >
                ✏️ Chỉnh sửa
              </Button>
            ) : (
              <>
                <Button
                  onClick={handleCancel}
                  className="bg-gray-300 dark:bg-gray-700 dark:text-white hover:bg-gray-400"
                >
                  ❌ Hủy
                </Button>
                <Button
                  onClick={handleSave}
                  disabled={saving}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white flex items-center gap-2"
                >
                  {saving && <Loader2 className="w-4 h-4 animate-spin" />} 💾
                  Lưu thay đổi
                </Button>
              </>
            )}
          </div>

          {/* 🔽 Thông báo kết quả lưu (luôn hiển thị dù đang editing hay không) */}
          {saveMessage.text && (
            <p
              className={`text-sm mt-1 transition ${
                saveMessage.type === "success"
                  ? "text-emerald-600"
                  : saveMessage.type === "error"
                  ? "text-red-500"
                  : "text-amber-500 animate-pulse"
              }`}
            >
              {saveMessage.text}
            </p>
          )}
        </div>
      </div>

      {/* CARD 1: Thông tin cơ bản */}
      <div className="bg-white dark:bg-gray-900 border rounded-2xl shadow p-6 space-y-5">
        <div className="flex flex-col md:flex-row gap-6">
          {/* Ảnh */}
          <label
            htmlFor="eq-img"
            className={`relative w-64 h-48 border-2 rounded-xl overflow-hidden ${
              editing
                ? "border-dashed cursor-pointer hover:border-emerald-500"
                : "border-solid"
            }`}
          >
            {formData.preview ? (
              <img
                src={formData.preview}
                alt={formData.name}
                className="object-contain w-full h-full"
              />
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-gray-400">
                <ImagePlus size={40} className="text-emerald-400" />
                <span className="text-sm">Chọn ảnh</span>
              </div>
            )}
            {editing && (
              <input
                type="file"
                id="eq-img"
                accept="image/*"
                className="absolute inset-0 opacity-0 cursor-pointer"
                onChange={handlePickImage}
              />
            )}
          </label>

          {/* Thông tin */}
          <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-3">
            <p>
              <strong>Mã thiết bị:</strong> {equipment.id}
            </p>
            <p>
              <strong>Nhóm:</strong> {equipment.main_name || "—"}
            </p>
            <p>
              <strong>Loại:</strong> {equipment.type_name || "—"}
            </p>

            <div className="col-span-2">
              <strong>Tên thiết bị:</strong>
              {editing ? (
                <Input
                  value={formData.name}
                  onChange={(e) => handleChange("name", e.target.value)}
                  className="mt-1 h-9"
                />
              ) : (
                <p className="mt-1">{formData.name || "—"}</p>
              )}
            </div>

            {/* <div className="col-span-2">
              <strong>Mô tả:</strong>
              {editing ? (
                <Textarea
                  value={formData.description}
                  onChange={(e) => handleChange("description", e.target.value)}
                  className="mt-1 text-sm"
                />
              ) : (
                <p className="mt-1">{formData.description || "—"}</p>
              )}
            </div> */}
            <div className="col-span-2">
              <strong>Mô tả:</strong>
              {editing ? (
                <Textarea
                  value={formData.description}
                  onChange={(e) => handleChange("description", e.target.value)}
                  className="mt-1 text-sm"
                />
              ) : (
                <div className="mt-1 max-w-[700px] break-words whitespace-pre-line leading-relaxed text-gray-800 dark:text-gray-100">
                  {formData.description || "—"}
                </div>
              )}
            </div>

            <p>
              <strong>Ngày tạo:</strong> {fmtDate(equipment.created_at)}
            </p>
            <p>
              <strong>Cập nhật gần nhất:</strong>{" "}
              {fmtDate(equipment.updated_at)}
            </p>
          </div>
        </div>
      </div>

      {/* CARD 2: Thông số kỹ thuật */}
      <div className="bg-white dark:bg-gray-900 border rounded-2xl shadow p-6 space-y-5">
        <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100">
          Thông số kỹ thuật
        </h3>

        {!editing ? (
          equipment.attributes && equipment.attributes.length > 0 ? (
            <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-3">
              {equipment.attributes.map((a, i) => (
                <div
                  key={i}
                  className="bg-gray-50 dark:bg-gray-800 rounded-lg p-3 border"
                >
                  <p className="text-xs text-gray-500">{a.attribute}</p>
                  <p className="text-sm font-medium">{a.value || "—"}</p>
                </div>
              ))}
            </div>
          ) : (
            <p className="italic text-gray-500">
              (Chưa có thông số kỹ thuật...)
            </p>
          )
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Left: Chọn thông số */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label className="font-medium text-sm">Chọn thông số</Label>
                <Button
                  size="sm"
                  variant="ghost"
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

              <div className="flex items-center gap-2">
                <Input
                  placeholder="Tìm thông số..."
                  value={searchAttr}
                  onChange={(e) => setSearchAttr(e.target.value)}
                  className="h-9 text-sm"
                />
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() =>
                    setSelectedAttrs(
                      Object.fromEntries(
                        filteredAttributes.map((a) => [a.name, ""])
                      )
                    )
                  }
                  className="text-xs"
                >
                  Chọn tất cả
                </Button>
              </div>

              <div className="grid grid-cols-2 gap-2 max-h-56 overflow-y-auto border rounded-md p-3">
                {filteredAttributes.map((attr) => (
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

              <div className="pt-2 border-t">
                {addingAttr ? (
                  <div className="text-sm text-gray-500 flex items-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Đang thêm...
                  </div>
                ) : (
                  <div className="flex gap-2 items-center">
                    <Input
                      placeholder="Thêm thông số mới"
                      value={newAttrName}
                      onChange={(e) => setNewAttrName(e.target.value)}
                      className="h-9 text-sm"
                    />
                    <Button
                      onClick={handleAddNewAttribute}
                      className="bg-emerald-500 hover:bg-emerald-600 text-white h-9 text-sm flex items-center gap-1"
                    >
                      <PlusCircle className="w-4 h-4" /> Thêm
                    </Button>
                  </div>
                )}
              </div>
            </div>

            {/* Right: Nhập giá trị */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label className="font-medium text-sm">Giá trị thông số</Label>
                <Button
                  size="sm"
                  variant="ghost"
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

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-[420px] overflow-y-auto p-2 border rounded-md">
                {Object.entries(selectedAttrs).map(([name, val]) => (
                  <div key={name}>
                    <Label className="text-xs text-gray-500">{name}</Label>
                    <Input
                      placeholder={`Nhập ${name}`}
                      value={val}
                      onChange={(e) =>
                        setSelectedAttrs((prev) => ({
                          ...prev,
                          [name]: e.target.value,
                        }))
                      }
                      className="h-9 text-sm mt-1"
                    />
                  </div>
                ))}
                {Object.keys(selectedAttrs).length === 0 && (
                  <div className="italic text-gray-500 text-sm">
                    (Chưa chọn thông số...)
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
