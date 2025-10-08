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
  ready: "Bảo trì thành công",
  failed: "Bảo trì thất bại",
  moving: "Đang di chuyển",
  "in stock": "Thiết bị trong kho",
  deleted: "Đã xóa",
};

const ITEMS_PER_PAGE = 8;

export default function MaintenanceReadySection() {
  const [equipments, setEquipments] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [selected, setSelected] = useState(null);
  const [maintenanceHistory, setMaintenanceHistory] = useState([]);
  const [search, setSearch] = useState("");
  const [activeGroup, setActiveGroup] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);

  const [loading, setLoading] = useState(true);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  // 🧭 Load danh sách thiết bị chờ phê duyệt (Ready / Failed)
  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        const data = await EquipmentUnitService.getByStatusGroup([
          "Ready",
          "Failed",
        ]);
        setEquipments(data);
        setFiltered(data);
      } catch (err) {
        console.error("❌ Lỗi load thiết bị:", err);
        toast.error("Không thể tải danh sách thiết bị chờ phê duyệt");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  // Lọc & tìm kiếm
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

  // 🧾 Load lịch sử bảo trì của unit được chọn
  const loadHistory = async (unitId) => {
    try {
      setLoadingHistory(true);
      const res = await MaintainService.getByUnit(unitId);
      if (res) setMaintenanceHistory([res]); // có thể là 1 hoặc nhiều record
      else setMaintenanceHistory([]);
    } catch (err) {
      console.error("❌ Lỗi load lịch sử:", err);
      toast.error("Không thể tải lịch sử bảo trì");
    } finally {
      setLoadingHistory(false);
    }
  };

  // 🟢 Phê duyệt trạng thái cuối
  const finalizeStatus = async (status) => {
    if (!selected) return;
    try {
      setActionLoading(true);
      await EquipmentUnitService.update(selected.id, { status });
      toast.success(`✅ Thiết bị đã được cập nhật trạng thái "${status}"`);
      setSuccessMsg(`Thiết bị đã được chuyển sang trạng thái "${status}"`);
      setErrorMsg("");

      // Cập nhật UI
      setEquipments((prev) => prev.filter((eq) => eq.id !== selected.id));
      setSelected(null);
    } catch (err) {
      console.error("❌ Lỗi khi phê duyệt:", err);
      toast.error("Không thể cập nhật trạng thái thiết bị");
      setErrorMsg("Không thể cập nhật trạng thái, vui lòng thử lại.");
      setSuccessMsg("");
    } finally {
      setActionLoading(false);
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
                  <TableHead className="text-center">Kết quả bảo trì</TableHead>
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
                        loadHistory(row.id);
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
          <div
            className={`grid grid-cols-2 gap-6 border-t-4 rounded-xl shadow bg-white dark:bg-[#1e1e1e] p-6 transition-colors ${
              selected.status === "ready"
                ? "border-green-500"
                : "border-rose-500"
            }`}
          >
            {/* Chi tiết */}
            <div>
              <h2 className="text-lg font-semibold mb-4">Chi tiết thiết bị</h2>
              <div className="flex gap-6">
                <img
                  src={selected.equipment?.image}
                  alt={selected.equipment?.name}
                  className="w-40 h-32 object-contain border rounded-lg"
                />
                <div className="space-y-2 text-sm">
                  <p>
                    <strong>Tên:</strong> {selected.equipment?.name}
                  </p>
                  <p>
                    <strong>Nhà cung cấp:</strong>{" "}
                    {selected.equipment?.vendor_name}
                  </p>
                  <p>
                    <strong>Chi nhánh:</strong> {selected.branch_id}
                  </p>
                  <p>
                    <strong>Trạng thái:</strong>{" "}
                    <Status status={selected.status} />
                  </p>
                </div>
              </div>
            </div>

            {/* Lịch sử bảo trì */}
            <div>
              <h2 className="text-lg font-semibold mb-4">Lịch sử bảo trì</h2>
              {loadingHistory ? (
                <div className="text-gray-500 animate-pulse">
                  Đang tải lịch sử...
                </div>
              ) : maintenanceHistory.length > 0 ? (
                <table className="w-full border text-sm dark:border-gray-700">
                  <thead className="bg-gray-100 dark:bg-gray-800 dark:text-gray-200">
                    <tr>
                      <th className="border p-2">Bắt đầu</th>
                      <th className="border p-2">Kết thúc</th>
                      <th className="border p-2">Chi phí</th>
                      <th className="border p-2">Kết quả</th>
                    </tr>
                  </thead>
                  <tbody>
                    {maintenanceHistory.map((mh, idx) => (
                      <tr key={idx}>
                        <td className="border p-2">
                          {mh.start_date?.slice(0, 10)}
                        </td>
                        <td className="border p-2">
                          {mh.end_date?.slice(0, 10) || "—"}
                        </td>
                        <td className="border p-2">
                          {mh.cost?.toLocaleString() || 0}đ
                        </td>
                        <td className="border p-2">
                          <Status status={mh.status} />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <p className="text-gray-500 dark:text-gray-400">
                  Không có lịch sử bảo trì
                </p>
              )}

              {/* Nút phê duyệt */}
              {selected.status?.toLowerCase() === "ready" && (
                <Button
                  onClick={() => finalizeStatus("Active")}
                  disabled={actionLoading}
                  className="bg-green-600 text-white w-full mt-4 flex items-center justify-center"
                >
                  {actionLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Đang xử lý...
                    </>
                  ) : (
                    "Hoạt động thiết bị"
                  )}
                </Button>
              )}

              {selected.status?.toLowerCase() === "failed" && (
                <Button
                  onClick={() => finalizeStatus("Inactive")}
                  disabled={actionLoading}
                  className="bg-rose-600 text-white w-full mt-4 flex items-center justify-center"
                >
                  {actionLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Đang xử lý...
                    </>
                  ) : (
                    "Ngưng hoạt động máy"
                  )}
                </Button>
              )}

              {/* Thông báo */}
              {successMsg && (
                <div className="mt-3 px-4 py-2 text-sm rounded bg-emerald-50 text-emerald-600 border border-emerald-200 shadow-sm">
                  {successMsg}
                </div>
              )}
              {errorMsg && (
                <div className="mt-3 px-4 py-2 text-sm rounded bg-red-50 text-red-600 border border-red-200 shadow-sm">
                  {errorMsg}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
