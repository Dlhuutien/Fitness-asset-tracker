import { useState } from "react";
import { Button } from "@/components/ui/buttonn";
import { Input } from "@/components/ui/input";

const initialEquipments = Array.from({ length: 25 }).map((_, idx) => ({
  id: idx + 1,
  name: `Thiết bị số ${idx + 1}`,
  vendor: idx % 2 === 0 ? "Technogym" : "Matrix Fitness",
  importDate: `2023-0${(idx % 9) + 1}-15`,
  warrantyExpire: idx % 2 === 0 ? "2025-12-01" : "2023-10-01",
  size: "2000 x 850 x 1450 mm",
  weight: `${150 + idx * 5} kg`,
  screen: idx % 2 === 0 ? "LCD 15 inch" : "Không",
  color: idx % 3 === 0 ? "Black" : "Silver",
  status: "Ngừng khẩn cấp",
  image: "https://cdn-icons-png.flaticon.com/512/1041/1041883.png",
  maintenanceHistory: [],
}));

export default function MaintenanceUrgentPage() {
  const [equipments, setEquipments] = useState(initialEquipments);
  const [selected, setSelected] = useState(null);
  const [step, setStep] = useState(0);
  const [cost, setCost] = useState("");
  const [technician] = useState("Kỹ thuật viên Nguyễn Văn A");

  const [page, setPage] = useState(1);
  const pageSize = 5;
  const totalPages = Math.ceil(equipments.length / pageSize);
  const pageData = equipments.slice((page - 1) * pageSize, page * pageSize);

  const checkWarranty = (equipment) => {
    const today = new Date();
    return new Date(equipment.warrantyExpire) > today;
  };

  const handleStart = () => {
    if (!selected) return;
    setStep(2);
    setCost(checkWarranty(selected) ? "0" : "");
  };

  const finishMaintenance = (result) => {
    const updatedEq = {
      ...selected,
      status: result,
      maintenanceHistory: [
        ...selected.maintenanceHistory,
        {
          dateStart: new Date().toISOString().slice(0, 10),
          dateEnd: new Date().toISOString().slice(0, 10),
          technician,
          cost: parseInt(cost || "0"),
          result,
        },
      ],
    };
    setEquipments((prev) => prev.filter((eq) => eq.id !== selected.id));
    console.log("Đẩy sang ReadyPage:", updatedEq);
    setSelected(null);
    setStep(0);
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
          Thiết bị ngừng khẩn cấp
        </h2>
        <div className="overflow-x-auto">
          <table className="w-full border text-sm rounded overflow-hidden dark:border-gray-700">
            <thead className="bg-gray-100 dark:bg-gray-800 dark:text-gray-200">
              <tr>
                <th className="border p-2">Tên</th>
                <th className="border p-2">Nhà cung cấp</th>
                <th className="border p-2">Ngày nhập</th>
                <th className="border p-2">Hạn bảo hành</th>
                <th className="border p-2">Trạng thái</th>
              </tr>
            </thead>
            <tbody>
              {pageData.map((eq) => (
                <tr
                  key={eq.id}
                  className={`cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 transition ${
                    selected?.id === eq.id ? "bg-blue-50 dark:bg-blue-900/30" : ""
                  }`}
                  onClick={() => {
                    setSelected(eq);
                    setStep(1);
                  }}
                >
                  <td className="border p-2">{eq.name}</td>
                  <td className="border p-2">{eq.vendor}</td>
                  <td className="border p-2">{eq.importDate}</td>
                  <td className="border p-2">
                    {eq.warrantyExpire}
                    {checkWarranty(eq) ? (
                      <span className="ml-2 px-2 py-0.5 bg-green-100 text-green-600 dark:bg-green-800 dark:text-green-200 rounded text-xs">
                        Còn hạn
                      </span>
                    ) : (
                      <span className="ml-2 px-2 py-0.5 bg-red-100 text-red-600 dark:bg-red-800 dark:text-red-200 rounded text-xs">
                        Hết hạn
                      </span>
                    )}
                  </td>
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

      {/* Chi tiết */}
      {selected && (
        <div className="bg-white dark:bg-[#1e1e1e] shadow rounded-xl p-6 space-y-4">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
            Chi tiết thiết bị
          </h2>
          <div className="flex gap-6">
            <img
              src={selected.image}
              alt={selected.name}
              className="w-40 h-32 object-contain border rounded-lg"
            />
            <div className="grid grid-cols-2 gap-x-12 gap-y-2 text-sm">
              <p><strong>Tên:</strong> {selected.name}</p>
              <p><strong>Nhà cung cấp:</strong> {selected.vendor}</p>
              <p><strong>Kích thước:</strong> {selected.size}</p>
              <p><strong>Ngày nhập:</strong> {selected.importDate}</p>
              <p><strong>Trọng lượng:</strong> {selected.weight}</p>
              <p><strong>Bảo hành:</strong> {selected.warrantyExpire}</p>
              <p><strong>Màn hình:</strong> {selected.screen}</p>
              <p><strong>Màu:</strong> {selected.color}</p>
              <p><strong>Trạng thái:</strong> {renderStatus(selected.status)}</p>
            </div>
          </div>

          {step === 1 && (
            <Button onClick={handleStart} className="bg-blue-500 text-white">
              Bắt đầu bảo trì
            </Button>
          )}

          {step === 2 && (
            <div className="space-y-3">
              {checkWarranty(selected) ? (
                <p className="text-green-600 font-semibold">
                  Còn bảo hành — Chi phí: 0đ
                </p>
              ) : (
                <div>
                  <p className="text-red-600 font-semibold mb-2">
                    Hết hạn bảo hành — nhập chi phí
                  </p>
                  <Input
                    type="number"
                    value={cost}
                    onChange={(e) => setCost(e.target.value)}
                    placeholder="Chi phí"
                  />
                </div>
              )}
              <div className="flex gap-4">
                <Button
                  onClick={() => finishMaintenance("Sửa thành công")}
                  className="bg-green-500 text-white"
                >
                  Sửa thành công
                </Button>
                <Button
                  onClick={() => finishMaintenance("Sửa thất bại")}
                  className="bg-red-500 text-white"
                >
                  Sửa thất bại
                </Button>
              </div>
            </div>
          )}

          {step === 3 && (
            <p className="text-blue-600">
              Thiết bị đã chuyển sang danh sách chờ duyệt
            </p>
          )}
        </div>
      )}
    </div>
  );
}
