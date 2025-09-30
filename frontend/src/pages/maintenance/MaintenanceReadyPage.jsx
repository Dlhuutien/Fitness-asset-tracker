import { useState } from "react";
import { Button } from "@/components/ui/buttonn";

const initialReadyEquipments = Array.from({ length: 22 }).map((_, idx) => ({
  id: idx + 100,
  name: `Thiết bị ready ${idx + 1}`,
  vendor: idx % 2 === 0 ? "Technogym" : "Matrix Fitness",
  importDate: `2023-0${(idx % 9) + 1}-10`,
  warrantyExpire: idx % 3 === 0 ? "2025-12-01" : "2023-11-15",
  status: idx % 2 === 0 ? "Sửa thành công" : "Sửa thất bại",
  maintenanceHistory: [
    {
      dateStart: "2025-09-01",
      dateEnd: "2025-09-02",
      technician: `Kỹ thuật viên ${String.fromCharCode(65 + (idx % 5))}`,
      cost: idx % 2 === 0 ? 0 : 1200000,
      result: idx % 2 === 0 ? "Sửa thành công" : "Sửa thất bại",
    },
  ],
}));

export default function MaintenanceReadyPage() {
  const [selected, setSelected] = useState(null);
  const [equipments, setEquipments] = useState(initialReadyEquipments);

  const [page, setPage] = useState(1);
  const pageSize = 5;
  const totalPages = Math.ceil(equipments.length / pageSize);
  const pageData = equipments.slice((page - 1) * pageSize, page * pageSize);

  const finalizeStatus = (status) => {
    setEquipments((prev) =>
      prev.map((eq) => (eq.id === selected.id ? { ...eq, status } : eq))
    );
    setSelected({ ...selected, status });
  };

  const renderStatus = (status) => {
    const styles = {
      "Ngừng khẩn cấp":
        "bg-red-100 text-red-600 dark:bg-red-800 dark:text-red-200",
      "Sửa thành công":
        "bg-green-100 text-green-600 dark:bg-green-800 dark:text-green-200",
      "Sửa thất bại":
        "bg-orange-100 text-orange-600 dark:bg-orange-800 dark:text-orange-200",
      "Hoạt động":
        "bg-blue-100 text-blue-600 dark:bg-blue-800 dark:text-blue-200",
      "Ngưng sử dụng":
        "bg-gray-200 text-gray-600 dark:bg-gray-700 dark:text-gray-300",
    };
    return (
      <span
        className={`px-2 py-1 rounded text-xs font-semibold ${styles[status]}`}
      >
        {status}
      </span>
    );
  };

  return (
    <div className="p-6 space-y-6 transition-colors">
      <div className="bg-white dark:bg-[#1e1e1e] shadow rounded-xl p-4 transition-colors">
        <h2 className="text-lg font-semibold mb-3 text-gray-900 dark:text-gray-100">
          Thiết bị chờ phê duyệt
        </h2>
        <div className="overflow-x-auto">
          <table className="w-full border text-sm rounded overflow-hidden dark:border-gray-700">
            <thead className="bg-gray-100 dark:bg-gray-800 dark:text-gray-200">
              <tr>
                <th className="border p-2">Tên</th>
                <th className="border p-2">Nhà cung cấp</th>
                <th className="border p-2">Ngày nhập</th>
                <th className="border p-2">Kết quả bảo trì</th>
              </tr>
            </thead>
            <tbody>
              {pageData.map((eq) => (
                <tr
                  key={eq.id}
                  className={`cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 transition ${
                    selected?.id === eq.id ? "bg-blue-50 dark:bg-blue-900/30" : ""
                  }`}
                  onClick={() => setSelected(eq)}
                >
                  <td className="border p-2">{eq.name}</td>
                  <td className="border p-2">{eq.vendor}</td>
                  <td className="border p-2">{eq.importDate}</td>
                  <td className="border p-2">{renderStatus(eq.status)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="flex justify-center mt-4 gap-2">
          <Button disabled={page === 1} onClick={() => setPage(page - 1)}>
            ⬅
          </Button>
          <span className="px-3 py-1 text-sm text-gray-700 dark:text-gray-300">
            Trang {page}/{totalPages}
          </span>
          <Button
            disabled={page === totalPages}
            onClick={() => setPage(page + 1)}
          >
            ➡
          </Button>
        </div>
      </div>

      {selected && (
        <div className="bg-white dark:bg-[#1e1e1e] shadow rounded-xl p-6 space-y-4 border-t-4 border-green-400 dark:border-green-600 transition-colors">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
            Chi tiết bảo trì
          </h2>
          <div className="grid grid-cols-2 gap-x-12 gap-y-2 text-sm text-gray-700 dark:text-gray-300">
            <p><strong>Tên:</strong> {selected.name}</p>
            <p><strong>Nhà cung cấp:</strong> {selected.vendor}</p>
            <p><strong>Ngày nhập:</strong> {selected.importDate}</p>
            <p><strong>Bảo hành:</strong> {selected.warrantyExpire}</p>
            <p><strong>Trạng thái hiện tại:</strong> {renderStatus(selected.status)}</p>
          </div>

          <h3 className="text-md font-semibold mt-4 text-gray-900 dark:text-gray-100">
            Lịch sử bảo trì
          </h3>
          <table className="w-full border text-sm dark:border-gray-700">
            <thead className="bg-gray-100 dark:bg-gray-800 dark:text-gray-200">
              <tr>
                <th className="border p-2">Bắt đầu</th>
                <th className="border p-2">Kết thúc</th>
                <th className="border p-2">Kỹ thuật viên</th>
                <th className="border p-2">Chi phí</th>
                <th className="border p-2">Kết quả</th>
              </tr>
            </thead>
            <tbody>
              {selected.maintenanceHistory?.map((mh, idx) => (
                <tr key={idx}>
                  <td className="border p-2">{mh.dateStart}</td>
                  <td className="border p-2">{mh.dateEnd}</td>
                  <td className="border p-2">{mh.technician}</td>
                  <td className="border p-2">{mh.cost.toLocaleString()}đ</td>
                  <td className="border p-2">{renderStatus(mh.result)}</td>
                </tr>
              ))}
            </tbody>
          </table>

          {selected.status === "Sửa thành công" && (
            <Button
              onClick={() => finalizeStatus("Hoạt động")}
              className="bg-green-500 text-white mt-4"
            >
              Đưa vào hoạt động
            </Button>
          )}
          {selected.status === "Sửa thất bại" && (
            <Button
              onClick={() => finalizeStatus("Ngưng sử dụng")}
              className="bg-red-500 text-white mt-4"
            >
              Ngưng hoạt động máy
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
