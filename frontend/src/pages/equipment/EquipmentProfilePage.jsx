import { useEffect, useState } from "react";
import { useParams, useLocation, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  CalendarDays,
  Factory,
  Package,
  Building2,
} from "lucide-react";
import { Button } from "@/components/ui/buttonn";
import Status from "@/components/common/Status";
import { toast } from "sonner";
import MaintainService from "@/services/MaintainService";

import EquipmentUnitService from "@/services/equipmentUnitService";

const STATUS_MAP = {
  active: "Hoạt động",
  inactive: "Ngưng hoạt động",
  "temporary urgent": "Ngừng tạm thời",
  "in progress": "Đang bảo trì",
  ready: "Bảo trì thành công",
  failed: "Bảo trì thất bại",
  moving: "Đang di chuyển",
  "in stock": "Trong kho",
  deleted: "Đã xóa",
};

export default function EquipmentProfilePage() {
  const { id } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const [data, setData] = useState(location.state || null);
  const [loading, setLoading] = useState(!location.state);
  const [successMsg, setSuccessMsg] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [reason, setReason] = useState("");
  const isTemporarilyStopped =
    data?.status?.toLowerCase() === "temporary urgent";
  const [historyOpen, setHistoryOpen] = useState(false);
  const [maintenanceHistory, setMaintenanceHistory] = useState([]);

  useEffect(() => {
    if (!data) {
      EquipmentUnitService.getById(id)
        .then((res) => setData(res))
        .catch((err) => console.error("❌ Lỗi:", err))
        .finally(() => setLoading(false));
    }
  }, [id, data]);

  // 🧾 Load lịch sử bảo trì của thiết bị
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

  const eq = data.equipment || {};
  const translatedStatus =
    STATUS_MAP[data.status?.toLowerCase()] || "Không xác định";

  // 🧩 Gửi yêu cầu bảo trì “Dừng tạm thời”
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

      setSuccessMsg("✅ Đã gửi yêu cầu bảo trì!");
      setReason("");
      toast.success("✅ Đã gửi yêu cầu bảo trì!");
    } catch (err) {
      console.error("❌ Lỗi khi tạo maintenance:", err);
      setErrorMsg("❌ Không thể tạo yêu cầu bảo trì!");
      toast.error("❌ Không thể tạo yêu cầu bảo trì!");
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div
      className="p-6 space-y-6 font-jakarta transition-colors duration-300"
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
    >
      {/* Nút quay lại */}
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
          {/* Ảnh */}
          <img
            src={eq.image || "/placeholder.jpg"}
            alt={eq.name}
            className="w-64 h-48 object-contain rounded-lg bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700"
          />

          {/* Thông tin */}
          <div className="flex-1 space-y-3">
            <h1 className="text-2xl font-semibold text-gray-900 dark:text-gray-100">
              {eq.name || "Thiết bị không xác định"}
            </h1>

            {/* Nhóm trạng thái */}
            <div className="flex flex-wrap items-center gap-3">
              <Status status={translatedStatus} />
              <span className="text-sm text-gray-500 dark:text-gray-400">
                Mã đơn vị:{" "}
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

            {/* Thông tin chi tiết */}
            <div className="grid sm:grid-cols-2 gap-x-8 gap-y-4 pt-4 border-t border-gray-200 dark:border-gray-700">
              <InfoItem
                icon={<Package size={16} />}
                label="Loại thiết bị"
                value={eq.type_name}
              />
              <InfoItem
                icon={<Package size={16} />}
                label="Mã thiết bị gốc"
                value={eq.id}
              />
              <InfoItem
                icon={<Factory size={16} />}
                label="Nhà cung cấp"
                value={eq.vendor_name}
              />
              <InfoItem
                icon={<Building2 size={16} />}
                label="Chi nhánh"
                value={data.branch_id}
              />
              <InfoItem
                icon={<CalendarDays size={16} />}
                label="Ngày tạo"
                value={new Date(data.created_at).toLocaleString("vi-VN")}
              />
              <InfoItem
                icon={<CalendarDays size={16} />}
                label="Cập nhật gần nhất"
                value={new Date(data.updated_at).toLocaleString("vi-VN")}
              />
              <InfoItem
                icon={<CalendarDays size={16} />}
                label="Bắt đầu bảo hành"
                value={new Date(data.warranty_start_date).toLocaleDateString(
                  "vi-VN"
                )}
              />
              <InfoItem
                icon={<CalendarDays size={16} />}
                label="Kết thúc bảo hành"
                value={
                  data.warranty_end_date
                    ? new Date(data.warranty_end_date).toLocaleDateString(
                        "vi-VN"
                      )
                    : "—"
                }
              />
              <InfoItem
                icon={<Package size={16} />}
                label="Thời hạn bảo hành"
                value={
                  eq.warranty_duration ? `${eq.warranty_duration} năm` : "—"
                }
              />
              <InfoItem
                icon={<Package size={16} />}
                label="Mô tả thiết bị"
                value={eq.description || data.description || "—"}
              />
              <InfoItem
                icon={<Package size={16} />}
                label="Giá nhập thiết bị"
                value={
                  data.cost
                    ? data.cost.toLocaleString("vi-VN", {
                        style: "currency",
                        currency: "VND",
                      })
                    : "—"
                }
              />
            </div>
          </div>
        </div>
      </div>

      {/* Thông số kỹ thuật */}
      <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl shadow-md p-6 hover:shadow-lg transition-all duration-300">
        <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-100 mb-4">
          Thông số kỹ thuật
        </h2>

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
      </div>

      {/* Lịch sử bảo trì thiết bị */}
      <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl shadow-md overflow-hidden">
        {/* Header */}
        <button
          onClick={() => setHistoryOpen((p) => !p)}
          className="w-full flex justify-between items-center p-6 hover:bg-gray-50 dark:hover:bg-gray-800 transition-all"
        >
          <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-100">
            Lịch sử bảo trì thiết bị
          </h2>
          <span
            className={`transform transition-transform ${
              historyOpen ? "rotate-180" : ""
            }`}
          >
            ▼
          </span>
        </button>

        {/* Nội dung */}
        {historyOpen && (
          <div className="p-6 border-t border-gray-200 dark:border-gray-700">
            {maintenanceHistory.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="min-w-full text-sm border dark:border-gray-700">
                  <thead className="bg-gray-100 dark:bg-gray-800 dark:text-gray-200">
                    <tr>
                      <th className="p-2 border">Bắt đầu</th>
                      <th className="p-2 border">Kết thúc</th>
                      <th className="p-2 border">Lý do</th>
                      <th className="p-2 border">Chi phí</th>
                      <th className="p-2 border">Kết quả</th>
                    </tr>
                  </thead>
                  <tbody>
                    {maintenanceHistory.map((item, idx) => (
                      <tr
                        key={idx}
                        className="hover:bg-gray-50 dark:hover:bg-gray-800"
                      >
                        <td className="p-2 border">
                          {item.start_date
                            ? new Date(item.start_date).toLocaleDateString(
                                "vi-VN"
                              )
                            : "—"}
                        </td>
                        <td className="p-2 border">
                          {item.end_date
                            ? new Date(item.end_date).toLocaleDateString(
                                "vi-VN"
                              )
                            : "—"}
                        </td>
                        <td className="p-2 border">
                          {item.maintenance_reason || "—"}
                        </td>
                        <td className="p-2 border">
                          {item.invoices && item.invoices.length > 0
                            ? `${item.invoices[0].cost.toLocaleString(
                                "vi-VN"
                              )} đ`
                            : "0 đ"}
                        </td>
                        <td className="p-2 border text-center">
                          <Status status={item.status || "—"} />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="text-sm text-gray-500 dark:text-gray-400 italic">
                (Chưa có lịch sử bảo trì nào cho thiết bị này)
              </p>
            )}
          </div>
        )}
      </div>

      {/* Nút bảo trì tạm thời */}
      {!isTemporarilyStopped ? (
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

          {/* Thông báo dưới nút */}
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
      )}
    </motion.div>
  );
}

function InfoItem({ icon, label, value }) {
  return (
    <div className="flex items-center gap-2">
      <div className="text-brand">{icon}</div>
      <div>
        <p className="text-sm text-gray-500 dark:text-gray-400">{label}</p>
        <p className="text-base font-medium text-gray-800 dark:text-gray-100">
          {value || "—"}
        </p>
      </div>
    </div>
  );
}
