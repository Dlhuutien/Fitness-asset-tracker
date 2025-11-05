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
import useAuthRole from "@/hooks/useAuthRole";

const fmtDate = (d) => (d ? new Date(d).toLocaleString("vi-VN") : "—");

export default function EquipmentProfilePage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editing, setEditing] = useState(false);
  const [equipment, setEquipment] = useState(null);
  const [saveMessage, setSaveMessage] = useState({ type: "", text: "" });
  const { isTechnician } = useAuthRole();

  const [formData, setFormData] = useState({
    name: "",
    description: "",
    warranty_duration: "2",
    image: "",
    preview: "",
    periodic_maintenance_date: "",
    periodic_frequency_type: "", // 🆕 Tuần / Tháng / Năm
    periodic_frequency_interval: "", // 🆕 Số lần lặp (VD: 2 => 2 tuần/lần)
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
          periodic_maintenance_date: eq.periodic_maintenance_date || "",
          periodic_frequency_type: eq.periodic_frequency_type || "",
          periodic_frequency_interval: eq.periodic_frequency_interval || "",
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
        periodic_maintenance_date: formData.periodic_maintenance_date || null,
        periodic_frequency_type: formData.periodic_frequency_type || null,
        periodic_frequency_interval:
          Number(formData.periodic_frequency_interval) || null,
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
      periodic_maintenance_date: equipment.periodic_maintenance_date || "",
      periodic_frequency_type: equipment.periodic_frequency_type || "",
      periodic_frequency_interval: equipment.periodic_frequency_interval || "",
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
      <div className="flex items-center gap-2">
        <Button
          onClick={() => navigate(-1)}
          className="bg-gray-400 text-white hover:bg-gray-500 flex items-center gap-2"
        >
          <ArrowLeft size={16} /> Quay lại
        </Button>
        <div className="flex flex-col gap-2">
          {/* Nút hành động */}
          <div className="flex gap-3">
            {!editing ? (
              !isTechnician && (
                <Button
                  onClick={() => setEditing(true)}
                  className="bg-blue-600 hover:bg-blue-700 text-white flex items-center gap-2"
                >
                  ✏️ Chỉnh sửa
                </Button>
              )
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
      {/* <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl shadow-md p-8 space-y-8 font-jakarta transition-all duration-300 hover:shadow-lg"> */}
      {/* ==================== CARD 1: THÔNG TIN CƠ BẢN ==================== */}
      <div className="bg-white dark:bg-gray-900 border rounded-3xl shadow p-8 space-y-6 transition-all hover:shadow-lg">
        <div className="flex flex-col md:flex-row gap-8 items-start">
          {/* ẢNH THIẾT BỊ */}
          <div className="flex-shrink-0">
            <img
              src={formData.preview || equipment.image || "/placeholder.png"}
              alt={formData.name}
              className="object-contain w-72 h-56 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm"
            />
          </div>

          {/* THÔNG TIN CHI TIẾT */}
          <div className="flex-1 grid sm:grid-cols-2 gap-x-10 gap-y-4 text-[15px]">
            <p>
              <strong className="text-gray-600 dark:text-gray-400">
                Mã thiết bị:
              </strong>{" "}
              {equipment.id}
            </p>
            <p>
              <strong className="text-gray-600 dark:text-gray-400">
                Nhóm:
              </strong>{" "}
              {equipment.main_name || "—"}
            </p>
            <p>
              <strong className="text-gray-600 dark:text-gray-400">
                Loại:
              </strong>{" "}
              {equipment.type_name || "—"}
            </p>
            <p>
              <strong className="text-gray-600 dark:text-gray-400">
                Ngày tạo:
              </strong>{" "}
              {fmtDate(equipment.created_at)}
            </p>
            <p>
              <strong className="text-gray-600 dark:text-gray-400">
                Cập nhật gần nhất:
              </strong>{" "}
              {fmtDate(equipment.updated_at)}
            </p>

            <div className="col-span-2">
              <strong className="text-gray-600 dark:text-gray-400">
                Tên thiết bị:
              </strong>
              {editing ? (
                <Input
                  value={formData.name}
                  onChange={(e) => handleChange("name", e.target.value)}
                  className="mt-1 h-9 border-gray-300 dark:border-gray-700"
                />
              ) : (
                <p className="mt-1 font-semibold text-lg">
                  {formData.name || "—"}
                </p>
              )}
            </div>

            <div className="col-span-2">
              <strong className="text-gray-600 dark:text-gray-400">
                Mô tả:
              </strong>
              {editing ? (
                <Textarea
                  value={formData.description}
                  onChange={(e) => handleChange("description", e.target.value)}
                  className="mt-1 text-sm"
                />
              ) : (
                <p className="mt-1 leading-relaxed text-gray-800 dark:text-gray-200 max-w-2xl whitespace-pre-line">
                  {formData.description || "—"}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* ==================== BẢO TRÌ ĐỊNH KỲ ==================== */}
        <div className="relative mt-8 rounded-3xl border border-emerald-100/70 bg-gradient-to-b from-emerald-50 via-cyan-50/40 to-white dark:from-gray-900 dark:via-gray-850 dark:to-gray-800 shadow-[0_8px_25px_rgba(0,0,0,0.05)] p-8 backdrop-blur-sm space-y-8">
          {/* Header */}
          <div className="flex items-center gap-3 mb-4">
            <span className="text-3xl animate-bounce-slow">🛠️</span>
            <h4 className="text-2xl font-bold tracking-wide bg-gradient-to-r from-emerald-600 to-cyan-600 bg-clip-text text-transparent">
              Cài đặt bảo trì định kỳ
            </h4>
          </div>

          {/* Inputs */}
          <div className="grid md:grid-cols-3 gap-x-10 gap-y-5 text-[15px]">
            <div>
              <p className="font-semibold text-transparent bg-clip-text bg-gradient-to-r from-emerald-500 to-cyan-500 text-base tracking-wide mb-1">
                Thời gian bắt đầu
              </p>
              {editing ? (
                <Input
                  type="date"
                  value={formData.periodic_maintenance_date || ""}
                  onChange={(e) =>
                    handleChange("periodic_maintenance_date", e.target.value)
                  }
                  className="h-11 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-emerald-400"
                />
              ) : (
                <p className="font-semibold text-gray-900 dark:text-gray-100 text-lg">
                  {formData.periodic_maintenance_date
                    ? new Date(
                        formData.periodic_maintenance_date
                      ).toLocaleDateString("vi-VN")
                    : "—"}
                </p>
              )}
            </div>

            <div>
              <p className="font-semibold text-transparent bg-clip-text bg-gradient-to-r from-emerald-500 to-cyan-500 text-base tracking-wide mb-1">
                {" "}
                Chu kỳ
              </p>
              {editing ? (
                <select
                  value={formData.periodic_frequency_type || ""}
                  onChange={(e) =>
                    handleChange("periodic_frequency_type", e.target.value)
                  }
                  className="h-11 w-full border border-gray-200 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-800 focus:ring-2 focus:ring-emerald-400"
                >
                  <option value="">— Chọn chu kỳ —</option>
                  <option value="week">Tuần</option>
                  <option value="month">Tháng</option>
                  <option value="year">Năm</option>
                </select>
              ) : (
                <p className="font-semibold text-gray-900 dark:text-gray-100 text-lg">
                  {formData.periodic_frequency_type
                    ? { week: "Tuần", month: "Tháng", year: "Năm" }[
                        formData.periodic_frequency_type
                      ]
                    : "—"}
                </p>
              )}
            </div>

            <div>
              <p className="font-semibold text-transparent bg-clip-text bg-gradient-to-r from-emerald-500 to-cyan-500 text-base tracking-wide mb-1">
                Tần suất
              </p>
              {editing ? (
                <Input
                  type="number"
                  min={1}
                  value={formData.periodic_frequency_interval || ""}
                  onChange={(e) =>
                    handleChange(
                      "periodic_frequency_interval",
                      e.target.value.replace(/\D/g, "")
                    )
                  }
                  placeholder="VD: 2"
                  className="h-11 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-emerald-400"
                />
              ) : (
                <p className="font-semibold text-gray-900 dark:text-gray-100 text-lg">
                  {formData.periodic_frequency_interval
                    ? `${formData.periodic_frequency_interval} ${
                        formData.periodic_frequency_type === "week"
                          ? "tuần/lần"
                          : formData.periodic_frequency_type === "month"
                          ? "tháng/lần"
                          : "năm/lần"
                      }`
                    : "—"}
                </p>
              )}
            </div>
          </div>
{/* === FITX Timeline v2: Label to, lắc nhún nhẹ, chú thích rõ === */}
{formData.periodic_maintenance_date &&
 formData.periodic_frequency_type &&
 formData.periodic_frequency_interval && (() => {
  const start = new Date(formData.periodic_maintenance_date);
  const next = new Date(start);
  const freq = Number(formData.periodic_frequency_interval || 1);

  // Tính mốc kế tiếp
  if (formData.periodic_frequency_type === "week") next.setDate(start.getDate() + freq * 7);
  if (formData.periodic_frequency_type === "month") next.setMonth(start.getMonth() + freq);
  if (formData.periodic_frequency_type === "year") next.setFullYear(start.getFullYear() + freq);

  const remind = new Date(next);
  remind.setDate(next.getDate() - 3);
  const today = new Date();

  // === Xác định mốc sắp tới ===
  let nextMilestone = "done";
  if (today < start) nextMilestone = "start";
  else if (today < remind) nextMilestone = "remind";
  else if (today < next) nextMilestone = "next";

  // Format ngày chuẩn DD/MM/YYYY
  const fmt = (d) => {
    const dd = String(d.getDate()).padStart(2, "0");
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const yyyy = d.getFullYear();
    return `${dd}/${mm}/${yyyy}`;
  };

  return (
    <div className="relative bg-white/80 dark:bg-gray-800/60 rounded-2xl border border-emerald-100 dark:border-gray-700 shadow-inner p-10 overflow-hidden">
      {/* ==== LINE ==== */}
      <div className="relative h-[7px] w-full bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden mb-14">
        <div className="absolute left-0 top-0 h-full bg-gradient-to-r from-emerald-500 via-cyan-400 to-indigo-500 rounded-full w-full opacity-70"></div>
      </div>

      {/* ==== 3 MỐC ==== */}
      <div className="flex justify-between items-start text-center select-none">
        {/* ==== BẮT ĐẦU ==== */}
        <div className="flex flex-col items-center w-1/3 group relative">
          <div
            className={`text-6xl ${
              nextMilestone === "start" ? "animate-[shakeBounce_1.3s_ease-in-out_infinite]" : ""
            } text-emerald-500 drop-shadow-[0_0_10px_rgba(16,185,129,0.5)] cursor-pointer`}
          >
            🗓️
          </div>
          <p className="mt-2 text-gray-700 dark:text-gray-300 text-lg font-semibold tracking-wide">
            Bắt đầu
          </p>
          <p className="text-emerald-600 dark:text-emerald-400 font-bold text-xl mt-1">
            {fmt(start)}
          </p>

          {/* Tooltip */}
          {nextMilestone === "start" && (
            <div className="absolute -top-14 opacity-0 group-hover:opacity-100 transition-all duration-300">
              <div className="bg-gradient-to-r from-emerald-500 to-cyan-500 text-white text-sm px-5 py-2 rounded-xl shadow-xl border border-emerald-300 whitespace-nowrap">
                ⚡ Sự kiện sắp xảy ra
              </div>
            </div>
          )}
        </div>

        {/* ==== NHẮC NHỞ ==== */}
        <div className="flex flex-col items-center w-1/3 group relative">
          <div
            className={`text-6xl ${
              nextMilestone === "remind" ? "animate-[shakeBounce_1.3s_ease-in-out_infinite]" : ""
            } text-indigo-500 drop-shadow-[0_0_10px_rgba(99,102,241,0.5)] cursor-pointer`}
          >
            ⏰
          </div>
          <p className="mt-2 text-gray-700 dark:text-gray-300 text-lg font-semibold tracking-wide">
            Nhắc nhở
          </p>
          <p className="text-indigo-600 dark:text-indigo-400 font-bold text-xl mt-1">
            {fmt(remind)}
          </p>

          {/* Tooltip */}
          {nextMilestone === "remind" && (
            <div className="absolute -top-14 opacity-0 group-hover:opacity-100 transition-all duration-300">
              <div className="bg-gradient-to-r from-indigo-500 to-cyan-500 text-white text-sm px-5 py-2 rounded-xl shadow-xl border border-indigo-300 whitespace-nowrap">
                ⚡ Sự kiện sắp xảy ra
              </div>
            </div>
          )}
        </div>

        {/* ==== BẢO TRÌ ==== */}
        <div className="flex flex-col items-center w-1/3 group relative">
          <div
            className={`text-6xl ${
              nextMilestone === "next" ? "animate-[shakeBounce_1.3s_ease-in-out_infinite]" : ""
            } text-amber-500 drop-shadow-[0_0_10px_rgba(245,158,11,0.6)] cursor-pointer`}
          >
            🔔
          </div>
          <p className="mt-2 text-gray-700 dark:text-gray-300 text-lg font-semibold tracking-wide">
            Bảo trì kế tiếp
          </p>
          <p className="text-emerald-600 dark:text-emerald-400 font-bold text-xl mt-1">
            {fmt(next)}
          </p>

          {/* Tooltip */}
          {nextMilestone === "next" && (
            <div className="absolute -top-14 opacity-0 group-hover:opacity-100 transition-all duration-300">
              <div className="bg-gradient-to-r from-amber-500 to-cyan-500 text-white text-sm px-5 py-2 rounded-xl shadow-xl border border-amber-300 whitespace-nowrap">
                ⚡ Sự kiện sắp xảy ra
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ==== CHU KỲ ==== */}
      <div className="mt-12 border-t border-gray-200 dark:border-gray-700 pt-5 text-base text-center text-gray-700 dark:text-gray-300 font-medium">
        <span className="inline-block bg-gradient-to-r from-emerald-500 to-cyan-500 text-transparent bg-clip-text font-semibold text-lg">
          ⏳ Chu kỳ:
        </span>{" "}
        <span className="font-semibold text-emerald-600 dark:text-emerald-400">
          {formData.periodic_frequency_interval}{" "}
          {formData.periodic_frequency_type === "week"
            ? "tuần"
            : formData.periodic_frequency_type === "month"
            ? "tháng"
            : "năm"}
        </span>{" "}
        kể từ ngày{" "}
        <span className="font-bold text-indigo-600 dark:text-indigo-400">{fmt(start)}</span>
      </div>
    </div>
  );
 })()}

{/* === Animation Shake Bounce (nhún nhẹ) === */}
<style>
{`
@keyframes shakeBounce {
  0%, 100% { transform: translateY(0) rotate(0deg); }
  20% { transform: translateY(-5px) rotate(-2deg); }
  40% { transform: translateY(3px) rotate(2deg); }
  60% { transform: translateY(-3px) rotate(-1deg); }
  80% { transform: translateY(2px) rotate(1deg); }
}
`}
</style>

        </div>
      </div>
      {/* </div> */}

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
