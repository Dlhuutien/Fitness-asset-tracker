import { Button } from "@/components/ui/buttonn";
import { Building2 } from "lucide-react";

export default function VendorPricePanel({ equipment, prices = [], onPickVendor }) {
  if (!equipment)
    return (
      <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
        <p className="text-gray-500 text-sm italic">
          Chọn một dòng thiết bị ở bảng trên (cột <b>Check giá</b>) để xem giá nhập gần nhất theo nhà cung cấp.
        </p>
      </div>
    );

  return (
    <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow space-y-5">
      {/* Header */}
      <div className="flex items-center gap-4">
        <img
          src={equipment.image}
          alt={equipment.name}
          className="w-16 h-14 object-contain rounded border border-gray-300 dark:border-gray-700"
        />
        <div>
          <h3 className="font-semibold text-emerald-600 text-lg">
            💰 Giá nhập gần nhất
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            {equipment.name} <span className="text-gray-400">({equipment.id})</span>
          </p>
        </div>
      </div>

      {/* Vendor list */}
      {prices.length ? (
        <div className="grid md:grid-cols-3 gap-4">
          {prices.map((v) => (
            <div
              key={v.vendor_id}
              className="border border-gray-200 dark:border-gray-700 rounded-xl p-4 bg-gray-50 dark:bg-gray-700/40 hover:shadow-md hover:scale-[1.01] transition-all duration-200"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Building2 size={18} className="text-emerald-500" />
                  <div>
                    <p className="font-semibold text-gray-800 dark:text-gray-100">
                      {v.vendor_name}
                    </p>
                    <p className="text-xs text-gray-500">
                      {new Date(v.date).toLocaleDateString("vi-VN")}
                    </p>
                  </div>
                </div>
                <div className="text-emerald-600 font-bold text-lg">
                  {Number(v.price || 0).toLocaleString("vi-VN")} đ
                </div>
              </div>
              <Button
                onClick={() => onPickVendor(v)}
                className="mt-3 w-full bg-emerald-500 hover:bg-emerald-600 text-white text-sm"
              >
                Chọn nhà cung cấp này
              </Button>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-sm text-gray-500 italic">
          Không có dữ liệu giá nhập gần nhất cho thiết bị này.
        </p>
      )}
    </div>
  );
}
