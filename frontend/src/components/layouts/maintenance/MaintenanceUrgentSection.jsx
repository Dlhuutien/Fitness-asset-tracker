import { useState } from "react";
import { Button } from "@/components/ui/buttonn";
import { Input } from "@/components/ui/input";
import Status from "@/components/common/Status"; // ✅ status chung

const initialEquipments = Array.from({ length: 10 }).map((_, idx) => ({
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
  maintenanceReason: "Lỗi cảm biến tốc độ",
  maintenanceHistory: [],
}));

export default function MaintenanceUrgentSection() {
  const [equipments, setEquipments] = useState(initialEquipments);
  const [selected, setSelected] = useState(null);
  const [maintenanceSteps, setMaintenanceSteps] = useState({}); // id → step
  const [cost, setCost] = useState("");
  const [note, setNote] = useState("");
  const [technician] = useState("Kỹ thuật viên Nguyễn Văn A");
  const [message, setMessage] = useState("");

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

    // update trạng thái "Đang bảo trì"
    setEquipments((prev) =>
      prev.map((eq) =>
        eq.id === selected.id ? { ...eq, status: "Đang bảo trì" } : eq
      )
    );
    setSelected({ ...selected, status: "Đang bảo trì" });

    // lưu step của thiết bị
    setMaintenanceSteps((prev) => ({ ...prev, [selected.id]: 2 }));
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
          note,
          result,
        },
      ],
    };

    // show message
    setMessage("✅ Thiết bị đã được chuyển sang Chờ phê duyệt!");

    setTimeout(() => {
      setEquipments((prev) => prev.filter((eq) => eq.id !== selected.id));
      setSelected(null);
      setMessage("");
      setMaintenanceSteps((prev) => {
        const clone = { ...prev };
        delete clone[selected.id];
        return clone;
      });
    }, 1500);

    console.log("Đã chuyển sang chờ phê duyệt:", updatedEq);
  };

  return (
    <div className="p-6 space-y-6">
      {/* Danh sách thiết bị */}
      <div className="bg-white dark:bg-[#1e1e1e] shadow rounded-lg p-4">
        <h2 className="text-lg font-semibold mb-3">Thiết bị ngừng khẩn cấp</h2>
        <div className="overflow-x-auto">
          <table className="w-full border text-sm">
            <thead className="bg-gray-100 dark:bg-gray-800">
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
                  className={`cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 ${
                    selected?.id === eq.id ? "bg-blue-50 dark:bg-blue-900/30" : ""
                  }`}
                  onClick={() => setSelected(eq)}
                >
                  <td className="border p-2">{eq.name}</td>
                  <td className="border p-2">{eq.vendor}</td>
                  <td className="border p-2">{eq.importDate}</td>
                  <td className="border p-2">
                    {eq.warrantyExpire}
                    {checkWarranty(eq) ? (
                      <span className="ml-2 px-2 py-0.5 rounded bg-green-100 text-green-700 text-xs">
                        Còn hạn
                      </span>
                    ) : (
                      <span className="ml-2 px-2 py-0.5 rounded bg-red-100 text-red-700 text-xs">
                        Hết hạn
                      </span>
                    )}
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
          <Button disabled={page === 1} onClick={() => setPage(page - 1)}>
            ⬅
          </Button>
          <span>
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

      {/* Panel chi tiết */}
      {selected && (
        <div className="grid grid-cols-3 gap-6">
          {/* Chi tiết thiết bị */}
          <div className="col-span-2 bg-white dark:bg-[#1e1e1e] shadow rounded-lg p-6 space-y-4">
            <h2 className="text-lg font-semibold">Chi tiết thiết bị</h2>
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
                <p>
                  <strong>Bảo hành:</strong> {selected.warrantyExpire}{" "}
                  {checkWarranty(selected) ? (
                    <span className="ml-2 px-2 py-0.5 rounded bg-green-100 text-green-700 text-xs">
                      Còn hạn
                    </span>
                  ) : (
                    <span className="ml-2 px-2 py-0.5 rounded bg-red-100 text-red-700 text-xs">
                      Hết hạn
                    </span>
                  )}
                </p>
                <p><strong>Màn hình:</strong> {selected.screen}</p>
                <p><strong>Màu:</strong> {selected.color}</p>
                <p>
                  <strong>Trạng thái:</strong> <Status status={selected.status} />
                </p>
              </div>
            </div>
          </div>

          {/* Phiếu bảo trì */}
          <div className="col-span-1 bg-white dark:bg-[#1e1e1e] shadow rounded-lg p-6 space-y-4">
            <h2 className="text-lg font-semibold">Phiếu bảo trì</h2>
            <p><strong>Người yêu cầu:</strong> Trần Văn B (ID: REQ123)</p>
            <p><strong>Lý do bảo trì:</strong> {selected.maintenanceReason}</p>

            {/* Step = 1 → hiển thị nút bắt đầu */}
            {(!maintenanceSteps[selected.id] ||
              maintenanceSteps[selected.id] === 1) && (
              <Button
                onClick={handleStart}
                className="bg-blue-500 text-white w-full"
              >
                Bắt đầu bảo trì
              </Button>
            )}

            {/* Step = 2 → hiển thị chi phí, ghi chú, thành công/thất bại */}
            {maintenanceSteps[selected.id] === 2 && (
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

                <div>
                  <label className="block text-sm mb-1">Ghi chú:</label>
                  <Input
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    placeholder="Nhập ghi chú bảo trì"
                  />
                </div>

                <div className="flex gap-4">
                  <Button
                    onClick={() => finishMaintenance("Bảo trì thành công")}
                    className="bg-green-500 text-white flex-1"
                  >
                    Bảo trì thành công
                  </Button>
                  <Button
                    onClick={() => finishMaintenance("Bảo trì thất bại")}
                    className="bg-red-500 text-white flex-1"
                  >
                    Bảo trì thất bại
                  </Button>
                </div>
              </div>
            )}

            {message && (
              <p className="text-emerald-600 font-semibold mt-2">{message}</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
