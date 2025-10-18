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
import {
  HeaderFilter,
  ColumnVisibilityButton,
  useGlobalFilterController,
  getUniqueValues,
} from "@/components/common/ExcelTableTools";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { Loader2, PackageCheck } from "lucide-react";
import { toast } from "sonner";

import EquipmentUnitService from "@/services/equipmentUnitService";
import BranchService from "@/services/branchService";
import EquipmentTransferService from "@/services/equipmentTransferService";
import useAuthRole from "@/hooks/useAuthRole";
import Branch from "@/components/common/Branch";

const ITEMS_PER_PAGE = 8;

const STATUS_MAP = {
  active: "Hoạt động",
  "in stock": "Thiết bị trong kho",
  inactive: "Ngưng hoạt động",
  "temporary urgent": "Ngừng tạm thời",
  "in progress": "Đang bảo trì",
  ready: "Bảo trì thành công",
  failed: "Bảo trì thất bại",
  moving: "Đang di chuyển",
  deleted: "Đã xóa",
};

const DISALLOWED_FOR_TRANSFER = new Set([
  "inactive",
  "temporary urgent",
  "in progress",
  "ready",
  "failed",
  "deleted",
  "moving",
]);

export default function TransferCreateSection() {
  const [units, setUnits] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [branches, setBranches] = useState([]);
  const [destBranch, setDestBranch] = useState("all");

  const [search, setSearch] = useState("");
  const [activeGroup, setActiveGroup] = useState("all");
  const [activeBranch, setActiveBranch] = useState("");

  const [selected, setSelected] = useState({});
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const { isSuperAdmin, branchId } = useAuthRole();

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
    select: true,
    id: true,
    image: true,
    name: true,
    main_name: true,
    type_name: true,
    status: true,
    vendor_name: true,
    branch_id: true,
  });

  // ===== Load dữ liệu =====
  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        const [u, b] = await Promise.all([
          EquipmentUnitService.getByStatusGroup(["Active", "In Stock"]),
          BranchService.getAll(),
        ]);
        setUnits(u || []);
        setFiltered(u || []);
        setBranches(b || []);
        if (b?.length > 0) {
          setActiveBranch(b[0].id); // mặc định chi nhánh hiện tại
          // Mặc định chọn chi nhánh đích là chi nhánh tiếp theo (nếu có),
          // nếu chỉ có 1 chi nhánh thì vẫn để "all"
          if (b.length > 1) setDestBranch(b[1].id);
        }
      } catch (e) {
        console.error(e);
        toast.error("Không thể tải dữ liệu thiết bị/chi nhánh.");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  // ===== Search + Filter =====
  useEffect(() => {
    const q = search.trim().toLowerCase();
    const f = (units || []).filter((u) => {
      const matchSearch =
        !q ||
        u.equipment?.name?.toLowerCase().includes(q) ||
        u.equipment?.vendor_name?.toLowerCase().includes(q) ||
        u.equipment?.type_name?.toLowerCase().includes(q);
      const matchGroup =
        activeGroup === "all" || u.equipment?.main_name === activeGroup;
      const matchBranch = !activeBranch || u.branch_id === activeBranch;
      return matchSearch && matchGroup && matchBranch;
    });
    setFiltered(f);
    setCurrentPage(1);
  }, [search, activeGroup, activeBranch, units]);

  // ===== Unique values cho HeaderFilter =====
  const uniqueValues = useMemo(
    () => ({
      id: getUniqueValues(filtered, (e) => e.id),
      name: getUniqueValues(filtered, (e) => e.equipment?.name),
      main_name: getUniqueValues(filtered, (e) => e.equipment?.main_name),
      type_name: getUniqueValues(filtered, (e) => e.equipment?.type_name),
      vendor_name: getUniqueValues(filtered, (e) => e.equipment?.vendor_name),
      branch_id: getUniqueValues(filtered, (e) => e.branch_id),
      status: getUniqueValues(
        filtered,
        (e) => STATUS_MAP[e.status?.toLowerCase()]
      ),
    }),
    [filtered]
  );

  // ===== Lọc theo cột =====
  const filteredByColumn = useMemo(() => {
    return (filtered || []).filter((e) => {
      return Object.keys(filters).every((key) => {
        const vals = filters[key] || [];
        if (!vals.length) return true;
        let v = "";
        switch (key) {
          case "id":
            v = e.id;
            break;
          case "name":
            v = e.equipment?.name;
            break;
          case "main_name":
            v = e.equipment?.main_name;
            break;
          case "type_name":
            v = e.equipment?.type_name;
            break;
          case "vendor_name":
            v = e.equipment?.vendor_name;
            break;
          case "branch_id":
            v = e.branch_id;
            break;
          case "status":
            v = STATUS_MAP[e.status?.toLowerCase()];
            break;
          default:
            v = "";
        }
        return vals.includes(v);
      });
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

  // ===== Toggle chọn thiết bị =====
  const toggleSelect = (row) => {
    const normalized = (row.status || "").toLowerCase();
    if (DISALLOWED_FOR_TRANSFER.has(normalized)) {
      toast.warning("Thiết bị không thể chuyển ở trạng thái hiện tại.");
      return;
    }
    setSelected((prev) => {
      const next = { ...prev };
      if (next[row.id]) delete next[row.id];
      else next[row.id] = row;
      return next;
    });
  };

  const selectedIds = Object.keys(selected);
  const selectedItems = Object.values(selected);
  const canSubmit =
    selectedIds.length > 0 &&
    destBranch !== "all" &&
    selectedIds.every((id) => selected[id].branch_id !== destBranch);

  // ===== Gửi yêu cầu tạo transfer =====
  const handleCreateTransfer = async () => {
    if (!canSubmit) {
      toast.info("Hãy chọn thiết bị và chi nhánh nhận hợp lệ.");
      return;
    }
    try {
      setCreating(true);
      const unit_ids = selectedIds;
      const anySameDest = unit_ids.some(
        (id) => selected[id].branch_id === destBranch
      );
      if (anySameDest) {
        toast.error("Thiết bị đã thuộc chi nhánh đích.");
        return;
      }
      await EquipmentTransferService.create({
        unit_ids,
        to_branch_id: destBranch,
      });
      toast.success("Đã tạo yêu cầu vận chuyển!");
      setSelected({});
      setUnits((prev) => prev.filter((u) => !unit_ids.includes(u.id)));
      setFiltered((prev) => prev.filter((u) => !unit_ids.includes(u.id)));
    } catch (e) {
      console.error(e);
      toast.error(e?.error || "Tạo yêu cầu vận chuyển thất bại.");
    } finally {
      setCreating(false);
    }
  };

  if (loading)
    return (
      <div className="p-6 text-gray-500 dark:text-gray-300 animate-pulse">
        Đang tải danh sách thiết bị...
      </div>
    );

  return (
    <div className="space-y-6">
      {/* ===== Toolbar ===== */}
      <div className="flex flex-wrap justify-between items-center gap-3 p-3 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl shadow-sm">
        <div className="flex flex-wrap items-center gap-2">
          <Input
            placeholder="🔍 Tìm tên, loại, nhà cung cấp..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="h-9 w-64 border-gray-300 dark:border-gray-700 focus:ring-2 focus:ring-emerald-400 text-sm"
          />

          {isSuperAdmin ? (
            <Select
              defaultValue={activeBranch}
              onValueChange={(v) => {
                setActiveBranch(v);
                setCurrentPage(1);
              }}
            >
              <SelectTrigger className="h-9 w-48 text-sm bg-gray-50 dark:bg-gray-800 border-gray-300 dark:border-gray-700">
                <SelectValue placeholder="Chi nhánh nguồn" />
              </SelectTrigger>
              <SelectContent className="z-[9999] bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 shadow-md">
                {branches.map((b) => (
                  <SelectItem key={b.id} value={b.id} className="text-sm">
                    {b.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          ) : (
            <div className="text-sm font-semibold text-emerald-600 dark:text-emerald-400">
              Chi nhánh hiện tại: <Branch id={branchId} />
            </div>
          )}
        </div>

        <ColumnVisibilityButton
          visibleColumns={visibleColumns}
          setVisibleColumns={setVisibleColumns}
          labels={{
            select: "Chọn",
            id: "Mã Unit",
            image: "Ảnh",
            name: "Tên thiết bị",
            main_name: "Nhóm",
            type_name: "Loại",
            status: "Trạng thái",
            vendor_name: "Nhà cung cấp",
            branch_id: "Chi nhánh",
          }}
        />
      </div>

      {/* ===== Chọn chi nhánh đích + nút tạo yêu cầu ===== */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl p-3">
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold text-emerald-600 dark:text-emerald-400">
            Chuyển đến:
          </span>
          <Select value={destBranch} onValueChange={setDestBranch}>
            <SelectTrigger className="h-9 w-48 text-sm bg-gray-50 dark:bg-gray-800 border-gray-300 dark:border-gray-700">
              <SelectValue placeholder="Chọn chi nhánh nhận" />
            </SelectTrigger>
            <SelectContent className="z-[9999] bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 shadow-md">
              {branches
                .filter((b) => b.id !== activeBranch)
                .map((b) => (
                  <SelectItem key={b.id} value={b.id} className="text-sm">
                    {b.name}
                  </SelectItem>
                ))}
            </SelectContent>
          </Select>

          <div className="text-sm text-gray-500">
            Đã chọn: <b>{selectedIds.length}</b> thiết bị
          </div>
        </div>

        <Button
          onClick={handleCreateTransfer}
          disabled={!canSubmit || creating}
          className={`text-white ${
            canSubmit ? "bg-emerald-500 hover:bg-emerald-600" : "bg-gray-400"
          } `}
        >
          {creating ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Đang tạo yêu cầu...
            </>
          ) : (
            "Tạo yêu cầu vận chuyển"
          )}
        </Button>
      </div>
      {/* ===== Card hiển thị thiết bị đang chọn ===== */}
      {selectedItems.length > 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md border border-gray-200 dark:border-gray-700 p-4">
          <div className="flex items-center gap-2 mb-3">
            <PackageCheck className="text-emerald-500" />
            <h2 className="text-lg font-semibold text-emerald-600">
              Thiết bị đang chọn để vận chuyển ({selectedItems.length})
            </h2>
            <Button
              onClick={() => setSelected({})}
              className="ml-auto bg-rose-500 hover:bg-rose-600 text-white text-sm px-3 py-1"
            >
              Bỏ chọn tất cả
            </Button>
          </div>

          <Table className="min-w-[700px] border">
            <TableHeader>
              <TableRow className="bg-emerald-50 dark:bg-gray-700 text-sm font-semibold">
                <TableHead>#</TableHead>
                <TableHead>Mã thiết bị</TableHead>
                <TableHead>Tên thiết bị</TableHead>
                <TableHead>Nhóm</TableHead>
                <TableHead>Loại</TableHead>
                <TableHead>Trạng thái</TableHead>
                <TableHead>Chi nhánh hiện tại</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {selectedItems.map((item, i) => (
                <TableRow key={item.id} className="text-sm">
                  <TableCell>{i + 1}</TableCell>
                  <TableCell>{item.id}</TableCell>
                  <TableCell>{item.equipment?.name}</TableCell>
                  <TableCell>{item.equipment?.main_name}</TableCell>
                  <TableCell>{item.equipment?.type_name}</TableCell>
                  <TableCell>
                    <Status
                      status={
                        STATUS_MAP[item.status?.toLowerCase()] || item.status
                      }
                    />
                  </TableCell>
                  <TableCell>{item.branch_id}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
      {/* ===== Bảng danh sách thiết bị ===== */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md overflow-hidden">
        <div className="overflow-x-auto">
          <Table className="min-w-[1000px] border border-gray-200 dark:border-gray-700">
            <TableHeader>
              <TableRow className="bg-gray-100 dark:bg-gray-700 text-sm font-semibold">
                <TableHead>#</TableHead>
                {visibleColumns.select && (
                  <TableHead className="text-emerald-600 font-bold text-center">
                    Chọn
                  </TableHead>
                )}
                {Object.entries(visibleColumns).map(([key, visible]) => {
                  if (!visible || key === "select") return null;
                  const columnLabels = {
                    id: "Mã thiết bị",
                    image: "Hình ảnh",
                    name: "Tên thiết bị",
                    main_name: "Nhóm",
                    type_name: "Loại",
                    status: "Trạng thái",
                    vendor_name: "Nhà cung cấp",
                    branch_id: "Chi nhánh",
                  };
                  return (
                    <TableHead key={key} className="text-center">
                      {key === "status" || key === "image" ? (
                        columnLabels[key]
                      ) : (
                        <HeaderFilter
                          selfKey={key}
                          label={columnLabels[key] || key}
                          values={uniqueValues[key]}
                          selected={filters[key]}
                          onChange={(v) =>
                            setFilters((p) => ({ ...p, [key]: v }))
                          }
                          controller={controller}
                        />
                      )}
                    </TableHead>
                  );
                })}
              </TableRow>
            </TableHeader>

            <TableBody>
              {currentData.map((row, idx) => {
                const norm = row.status?.toLowerCase();
                const translated = STATUS_MAP[norm] || row.status;
                const disabled = DISALLOWED_FOR_TRANSFER.has(norm);
                const isChecked = !!selected[row.id];
                return (
                  <TableRow
                    key={row.id}
                    className={`transition ${
                      isChecked
                        ? "bg-emerald-50 dark:bg-emerald-900/30"
                        : "hover:bg-gray-50 dark:hover:bg-gray-700"
                    }`}
                  >
                    <TableCell className="text-center">
                      {(currentPage - 1) * ITEMS_PER_PAGE + idx + 1}
                    </TableCell>
                    {visibleColumns.select && (
                      <TableCell className="text-center">
                        <input
                          type="checkbox"
                          disabled={disabled}
                          checked={isChecked}
                          onChange={() => toggleSelect(row)}
                          className={`w-5 h-5 cursor-pointer accent-emerald-500 transition-transform duration-150 
                          ${
                            disabled
                              ? "opacity-40 cursor-not-allowed"
                              : "hover:scale-110"
                          }`}
                        />
                      </TableCell>
                    )}
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
                                : row.branch_id === "G3"
                                ? "text-orange-600 dark:text-orange-400"
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
                    {visibleColumns.status && (
                      <TableCell className="text-center">
                        <Status status={translated} />
                        {disabled && (
                          <div className="text-[11px] text-rose-500 mt-1">
                            Không thể chuyển
                          </div>
                        )}
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
        <div className="flex justify-between items-center border-t dark:border-gray-600 px-4 py-2 bg-gray-50 dark:bg-gray-700 text-sm">
          <div className="text-gray-700 dark:text-gray-300">
            Trang {currentPage} / {totalPages} — Tổng: {filteredByColumn.length}{" "}
            thiết bị
          </div>
        </div>
      </div>
    </div>
  );
}
