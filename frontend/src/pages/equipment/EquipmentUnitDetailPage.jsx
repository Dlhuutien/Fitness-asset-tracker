import { useEffect, useMemo, useState } from "react";
import { useParams, useLocation, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  CalendarDays,
  Factory,
  Package,
  Building2,
  ChevronDown,
} from "lucide-react";
import { Button } from "@/components/ui/buttonn";
import Status from "@/components/common/Status";
import { toast } from "sonner";
import MaintainService from "@/services/MaintainService";
import EquipmentUnitService from "@/services/equipmentUnitService";

// Map vi -> en status for Status chip display
const STATUS_MAP = {
  active: "Hoạt động",
  inactive: "Ngưng hoạt động",
  "temporary urgent": "Ngừng tạm thời",
  "in progress": "Đang bảo trì",
  ready: "Bảo trì thành công",
  failed: "Bảo trì thất bại",
  moving: "Đang di chuyển",
  "in stock": "Thiết bị trong kho",
  deleted: "Đã xóa",
  disposed: "Đã thanh lý",
};

// Các lựa chọn status chuẩn BE (casing quan trọng!)
const STATUS_OPTIONS = [
  "Active",
  "Inactive",
  "Temporary Urgent",
  "In Progress",
  "Ready",
  "Failed",
  "Moving",
  "In Stock",
  "Deleted",
  "Disposed",
];

export default function EquipmentProfilePage() {
  const { id } = useParams();
  const location = useLocation();
  const navigate = useNavigate();

  const [data, setData] = useState(location.state || null);
  const [loading, setLoading] = useState(!location.state);
  const [successMsg, setSuccessMsg] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [reason, setReason] = useState("");
  const [showSpecs, setShowSpecs] = useState(true);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [maintenanceHistory, setMaintenanceHistory] = useState([]);

  // Inline edit mode
  const [editMode, setEditMode] = useState(false);
  const [form, setForm] = useState({
    // unit fields
    status: "",
    branch_id: "",
    cost: "",
    description: "",
    warranty_start_date: "",
    warranty_end_date: "",
    // equipment base fields
    equipment_name: "",
  });

  const eq = data?.equipment || {};
  const isTemporarilyStopped =
    data?.status?.toLowerCase() === "temporary urgent";

  // Load unit detail when no prefetched state
  useEffect(() => {
    if (!data) {
      setLoading(true);
      EquipmentUnitService.getById(id)
        .then((res) => setData(res))
        .catch((err) => console.error("❌ Lỗi lấy chi tiết unit:", err))
        .finally(() => setLoading(false));
    }
  }, [id, data]);

  // Load maintenance history
  useEffect(() => {
    if (!data?.id) return;
    (async () => {
      try {
        const res = await MaintainService.getFullHistory(data.id);
        setMaintenanceHistory(res || []);
      } catch (err) {
        console.error("❌ Lỗi khi tải lịch sử bảo trì:", err);
      }
    })();
  }, [data?.id]);

  // Init form values when data changes (enter/leave edit mode, or loaded)
  useEffect(() => {
    if (!data) return;
    setForm({
      status: normalizeStatusForInput(data.status),
      branch_id: data.branch_id || "",
      cost: data.cost ?? "",
      description: data.description || eq.description || "",
      warranty_start_date: toLocalInputDateTime(data.warranty_start_date),
      warranty_end_date: toLocalInputDateTime(data.warranty_end_date),
      equipment_name: eq.name || "",
    });
  }, [data]);

  const translatedStatus =
    STATUS_MAP[data?.status?.toLowerCase()] || "Không xác định";

  // ===== Helpers to format date <input type="datetime-local"> =====
  function toLocalInputDateTime(iso) {
    if (!iso) return "";
    try {
      const d = new Date(iso);
      const pad = (n) => String(n).padStart(2, "0");
      const yyyy = d.getFullYear();
      const MM = pad(d.getMonth() + 1);
      const dd = pad(d.getDate());
      const hh = pad(d.getHours());
      const mm = pad(d.getMinutes());
      return `${yyyy}-${MM}-${dd}T${hh}:${mm}`;
    } catch {
      return "";
    }
  }
  function toISOStringIfSet(local) {
    if (!local) return null;
    try {
      const d = new Date(local);
      return d.toISOString();
    } catch {
      return null;
    }
  }

  function normalizeStatusForInput(status) {
    if (!status) return "";
    // Chuyển status bất kỳ casing thành dạng chuẩn có sẵn trong OPTIONS
    const lower = String(status).toLowerCase();
    const found = STATUS_OPTIONS.find(
      (opt) => opt.toLowerCase() === lower
    );
    return found || status; // fallback giữ nguyên
  }

  // ===== Actions =====
  const handleCreateMaintenance = async () => {
    if (!data?.id) {
      setErrorMsg("⚠️ Không xác định được mã thiết bị!");
      return;
    }
    if (!reason.trim()) {
      setErrorMsg("⚠️ Vui lòng nhập lý do tạm dừng!");
      return;
    }

    try {
      setLoading(true);
      setErrorMsg("");
      setSuccessMsg("");
      toast.info("⏳ Đang gửi yêu cầu bảo trì...");

      await MaintainService.create({
        equipment_unit_id: data.id,
        maintenance_reason: reason.trim(),
      });

      await EquipmentUnitService.update(data.id, {
        status: "Temporary Urgent",
      });

      setData((prev) => ({ ...prev, status: "Temporary Urgent" }));
      setReason("");
      toast.success("✅ Đã dừng tạm thời thiết bị!");
      setSuccessMsg(
        "✅ Thiết bị đã được chuyển sang trạng thái ngừng tạm thời!"
      );
    } catch (err) {
      console.error("❌ Lỗi khi dừng tạm thời:", err);
      setErrorMsg("❌ Không thể dừng tạm thời thiết bị!");
      toast.error("❌ Không thể dừng tạm thời thiết bị!");
    } finally {
      setLoading(false);
    }
  };

  const handleActivate = async () => {
    try {
      setLoading(true);
      await EquipmentUnitService.update(data.id, { status: "Active" });
      setData((prev) => ({ ...prev, status: "Active" }));
      toast.success("✅ Thiết bị đã được đưa vào hoạt động!");
      setSuccessMsg("Thiết bị đã được kích hoạt thành công.");
      setErrorMsg("");
    } catch (err) {
      console.error("❌ Lỗi khi cập nhật trạng thái:", err);
      toast.error("❌ Không thể đưa thiết bị vào hoạt động!");
      setErrorMsg("Không thể đưa vào hoạt động, vui lòng thử lại.");
      setSuccessMsg("");
    } finally {
      setLoading(false);
    }
  };

  const handleEditToggle = () => {
    // bật/tắt edit mode, đồng thời reset form từ data hiện tại
    setEditMode((prev) => !prev);
    if (!editMode && data) {
      setForm({
        status: normalizeStatusForInput(data.status),
        branch_id: data.branch_id || "",
        cost: data.cost ?? "",
        description: data.description || eq.description || "",
        warranty_start_date: toLocalInputDateTime(data.warranty_start_date),
        warranty_end_date: toLocalInputDateTime(data.warranty_end_date),
        equipment_name: eq.name || "",
      });
    }
  };

  const handleCancel = () => {
    // khôi phục form và tắt edit
    if (data) {
      setForm({
        status: normalizeStatusForInput(data.status),
        branch_id: data.branch_id || "",
        cost: data.cost ?? "",
        description: data.description || eq.description || "",
        warranty_start_date: toLocalInputDateTime(data.warranty_start_date),
        warranty_end_date: toLocalInputDateTime(data.warranty_end_date),
        equipment_name: eq.name || "",
      });
    }
    setEditMode(false);
  };

  const handleSave = async () => {
    if (!data?.id) return;

    // Chuẩn hóa payload cho unit update
    const unitPayload = {
      status: form.status || data.status,
      branch_id: form.branch_id || null,
      description: form.description?.trim() || "",
    };

    // cost
    if (form.cost !== "" && form.cost !== null && !isNaN(form.cost)) {
      unitPayload.cost = parseFloat(form.cost);
    }

    // warranty dates
    unitPayload.warranty_start_date = toISOStringIfSet(
      form.warranty_start_date
    );
    unitPayload.warranty_end_date = toISOStringIfSet(form.warranty_end_date);

    try {
      setLoading(true);
      toast.info("⏳ Đang lưu thay đổi...");

      // 1) Update Unit
      await EquipmentUnitService.update(data.id, unitPayload);

      // 2) Update equipment base (name) nếu thay đổi
      if (data.equipment?.id) {
        const currName = data.equipment?.name || "";
        if (form.equipment_name.trim() !== currName) {
          await EquipmentUnitService.updateBaseInfo(data.equipment.id, {
            name: form.equipment_name.trim(),
          });
        }
      }

      // 3) Update UI state
      setData((prev) => ({
        ...prev,
        status: unitPayload.status,
        branch_id: unitPayload.branch_id ?? prev.branch_id,
        description: unitPayload.description,
        cost:
          unitPayload.cost !== undefined && !isNaN(unitPayload.cost)
            ? unitPayload.cost
            : prev.cost,
        warranty_start_date:
          unitPayload.warranty_start_date ?? prev.warranty_start_date,
        warranty_end_date:
          unitPayload.warranty_end_date ?? prev.warranty_end_date,
        equipment: {
          ...prev.equipment,
          name: form.equipment_name || prev.equipment?.name,
        },
      }));

      toast.success("✅ Cập nhật thiết bị thành công!");
      setEditMode(false);
    } catch (err) {
      console.error("❌ Lỗi khi lưu thay đổi:", err);
      toast.error("❌ Không thể lưu thay đổi!");
    } finally {
      setLoading(false);
    }
  };

  if (loading)
    return (
      <div className="p-6 text-center text-gray-500 dark:text-gray-300 animate-pulse">
        Đang tải dữ liệu thiết bị...
      </div>
    );

  if (!data)
    return (
      <div className="p-6 text-center text-red-500 font-semibold">
        Không tìm thấy thiết bị
      </div>
    );

  return (
    <motion.div
      className="p-6 space-y-6 font-jakarta transition-colors duration-300"
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
    >
      {/* Back */}
      <Button
        onClick={() => navigate(-1)}
        variant="outline"
        className="flex items-center gap-2 border-brand text-brand hover:bg-brand/10 dark:hover:bg-brand-dark/30 transition-all text-sm font-medium px-3 py-1.5 rounded-md shadow-sm"
      >
        <ArrowLeft size={16} />
        <span>Quay lại</span>
      </Button>

      {/* Card chính */}
      <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl shadow-md p-6 hover:shadow-lg transition-all duration-300">
        <div className="flex flex-col md:flex-row gap-6 items-start md:items-center">
          <img
            src={eq.image || "/placeholder.jpg"}
            alt={eq.name}
            className="w-64 h-48 object-contain rounded-lg bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700"
          />

          <div className="flex-1 space-y-3 w-full">
            <div className="flex items-center justify-between flex-wrap gap-3">
              {!editMode ? (
                <h1 className="text-2xl font-semibold text-gray-900 dark:text-gray-100">
                  {eq.name || "Thiết bị không xác định"}
                </h1>
              ) : (
                <div className="w-full max-w-md">
                  <label className="text-sm text-gray-500 dark:text-gray-400">
                    Tên thiết bị
                  </label>
                  <input
                    type="text"
                    value={form.equipment_name}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, equipment_name: e.target.value }))
                    }
                    className="w-full px-3 py-2 border rounded-lg dark:bg-gray-800 dark:text-white dark:border-gray-600 focus:ring-2 focus:ring-emerald-400 outline-none"
                  />
                </div>
              )}

              <div className="flex items-center gap-3">
                {data.status?.toLowerCase() === "in stock" && !editMode && (
                  <Button
                    onClick={handleActivate}
                    disabled={loading}
                    className="bg-gradient-to-r from-emerald-400 to-emerald-600 hover:from-emerald-500 hover:to-emerald-700 text-white px-6 py-3 rounded-xl shadow-md hover:shadow-lg transition-all duration-300 font-semibold"
                  >
                    🚀 Đưa vào hoạt động
                  </Button>
                )}

                {!editMode ? (
                  <Button
                    onClick={handleEditToggle}
                    variant="outline"
                    className="px-5 py-3 rounded-xl border-amber-400 text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-900/30 transition-all duration-300 font-semibold"
                  >
                    ✏️ Sửa thông tin
                  </Button>
                ) : (
                  <>
                    <Button
                      onClick={handleCancel}
                      variant="outline"
                      className="px-5 py-3 rounded-xl border-gray-300 text-gray-700 hover:bg-gray-50 dark:text-gray-300 dark:hover:bg-gray-800 transition-all font-semibold"
                    >
                      Hủy
                    </Button>
                    <Button
                      onClick={handleSave}
                      disabled={loading}
                      className="bg-gradient-to-r from-emerald-400 to-emerald-600 hover:from-emerald-500 hover:to-emerald-700 text-white px-6 py-3 rounded-xl shadow-md hover:shadow-lg transition-all font-semibold"
                    >
                      💾 Lưu thay đổi
                    </Button>
                  </>
                )}
              </div>
            </div>

            {/* Ghi chú kho */}
            {data.status?.toLowerCase() === "in stock" && !editMode && (
              <p className="text-xs italic text-gray-400 mt-[6px]">
                Thiết bị mới nhập vào kho
              </p>
            )}

            {/* Nhóm trạng thái + id + nhóm */}
            <div className="flex flex-wrap items-center gap-3">
              {!editMode ? (
                <Status status={translatedStatus} />
              ) : (
                <div className="w-60">
                  <label className="text-sm text-gray-500 dark:text-gray-400">
                    Trạng thái
                  </label>
                  <select
                    value={form.status}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, status: e.target.value }))
                    }
                    className="w-full px-3 py-2 border rounded-lg dark:bg-gray-800 dark:text-white dark:border-gray-600 focus:ring-2 focus:ring-emerald-400 outline-none"
                  >
                    {STATUS_OPTIONS.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <span className="text-sm text-gray-500 dark:text-gray-400">
                Mã định danh thiết bị:{" "}
                <span className="font-medium text-gray-900 dark:text-gray-100">
                  {data.id}
                </span>
              </span>

              <span className="text-sm text-gray-500 dark:text-gray-400">
                Nhóm:{" "}
                <span className="font-medium text-gray-900 dark:text-gray-100">
                  {eq.main_name || "—"}
                </span>
              </span>
            </div>

            {/* Chi tiết: chuyển sang input khi editMode */}
            <div className="grid sm:grid-cols-2 gap-x-8 gap-y-4 pt-4 border-t border-gray-200 dark:border-gray-700">
              {/* Loại thiết bị (read-only) */}
              <FieldView icon={<Package size={16} />} label="Loại thiết bị">
                {eq.type_name || "—"}
              </FieldView>

              {/* Mã thiết bị gốc (read-only) */}
              <FieldView icon={<Package size={16} />} label="Mã thiết bị gốc">
                {eq.id || "—"}
              </FieldView>

              {/* Nhà cung cấp (read-only trong phiên bản này) */}
              <FieldView icon={<Factory size={16} />} label="Nhà cung cấp">
                {data.vendor_name || "—"}
              </FieldView>

              {/* Chi nhánh (input text) */}
              <FieldEdit
                editMode={editMode}
                icon={<Building2 size={16} />}
                label="Chi nhánh"
                value={form.branch_id}
                onChange={(v) => setForm((f) => ({ ...f, branch_id: v }))}
                placeholder="VD: GV / Q1..."
              >
                {data.branch_id || "—"}
              </FieldEdit>

              {/* Ngày tạo (read-only) */}
              <FieldView icon={<CalendarDays size={16} />} label="Ngày tạo">
                {new Date(data.created_at).toLocaleString("vi-VN")}
              </FieldView>

              {/* Cập nhật gần nhất (read-only) */}
              <FieldView
                icon={<CalendarDays size={16} />}
                label="Cập nhật gần nhất"
              >
                {new Date(data.updated_at).toLocaleString("vi-VN")}
              </FieldView>

              {/* Bảo hành: start */}
              <FieldEdit
                editMode={editMode}
                icon={<CalendarDays size={16} />}
                label="Bắt đầu bảo hành"
                type="datetime-local"
                value={form.warranty_start_date}
                onChange={(v) =>
                  setForm((f) => ({ ...f, warranty_start_date: v }))
                }
              >
                {data.warranty_start_date
                  ? new Date(data.warranty_start_date).toLocaleString("vi-VN")
                  : "—"}
              </FieldEdit>

              {/* Bảo hành: end */}
              <FieldEdit
                editMode={editMode}
                icon={<CalendarDays size={16} />}
                label="Kết thúc bảo hành"
                type="datetime-local"
                value={form.warranty_end_date}
                onChange={(v) =>
                  setForm((f) => ({ ...f, warranty_end_date: v }))
                }
              >
                {data.warranty_end_date
                  ? new Date(data.warranty_end_date).toLocaleString("vi-VN")
                  : "—"}
              </FieldEdit>

              {/* Thời hạn bảo hành (read-only nếu đang tính từ start/end; nếu bạn có field riêng thì chuyển sang editable tương tự) */}
              <FieldView
                icon={<Package size={16} />}
                label="Thời hạn bảo hành"
              >
                {data.warranty_duration ? `${data.warranty_duration} năm` : "—"}
              </FieldView>

              {/* Mô tả */}
              <FieldEdit
                editMode={editMode}
                icon={<Package size={16} />}
                label="Mô tả thiết bị"
                type="textarea"
                value={form.description}
                onChange={(v) => setForm((f) => ({ ...f, description: v }))}
                placeholder="Mô tả chi tiết..."
              >
                {eq.description || data.description || "—"}
              </FieldEdit>

              {/* Giá nhập */}
              <FieldEdit
                editMode={editMode}
                icon={<Package size={16} />}
                label="Giá nhập thiết bị"
                type="number"
                value={form.cost}
                onChange={(v) => setForm((f) => ({ ...f, cost: v }))}
                placeholder="0"
              >
                {data.cost
                  ? data.cost.toLocaleString("vi-VN", {
                      style: "currency",
                      currency: "VND",
                    })
                  : "—"}
              </FieldEdit>
            </div>
          </div>
        </div>
      </div>

      {/* Thông số kỹ thuật */}
      <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl shadow-md overflow-hidden transition-all duration-300">
        <button
          onClick={() => setShowSpecs(!showSpecs)}
          className="w-full flex justify-between items-center p-6 hover:bg-gray-50 dark:hover:bg-gray-800 transition-all"
        >
          <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-100">
            Thông số kỹ thuật
          </h2>
          <ChevronDown
            className={`w-5 h-5 text-gray-600 dark:text-gray-300 transform transition-transform ${
              showSpecs ? "rotate-180" : ""
            }`}
          />
        </button>

        {showSpecs && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            transition={{ duration: 0.3 }}
            className="p-6 border-t border-gray-200 dark:border-gray-700"
          >
            {eq.attributes && eq.attributes.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                {eq.attributes.map((attr, i) => (
                  <div
                    key={i}
                    className="bg-gray-50 dark:bg-gray-800 rounded-lg p-3 border border-gray-200 dark:border-gray-700 hover:border-emerald-400/60 transition"
                  >
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {attr.attribute}
                    </p>
                    <p className="text-sm font-medium text-gray-800 dark:text-gray-100">
                      {attr.value || "—"}
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm italic text-gray-500 dark:text-gray-400 text-center">
                (Chưa có thông số kỹ thuật nào được thêm cho thiết bị này)
              </p>
            )}
          </motion.div>
        )}
      </div>

      {/* Lịch sử bảo trì */}
      <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl shadow-md overflow-hidden">
        <button
          onClick={() => setHistoryOpen((p) => !p)}
          className="w-full flex justify-between items-center p-6 hover:bg-gray-50 dark:hover:bg-gray-800 transition-all"
        >
          <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-100">
            Lịch sử bảo trì thiết bị
          </h2>
          <ChevronDown
            className={`w-5 h-5 text-gray-600 dark:text-gray-300 transform transition-transform ${
              historyOpen ? "rotate-180" : ""
            }`}
          />
        </button>

        {historyOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            transition={{ duration: 0.3 }}
            className="p-6 border-t border-gray-200 dark:border-gray-700"
          >
            {maintenanceHistory.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="min-w-full text-sm border dark:border-gray-700">
                  <thead className="bg-gray-100 dark:bg-gray-800 dark:text-gray-200">
                    <tr>
                      <th className="p-2 border">Chi nhánh</th>
                      <th className="p-2 border">Bắt đầu</th>
                      <th className="p-2 border">Kết thúc</th>
                      <th className="p-2 border">Lý do</th>
                      <th className="p-2 border">Chi tiết</th>
                      <th className="p-2 border">Yêu cầu bởi</th>
                      <th className="p-2 border">Kỹ thuật viên</th>
                      <th className="p-2 border">Bảo hành</th>
                      <th className="p-2 border">Chi phí</th>
                      <th className="p-2 border">Ngày tạo hóa đơn</th>
                    </tr>
                  </thead>
                  <tbody>
                    {maintenanceHistory.map((item, idx) => {
                      const invoice = item.invoices?.[0] || {};
                      return (
                        <tr
                          key={idx}
                          className="hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                        >
                          <td className="p-2 border text-center">
                            {item.branch_id || "—"}
                          </td>
                          <td className="p-2 border">
                            {item.start_date
                              ? new Date(item.start_date).toLocaleString(
                                  "vi-VN"
                                )
                              : "—"}
                          </td>
                          <td className="p-2 border">
                            {item.end_date
                              ? new Date(item.end_date).toLocaleString("vi-VN")
                              : "—"}
                          </td>
                          <td className="p-2 border">
                            {item.maintenance_reason || "—"}
                          </td>
                          <td className="p-2 border">
                            {item.maintenance_detail || "—"}
                          </td>
                          <td className="p-2 border">
                            {item.requested_by_name || "—"}
                          </td>
                          <td className="p-2 border">
                            {item.technician_name || "—"}
                          </td>
                          <td className="p-2 border text-center">
                            {item.warranty ? "Có" : "Không"}
                          </td>
                          <td className="p-2 border text-right">
                            {invoice.cost !== undefined
                              ? `${invoice.cost.toLocaleString("vi-VN")} đ`
                              : "—"}
                          </td>
                          <td className="p-2 border text-center">
                            {invoice.created_at
                              ? new Date(invoice.created_at).toLocaleString(
                                  "vi-VN"
                                )
                              : "—"}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="text-sm text-gray-500 dark:text-gray-400 italic">
                (Chưa có lịch sử bảo trì nào cho thiết bị này)
              </p>
            )}
          </motion.div>
        )}
      </div>

      {/* Dừng tạm thời */}
      {data.status?.toLowerCase() === "active" &&
        (!isTemporarilyStopped ? (
          <div className="flex flex-col items-center justify-center gap-3 pt-4">
            <div className="w-full max-w-md flex flex-col items-center gap-2">
              <input
                type="text"
                placeholder="Nhập lý do tạm dừng thiết bị..."
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg shadow-sm text-sm 
        dark:bg-gray-800 dark:text-white dark:border-gray-600 focus:ring-2 
        focus:ring-amber-400 outline-none transition-all"
              />
              <Button
                onClick={handleCreateMaintenance}
                disabled={loading}
                className="bg-gradient-to-r from-amber-300 to-yellow-400 hover:from-yellow-400 hover:to-amber-300 
        text-gray-800 font-semibold px-8 py-3 rounded-lg shadow-md hover:shadow-lg transition-all 
        disabled:opacity-70 disabled:cursor-not-allowed w-full"
              >
                ⚙️ Dừng tạm thời
              </Button>
            </div>

            {successMsg && (
              <div className="px-4 py-2 text-sm rounded bg-emerald-50 text-emerald-600 border border-emerald-200 shadow-sm">
                {successMsg}
              </div>
            )}
            {errorMsg && (
              <div className="px-4 py-2 text-sm rounded bg-red-50 text-red-600 border border-red-200 shadow-sm">
                {errorMsg}
              </div>
            )}
          </div>
        ) : (
          <div className="text-center pt-4">
            <div className="inline-block px-4 py-2 text-sm font-medium text-amber-600 bg-amber-50 border border-amber-200 rounded-lg shadow-sm">
              ⚠️ Thiết bị hiện đang ở trạng thái <b>“Ngừng tạm thời”</b>.
            </div>
          </div>
        ))}
    </motion.div>
  );
}

/** Hiển thị chỉ đọc */
function FieldView({ icon, label, children }) {
  return (
    <div className="flex items-center gap-2">
      <div className="text-brand">{icon}</div>
      <div>
        <p className="text-sm text-gray-500 dark:text-gray-400">{label}</p>
        <p className="text-base font-medium text-gray-800 dark:text-gray-100">
          {children ?? "—"}
        </p>
      </div>
    </div>
  );
}


/** Inline edit: khi editMode=true hiển thị input, ngược lại hiển thị children */
function FieldEdit({
  editMode,
  icon,
  label,
  type = "text",
  value,
  onChange,
  placeholder,
  children,
}) {
  return (
    <div className="flex items-start gap-2">
      <div className="mt-1 text-brand">{icon}</div>
      <div className="w-full">
        <p className="text-sm text-gray-500 dark:text-gray-400">{label}</p>

        {!editMode ? (
          <p
            className="text-base font-medium text-gray-800 dark:text-gray-100 max-w-[400px] overflow-hidden text-ellipsis whitespace-nowrap"
            title={children ?? "—"}
          >
            {children ?? "—"}
          </p>
        ) : type === "textarea" ? (
          <textarea
            rows={3}
            value={value ?? ""}
            placeholder={placeholder}
            onChange={(e) => onChange?.(e.target.value)}
            className="w-full mt-1 px-3 py-2 border rounded-lg dark:bg-gray-800 dark:text-white dark:border-gray-600 focus:ring-2 focus:ring-emerald-400 outline-none"
          />
        ) : (
          <input
            type={type}
            value={value ?? ""}
            placeholder={placeholder}
            onChange={(e) => onChange?.(e.target.value)}
            className="w-full mt-1 px-3 py-2 border rounded-lg dark:bg-gray-800 dark:text-white dark:border-gray-600 focus:ring-2 focus:ring-emerald-400 outline-none"
          />
        )}
      </div>
    </div>
  );
}

