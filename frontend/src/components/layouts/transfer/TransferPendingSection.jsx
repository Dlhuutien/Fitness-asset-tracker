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
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

import EquipmentTransferService from "@/services/equipmentTransferService";
import BranchService from "@/services/branchService";
import Branch from "@/components/common/Branch";
import useAuthRole from "@/hooks/useAuthRole";

const ITEMS_PER_PAGE = 8;

const STATUS_BADGE = {
  pending: "Đang vận chuyển",
  completed: "Đã hoàn tất",
};
const UNIT_STATUS_LABELS = {
  "In Stock": "Trong kho",
  Moving: "Đang vận chuyển",
  Active: "Hoạt động",
  Inactive: "Ngưng sử dụng",
};

export default function TransferPendingSection() {
  const [transfers, setTransfers] = useState([]);
  const [filtered, setFiltered] = useState([]);

  const [branches, setBranches] = useState([]);
  const [search, setSearch] = useState("");
  const [activeBranch, setActiveBranch] = useState("all"); // filter by from/to?

  const [selected, setSelected] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [completing, setCompleting] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [refreshing, setRefreshing] = useState(false);
  const { isSuperAdmin, branchId } = useAuthRole();

  // excel tools
  const controller = useGlobalFilterController();
  const [filters, setFilters] = useState({
    id: [],
    from_branch_id: [],
    to_branch_id: [],
    status: [],
  });
  const [visibleColumns, setVisibleColumns] = useState({
    id: true,
    from_branch_id: true,
    to_branch_id: true,
    status: true,
    move_start_date: true,
  });

  const loadData = async (isRefresh = false) => {
    try {
      if (!isRefresh) setLoading(true);
      else setRefreshing(true);

      const [t, b] = await Promise.all([
        EquipmentTransferService.getAll(),
        BranchService.getAll(),
      ]);
      const list = (t || []).filter(
        (x) => (x.status || "").toLowerCase() !== "completed"
      );
      setTransfers(list);
      setFiltered(list);
      setBranches(b || []);
    } catch (e) {
      console.error(e);
      toast.error("Không thể tải danh sách phiếu vận chuyển.");
    } finally {
      if (!isRefresh) setLoading(false);
      else setRefreshing(false);
    }
  };

  useEffect(() => {
    (async () => {
      await loadData();
    })();
  }, []);

  // Search + branch filter
  useEffect(() => {
    const q = search.trim().toLowerCase();
    const f = (transfers || []).filter((t) => {
      const matchSearch =
        !q ||
        t.id.toLowerCase().includes(q) ||
        (t.description || "").toLowerCase().includes(q) ||
        (t.details || [])
          .map((d) => d.equipment_unit_id)
          .join(",")
          .toLowerCase()
          .includes(q);

      const matchBranch =
        activeBranch === "all" ||
        t.from_branch_id === activeBranch ||
        t.to_branch_id === activeBranch;

      return matchSearch && matchBranch;
    });
    setFiltered(f);
    setCurrentPage(1);
  }, [search, activeBranch, transfers]);

  // excel unique values
  const uniqueValues = useMemo(
    () => ({
      id: getUniqueValues(filtered, (e) => e.id),
      from_branch_id: getUniqueValues(filtered, (e) => e.from_branch_id),
      to_branch_id: getUniqueValues(filtered, (e) => e.to_branch_id),
      status: getUniqueValues(filtered, (e) => e.status),
    }),
    [filtered]
  );

  // column filters
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
          case "from_branch_id":
            v = e.from_branch_id;
            break;
          case "to_branch_id":
            v = e.to_branch_id;
            break;
          case "status":
            v = e.status;
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

  const handleComplete = async (transfer) => {
    try {
      setCompleting(true);
      const dateValue = transfer.move_receive_date || new Date().toISOString();

      await EquipmentTransferService.complete(transfer.id, dateValue);
      toast.success("✅ Đã xác nhận hoàn tất vận chuyển!");

      // 🧠 Đóng card trước — để tránh mất thông báo khi re-render
      setSelected(null);

      // ✅ Đặt thông báo sau khi đóng card
      setSuccessMsg("✅ Đã xác nhận hoàn tất vận chuyển!");
      setErrorMsg("");

      // Reload lại dữ liệu (refresh ngầm)
      await loadData(true);

      // ⏳ Ẩn thông báo sau 5s
      setTimeout(() => setSuccessMsg(""), 5000);
    } catch (e) {
      console.error(e);
      toast.error(e?.error || "Xác nhận hoàn tất thất bại.");

      // 🧠 Đóng card trước — để luôn thấy lỗi
      setSelected(null);

      setErrorMsg("❌ Xác nhận thất bại, vui lòng thử lại!");
      setSuccessMsg("");

      setTimeout(() => setErrorMsg(""), 5000);
    } finally {
      setCompleting(false);
    }
  };

  if (loading && !refreshing)
    return (
      <div className="p-6 text-gray-500 dark:text-gray-300 animate-pulse">
        Đang tải phiếu vận chuyển...
      </div>
    );

  return (
    <div className="space-y-4">
      {/* Toolbar ngang */}
      <div className="flex flex-wrap justify-between items-center gap-3 p-3 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl shadow-sm">
        <div className="flex flex-wrap items-center gap-2">
          <Input
            placeholder="🔍 Tìm mã phiếu, mô tả hoặc mã unit..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="h-9 w-72 border-gray-300 dark:border-gray-700 focus:ring-2 focus:ring-emerald-400 text-sm"
          />

          <Select
            onValueChange={(v) => {
              setActiveBranch(v);
              setCurrentPage(1);
            }}
            defaultValue="all"
          >
            <SelectTrigger className="h-9 w-44 border-gray-300 dark:border-gray-700 text-sm bg-gray-50 dark:bg-gray-800 focus:ring-emerald-400 transition">
              <SelectValue placeholder="Lọc theo chi nhánh" />
            </SelectTrigger>
            <SelectContent className="z-[9999] bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 shadow-md rounded-md">
              <SelectItem value="all" className="text-sm">
                Tất cả
              </SelectItem>
              {branches.map((b) => (
                <SelectItem key={b.id} value={b.id} className="text-sm">
                  {b.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <ColumnVisibilityButton
          visibleColumns={visibleColumns}
          setVisibleColumns={setVisibleColumns}
          labels={{
            id: "Mã phiếu",
            from_branch_id: "Từ chi nhánh",
            to_branch_id: "Đến chi nhánh",
            status: "Trạng thái",
            move_start_date: "Bắt đầu",
          }}
        />
      </div>

      {/* Bảng */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md overflow-hidden">
        <div className="overflow-x-auto">
          <Table className="min-w-[900px] border border-gray-200 dark:border-gray-700">
            <TableHeader>
              <TableRow className="bg-gray-100 dark:bg-gray-700 text-sm font-semibold">
                <TableHead>#</TableHead>
                {visibleColumns.id && (
                  <TableHead>
                    <HeaderFilter
                      selfKey="id"
                      label="Mã phiếu"
                      values={uniqueValues.id}
                      selected={filters.id}
                      onChange={(v) => setFilters((p) => ({ ...p, id: v }))}
                      controller={controller}
                    />
                  </TableHead>
                )}
                {visibleColumns.from_branch_id && (
                  <TableHead>
                    <HeaderFilter
                      selfKey="from_branch_id"
                      label="Từ chi nhánh"
                      values={uniqueValues.from_branch_id}
                      selected={filters.from_branch_id}
                      onChange={(v) =>
                        setFilters((p) => ({ ...p, from_branch_id: v }))
                      }
                      controller={controller}
                    />
                  </TableHead>
                )}
                {visibleColumns.to_branch_id && (
                  <TableHead>
                    <HeaderFilter
                      selfKey="to_branch_id"
                      label="Đến chi nhánh"
                      values={uniqueValues.to_branch_id}
                      selected={filters.to_branch_id}
                      onChange={(v) =>
                        setFilters((p) => ({ ...p, to_branch_id: v }))
                      }
                      controller={controller}
                    />
                  </TableHead>
                )}
                {visibleColumns.status && (
                  <TableHead>
                    <HeaderFilter
                      selfKey="status"
                      label="Trạng thái"
                      values={uniqueValues.status}
                      selected={filters.status}
                      onChange={(v) => setFilters((p) => ({ ...p, status: v }))}
                      controller={controller}
                    />
                  </TableHead>
                )}
                {visibleColumns.move_start_date && (
                  <TableHead>Bắt đầu</TableHead>
                )}
              </TableRow>
            </TableHeader>

            <TableBody>
              {currentData.map((row, idx) => {
                const label =
                  STATUS_BADGE[row.status?.toLowerCase()] || row.status;
                return (
                  <TableRow
                    key={row.id}
                    onClick={() => setSelected(row)}
                    className={`cursor-pointer transition ${
                      selected?.id === row.id
                        ? "bg-emerald-50 dark:bg-emerald-900/30"
                        : "hover:bg-gray-50 dark:hover:bg-gray-700"
                    }`}
                  >
                    <TableCell className="text-center">
                      {(currentPage - 1) * ITEMS_PER_PAGE + idx + 1}
                    </TableCell>
                    {visibleColumns.id && <TableCell>{row.id}</TableCell>}
                    {visibleColumns.from_branch_id && (
                      <TableCell>
                        <Branch id={row.from_branch_id} />
                      </TableCell>
                    )}
                    {visibleColumns.to_branch_id && (
                      <TableCell>
                        <Branch id={row.to_branch_id} />
                      </TableCell>
                    )}
                    {visibleColumns.status && (
                      <TableCell>
                        <Status status={label} />
                      </TableCell>
                    )}
                    {visibleColumns.move_start_date && (
                      <TableCell>
                        {row.move_start_date
                          ? new Date(row.move_start_date).toLocaleString(
                              "vi-VN"
                            )
                          : "—"}
                      </TableCell>
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
            phiếu
          </div>
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
              disabled={currentPage === 1}
              className="dark:border-gray-600 dark:text-gray-200 disabled:opacity-50"
            >
              «
            </Button>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
              <button
                key={page}
                onClick={() => setCurrentPage(page)}
                className={`w-8 h-8 flex items-center justify-center rounded-md border text-sm font-medium transition-all
                ${
                  currentPage === page
                    ? "bg-emerald-500 text-white border-emerald-500"
                    : "bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700"
                }`}
              >
                {page}
              </button>
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

      {/* Card chi tiết + nút hoàn tất */}
      {selected && (
        <div className="bg-white dark:bg-[#1e1e1e] shadow-lg rounded-2xl p-6 border border-gray-200 dark:border-gray-700 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">Chi tiết phiếu</h3>
            <Status
              status={
                STATUS_BADGE[selected.status?.toLowerCase()] || selected.status
              }
            />
          </div>

          <div className="text-sm grid md:grid-cols-2 gap-2">
            <p>
              <b>Mã phiếu:</b> {selected.id}
            </p>
            <p className="flex items-center gap-2">
              <b>Từ:</b> <Branch id={selected.from_branch_id} />
              <span className="text-gray-500">→</span>
              <b>Đến:</b> <Branch id={selected.to_branch_id} />
            </p>

            <p className="md:col-span-2">
              <b>Mô tả:</b> {selected.description || "—"}
            </p>
            <p>
              <b>Bắt đầu:</b>{" "}
              {selected.move_start_date
                ? new Date(selected.move_start_date).toLocaleString("vi-VN")
                : "—"}
            </p>
          </div>

          <div className="border rounded-lg overflow-hidden">
            <div className="bg-gray-50 dark:bg-gray-800 px-3 py-2 text-sm font-medium">
              Danh sách thiết bị
            </div>
            <div className="max-h-64 overflow-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-100 dark:bg-gray-900 sticky top-0">
                  <tr>
                    <th className="p-2 text-left">Mã thiết bị</th>
                    <th className="p-2 text-left">Tên thiết bị</th>
                    <th className="p-2 text-left">Trạng thái</th>
                    <th className="p-2 text-left">Chi nhánh hiện tại</th>
                  </tr>
                </thead>
                <tbody>
                  {(selected.details || []).map((d) => (
                    <tr
                      key={d.id}
                      className="border-t hover:bg-gray-50 dark:hover:bg-gray-700 transition"
                    >
                      <td className="p-2 font-medium text-gray-900 dark:text-gray-100">
                        {d.equipment_unit_id}
                      </td>
                      <td className="p-2 text-gray-700 dark:text-gray-300">
                        {d.equipment_unit?.equipment_name || "—"}
                      </td>
                      <td className="p-2">
                        <Status
                          status={
                            UNIT_STATUS_LABELS[d.equipment_unit?.status] ||
                            d.equipment_unit?.status ||
                            "—"
                          }
                        />
                      </td>
                      <td className="p-2">
                        <Branch id={d.equipment_unit?.branch_id} />
                      </td>
                    </tr>
                  ))}
                  {(!selected.details || selected.details.length === 0) && (
                    <tr>
                      <td className="p-2 text-gray-500" colSpan={4}>
                        Không có thiết bị trong phiếu.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Ngày hoàn tất + Nút hoàn tất */}
          {(isSuperAdmin ||
            selected.to_branch_id === branchId) && (
            <div className="space-y-3">
              <div>
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Ngày hoàn tất vận chuyển:
                </label>
                <input
                  type="datetime-local"
                  value={selected.move_receive_date || ""}
                  min={
                    selected.move_start_date
                      ? new Date(selected.move_start_date)
                          .toISOString()
                          .slice(0, 16) // ✅ ISO → yyyy-MM-ddTHH:mm
                      : undefined
                  }
                  onChange={(e) =>
                    setSelected((prev) => ({
                      ...prev,
                      move_receive_date: e.target.value,
                    }))
                  }
                  className="mt-1 w-full border border-gray-300 dark:border-gray-700 rounded-md px-3 py-2 text-sm bg-gray-50 dark:bg-gray-900 focus:ring-2 focus:ring-emerald-400 focus:border-emerald-400 outline-none"
                />
                {selected.move_start_date && (
                  <p className="text-xs text-gray-500 mt-1">
                    Ngày bắt đầu:{" "}
                    {new Date(selected.move_start_date).toLocaleString("vi-VN")}
                  </p>
                )}
              </div>

              <Button
                onClick={() =>
                  handleComplete({
                    id: selected.id,
                    move_receive_date:
                      selected.move_receive_date || new Date().toISOString(),
                  })
                }
                disabled={completing}
                className="w-full flex items-center justify-center bg-emerald-600 hover:bg-emerald-700 text-white"
              >
                {completing ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Đang xác nhận...
                  </>
                ) : (
                  "✅ Đã vận chuyển thành công"
                )}
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
