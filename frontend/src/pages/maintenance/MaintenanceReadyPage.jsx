import { useState } from "react";
import { Button } from "@/components/ui/buttonn";
import Status from "@/components/common/Status";

const initialReadyEquipments = Array.from({ length: 22 }).map((_, idx) => ({
  id: idx + 100,
  name: `Thiết bị ready ${idx + 1}`,
  vendor: idx % 2 === 0 ? "Technogym" : "Matrix Fitness",
  importDate: `2023-0${(idx % 9) + 1}-10`,
  warrantyExpire: idx % 3 === 0 ? "2025-12-01" : "2023-11-15",
  // status = kết quả bảo trì
  status: idx % 2 === 0 ? "Bảo trì thành công" : "Bảo trì thất bại",
  // workStatus = trạng thái hiển thị trên bảng (ban đầu luôn Đang bảo trì)
  workStatus: "Đang bảo trì",
  image: "https://cdn-icons-png.flaticon.com/512/1041/1041883.png",
  maintenanceHistory: [
    {
      dateStart: "2025-09-01",
      dateEnd: "2025-09-02",
      technician: `Kỹ thuật viên ${String.fromCharCode(65 + (idx % 5))}`,
      cost: idx % 2 === 0 ? 0 : 1200000,
      result: idx % 2 === 0 ? "Bảo trì thành công" : "Bảo trì thất bại",
    },
  ],
}));

export default function MaintenanceReadyPage() {
  const [equipments, setEquipments] = useState(initialReadyEquipments);
  const [selected, setSelected] = useState(null);
  const [page, setPage] = useState(1);
  const pageSize = 5;

  const [banner, setBanner] = useState(null); // { text, tone: 'green' | 'red' }

  const totalPages = Math.ceil(equipments.length / pageSize) || 1;
  const pageData = equipments.slice((page - 1) * pageSize, page * pageSize);

  // finalize khi ấn duyệt
  const finalizeStatus = (finalWorkStatus) => {
    if (!selected) return;

    setEquipments((prev) =>
      prev.map((eq) =>
        eq.id === selected.id ? { ...eq, workStatus: finalWorkStatus } : eq
      )
    );
    setSelected((prev) =>
      prev ? { ...prev, workStatus: finalWorkStatus } : prev
    );

    if (finalWorkStatus === "Hoạt động") {
      setBanner({ text: "✅ Thiết bị đã hoạt động", tone: "green" });
    } else {
      setBanner({ text: "❌ Thiết bị đã ngưng hoạt động", tone: "red" });
    }

    setTimeout(() => {
      setEquipments((prev) => {
        const next = prev.filter((eq) => eq.id !== selected.id);
        const nextTotal = Math.ceil(next.length / pageSize) || 1;
        if (page > nextTotal) setPage(nextTotal);
        return next;
      });
      setSelected(null);
      setTimeout(() => setBanner(null), 1500);
    }, 1500);
  };

  return (
    <div className="p-6 space-y-6 transition-colors">
      {/* Bảng danh sách */}
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
                <th className="border p-2">Trạng thái</th>
                <th className="border p-2">Kết quả bảo trì</th>
              </tr>
            </thead>
            <tbody>
              {pageData.map((eq) => (
                <tr
                  key={eq.id}
                  className={`cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 transition ${
                    selected?.id === eq.id
                      ? "bg-blue-50 dark:bg-blue-900/30"
                      : ""
                  }`}
                  onClick={() => setSelected(eq)}
                >
                  <td className="border p-2">{eq.name}</td>
                  <td className="border p-2">{eq.vendor}</td>
                  <td className="border p-2">{eq.importDate}</td>
                  <td className="border p-2">
                    <Status status={eq.workStatus} />
                  </td>
                  <td className="border p-2">
                    <Status status={eq.status} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="flex justify-center mt-4 gap-2">
          <Button
            disabled={page === 1}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
          >
            ⬅
          </Button>
          <span className="px-3 py-1 text-sm text-gray-700 dark:text-gray-300">
            Trang {page}/{totalPages}
          </span>
          <Button
            disabled={page === totalPages}
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
          >
            ➡
          </Button>
        </div>
      </div>

      {/* Panel chi tiết */}
      {selected && (
        <div
          className={`grid grid-cols-2 gap-6 border-t-4 rounded-xl shadow bg-white dark:bg-[#1e1e1e] p-6 transition-colors
            ${
              selected.status === "Bảo trì thành công"
                ? "border-green-500"
                : "border-rose-500"
            }`}
        >
          {/* Chi tiết (trái) */}
          <div>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
              Chi tiết thiết bị
            </h2>
            <div className="flex gap-6">
              <img
                src={selected.image}
                alt={selected.name}
                className="w-40 h-32 object-contain border rounded-lg"
              />
              <div className="space-y-2 text-sm text-gray-700 dark:text-gray-300">
                <p>
                  <strong>Tên:</strong> {selected.name}
                </p>
                <p>
                  <strong>Nhà cung cấp:</strong> {selected.vendor}
                </p>
                <p>
                  <strong>Ngày nhập:</strong> {selected.importDate}
                </p>
                <p>
                  <strong>Bảo hành:</strong> {selected.warrantyExpire}
                </p>
                <p>
                  <strong>Trạng thái:</strong>{" "}
                  <Status status={selected.workStatus} />
                </p>
                <p>
                  <strong>Kết quả bảo trì:</strong>{" "}
                  <Status status={selected.status} />
                </p>
              </div>
            </div>
          </div>

          {/* Lịch sử (phải) */}
          <div>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
              Lịch sử bảo trì
            </h2>
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
                    <td className="border p-2">
                      <Status status={mh.result} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Nút duyệt */}
            {selected.status === "Bảo trì thành công" && (
              <Button
                onClick={() => finalizeStatus("Hoạt động")}
                className="bg-green-600 text-white w-full mt-4"
              >
                Hoạt động thiết bị
              </Button>
            )}
            {selected.status === "Bảo trì thất bại" && (
              <Button
                onClick={() => finalizeStatus("Ngưng hoạt động")}
                className="bg-rose-600 text-white w-full mt-4"
              >
                Ngưng hoạt động máy
              </Button>
            )}
          </div>
        </div>
      )}

      {/* Alert Notification */}
      {banner && (
        <div
          className={`fixed bottom-6 right-6 px-5 py-2 rounded-lg shadow-md border animate-fade-in-up text-sm font-semibold
      ${
        banner.tone === "green"
          ? "bg-emerald-100/90 border-emerald-300 text-emerald-700"
          : "bg-rose-100/90 border-rose-300 text-rose-700"
      }`}
        >
          {banner.text}
        </div>
      )}
    </div>
  );
}
