import { useEffect, useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/buttonn";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import Status from "@/components/common/Status";
import { Grid, Loader2 } from "lucide-react";
import EquipmentUnitService from "@/services/equipmentUnitService";
import MaintainService from "@/services/MaintainService";
import { toast } from "sonner";

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
};

const ITEMS_PER_PAGE = 8;

export default function MaintenanceUrgentSection() {
  const [equipments, setEquipments] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [selected, setSelected] = useState(null);
  const [maintenanceSteps, setMaintenanceSteps] = useState({});
  const [cost, setCost] = useState("");
  const [note, setNote] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [loadingStart, setLoadingStart] = useState(false);
  const [loadingComplete, setLoadingComplete] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  // Bộ lọc + tìm kiếm + phân trang
  const [search, setSearch] = useState("");
  const [activeGroup, setActiveGroup] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);

  // 🧭 Load dữ liệu
  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        const data = await EquipmentUnitService.getByStatusGroup([
          "Temporary Urgent",
          "In Progress",
        ]);
        setEquipments(data);
        setFiltered(data);
      } catch (err) {
        console.error("❌ Lỗi load thiết bị:", err);
        toast.error("Không thể tải danh sách thiết bị ngừng khẩn cấp");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  // ====== Xử lý tìm kiếm + lọc ======
  useEffect(() => {
    const q = search.trim().toLowerCase();

    const f = equipments.filter((u) => {
      const matchSearch =
        !q ||
        u.equipment?.name?.toLowerCase().includes(q) ||
        u.equipment?.vendor_name?.toLowerCase().includes(q) ||
        u.equipment?.type_name?.toLowerCase().includes(q);

      if (activeGroup === "all") return matchSearch;
      return u.equipment?.main_name === activeGroup && matchSearch;
    });

    setFiltered(f);
    setCurrentPage(1);
  }, [search, activeGroup, equipments]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / ITEMS_PER_PAGE));
  const currentData = filtered.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  const checkWarranty = (equipment) => {
    const today = new Date();
    return new Date(equipment.warranty_end_date) > today;
  };

  // 🟦 Bắt đầu bảo trì
  const handleStart = async () => {
    if (!selected) return;
    try {
      setLoadingStart(true);
      const m = await MaintainService.getByUnit(selected.id);
      if (!m) {
        toast.error("Không tìm thấy yêu cầu bảo trì đang hoạt động!");
        return;
      }
      await MaintainService.progress(m.id);
      toast.success("🔧 Đã bắt đầu bảo trì");
      setSuccessMsg("Thiết bị đã chuyển sang trạng thái 'Đang bảo trì'");
      setErrorMsg("");

      setEquipments((prev) =>
        prev.map((eq) =>
          eq.id === selected.id ? { ...eq, status: "In Progress" } : eq
        )
      );
      setSelected({ ...selected, status: "In Progress" });
      setMaintenanceSteps((prev) => ({ ...prev, [selected.id]: 2 }));
      setCost(checkWarranty(selected) ? "0" : "");
    } catch (err) {
      toast.error("Không thể bắt đầu bảo trì");
      setErrorMsg("Không thể bắt đầu bảo trì, vui lòng thử lại.");
    } finally {
      setLoadingStart(false);
    }
  };

  // 🟩 Hoàn tất bảo trì
  const finishMaintenance = async (result) => {
    if (!selected) return;
    try {
      setLoadingComplete(true);
      const m = await MaintainService.getByUnit(selected.id);
      if (!m) {
        toast.error("Không tìm thấy maintenance để hoàn tất!");
        return;
      }

      const payload = {
        status: result === "Bảo trì thành công" ? "Ready" : "Failed",
        cost: parseInt(cost || "0"),
        maintenance_detail: note,
      };

      await MaintainService.complete(m.id, payload);
      toast.success("✅ Đã gửi kết quả bảo trì");
      setSuccessMsg("Thiết bị đã được chuyển sang 'Chờ phê duyệt'");
      setErrorMsg("");

      setTimeout(() => {
        setEquipments((prev) => prev.filter((eq) => eq.id !== selected.id));
        setSelected(null);
        setMessage("");
      }, 1500);
    } catch (err) {
      toast.error("Không thể hoàn tất bảo trì");
      setErrorMsg("Không thể hoàn tất bảo trì, vui lòng thử lại.");
      setSuccessMsg("");
    } finally {
      setLoadingComplete(false);
    }
  };

  if (loading)
    return (
      <div className="p-6 text-gray-500 dark:text-gray-300 animate-pulse">
        Đang tải danh sách thiết bị...
      </div>
    );

  return (
    <div className="grid grid-cols-12 gap-4">
      {/* Sidebar bộ lọc */}
      <div className="col-span-3 space-y-4">
        <h2 className="text-xl font-bold text-emerald-600 dark:text-emerald-400">
          Bộ lọc thiết bị
        </h2>

        {/* Ô tìm kiếm */}
        <div className="p-3 bg-white dark:bg-gray-800 rounded-lg shadow space-y-2">
          <h3 className="font-semibold text-sm dark:text-gray-200">Tìm kiếm</h3>
          <Input
            placeholder="Tìm tên, loại, nhà cung cấp..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="dark:bg-gray-700 dark:text-gray-100"
          />
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setSearch("")}
              className="dark:border-gray-600 dark:text-gray-200"
            >
              Reset
            </Button>
            <Button
              size="sm"
              className="bg-emerald-500 text-white hover:bg-emerald-600"
            >
              Tìm
            </Button>
          </div>
        </div>

        {/* Nhóm thiết bị */}
        <div className="p-3 bg-white dark:bg-gray-800 rounded-lg shadow">
          <h3 className="font-semibold text-sm mb-2 dark:text-gray-200">
            Hiển thị theo nhóm
          </h3>
          <div className="flex flex-col gap-2 max-h-[340px] overflow-y-auto">
            {[
              { id: "all", name: "Tất cả" },
              ...Array.from(
                new Set(equipments.map((e) => e.equipment?.main_name))
              ).map((n) => ({ id: n, name: n })),
            ].map((g, idx) => (
              <button
                key={idx}
                onClick={() => setActiveGroup(g.id)}
                className={`flex items-center gap-3 px-2 py-2 rounded-md border text-sm transition ${
                  activeGroup === g.id
                    ? "bg-emerald-100 border-emerald-500 text-emerald-700 dark:bg-emerald-900 dark:text-emerald-200"
                    : "bg-white border-gray-200 hover:bg-gray-50 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-200"
                }`}
              >
                <Grid size={16} />
                <span className="flex-1 truncate">{g.name}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="col-span-9 space-y-3">
        {/* Bảng danh sách */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
          <div className="overflow-x-auto">
            <Table className="min-w-[1000px] border border-gray-200 dark:border-gray-600">
              <TableHeader>
                <TableRow className="bg-gray-100 dark:bg-gray-700 text-sm font-semibold">
                  <TableHead>#</TableHead>
                  <TableHead>Mã Unit</TableHead>
                  <TableHead>Hình ảnh</TableHead>
                  <TableHead>Tên thiết bị</TableHead>
                  <TableHead>Nhóm</TableHead>
                  <TableHead>Loại</TableHead>
                  <TableHead className="text-center">Trạng thái</TableHead>
                  <TableHead>Nhà cung cấp</TableHead>
                  <TableHead>Chi nhánh</TableHead>
                </TableRow>
              </TableHeader>

              <TableBody>
                {currentData.map((row, idx) => {
                  const normalized = row.status?.trim().toLowerCase();
                  const translated = STATUS_MAP[normalized] || row.status;
                  return (
                    <TableRow
                      key={row.id}
                      className={`cursor-pointer transition ${
                        selected?.id === row.id
                          ? "bg-blue-50 dark:bg-blue-900/30"
                          : "hover:bg-gray-50 dark:hover:bg-gray-700"
                      }`}
                      onClick={() => {
                        setSelected(row);
                        setSuccessMsg("");
                        setErrorMsg("");
                      }}
                    >
                      <TableCell className="text-center">
                        {(currentPage - 1) * ITEMS_PER_PAGE + idx + 1}
                      </TableCell>
                      <TableCell>{row.id}</TableCell>
                      <TableCell>
                        <img
                          src={row.equipment?.image}
                          alt={row.equipment?.name}
                          className="w-12 h-10 object-contain rounded"
                        />
                      </TableCell>
                      <TableCell>{row.equipment?.name}</TableCell>
                      <TableCell>{row.equipment?.main_name}</TableCell>
                      <TableCell>{row.equipment?.type_name}</TableCell>
                      <TableCell className="text-center">
                        <Status status={translated} />
                      </TableCell>
                      <TableCell>{row.equipment?.vendor_name}</TableCell>
                      <TableCell>{row.branch_id}</TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>

          {/* Pagination */}
          <div className="flex justify-between items-center border-t dark:border-gray-600 px-4 py-2 bg-gray-50 dark:bg-gray-700">
            <div className="text-sm text-gray-700 dark:text-gray-300">
              Tổng cộng: {filtered.length} thiết bị
            </div>
            <div className="flex gap-1">
              <Button
                size="sm"
                variant="outline"
                onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
                className="dark:border-gray-600 dark:text-gray-200"
              >
                «
              </Button>
              {Array.from({ length: totalPages }).map((_, i) => (
                <Button
                  key={i}
                  size="sm"
                  variant={currentPage === i + 1 ? "default" : "outline"}
                  className={`transition-all ${
                    currentPage === i + 1
                      ? "bg-emerald-500 text-white font-semibold"
                      : "hover:bg-gray-200 dark:hover:bg-gray-600 dark:border-gray-600 dark:text-gray-200"
                  }`}
                  onClick={() => setCurrentPage(i + 1)}
                >
                  {i + 1}
                </Button>
              ))}
              <Button
                size="sm"
                variant="outline"
                onClick={() =>
                  setCurrentPage((p) => Math.min(p + 1, totalPages))
                }
                className="dark:border-gray-600 dark:text-gray-200"
              >
                »
              </Button>
            </div>
          </div>
        </div>

        {/* Panel chi tiết */}
        {selected && (
          <div className="grid grid-cols-3 gap-6">
            <div className="col-span-2 bg-white dark:bg-[#1e1e1e] shadow rounded-lg p-6 space-y-4">
              <h2 className="text-lg font-semibold">Chi tiết thiết bị</h2>
              <div className="flex gap-6">
                <img
                  src={selected.equipment?.image}
                  alt={selected.equipment?.name}
                  className="w-40 h-32 object-contain border rounded-lg"
                />
                <div className="grid grid-cols-2 gap-x-12 gap-y-2 text-sm">
                  <p>
                    <strong>Tên:</strong> {selected.equipment?.name}
                  </p>
                  <p>
                    <strong>Nhà cung cấp:</strong>{" "}
                    {selected.equipment?.vendor_name}
                  </p>
                  <p>
                    <strong>Nhóm:</strong> {selected.equipment?.main_name}
                  </p>
                  <p>
                    <strong>Chi nhánh:</strong> {selected.branch_id}
                  </p>
                  <p>
                    <strong>Bảo hành đến:</strong>{" "}
                    {selected.warranty_end_date?.slice(0, 10)}
                  </p>
                  <p>
                    <strong>Trạng thái:</strong>{" "}
                    <Status status={selected.status} />
                  </p>
                </div>
              </div>
            </div>

            <div className="col-span-1 bg-white dark:bg-[#1e1e1e] shadow rounded-lg p-6 space-y-4">
              <h2 className="text-lg font-semibold">Phiếu bảo trì</h2>
              <p>
                <strong>Lý do:</strong> {selected.maintenance_reason || "—"}
              </p>

              {(!maintenanceSteps[selected.id] ||
                maintenanceSteps[selected.id] === 1) && (
                <Button
                  onClick={handleStart}
                  disabled={loadingStart}
                  className="bg-blue-500 text-white w-full flex items-center justify-center"
                >
                  {loadingStart ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Đang xử lý...
                    </>
                  ) : (
                    "Bắt đầu bảo trì"
                  )}
                </Button>
              )}

              {/* Step 2 */}
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
                      disabled={loadingComplete}
                      className="bg-green-500 text-white flex-1 flex items-center justify-center"
                    >
                      {loadingComplete ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Đang gửi...
                        </>
                      ) : (
                        "Bảo trì thành công"
                      )}
                    </Button>

                    <Button
                      onClick={() => finishMaintenance("Bảo trì thất bại")}
                      disabled={loadingComplete}
                      className="bg-red-500 text-white flex-1 flex items-center justify-center"
                    >
                      {loadingComplete ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Đang gửi...
                        </>
                      ) : (
                        "Bảo trì thất bại"
                      )}
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
              )}

              {message && (
                <p className="text-emerald-600 font-semibold mt-2">{message}</p>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
