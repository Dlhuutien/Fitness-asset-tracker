import { useEffect, useMemo, useState } from "react";
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
  getUniqueValues,
  getStatusVN,
  useGlobalFilterController,
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

  const [loading, setLoading] = useState(true);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  const [currentPage, setCurrentPage] = useState(1);

  // Bộ lọc kiểu Excel
  const [filters, setFilters] = useState({
    id: [],
    name: [],
    main_name: [],
    type_name: [],
    status: [],
    vendor_name: [],
    branch_id: [],
  });
  const controller = useGlobalFilterController();

  // Ẩn/hiện cột
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

  // 🧾 Load lịch sử bảo trì của unit được chọn
  const loadHistory = async (unitId) => {
    try {
      setLoadingHistory(true);
      const res = await MaintainService.getByUnit(unitId);
      if (res) setMaintenanceHistory([res]);
      else setMaintenanceHistory([]);
    } catch (err) {
      console.error("❌ Lỗi load lịch sử:", err);
      toast.error("Không thể tải lịch sử bảo trì");
    } finally {
      setLoadingHistory(false);
    }
  };

  // 🧠 Hàm khớp giá trị filter
  const matches = (vals, val) =>
    vals.length === 0 ||
    vals.some(
      (v) => String(v).trim().toLowerCase() === String(val).trim().toLowerCase()
    );

  // 🧩 Áp filter
  useEffect(() => {
    let rs = [...(equipments || [])];

    rs = rs.filter((r) => {
      const id = String(r.id ?? "");
      const name = String(r.equipment?.name ?? "");
      const main_name = String(r.equipment?.main_name ?? "");
      const type_name = String(r.equipment?.type_name ?? "");
      const statusVN = getStatusVN(r.status);
      const vendor_name = String(r.equipment?.vendor_name ?? "");
      const branch_id = String(r.branch_id ?? "");

      return (
        matches(filters.id, id) &&
        matches(filters.name, name) &&
        matches(filters.main_name, main_name) &&
        matches(filters.type_name, type_name) &&
        matches(filters.status, statusVN) &&
        matches(filters.vendor_name, vendor_name) &&
        matches(filters.branch_id, branch_id)
      );
    });

    setFiltered(rs);
    setCurrentPage(1);
  }, [filters, equipments]);

  // 🧩 Unique values cho dropdown filter
  const unique = useMemo(() => {
    const list = equipments || [];
    return {
      id: getUniqueValues(list, (e) => e.id),
      name: getUniqueValues(list, (e) => e.equipment?.name),
      main_name: getUniqueValues(list, (e) => e.equipment?.main_name),
      type_name: getUniqueValues(list, (e) => e.equipment?.type_name),
      status: getUniqueValues(list, (e) => getStatusVN(e.status)),
      vendor_name: getUniqueValues(list, (e) => e.equipment?.vendor_name),
      branch_id: getUniqueValues(list, (e) => e.branch_id),
    };
  }, [equipments]);

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

  const totalPages = Math.max(1, Math.ceil(filtered.length / ITEMS_PER_PAGE));
  const currentData = filtered.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold text-emerald-600 dark:text-emerald-400">
          Danh sách thiết bị chờ phê duyệt
        </h2>

        <ColumnVisibilityButton
          visibleColumns={visibleColumns}
          setVisibleColumns={setVisibleColumns}
          labels={{
            id: "Mã Unit",
            image: "Hình ảnh",
            name: "Tên thiết bị",
            main_name: "Nhóm",
            type_name: "Loại",
            status: "Kết quả bảo trì",
            vendor_name: "Nhà cung cấp",
            branch_id: "Chi nhánh",
          }}
        />
      </div>

      {/* TABLE */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <Table className="min-w-[1100px] border border-gray-200 dark:border-gray-600">
            <TableHeader>
              <TableRow className="bg-gray-100 dark:bg-gray-700 text-sm font-semibold">
                <TableHead className="text-center">#</TableHead>

                {visibleColumns.id && (
                  <TableHead>
                    <HeaderFilter
                      selfKey="id"
                      label="Mã Unit"
                      values={unique.id}
                      selected={filters.id}
                      onChange={(vals) => setFilters((f) => ({ ...f, id: vals }))}
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
                      values={unique.name}
                      selected={filters.name}
                      onChange={(vals) => setFilters((f) => ({ ...f, name: vals }))}
                      controller={controller}
                    />
                  </TableHead>
                )}

                {visibleColumns.main_name && (
                  <TableHead>
                    <HeaderFilter
                      selfKey="main_name"
                      label="Nhóm"
                      values={unique.main_name}
                      selected={filters.main_name}
                      onChange={(vals) => setFilters((f) => ({ ...f, main_name: vals }))}
                      controller={controller}
                    />
                  </TableHead>
                )}

                {visibleColumns.type_name && (
                  <TableHead>
                    <HeaderFilter
                      selfKey="type_name"
                      label="Loại"
                      values={unique.type_name}
                      selected={filters.type_name}
                      onChange={(vals) => setFilters((f) => ({ ...f, type_name: vals }))}
                      controller={controller}
                    />
                  </TableHead>
                )}

                {visibleColumns.status && (
                  <TableHead className="text-center">
                    <HeaderFilter
                      selfKey="status"
                      label="Kết quả bảo trì"
                      values={unique.status}
                      selected={filters.status}
                      onChange={(vals) => setFilters((f) => ({ ...f, status: vals }))}
                      controller={controller}
                    />
                  </TableHead>
                )}

                {visibleColumns.vendor_name && (
                  <TableHead>
                    <HeaderFilter
                      selfKey="vendor_name"
                      label="Nhà cung cấp"
                      values={unique.vendor_name}
                      selected={filters.vendor_name}
                      onChange={(vals) => setFilters((f) => ({ ...f, vendor_name: vals }))}
                      controller={controller}
                    />
                  </TableHead>
                )}

                {visibleColumns.branch_id && (
                  <TableHead>
                    <HeaderFilter
                      selfKey="branch_id"
                      label="Chi nhánh"
                      values={unique.branch_id}
                      selected={filters.branch_id}
                      onChange={(vals) => setFilters((f) => ({ ...f, branch_id: vals }))}
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
      </div>

      {/* === Panel chi tiết === */}
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

          {/* Lịch sử */}
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
  );
}
