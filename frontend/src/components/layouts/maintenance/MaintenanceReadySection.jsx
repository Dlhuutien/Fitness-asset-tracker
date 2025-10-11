import { useEffect, useState, useMemo } from "react";
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
import {
  HeaderFilter,
  ColumnVisibilityButton,
  useGlobalFilterController,
  getUniqueValues,
} from "@/components/common/ExcelTableTools";

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

  // ===== Excel Table Tools =====
  const controller = useGlobalFilterController();
  const [filters, setFilters] = useState({
    id: [],
    name: [],
    main_name: [],
    type_name: [],
    vendor_name: [],
    branch_id: [],
    status: [],
  });

  const [visibleColumns, setVisibleColumns] = useState({
    id: true,
    image: true,
    name: true,
    main_name: true,
    type_name: true,
    status: true,
    vendor_name: true,
    branch_id: true,
  });

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

  // Excel-style unique values
  const uniqueValues = useMemo(
    () => ({
      id: getUniqueValues(equipments, (e) => e.id),
      name: getUniqueValues(equipments, (e) => e.equipment?.name),
      main_name: getUniqueValues(equipments, (e) => e.equipment?.main_name),
      type_name: getUniqueValues(equipments, (e) => e.equipment?.type_name),
      vendor_name: getUniqueValues(equipments, (e) => e.equipment?.vendor_name),
      branch_id: getUniqueValues(equipments, (e) => e.branch_id),
      status: getUniqueValues(
        equipments,
        (e) => STATUS_MAP[e.status?.toLowerCase()]
      ),
    }),
    [equipments]
  );

  const filteredByColumn = useMemo(() => {
    return (filtered || []).filter((e) => {
      const match = Object.keys(filters).every((key) => {
        if (!filters[key] || filters[key].length === 0) return true;
        let val = "";
        switch (key) {
          case "id":
            val = e.id;
            break;
          case "name":
            val = e.equipment?.name;
            break;
          case "main_name":
            val = e.equipment?.main_name;
            break;
          case "type_name":
            val = e.equipment?.type_name;
            break;
          case "vendor_name":
            val = e.equipment?.vendor_name;
            break;
          case "branch_id":
            val = e.branch_id;
            break;
          case "status":
            val = STATUS_MAP[e.status?.toLowerCase()];
            break;
          default:
            val = "";
        }
        return filters[key].includes(val);
      });
      return match;
    });
  }, [filtered, filters]);

  const totalPages = Math.max(
    1,
    Math.ceil(filteredByColumn.length / ITEMS_PER_PAGE)
  );
  const currentData = filteredByColumn.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  // 🧾 Load lịch sử bảo trì của unit được chọn
  const loadHistory = async (unitId) => {
    try {
      setLoadingHistory(true);
      const res = await MaintainService.getLatestHistory(unitId);
      if (res) setMaintenanceHistory([res]);
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
          <div className="flex justify-end px-4 py-2">
            <ColumnVisibilityButton
              visibleColumns={visibleColumns}
              setVisibleColumns={setVisibleColumns}
              labels={{
                id: "Mã Unit",
                image: "Ảnh",
                name: "Tên thiết bị",
                main_name: "Nhóm",
                type_name: "Loại",
                status: "Kết quả bảo trì",
                vendor_name: "Nhà cung cấp",
                branch_id: "Chi nhánh",
              }}
            />
          </div>

          <div className="overflow-x-auto">
            <Table className="min-w-[1000px] border border-gray-200 dark:border-gray-600">
              <TableHeader>
                <TableRow className="bg-gray-100 dark:bg-gray-700 text-sm font-semibold">
                  <TableHead>#</TableHead>
                  {visibleColumns.id && (
                    <TableHead>
                      <HeaderFilter
                        selfKey="id"
                        label="Mã Unit"
                        values={uniqueValues.id}
                        selected={filters.id}
                        onChange={(v) => setFilters((p) => ({ ...p, id: v }))}
                        controller={controller}
                      />
                    </TableHead>
                  )}
                  {visibleColumns.image && <TableHead>Hình ảnh</TableHead>}
                  {visibleColumns.name && (
                    <TableHead>
                      <HeaderFilter
                        selfKey="name"
                        label="Tên thiết bị"
                        values={uniqueValues.name}
                        selected={filters.name}
                        onChange={(v) => setFilters((p) => ({ ...p, name: v }))}
                        controller={controller}
                      />
                    </TableHead>
                  )}
                  {visibleColumns.main_name && (
                    <TableHead>
                      <HeaderFilter
                        selfKey="main_name"
                        label="Nhóm"
                        values={uniqueValues.main_name}
                        selected={filters.main_name}
                        onChange={(v) =>
                          setFilters((p) => ({ ...p, main_name: v }))
                        }
                        controller={controller}
                      />
                    </TableHead>
                  )}
                  {visibleColumns.type_name && (
                    <TableHead>
                      <HeaderFilter
                        selfKey="type_name"
                        label="Loại"
                        values={uniqueValues.type_name}
                        selected={filters.type_name}
                        onChange={(v) =>
                          setFilters((p) => ({ ...p, type_name: v }))
                        }
                        controller={controller}
                      />
                    </TableHead>
                  )}
                  {visibleColumns.status && (
                    <TableHead>
                      <HeaderFilter
                        selfKey="status"
                        label="Kết quả bảo trì"
                        values={uniqueValues.status}
                        selected={filters.status}
                        onChange={(v) =>
                          setFilters((p) => ({ ...p, status: v }))
                        }
                        controller={controller}
                      />
                    </TableHead>
                  )}
                  {visibleColumns.vendor_name && (
                    <TableHead>
                      <HeaderFilter
                        selfKey="vendor_name"
                        label="Nhà cung cấp"
                        values={uniqueValues.vendor_name}
                        selected={filters.vendor_name}
                        onChange={(v) =>
                          setFilters((p) => ({ ...p, vendor_name: v }))
                        }
                        controller={controller}
                      />
                    </TableHead>
                  )}
                  {visibleColumns.branch_id && (
                    <TableHead>
                      <HeaderFilter
                        selfKey="branch_id"
                        label="Chi nhánh"
                        values={uniqueValues.branch_id}
                        selected={filters.branch_id}
                        onChange={(v) =>
                          setFilters((p) => ({ ...p, branch_id: v }))
                        }
                        controller={controller}
                      />
                    </TableHead>
                  )}
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
                      {visibleColumns.id && <TableCell>{row.id}</TableCell>}
                      {visibleColumns.image && (
                        <TableCell>
                          <img
                            src={row.equipment?.image}
                            alt={row.equipment?.name}
                            className="w-12 h-10 object-contain rounded"
                          />
                        </TableCell>
                      )}
                      {visibleColumns.name && (
                        <TableCell>{row.equipment?.name}</TableCell>
                      )}
                      {visibleColumns.main_name && (
                        <TableCell>{row.equipment?.main_name}</TableCell>
                      )}
                      {visibleColumns.type_name && (
                        <TableCell>{row.equipment?.type_name}</TableCell>
                      )}
                      {visibleColumns.status && (
                        <TableCell className="text-center">
                          <Status status={translated} />
                        </TableCell>
                      )}
                      {visibleColumns.vendor_name && (
                        <TableCell>{row.equipment?.vendor_name}</TableCell>
                      )}
                      {visibleColumns.branch_id && (
                        <TableCell>{row.branch_id}</TableCell>
                      )}
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>

          {/* Pagination */}
          <div className="flex justify-between items-center border-t dark:border-gray-600 px-4 py-2 bg-gray-50 dark:bg-gray-700">
            <div className="text-sm text-gray-700 dark:text-gray-300">
              Tổng cộng: {filteredByColumn.length} thiết bị
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
            {/* Lịch sử bảo trì */}
            <div>
              <h2 className="text-lg font-semibold mb-4">Lịch sử bảo trì</h2>

              {loadingHistory ? (
                <div className="text-gray-500 animate-pulse">
                  Đang tải lịch sử...
                </div>
              ) : maintenanceHistory.length > 0 ? (
                <div className="overflow-x-auto overflow-y-auto max-h-64 border rounded-md">
                  <table className="w-full min-w-[800px] text-sm border-collapse">
                    <thead className="bg-gray-100 dark:bg-gray-800 sticky top-0 z-10">
                      <tr>
                        <th className="border p-2">Tên thiết bị</th>
                        <th className="border p-2">Người yêu cầu</th>
                        <th className="border p-2">Kỹ thuật viên</th>
                        <th className="border p-2">Lý do</th>
                        <th className="border p-2">Chi tiết</th>
                        <th className="border p-2">Bắt đầu</th>
                        <th className="border p-2">Kết thúc</th>
                        <th className="border p-2 text-right">Chi phí</th>
                      </tr>
                    </thead>
                    <tbody className="dark:bg-gray-900">
                      {maintenanceHistory.map((mh, idx) => (
                        <tr
                          key={idx}
                          className="border-t hover:bg-gray-50 dark:hover:bg-gray-800"
                        >
                          <td className="border p-2">{mh.equipment_name}</td>
                          <td className="border p-2">{mh.requested_by_name}</td>
                          <td className="border p-2">{mh.technician_name}</td>
                          <td className="border p-2">
                            {mh.maintenance_reason}
                          </td>
                          <td className="border p-2 max-w-[200px] truncate">
                            {mh.maintenance_detail}
                          </td>
                          <td className="border p-2">
                            {new Date(mh.start_date).toLocaleString("vi-VN")}
                          </td>
                          <td className="border p-2">
                            {new Date(mh.end_date).toLocaleString("vi-VN")}
                          </td>
                          <td className="border p-2 text-right">
                            {mh.invoices?.[0]?.cost?.toLocaleString() || 0} ₫
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
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
