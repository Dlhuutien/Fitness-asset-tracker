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
import useAuthRole from "@/hooks/useAuthRole";
import EquipmentTransferHistoryService from "@/services/EquipmentTransferHistoryService";

// Map vi -> en status for Status chip display
const STATUS_MAP = {
  active: "Hoạt động",
  inactive: "Ngưng hoạt động",
  "temporary urgent": "Ngừng tạm thời",
  "in progress": "Đang bảo trì",
  ready: "Bảo trì thành công",
  failed: "Bảo trì thất bại",
  moving: "Đang điều chuyển",
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
  const [transferHistoryOpen, setTransferHistoryOpen] = useState(false);
  const [transferHistory, setTransferHistory] = useState([]);
  const { branchId, isSuperAdmin, isTechnician, isOperator } = useAuthRole();
  const isForeignBranch =
    !isSuperAdmin && data?.branch_id && data.branch_id !== branchId;

  // Inline edit mode
  const [editMode, setEditMode] = useState(false);
  const [form, setForm] = useState({
    equipment_name: "",
    branch_id: "",
    warranty_duration: "",
    description: "",
    cost: "",
  });

  const eq = data?.equipment || {};
  const isTemporarilyStopped =
    data?.status?.toLowerCase() === "Temporary Urgent";

  // Load unit detail when no prefetched state
  useEffect(() => {
    if (!data) {
      setLoading(true);
      EquipmentUnitService.getById(id)
        .then((res) => {
          setData(res);
          const eq = res?.equipment || {};
          setForm({
            equipment_name: eq.name || "",
            branch_id: res.branch_id || "",
            warranty_duration: res.warranty_duration || 1,
            description: res.description || eq.description || "",
            cost: res.cost || "",
          });
        })
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

  // Load transfer history
  useEffect(() => {
    if (!data?.id) return;
    (async () => {
      try {
        const res = await EquipmentTransferHistoryService.getByUnitId(data.id);
        setTransferHistory(res || []);
      } catch (err) {
        console.error("❌ Lỗi khi tải lịch sử điều chuyển:", err);
      }
    })();
  }, [data?.id]);

  // Helper: tính ngày kết thúc bảo hành theo số năm
  const computeWarrantyEnd = (startDate, years) => {
    if (!startDate || !years) return "";
    const start = new Date(startDate);
    start.setFullYear(start.getFullYear() + Number(years));
    return start.toISOString();
  };

  const translatedStatus =
    STATUS_MAP[data?.status?.toLowerCase()] || "Không xác định";

  // ===== Save =====
  const handleSave = async () => {
    if (!data?.id) return;

    try {
      setLoading(true);
      toast.info("⏳ Đang lưu thay đổi...");

      const newWarrantyEnd = computeWarrantyEnd(
        data.warranty_start_date,
        form.warranty_duration
      );

      // 1️⃣ Update unit
      await EquipmentUnitService.update(data.id, {
        branch_id: form.branch_id,
        cost: Number(form.cost) || 0,
        description: form.description?.trim() || "",
        warranty_duration: Number(form.warranty_duration),
        warranty_end_date: newWarrantyEnd,
      });

      // 2️⃣ Update base equipment name nếu đổi
      if (data.equipment?.id) {
        const oldName = data.equipment?.name || "";
        if (form.equipment_name.trim() !== oldName) {
          await EquipmentUnitService.updateBaseInfo(data.equipment.id, {
            name: form.equipment_name.trim(),
          });
        }
      }

      // 3️⃣ Update UI state
      setData((prev) => ({
        ...prev,
        branch_id: form.branch_id,
        cost: Number(form.cost) || prev.cost,
        description: form.description,
        warranty_duration: Number(form.warranty_duration),
        warranty_end_date: newWarrantyEnd,
        equipment: {
          ...prev.equipment,
          name: form.equipment_name,
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

  // ===== Dừng tạm thời =====
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

  const handleMoveToStock = async () => {
    try {
      setLoading(true);
      await EquipmentUnitService.update(data.id, { status: "In Stock" });
      setData((prev) => ({ ...prev, status: "In Stock" }));
      toast.success("📦 Thiết bị đã được đưa lại vào kho!");
      setSuccessMsg("Thiết bị đã được chuyển sang trạng thái 'Trong kho'.");
      setErrorMsg("");
    } catch (err) {
      console.error("❌ Lỗi khi đưa vào kho:", err);
      toast.error("❌ Không thể đưa thiết bị vào kho!");
      setErrorMsg("Không thể chuyển vào kho, vui lòng thử lại.");
      setSuccessMsg("");
    } finally {
      setLoading(false);
    }
  };

  // ===== Loading =====
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

  // ====== UI ======
  return (
    <motion.div
      className="p-6 space-y-6 font-jakarta transition-colors duration-300"
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
    >
      {/* Back + Transfer */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Button
            onClick={() => navigate(-1)}
            variant="outline"
            className="flex items-center gap-2 border-brand text-brand hover:bg-brand/10 dark:hover:bg-brand-dark/30 transition-all text-sm font-medium px-3 py-1.5 rounded-md shadow-sm"
          >
            <ArrowLeft size={16} />
            <span>Quay lại</span>
          </Button>

          {/* 🔁 Điều chuyển + 🗑️ Thanh lý */}
          {!isForeignBranch && !(isTechnician || isOperator) && (
            <div className="flex items-center gap-2">
              {/* 🏭 Nút điều chuyển (Active hoặc In Stock) */}
              {["active", "in stock"].includes(data.status?.toLowerCase()) && (
                <Button
                  onClick={() =>
                    navigate("/app/equipment/transfer", {
                      state: {
                        preselectedUnit: data,
                        branch_id: data.branch_id,
                      },
                    })
                  }
                  className="flex items-center gap-2 bg-gradient-to-r from-indigo-400 to-purple-600 hover:from-indigo-500 hover:to-purple-700 text-white px-4 py-2 rounded-lg shadow-md hover:shadow-lg transition-all text-sm font-semibold"
                >
                  Điều chuyển
                </Button>
              )}

              {/* 🗑️ Nút thanh lý (Inactive hoặc In Stock) */}
              {["inactive", "in stock"].includes(
                data.status?.toLowerCase()
              ) && (
                <Button
                  onClick={() =>
                    navigate("/app/equipment/disposal", {
                      state: {
                        preselectedUnit: data,
                        branch_id: data.branch_id, // ✅ gửi kèm chi nhánh thiết bị
                      },
                    })
                  }
                  className="flex items-center gap-2 bg-gradient-to-r from-rose-400 to-rose-600 hover:from-rose-500 hover:to-rose-700 text-white px-4 py-2 rounded-lg shadow-md hover:shadow-lg transition-all text-sm font-semibold"
                >
                  Thanh lý
                </Button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Card chính */}
      <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl shadow-md p-6">
        <div className="flex flex-col md:flex-row gap-6">
          <img
            src={eq.image || "/placeholder.jpg"}
            alt={eq.name}
            className="w-64 h-48 object-contain rounded-lg bg-gray-50 dark:bg-gray-800 border"
          />

          <div className="flex-1 space-y-3">
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
                    className="w-full px-3 py-2 border rounded-lg dark:bg-gray-800 dark:text-white focus:ring-2 focus:ring-emerald-400 outline-none"
                  />
                </div>
              )}

              {!isForeignBranch && !isTechnician && (
                <div className="flex items-center gap-3">
                  {/* 🚀 Nếu thiết bị đang trong kho => cho phép kích hoạt */}
                  {data.status?.toLowerCase() === "in stock" && !editMode && (
                    <Button
                      onClick={handleActivate}
                      disabled={loading}
                      className="bg-gradient-to-r from-emerald-400 to-emerald-600 hover:from-emerald-500 hover:to-emerald-700 text-white px-6 py-3 rounded-xl shadow-md hover:shadow-lg transition-all duration-300 font-semibold"
                    >
                      🚀 Đưa vào hoạt động
                    </Button>
                  )}

                  {/* 📦 Nếu thiết bị đang hoạt động => cho phép đưa lại vào kho */}
                  {data.status?.toLowerCase() === "active" && !editMode && (
                    <Button
                      onClick={handleMoveToStock}
                      disabled={loading}
                      className="bg-gradient-to-r from-blue-400 to-indigo-600 hover:from-blue-500 hover:to-indigo-700 text-white px-6 py-3 rounded-xl shadow-md hover:shadow-lg transition-all duration-300 font-semibold"
                    >
                      📦 Đưa vào kho
                    </Button>
                  )}

                  {/* ✏️ Nút Sửa / Hủy / Lưu */}
                  {!editMode ? (
                    <Button
                      onClick={() => setEditMode(true)}
                      variant="outline"
                      className="px-5 py-3 rounded-xl border-amber-400 text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-900/30 transition-all font-semibold"
                    >
                      ✏️ Sửa thông tin
                    </Button>
                  ) : (
                    <>
                      <Button
                        onClick={() => setEditMode(false)}
                        variant="outline"
                        className="px-5 py-3 rounded-xl border-gray-300 text-gray-700 hover:bg-gray-50 dark:text-gray-300 dark:hover:bg-gray-800 transition-all font-semibold"
                      >
                        Hủy
                      </Button>
                      <Button
                        onClick={handleSave}
                        disabled={loading}
                        className="bg-gradient-to-r from-emerald-400 to-emerald-600 text-white px-6 py-3 rounded-xl shadow-md hover:shadow-lg transition-all font-semibold"
                      >
                        💾 Lưu thay đổi
                      </Button>
                    </>
                  )}
                </div>
              )}
            </div>

            {/* Nhóm trạng thái + id + nhóm */}
            <div className="flex flex-wrap items-center gap-3">
              <Status status={translatedStatus} />
              <span className="text-sm text-gray-500">
                Mã định danh thiết bị:{" "}
                <span className="font-medium">{data.id}</span>
              </span>
              <span className="text-sm text-gray-500">
                Nhóm: <span className="font-medium">{eq.main_name || "—"}</span>
              </span>
            </div>

            {/* Chi tiết */}
            <div className="grid sm:grid-cols-2 gap-x-8 gap-y-4 pt-4 border-t">
              <FieldView icon={<Package />} label="Loại thiết bị">
                {eq.type_name || "—"}
              </FieldView>

              <FieldView icon={<Factory />} label="Nhà cung cấp">
                {data.vendor_name || "—"}
              </FieldView>

              {/* Chi nhánh (không cho chỉnh sửa) */}
              <FieldView icon={<Building2 />} label="Chi nhánh">
                {data.branch_id || "—"}
              </FieldView>

              <FieldView icon={<CalendarDays />} label="Ngày bắt đầu bảo hành">
                {new Date(data.warranty_start_date).toLocaleDateString("vi-VN")}
              </FieldView>

              <FieldView icon={<CalendarDays />} label="Ngày kết thúc bảo hành">
                {new Date(data.warranty_end_date).toLocaleDateString("vi-VN")}
              </FieldView>

              <FieldEdit
                editMode={editMode}
                icon={<Package />}
                label="Thời hạn bảo hành (năm)"
                type="number"
                value={form.warranty_duration}
                onChange={(v) =>
                  setForm((f) => ({ ...f, warranty_duration: v }))
                }
                placeholder="VD: 2"
              >
                {data.warranty_duration ? `${data.warranty_duration} năm` : "—"}
              </FieldEdit>

              <FieldEdit
                editMode={editMode}
                icon={<Package />}
                label="Mô tả thiết bị"
                type="textarea"
                value={form.description}
                onChange={(v) => setForm((f) => ({ ...f, description: v }))}
              >
                {eq.description || data.description || "—"}
              </FieldEdit>

              <FieldEdit
                editMode={editMode}
                icon={<Package />}
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
      <SpecSection showSpecs={showSpecs} setShowSpecs={setShowSpecs} eq={eq} />

      {/* Lịch sử bảo trì */}
      <HistorySection
        historyOpen={historyOpen}
        setHistoryOpen={setHistoryOpen}
        maintenanceHistory={maintenanceHistory}
      />

      {/* Lịch sửchuyểnhuyển */}
      <TransferHistorySection
        transferHistoryOpen={transferHistoryOpen}
        setTransferHistoryOpen={setTransferHistoryOpen}
        transferHistory={transferHistory}
      />

      {/* Dừng tạm thời */}
      <PauseSection
        data={data}
        branchId={branchId}
        isForeignBranch={isForeignBranch}
        isTemporarilyStopped={isTemporarilyStopped}
        reason={reason}
        setReason={setReason}
        handleCreateMaintenance={handleCreateMaintenance}
        loading={loading}
        successMsg={successMsg}
        errorMsg={errorMsg}
      />
    </motion.div>
  );
}

/* ===== Field hiển thị chỉ đọc ===== */
function FieldView({ icon, label, children }) {
  return (
    <div className="flex items-center gap-2">
      <div className="text-brand">{icon}</div>
      <div>
        <p className="text-sm text-gray-500">{label}</p>
        <p className="text-base font-medium text-gray-800">{children ?? "—"}</p>
      </div>
    </div>
  );
}

/* ===== Field chỉnh sửa inline ===== */
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
        <p className="text-sm text-gray-500">{label}</p>
        {!editMode ? (
          <p className="text-base font-medium text-gray-800">
            {children ?? "—"}
          </p>
        ) : type === "textarea" ? (
          <textarea
            rows={3}
            value={value ?? ""}
            placeholder={placeholder}
            onChange={(e) => onChange?.(e.target.value)}
            className="w-full mt-1 px-3 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-400 outline-none"
          />
        ) : (
          <input
            type={type}
            value={value ?? ""}
            placeholder={placeholder}
            onChange={(e) => onChange?.(e.target.value)}
            className="w-full mt-1 px-3 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-400 outline-none"
          />
        )}
      </div>
    </div>
  );
}

/* ===== Thông số kỹ thuật ===== */
function SpecSection({ showSpecs, setShowSpecs, eq }) {
  return (
    <div className="bg-white border rounded-xl shadow-md overflow-hidden">
      <button
        onClick={() => setShowSpecs(!showSpecs)}
        className="w-full flex justify-between items-center p-6 hover:bg-gray-50"
      >
        <h2 className="text-lg font-semibold text-gray-800">
          Thông số kỹ thuật
        </h2>
        <ChevronDown
          className={`w-5 h-5 text-gray-600 transform transition-transform ${
            showSpecs ? "rotate-180" : ""
          }`}
        />
      </button>

      {showSpecs && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          transition={{ duration: 0.3 }}
          className="p-6 border-t"
        >
          {eq.attributes && eq.attributes.length > 0 ? (
            <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-4">
              {eq.attributes.map((attr, i) => (
                <div
                  key={i}
                  className="bg-gray-50 rounded-lg p-3 border hover:border-emerald-400/60 transition"
                >
                  <p className="text-xs text-gray-500">{attr.attribute}</p>
                  <p className="text-sm font-medium text-gray-800">
                    {attr.value || "—"}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm italic text-gray-500 text-center">
              (Chưa có thông số kỹ thuật nào)
            </p>
          )}
        </motion.div>
      )}
    </div>
  );
}

/* ===== Lịch sử bảo trì ===== */
function HistorySection({ historyOpen, setHistoryOpen, maintenanceHistory }) {
  return (
    <div className="bg-white border rounded-xl shadow-md overflow-hidden">
      <button
        onClick={() => setHistoryOpen((p) => !p)}
        className="w-full flex justify-between items-center p-6 hover:bg-gray-50"
      >
        <h2 className="text-lg font-semibold text-gray-800">
          Lịch sử bảo trì thiết bị
        </h2>
        <ChevronDown
          className={`w-5 h-5 text-gray-600 transform transition-transform ${
            historyOpen ? "rotate-180" : ""
          }`}
        />
      </button>

      {historyOpen && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          transition={{ duration: 0.3 }}
          className="p-6 border-t"
        >
          {maintenanceHistory.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm border">
                <thead className="bg-gray-100">
                  <tr>
                    <th className="p-2 border">Chi nhánh</th>
                    <th className="p-2 border">Bắt đầu</th>
                    <th className="p-2 border">Kết thúc</th>
                    <th className="p-2 border">Lý do</th>
                    <th className="p-2 border">Chi phí</th>
                  </tr>
                </thead>
                <tbody>
                  {maintenanceHistory.map((item, idx) => (
                    <tr key={idx} className="hover:bg-gray-50">
                      <td className="p-2 border text-center">
                        {item.branch_id || "—"}
                      </td>
                      <td className="p-2 border">
                        {item.start_date
                          ? new Date(item.start_date).toLocaleString("vi-VN")
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
                      <td className="p-2 border text-right">
                        {item.invoices?.[0]?.cost
                          ? `${item.invoices[0].cost.toLocaleString("vi-VN")} đ`
                          : "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-sm italic text-gray-500">
              (Chưa có lịch sử bảo trì)
            </p>
          )}
        </motion.div>
      )}
    </div>
  );
}

/* ===== Lịch sử điều chuyển ===== */
function TransferHistorySection({
  transferHistoryOpen,
  setTransferHistoryOpen,
  transferHistory,
}) {
  return (
    <div className="bg-white border rounded-xl shadow-md overflow-hidden">
      <button
        onClick={() => setTransferHistoryOpen((p) => !p)}
        className="w-full flex justify-between items-center p-6 hover:bg-gray-50"
      >
        <h2 className="text-lg font-semibold text-gray-800">
          Lịch sử điều chuyển thiết bị
        </h2>
        <ChevronDown
          className={`w-5 h-5 text-gray-600 transform transition-transform ${
            transferHistoryOpen ? "rotate-180" : ""
          }`}
        />
      </button>

      {transferHistoryOpen && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          transition={{ duration: 0.3 }}
          className="p-6 border-t"
        >
          {transferHistory.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm border">
                <thead className="bg-gray-100">
                  <tr>
                    <th className="p-2 border">Thời gian</th>
                    <th className="p-2 border">Từ chi nhánh</th>
                    <th className="p-2 border">Đến chi nhánh</th>
                    <th className="p-2 border">Người nhận</th>
                    <th className="p-2 border">Mô tả</th>
                  </tr>
                </thead>
                <tbody>
                  {transferHistory.map((item, idx) => (
                    <tr key={idx} className="hover:bg-gray-50">
                      <td className="p-2 border text-center">
                        {item.moved_at
                          ? new Date(item.moved_at).toLocaleString("vi-VN")
                          : "—"}
                      </td>
                      <td className="p-2 border text-center">
                        {item.from_branch_name || item.from_branch_id || "—"}
                      </td>
                      <td className="p-2 border text-center">
                        {item.to_branch_name || item.to_branch_id || "—"}
                      </td>
                      <td className="p-2 border text-center">
                        {item.receiver_name || "—"}
                      </td>
                      <td className="p-2 border">{item.description || "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-sm italic text-gray-500">
              (Chưa có lịch sử điều chuyển)
            </p>
          )}
        </motion.div>
      )}
    </div>
  );
}

/* ===== Dừng tạm thời ===== */
function PauseSection({
  data,
  branchId,
  isForeignBranch,
  isTemporarilyStopped,
  reason,
  setReason,
  handleCreateMaintenance,
  loading,
  successMsg,
  errorMsg,
}) {
  if (data.status?.toLowerCase() !== "active" || isForeignBranch) {
    return null;
  }

  return !isTemporarilyStopped ? (
    <div className="flex flex-col items-center gap-3 pt-4">
      <div className="w-full max-w-md flex flex-col gap-2">
        <input
          type="text"
          placeholder="Nhập lý do tạm dừng thiết bị..."
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          className="w-full px-4 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-amber-400 outline-none"
        />
        <Button
          onClick={handleCreateMaintenance}
          disabled={loading}
          className="bg-gradient-to-r from-amber-300 to-yellow-400 text-gray-800 font-semibold px-8 py-3 rounded-lg shadow-md hover:shadow-lg transition-all disabled:opacity-70 w-full"
        >
          ⚙️ Dừng tạm thời
        </Button>
      </div>

      {successMsg && (
        <div className="px-4 py-2 text-sm rounded bg-emerald-50 text-emerald-600 border shadow-sm">
          {successMsg}
        </div>
      )}
      {errorMsg && (
        <div className="px-4 py-2 text-sm rounded bg-red-50 text-red-600 border shadow-sm">
          {errorMsg}
        </div>
      )}
    </div>
  ) : (
    <div className="text-center pt-4">
      <div className="inline-block px-4 py-2 text-sm font-medium text-amber-600 bg-amber-50 border rounded-lg shadow-sm">
        ⚠️ Thiết bị hiện đang ở trạng thái <b>“Ngừng tạm thời”</b>.
      </div>
    </div>
  );
}
