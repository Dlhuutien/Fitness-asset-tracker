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
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import Status from "@/components/common/Status";
import { Grid, Loader2 } from "lucide-react";
import EquipmentUnitService from "@/services/equipmentUnitService";
import BranchService from "@/services/branchService";
import MaintainService from "@/services/MaintainService";
import { toast } from "sonner";
import {
  HeaderFilter,
  ColumnVisibilityButton,
  useGlobalFilterController,
  getUniqueValues,
} from "@/components/common/ExcelTableTools";
import useAuthRole from "@/hooks/useAuthRole";
import Branch from "@/components/common/Branch";

const STATUS_MAP = {
  active: "Hoạt động",
  inactive: "Ngưng hoạt động",
  ready: "Bảo trì thành công",
  failed: "Bảo trì thất bại",
  moving: "Đang điều chuyển",
  "in stock": "Thiết bị trong kho",
  deleted: "Đã xóa",
};

const ITEMS_PER_PAGE = 8;
const formatLocation = (floor, area) => {
  if (floor && area) return `${floor}, ${area}`;
  return floor || area || "—";
};

export default function MaintenanceReadySection() {
  const [equipments, setEquipments] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [selected, setSelected] = useState(null);
  const [maintenanceHistory, setMaintenanceHistory] = useState([]);
  const [search, setSearch] = useState("");
  const [activeGroup, setActiveGroup] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [branches, setBranches] = useState([]);
  const [activeBranch, setActiveBranch] = useState("all");

  const { isSuperAdmin, branchId } = useAuthRole();
  const [bulkSelectAll, setBulkSelectAll] = useState(false);

  const [loading, setLoading] = useState(true);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [bulkMode, setBulkMode] = useState(null);
  // "success" | "fail" | null

  const [checkedMap, setCheckedMap] = useState({});
  // { "EQID123": true, "EQID124": false }
  const handleBulkConfirm = async () => {
    const selectedIds = Object.keys(checkedMap).filter((id) => checkedMap[id]);

    if (selectedIds.length === 0) {
      toast.error("Vui lòng chọn ít nhất 1 thiết bị!");
      return;
    }

    setPanel({
      open: true,
      loading: true,
      message: "",
    });

    try {
      for (const id of selectedIds) {
        await EquipmentUnitService.update(id, {
          status: bulkMode === "success" ? "Active" : "Inactive",
        });
      }

      setTimeout(() => {
        setPanel({
          open: true,
          loading: false,
          message:
            bulkMode === "success"
              ? "Đã phê duyệt: Hoạt động lại máy"
              : "Đã phê duyệt: Ngưng hoạt động máy",
        });

        // xóa device có id đã chọn
        setEquipments((prev) =>
          prev.filter((eq) => !selectedIds.includes(eq.id))
        );
      }, 500);
    } catch (err) {
      setPanel({
        open: true,
        loading: false,
        message: "Có lỗi xảy ra khi phê duyệt!",
      });
    }
  };

  const [panel, setPanel] = useState({
    open: false,
    loading: true,
    message: "",
  });

  // ===== Excel Table Tools =====
  const controller = useGlobalFilterController();
  const [filters, setFilters] = useState({
    id: [],
    name: [],
    main_name: [],
    type_name: [],
    location: [],
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
    location: true,
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
  useEffect(() => {
    (async () => {
      try {
        const res = await BranchService.getAll();
        setBranches(res || []);
      } catch {
        toast.error("Không thể tải danh sách chi nhánh!");
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
        u.vendor_name?.toLowerCase().includes(q) ||
        u.equipment?.type_name?.toLowerCase().includes(q);

      const matchGroup =
        activeGroup === "all" || u.equipment?.main_name === activeGroup;

      const matchBranch =
        activeBranch === "all" || u.branch_id === activeBranch;

      return matchSearch && matchGroup && matchBranch;
    });

    setFiltered(f);
    setCurrentPage(1);
  }, [search, activeGroup, activeBranch, equipments]);

  // Excel-style unique values
  const uniqueValues = useMemo(
    () => ({
      id: getUniqueValues(equipments, (e) => e.id),
      name: getUniqueValues(equipments, (e) => e.equipment?.name),
      main_name: getUniqueValues(equipments, (e) => e.equipment?.main_name),
      type_name: getUniqueValues(equipments, (e) => e.equipment?.type_name),
      location: getUniqueValues(equipments, (e) =>
        formatLocation(e.floor_name, e.area_name)
      ).filter((v) => v !== "—"),
      vendor_name: getUniqueValues(equipments, (e) => e.vendor_name),
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
          case "location":
            val = formatLocation(e.floor_name, e.area_name);
            break;
          case "vendor_name":
            val = e.vendor_name;
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

      // ✅ Hiển thị thông báo đẹp hơn
      const msg =
        status === "Active"
          ? "✅ Thiết bị đã được đưa vào hoạt động!"
          : "⚠️ Thiết bị đã được ngưng hoạt động!";
      toast.success(msg);
      setSuccessMsg(msg);
      setErrorMsg("");

      // ⏳ Đợi 2 giây rồi mới xóa item và reset panel
      setTimeout(() => {
        setEquipments((prev) => prev.filter((eq) => eq.id !== selected.id));
        setSelected(null);
        setSuccessMsg("");
      }, 2000);
    } catch (err) {
      console.error("❌ Lỗi khi phê duyệt:", err);
      toast.error("Không thể cập nhật trạng thái thiết bị");
      setErrorMsg("❌ Không thể cập nhật trạng thái, vui lòng thử lại.");
      setSuccessMsg("");

      // ⏳ Ẩn thông báo lỗi sau 2 giây
      setTimeout(() => {
        setErrorMsg("");
      }, 2000);
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
    <div className="space-y-4">
      {/* ====== Toolbar ====== */}
      <div className="flex flex-wrap justify-between items-center gap-3 p-3 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl shadow-sm">
        <div className="flex flex-wrap items-center gap-2">
          {/* Ô tìm kiếm */}
          <Input
            placeholder="🔍 Tìm tên, loại, nhà cung cấp..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="h-9 w-64 border-gray-300 dark:border-gray-700 focus:ring-2 focus:ring-emerald-400 text-sm"
          />

          {/* Nhóm thiết bị */}
          <Select
            onValueChange={(v) => {
              setActiveGroup(v);
              setCurrentPage(1);
            }}
            defaultValue="all"
          >
            <SelectTrigger className="h-9 w-44 border-gray-300 dark:border-gray-700 text-sm bg-gray-50 dark:bg-gray-800 focus:ring-emerald-400 transition">
              <SelectValue placeholder="Nhóm thiết bị" />
            </SelectTrigger>
            <SelectContent className="z-[9999] bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 shadow-md rounded-md">
              {[
                { id: "all", name: "Tất cả nhóm" },
                ...Array.from(
                  new Set(equipments.map((e) => e.equipment?.main_name))
                ).map((n) => ({ id: n, name: n })),
              ].map((g) => (
                <SelectItem
                  key={g.id}
                  value={g.id}
                  className="text-sm cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800"
                >
                  {g.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Chi nhánh (chỉ hiển thị cho super-admin) */}
          {isSuperAdmin && (
            <Select
              onValueChange={(v) => {
                setActiveBranch(v);
                setCurrentPage(1);
              }}
              defaultValue="all"
            >
              <SelectTrigger className="h-9 w-40 text-sm bg-gray-50 dark:bg-gray-800 border-gray-300 dark:border-gray-700">
                <SelectValue placeholder="Chi nhánh" />
              </SelectTrigger>
              <SelectContent className="z-[9999] bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 shadow-md">
                <SelectItem value="all" className="text-sm">
                  Tất cả chi nhánh
                </SelectItem>
                {branches.map((b) => (
                  <SelectItem key={b.id} value={b.id} className="text-sm">
                    {b.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </div>

        <div className="flex items-center gap-2">
          <Button
            className="bg-emerald-600 text-white"
            onClick={() => {
              setBulkMode("success");

              // Toggle trạng thái
              setBulkSelectAll((prev) => {
                const newState = !prev;
                const m = {};

                filteredByColumn.forEach((row) => {
                  if (row.status?.toLowerCase() === "ready") {
                    m[row.id] = newState; // true = chọn hết, false = bỏ hết
                  }
                });

                setCheckedMap(newState ? m : {});
                return newState;
              });
            }}
          >
            Phê duyệt thành công
          </Button>

          <Button
            className="bg-rose-600 text-white"
            onClick={() => {
              setBulkMode("fail");

              setBulkSelectAll((prev) => {
                const newState = !prev;
                const m = {};

                filteredByColumn.forEach((row) => {
                  if (row.status?.toLowerCase() === "failed") {
                    m[row.id] = newState;
                  }
                });

                setCheckedMap(newState ? m : {});
                return newState;
              });
            }}
          >
            Phê duyệt thất bại
          </Button>

          {/* Di chuyển Hiển thị cột xuống đây */}
          <ColumnVisibilityButton
            visibleColumns={visibleColumns}
            setVisibleColumns={setVisibleColumns}
            labels={{
              id: "Mã định danh",
              image: "Ảnh",
              name: "Tên thiết bị",
              main_name: "Nhóm",
              type_name: "Loại",
              location: "Vị trí",
              status: "Trạng thái",
              vendor_name: "Nhà cung cấp",
              branch_id: "Chi nhánh",
            }}
          />
        </div>
      </div>

      {/* Main content */}
      <div className="col-span-9 space-y-3">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
          <div className="overflow-x-auto">
            <Table className="min-w-[1000px] border border-gray-200 dark:border-gray-600">
              <TableHeader>
                <TableRow className="bg-gray-100 dark:bg-gray-700 text-sm font-semibold">
                  {bulkMode && (
                    <TableHead className="text-center">Chọn</TableHead>
                  )}
                  <TableHead>#</TableHead>
                  {visibleColumns.id && (
                    <TableHead>
                      <HeaderFilter
                        selfKey="id"
                        label="Mã định danh thiết bị"
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
                  {visibleColumns.location && (
                    <TableHead>
                      <HeaderFilter
                        selfKey="location"
                        label="Vị trí"
                        values={uniqueValues.location}
                        selected={filters.location}
                        onChange={(v) =>
                          setFilters((p) => ({ ...p, location: v }))
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
                      {bulkMode && (
                        <TableCell className="text-center">
                          <input
                            type="checkbox"
                            checked={checkedMap[row.id] || false}
                            onChange={(e) =>
                              setCheckedMap((prev) => ({
                                ...prev,
                                [row.id]: e.target.checked,
                              }))
                            }
                            className="w-4 h-4"
                          />
                        </TableCell>
                      )}
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
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <span
                              className={`
                              font-semibold truncate max-w-[220px]
                              ${
                                row.branch_id === "GV"
                                  ? "text-emerald-600 dark:text-emerald-400"
                                  : row.branch_id === "Q3"
                                  ? "text-blue-600 dark:text-blue-400"
                                  : "text-gray-800 dark:text-gray-200"
                              }
                            `}
                            >
                              {row.equipment?.name}
                            </span>
                          </div>
                        </TableCell>
                      )}

                      {visibleColumns.main_name && (
                        <TableCell>{row.equipment?.main_name}</TableCell>
                      )}
                      {visibleColumns.type_name && (
                        <TableCell>{row.equipment?.type_name}</TableCell>
                      )}
                      {visibleColumns.location && (
                        <TableCell className="text-center">
                          {formatLocation(row.floor_name, row.area_name)}
                        </TableCell>
                      )}
                      {visibleColumns.status && (
                        <TableCell className="text-center">
                          <Status status={translated} />
                        </TableCell>
                      )}
                      {visibleColumns.vendor_name && (
                        <TableCell>{row.vendor_name}</TableCell>
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
        {bulkMode && (
          <div className="p-4 bg-white dark:bg-gray-800 rounded-lg shadow border">
            <Button
              className="
    w-full py-4 
    bg-gradient-to-r from-blue-600 to-indigo-600 
    hover:opacity-90 
    text-white text-base font-bold 
    rounded-xl shadow-lg
    transition-all
  "
              onClick={handleBulkConfirm}
            >
              ✔ Xác nhận phê duyệt
            </Button>
          </div>
        )}

        {/* Panel chi tiết */}
        {selected && (
          <div
            className={`flex flex-col gap-6 border-t-4 rounded-xl shadow bg-white dark:bg-[#1e1e1e] p-6 transition-colors ${
              selected.status === "Ready"
                ? "border-green-500"
                : "border-rose-500"
            }`}
          >
            {/* 🧾 Chi tiết thiết bị */}
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
                    <strong>Nhà cung cấp:</strong> {selected.vendor_name}
                  </p>
                  <p>
                    <strong>Chi nhánh:</strong> {selected.branch_id}
                  </p>
                  <p>
                    <strong>Trạng thái:</strong>{" "}
                    <Status
                      status={
                        STATUS_MAP[selected.status?.toLowerCase()] ||
                        selected.status ||
                        "Không xác định"
                      }
                    />
                  </p>
                </div>
              </div>
            </div>

            {/* 🛠 Chi tiết bảo trì */}
            <div>
              <h2 className="text-lg font-semibold mb-4">Chi tiết bảo trì</h2>

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

              {/* 🔘 Nút phê duyệt */}
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

              {/* 🧩 Thông báo */}
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
      {panel.open && (
        <div className="fixed inset-0 z-[99999] bg-black/40 backdrop-blur-sm flex items-center justify-center">
          <div
            className="
      bg-white dark:bg-gray-800 
      p-7 
      rounded-3xl 
      shadow-2xl 
      w-[380px] 
      text-center 
      space-y-5 
      border dark:border-gray-700
      transform scale-100 animate-[fadeIn_0.25s_ease]
    "
          >
            {panel.loading ? (
              <>
                <Loader2 className="w-12 h-12 text-blue-600 animate-spin mx-auto" />
                <p className="text-gray-700 dark:text-gray-300 text-base">
                  Đang xử lý phê duyệt...
                </p>
              </>
            ) : (
              <>
                <div className="text-3xl">
                  {bulkMode === "success" ? "🎉" : "⚠️"}
                </div>

                <p className="text-xl font-bold">
                  {bulkMode === "success"
                    ? "Đã phê duyệt thành công"
                    : "Đã phê duyệt thất bại"}
                </p>

                <p className="text-gray-600 dark:text-gray-300 text-sm leading-relaxed">
                  Các thiết bị đã được chuyển sang trạng thái <br />
                  <span className="font-semibold text-blue-600">
                    {bulkMode === "success" ? "Hoạt động" : "Ngưng hoạt động"}
                  </span>
                </p>

                <Button
                  className="
              w-full 
              bg-blue-600 hover:bg-blue-700 
              text-white font-semibold 
              rounded-xl py-3
            "
                  onClick={() => {
                    setPanel({ open: false, loading: false, message: "" });
                    setBulkMode(null);
                    setCheckedMap({});
                  }}
                >
                  Đóng
                </Button>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
