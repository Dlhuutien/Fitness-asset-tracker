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
import { Loader2, Trash2 } from "lucide-react";
import { toast } from "sonner";

import EquipmentUnitService from "@/services/equipmentUnitService";
import EquipmentDisposalService from "@/services/EquipmentDisposalService";
import BranchService from "@/services/branchService";
import useAuthRole from "@/hooks/useAuthRole";
import Branch from "@/components/common/Branch";

const ITEMS_PER_PAGE = 8;

const STATUS_MAP = {
  active: "Hoạt động",
  "in stock": "Thiết bị trong kho",
  inactive: "Ngưng hoạt động",
  disposed: "Đã thanh lý",
};

export default function EquipmentDisposalPage() {
  const [units, setUnits] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [branches, setBranches] = useState([]);
  const [activeBranch, setActiveBranch] = useState("");
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState({});
  const [note, setNote] = useState("");
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const { isSuperAdmin, branchId } = useAuthRole();
  const [successMsg, setSuccessMsg] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

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
          EquipmentUnitService.getByStatusGroup(["In Stock", "Inactive"]),
          BranchService.getAll(),
        ]);
        setUnits(u || []);
        setFiltered(u || []);
        setBranches(b || []);
        if (b?.length > 0) setActiveBranch(b[0].id);
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
      const matchBranch = !activeBranch || u.branch_id === activeBranch;
      return matchSearch && matchBranch;
    });
    setFiltered(f);
    setCurrentPage(1);
  }, [search, activeBranch, units]);

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
    return filtered.filter((e) =>
      Object.keys(filters).every((key) => {
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
        }
        return vals.includes(v);
      })
    );
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
    if (row.status?.toLowerCase() === "disposed") {
      toast.warning("Thiết bị này đã được thanh lý.");
      return;
    }

    // ✅ Nếu đã có thiết bị được chọn, chỉ cho chọn thêm cùng chi nhánh
    const currentSelected = Object.values(selected);
    if (currentSelected.length > 0) {
      const selectedBranch = currentSelected[0].branch_id;
      if (row.branch_id !== selectedBranch) {
        toast.warning(
          `Chỉ được chọn thiết bị cùng chi nhánh (${selectedBranch})!`
        );
        return;
      }
    }

    setSelected((prev) => {
      const next = { ...prev };
      if (next[row.id]) delete next[row.id];
      else next[row.id] = { ...row, value_recovered: 0 };
      return next;
    });
  };

  const handleValueChange = (id, value) => {
    setSelected((prev) => ({
      ...prev,
      [id]: { ...prev[id], value_recovered: Number(value) || 0 },
    }));
  };

  const selectedItems = Object.values(selected);
  const totalValue = selectedItems.reduce(
    (sum, i) => sum + (i.value_recovered || 0),
    0
  );

  // ===== Gửi yêu cầu tạo thanh lý =====
  const handleCreateDisposal = async () => {
    if (selectedItems.length === 0) {
      toast.info("Hãy chọn ít nhất một thiết bị để thanh lý.");
      return;
    }
    if (!note.trim()) {
      toast.info("Vui lòng nhập ghi chú cho đợt thanh lý.");
      return;
    }

    try {
      setCreating(true);
      const items = selectedItems.map((u) => ({
        equipment_unit_id: u.id,
        value_recovered: u.value_recovered || 0,
      }));

      await EquipmentDisposalService.create({
        branch_id: isSuperAdmin ? activeBranch : branchId,
        note,
        items,
      });

      toast.success("✅ Đã tạo đợt thanh lý thành công!");
      setSuccessMsg("✅ Đã tạo đợt thanh lý thành công!");
      setErrorMsg("");

      const disposedIds = items.map((i) => i.equipment_unit_id);
      setUnits((prev) => prev.filter((u) => !disposedIds.includes(u.id)));
      setFiltered((prev) => prev.filter((u) => !disposedIds.includes(u.id)));
      setSelected({});
      setNote("");

      setTimeout(() => setSuccessMsg(""), 5000);
    } catch (err) {
      toast.error(err?.error || "Không thể tạo đợt thanh lý.");
      setErrorMsg("❌ Không thể tạo đợt thanh lý, vui lòng thử lại!");
      setSuccessMsg("");
      setTimeout(() => setErrorMsg(""), 5000);
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
              disabled={selectedItems.length > 0}
            >
              <SelectTrigger
                className={`h-9 w-48 text-sm bg-gray-50 dark:bg-gray-800 border-gray-300 dark:border-gray-700 
        ${selectedItems.length > 0 ? "opacity-60 cursor-not-allowed" : ""}
      `}
              >
                <SelectValue placeholder="Chi nhánh" />
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
          {selectedItems.length > 0 && (
            <p className="text-xs text-gray-500 italic ml-1">
              (Không thể đổi chi nhánh khi đã chọn thiết bị)
            </p>
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

      {/* ===== Ghi chú + tạo đợt thanh lý ===== */}
      <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl p-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <Input
            placeholder="📝 Ghi chú đợt thanh lý (ví dụ: Thanh lý thiết bị hư 19/10)"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            className="flex-1 h-9 text-sm"
          />
          <div className="text-sm text-gray-600">
            Tổng giá trị thu hồi:{" "}
            <b className="text-emerald-600">
              {totalValue.toLocaleString("vi-VN")}₫
            </b>
          </div>
          <Button
            onClick={handleCreateDisposal}
            disabled={creating}
            className="bg-rose-500 hover:bg-rose-600 text-white flex items-center"
          >
            {creating ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" /> Đang tạo...
              </>
            ) : (
              <>
                <Trash2 className="w-4 h-4 mr-2" />
                Tạo đơn thanh lý
              </>
            )}
          </Button>
        </div>

        {/* 🧩 Thông báo (hiện ngay dưới nút, full width, không lệch flex) */}
        {(successMsg || errorMsg) && (
          <div className="mt-3">
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
      </div>

      {/* ===== Card hiển thị thiết bị đang chọn ===== */}
      {selectedItems.length > 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md border border-gray-200 dark:border-gray-700 p-4">
          <div className="flex items-center gap-2 mb-3">
            <Trash2 className="text-rose-500" />
            <h2 className="text-lg font-semibold text-rose-600">
              Thiết bị được chọn để thanh lý ({selectedItems.length})
            </h2>
            <Button
              onClick={() => setSelected({})}
              className="ml-auto bg-gray-500 hover:bg-gray-600 text-white text-sm px-3 py-1"
            >
              Bỏ chọn tất cả
            </Button>
          </div>

          <Table className="min-w-[800px] border">
            <TableHeader>
              <TableRow className="bg-rose-50 dark:bg-gray-700 text-sm font-semibold">
                <TableHead>#</TableHead>
                <TableHead>Mã thiết bị</TableHead>
                <TableHead>Tên thiết bị</TableHead>
                <TableHead>Trạng thái</TableHead>
                <TableHead>Chi nhánh</TableHead>
                <TableHead>Giá gốc (vn₫)</TableHead>
                <TableHead>Giá trị thu hồi (vn₫)</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {selectedItems.map((item, i) => (
                <TableRow key={item.id} className="text-sm">
                  <TableCell>{i + 1}</TableCell>
                  <TableCell>{item.id}</TableCell>
                  {visibleColumns.name && (
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <span
                          className={`
                    font-semibold truncate max-w-[220px]
                    ${
                      item.branch_id === "GV"
                        ? "text-emerald-600 dark:text-emerald-400"
                        : item.branch_id === "Q3"
                        ? "text-orange-600 dark:text-orange-400"
                        : "text-gray-800 dark:text-gray-200"
                    }
                  `}
                        >
                          {item.equipment?.name}
                        </span>
                      </div>
                    </TableCell>
                  )}
                  <TableCell>
                    <Status
                      status={
                        STATUS_MAP[item.status?.toLowerCase()] || item.status
                      }
                    />
                  </TableCell>
                  <TableCell>{item.branch_id}</TableCell>
                  <TableCell className="text-right font-medium text-gray-700 dark:text-gray-200">
                    {item.cost?.toLocaleString("vi-VN") || "—"}
                  </TableCell>
                  <TableCell>
                    <Input
                      type="text"
                      inputMode="numeric"
                      placeholder="0"
                      value={
                        item.value_recovered
                          ? item.value_recovered.toLocaleString("vi-VN")
                          : ""
                      }
                      onChange={(e) => {
                        // Loại bỏ mọi ký tự không phải số
                        const raw = e.target.value.replace(/\D/g, "");
                        // Cập nhật state gốc bằng số thật
                        handleValueChange(item.id, raw ? Number(raw) : 0);
                      }}
                      onBlur={(e) => {
                        // Khi blur, tự format lại có dấu chấm
                        const raw = e.target.value.replace(/\D/g, "");
                        const formatted = raw
                          ? Number(raw).toLocaleString("vi-VN")
                          : "";
                        e.target.value = formatted;
                      }}
                      className="w-36 h-8 text-right"
                    />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {/* ===== Danh sách thiết bị ===== */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md overflow-hidden">
        <div className="overflow-x-auto">
          <Table className="min-w-[1000px] border border-gray-200 dark:border-gray-700">
            <TableHeader>
              <TableRow className="bg-gray-100 dark:bg-gray-700 text-sm font-semibold">
                <TableHead>#</TableHead>
                {visibleColumns.select && (
                  <TableHead className="text-rose-600 font-bold text-center">
                    Chọn
                  </TableHead>
                )}
                {Object.entries(visibleColumns).map(([key, visible]) => {
                  if (!visible || key === "select") return null;
                  const columnLabels = {
                    id: "Mã Unit",
                    image: "Ảnh",
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
                          label={columnLabels[key]}
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
                const isChecked = !!selected[row.id];
                return (
                  <TableRow
                    key={row.id}
                    className={`transition ${
                      isChecked
                        ? "bg-rose-50 dark:bg-rose-900/30"
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
                          checked={isChecked}
                          onChange={() => toggleSelect(row)}
                          className="w-5 h-5 accent-rose-500 hover:scale-110 transition-transform"
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

        {/* ===== Pagination ===== */}
        <div className="flex justify-between items-center border-t dark:border-gray-600 px-4 py-2 bg-gray-50 dark:bg-gray-700">
          <div className="text-sm text-gray-700 dark:text-gray-300">
            Tổng cộng: {filteredByColumn.length} thiết bị
          </div>
          <div className="flex gap-1">
            <Button
              size="sm"
              variant="outline"
              onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
              disabled={currentPage === 1}
              className="dark:border-gray-600 dark:text-gray-200 disabled:opacity-50"
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
              onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
              disabled={currentPage === totalPages}
              className="dark:border-gray-600 dark:text-gray-200 disabled:opacity-50"
            >
              »
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
