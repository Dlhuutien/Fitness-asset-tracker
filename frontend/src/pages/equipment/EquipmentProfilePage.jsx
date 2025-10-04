import { useEffect, useState } from "react";
import { useParams, useLocation, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft, CalendarDays, Factory, Package, Building2 } from "lucide-react";
import { Button } from "@/components/ui/buttonn";
import Status from "@/components/common/Status";

import EquipmentUnitService from "@/services/equipmentUnitService";

const STATUS_MAP = {
  active: "Hoạt động",
  inactive: "Ngưng hoạt động",
  "temporary urgent": "Ngừng khẩn cấp",
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

  useEffect(() => {
    if (!data) {
      EquipmentUnitService.getById(id)
        .then((res) => setData(res))
        .catch((err) => console.error("❌ Lỗi:", err))
        .finally(() => setLoading(false));
    }
  }, [id, data]);

  if (loading)
    return <div className="p-6 text-center text-gray-500 dark:text-gray-300 animate-pulse">Đang tải dữ liệu thiết bị...</div>;

  if (!data)
    return <div className="p-6 text-center text-red-500 font-semibold">Không tìm thấy thiết bị</div>;

  const eq = data.equipment || {};
  const translatedStatus = STATUS_MAP[data.status?.toLowerCase()] || "Không xác định";

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
      <div
        className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl shadow-md p-6 hover:shadow-lg transition-all duration-300"
      >
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
            <div className="flex flex-wrap items-center gap-3">
              <Status status={translatedStatus} />
              <span className="text-sm text-gray-500 dark:text-gray-400">
                Mã đơn vị:{" "}
                <span className="font-medium text-gray-900 dark:text-gray-100">{data.id}</span>
              </span>
              <span className="text-sm text-gray-500 dark:text-gray-400">
                Nhóm:{" "}
                <span className="font-medium text-gray-900 dark:text-gray-100">{eq.main_name || "—"}</span>
              </span>
            </div>

            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-3 pt-4 border-t border-gray-200 dark:border-gray-700">
              <InfoItem icon={<Package size={16} />} label="Loại" value={eq.type_name} />
              <InfoItem icon={<Factory size={16} />} label="Nhà cung cấp" value={eq.vendor_name} />
              <InfoItem icon={<Building2 size={16} />} label="Chi nhánh" value={data.branch_id} />
              <InfoItem
                icon={<CalendarDays size={16} />}
                label="Ngày tạo"
                value={new Date(data.created_at).toLocaleString("vi-VN")}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Thông số kỹ thuật */}
      <div
        className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl shadow-md p-6 hover:shadow-lg transition-all duration-300"
      >
        <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-100 mb-4">
          Thông số kỹ thuật
        </h2>
        {eq.specs && Object.keys(eq.specs).length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {Object.entries(eq.specs).map(([key, value], i) => (
              <div
                key={i}
                className="bg-gray-50 dark:bg-gray-800 rounded-lg p-3 border border-gray-200 dark:border-gray-700 hover:border-brand/60 transition"
              >
                <p className="text-xs text-gray-500 dark:text-gray-400">{key}</p>
                <p className="text-sm font-medium text-gray-800 dark:text-gray-100">{value}</p>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm italic text-gray-500 dark:text-gray-400 text-center">
            (Thông số kỹ thuật sẽ hiển thị ở đây sau)
          </p>
        )}
      </div>

      {/* Nút khẩn cấp */}
      <div className="flex justify-center pt-2">
        <Button className="bg-gradient-to-r from-orange-400 to-red-500 hover:from-orange-500 hover:to-red-600 text-white font-semibold px-8 py-3 rounded-lg shadow-lg transition-all">
          🚨 Dừng khẩn cấp
        </Button>
      </div>
    </motion.div>
  );
}

function InfoItem({ icon, label, value }) {
  return (
    <div className="flex items-center gap-2">
      <div className="text-brand">{icon}</div>
      <div>
        <p className="text-sm text-gray-500 dark:text-gray-400">{label}</p>
        <p className="text-base font-medium text-gray-800 dark:text-gray-100">{value || "—"}</p>
      </div>
    </div>
  );
}
