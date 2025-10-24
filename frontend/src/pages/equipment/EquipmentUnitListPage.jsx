import { useEffect, useMemo, useRef, useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/buttonn";
import { exportToExcel } from "@/services/Files";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  ColumnVisibilityButton,
  HeaderFilter,
  getUniqueValues,
  useGlobalFilterController,
  getStatusVN,
} from "@/components/common/ExcelTableTools";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { toast } from "sonner";
import Status from "@/components/common/Status";
import BranchService from "@/services/branchService";
import { useEquipmentData } from "@/hooks/useEquipmentUnitData";
import { useNavigate } from "react-router-dom";
import { ArrowDownUp, Download } from "lucide-react";
import useAuthRole from "@/hooks/useAuthRole";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogFooter,
  AlertDialogCancel,
} from "@/components/ui/alert-dialog";
import EquipmentImportPage from "@/pages/equipment/EquipmentImportPage";

const ITEMS_PER_PAGE = 8;

export default function EquipmentUnitListSection() {
  // 🧠 State & hooks
  const [activeGroup, setActiveGroup] = useState("all");
  const [activeBranch, setActiveBranch] = useState("all");
  const [activeStatus, setActiveStatus] = useState("all");
  const [branches, setBranches] = useState([]);
  const [search, setSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [goToPage, setGoToPage] = useState("");
  const [newIds, setNewIds] = useState(new Set());
  const [sortNewestFirst, setSortNewestFirst] = useState(true);
  const navigate = useNavigate();
  const { isSuperAdmin } = useAuthRole();
  const [openImport, setOpenImport] = useState(false);

  // ⚙️ Dữ liệu thiết bị
  const { eqUnits, eqErr, unitLoading, cats, catErr, catLoading } =
    useEquipmentData();
  const groups = [{ id: "all", name: "Tất cả nhóm" }, ...(cats || [])];
  const units = eqUnits || [];

  // 🏢 Lấy danh sách chi nhánh
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

  // ✨ Theo dõi thiết bị mới (highlight NEW)
  const seenIdsRef = useRef(new Set());
  const initializedRef = useRef(false);

  useEffect(() => {
    if (!Array.isArray(units) || units.length === 0) return;
    const LS_KEY = "fitx_seen_unit_ids";

    if (!initializedRef.current) {
      let saved = [];
      try {
        const raw = localStorage.getItem(LS_KEY);
        saved = Array.isArray(JSON.parse(raw)) ? JSON.parse(raw) : [];
      } catch {
        saved = [];
      }

      if (saved.length > 0) {
        seenIdsRef.current = new Set(saved);
        const newOnes = units
          .map((u) => u.id)
          .filter((id) => !seenIdsRef.current.has(id));

        if (newOnes.length > 0) {
          setNewIds(new Set([...newOnes]));
          newOnes.forEach((id) => seenIdsRef.current.add(id));
          localStorage.setItem(LS_KEY, JSON.stringify([...seenIdsRef.current]));
        }
      } else {
        seenIdsRef.current = new Set(units.map((u) => u.id));
        localStorage.setItem(LS_KEY, JSON.stringify([...seenIdsRef.current]));
      }
      initializedRef.current = true;
      return;
    }

    const prev = seenIdsRef.current;
    const incoming = units.map((u) => u.id);
    const newOnes = incoming.filter((id) => !prev.has(id));

    if (newOnes.length > 0) {
      setNewIds((prev) => new Set([...prev, ...newOnes]));
      newOnes.forEach((id) => prev.add(id));
      localStorage.setItem(LS_KEY, JSON.stringify([...prev]));
      window.dispatchEvent(
        new CustomEvent("fitx-units-updated", { detail: { newIds: newOnes } })
      );
    }
  }, [units]);

  const handleHover = (id) => {
    setNewIds((prev) => {
      if (!prev.has(id)) return prev;
      const updated = new Set(prev);
      updated.delete(id);
      return updated;
    });
  };

  // ⚙️ Hiển thị cột & Filter
  const [visibleColumns, setVisibleColumns] = useState({
    id: true,
    image: true,
    name: true,
    main: true,
    type: true,
    status: true,
    description: true,
    created_at: true,
  });

  const [filters, setFilters] = useState({
    id: [],
    name: [],
    main: [],
    type: [],
    status: [],
    description: [],
  });

  const controller = useGlobalFilterController();

  const uniqueValues = useMemo(
    () => ({
      id: getUniqueValues(units, (u) => u.id),
      name: getUniqueValues(units, (u) => u.equipment?.name),
      main: getUniqueValues(units, (u) => u.equipment?.main_name),
      type: getUniqueValues(units, (u) => u.equipment?.type_name),
      description: getUniqueValues(units, (u) => u.equipment?.description),
      status: getUniqueValues(units, (u) => getStatusVN(u.status)),
    }),
    [units]
  );

  // 🔍 Lọc & Sắp xếp
  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return (units || [])
      .filter((u) => {
        const name = u.equipment?.name?.toLowerCase() || "";
        const main = u.equipment?.main_name?.toLowerCase() || "";
        const type = u.equipment?.type_name?.toLowerCase() || "";
        const id = u.id?.toLowerCase() || "";
        const statusVN = getStatusVN(u.status);
        const branchId = u.branch_id || "";

        const matchSearch =
          !q ||
          name.includes(q) ||
          type.includes(q) ||
          id.includes(q) ||
          statusVN.includes(q);

        const matchGroup = activeGroup === "all" || main === activeGroup;
        const matchBranch = activeBranch === "all" || branchId === activeBranch;
        const matchStatus = activeStatus === "all" || statusVN === activeStatus;

        const matchColumn = {
          id: filters.id.length === 0 || filters.id.includes(u.id),
          name:
            filters.name.length === 0 ||
            filters.name.includes(u.equipment?.name),
          main:
            filters.main.length === 0 ||
            filters.main.includes(u.equipment?.main_name),
          type:
            filters.type.length === 0 ||
            filters.type.includes(u.equipment?.type_name),
          status:
            filters.status.length === 0 || filters.status.includes(statusVN),
        };

        return (
          matchSearch &&
          matchGroup &&
          matchBranch &&
          matchStatus &&
          Object.values(matchColumn).every(Boolean)
        );
      })
      .sort((a, b) =>
        sortNewestFirst
          ? new Date(b.created_at) - new Date(a.created_at)
          : new Date(a.created_at) - new Date(b.created_at)
      );
  }, [
    units,
    search,
    activeGroup,
    activeBranch,
    activeStatus,
    filters,
    sortNewestFirst,
  ]);

  // 📄 Phân trang
  const totalPages = Math.max(1, Math.ceil(filtered.length / ITEMS_PER_PAGE));
  const currentData = filtered.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  if (unitLoading || catLoading)
    return <div className="p-4 animate-pulse text-gray-500">Đang tải...</div>;
  if (eqErr || catErr)
    return (
      <div className="p-4 text-red-500">Lỗi khi tải dữ liệu, thử lại sau.</div>
    );

  return (
    <div className="p-4 space-y-4 font-jakarta">
      {/* 🧩 Toolbar */}
      <div className="sticky top-0 z-20 flex flex-wrap items-center justify-between gap-3 p-3 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl shadow-sm">
        <div className="flex flex-wrap items-center gap-2">
          {/* 🏷️ Tiêu đề + Tìm kiếm */}
          <div className="flex items-center gap-2">
            <h2 className="text-base md:text-lg font-semibold text-emerald-600 mr-2">
              Danh sách chi tiết từng thiết bị
            </h2>

            <Input
              placeholder="Tìm kiếm..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setCurrentPage(1);
              }}
              className="pl-8 h-9 w-64 border-gray-300 dark:border-gray-700 text-sm"
            />
          </div>

          {/* 🏢 Chi nhánh (nếu super admin) */}
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

          {/* 🔽 Sắp xếp */}
          <Button
            onClick={() => setSortNewestFirst((p) => !p)}
            className="flex items-center gap-1 bg-emerald-500 hover:bg-emerald-600 text-white text-sm px-3"
          >
            <ArrowDownUp size={16} />
            {sortNewestFirst ? "Mới → Cũ" : "Cũ → Mới"}
          </Button>

          {/* 📦 Export Excel (đưa kế nút sắp xếp) */}
          <Button
            onClick={() => {
              if (!filtered || filtered.length === 0) {
                toast.warning("⚠️ Không có dữ liệu để xuất!");
                return;
              }

              const data = filtered.map((u) => ({
                ID: u.id,
                "Tên thiết bị": u.equipment?.name,
                Nhóm: u.equipment?.main_name,
                Loại: u.equipment?.type_name,
                "Trạng thái": getStatusVN(u.status),
                "Mô tả": u.equipment?.description || "",
                "Ngày nhập": new Date(u.created_at).toLocaleDateString("vi-VN"),
              }));

              exportToExcel(data, "Danh_sach_thiet_bi");
              toast.success(`✅ Đã xuất ${data.length} bản ghi ra Excel!`);
            }}
            className="flex items-center gap-2 h-9 rounded-lg border border-gray-200 bg-white text-gray-700 font-medium shadow-sm hover:border-emerald-400 hover:text-emerald-600 hover:bg-emerald-50 hover:-translate-y-[1px] transition-all duration-200"
          >
            <Download className="w-4 h-4" />
            Export Excel
          </Button>
        </div>

        {/* 📥 Nút Nhập thiết bị + Hiển thị cột */}
        <div className="flex items-center gap-3">
          <Button
            onClick={() => setOpenImport(true)}
            className="flex items-center gap-2 h-9 px-4 bg-gradient-to-r from-emerald-500 to-green-600 text-white font-medium rounded-lg shadow hover:opacity-90 hover:-translate-y-[1px] transition-all"
          >
            📥 Nhập thiết bị
          </Button>

          <ColumnVisibilityButton
            visibleColumns={visibleColumns}
            setVisibleColumns={setVisibleColumns}
            labels={{
              id: "Mã định danh thiết bị",
              image: "Hình ảnh",
              name: "Tên thiết bị",
              main: "Nhóm",
              type: "Loại",
              status: "Trạng thái",
              description: "Mô tả",
              created_at: "Ngày nhập",
            }}
          />
        </div>
      </div>

      {/* 📊 Bảng dữ liệu */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md overflow-hidden">
        <div className="overflow-x-auto">
          <Table className="border border-gray-200 dark:border-gray-700">
            <TableHeader>
              <TableRow className="bg-gray-100 dark:bg-gray-700 text-sm font-semibold">
                <TableHead className="text-center border dark:border-gray-600">
                  #
                </TableHead>

                {visibleColumns.id && (
                  <TableHead className="border dark:border-gray-600">
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

                {visibleColumns.image && (
                  <TableHead className="border dark:border-gray-600 text-center">
                    Hình ảnh
                  </TableHead>
                )}

                {visibleColumns.name && (
                  <TableHead className="border dark:border-gray-600">
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

                {visibleColumns.main && (
                  <TableHead className="border dark:border-gray-600">
                    <HeaderFilter
                      selfKey="main"
                      label="Nhóm"
                      values={uniqueValues.main}
                      selected={filters.main}
                      onChange={(v) => setFilters((p) => ({ ...p, main: v }))}
                      controller={controller}
                    />
                  </TableHead>
                )}

                {visibleColumns.type && (
                  <TableHead className="border dark:border-gray-600">
                    <HeaderFilter
                      selfKey="type"
                      label="Loại"
                      values={uniqueValues.type}
                      selected={filters.type}
                      onChange={(v) => setFilters((p) => ({ ...p, type: v }))}
                      controller={controller}
                    />
                  </TableHead>
                )}

                {visibleColumns.status && (
                  <TableHead className="border dark:border-gray-600 text-center">
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

                {visibleColumns.description && (
                  <TableHead className="border dark:border-gray-600">
                    Mô tả
                  </TableHead>
                )}

                {visibleColumns.created_at && (
                  <TableHead className="border dark:border-gray-600 text-center">
                    Ngày nhập
                  </TableHead>
                )}
              </TableRow>
            </TableHeader>

            <TableBody>
              {currentData.map((row, idx) => {
                const isNew = newIds.has(row.id);
                return (
                  <tr
                    key={row.id}
                    onMouseEnter={() => handleHover(row.id)}
                    onClick={() => navigate(`/app/equipment/${row.id}`)}
                    className={`text-sm transition cursor-pointer ${
                      isNew
                        ? "bg-emerald-50 dark:bg-emerald-800/30 animate-pulse"
                        : "hover:bg-gray-50 dark:hover:bg-gray-700"
                    }`}
                  >
                    <TableCell className="text-center">
                      {(currentPage - 1) * ITEMS_PER_PAGE + idx + 1}
                    </TableCell>

                    {visibleColumns.id && (
                      <TableCell className="relative font-medium">
                        {row.id}
                        {isNew && (
                          <span className="ml-2 px-1.5 py-0.5 text-[10px] font-semibold text-white bg-emerald-500 rounded shadow-sm animate-pulse">
                            NEW
                          </span>
                        )}
                      </TableCell>
                    )}

                    {visibleColumns.image && (
                      <TableCell className="text-center">
                        <img
                          src={row.equipment?.image}
                          alt={row.equipment?.name}
                          className="inline-block w-12 h-10 object-contain rounded"
                        />
                      </TableCell>
                    )}

                    {visibleColumns.name && (
                      <TableCell>
                        <span className="font-semibold text-gray-800 dark:text-gray-100">
                          {row.equipment?.name}
                        </span>
                      </TableCell>
                    )}

                    {visibleColumns.main && (
                      <TableCell>{row.equipment?.main_name}</TableCell>
                    )}

                    {visibleColumns.type && (
                      <TableCell>{row.equipment?.type_name}</TableCell>
                    )}

                    {visibleColumns.status && (
                      <TableCell className="text-center">
                        <Status status={getStatusVN(row.status)} />
                      </TableCell>
                    )}

                    {visibleColumns.description && (
                      <TableCell>
                        <span className="line-clamp-2 text-gray-700 dark:text-gray-300">
                          {row.equipment?.description || "—"}
                        </span>
                      </TableCell>
                    )}

                    {visibleColumns.created_at && (
                      <TableCell className="text-center">
                        {new Date(row.created_at).toLocaleString("vi-VN")}
                      </TableCell>
                    )}
                  </tr>
                );
              })}
            </TableBody>
          </Table>
        </div>

        {/* 📦 Pagination */}
        <div className="flex justify-between items-center border-t dark:border-gray-600 px-4 py-2 bg-gray-50 dark:bg-gray-700">
          <div className="flex items-center gap-2 text-sm">
            <span className="dark:text-gray-200">Đi đến:</span>
            <input
              type="number"
              min={1}
              max={totalPages}
              className="w-14 px-2 py-1 border rounded text-sm dark:bg-gray-700 dark:text-gray-100 dark:border-gray-600"
              value={goToPage}
              onChange={(e) => setGoToPage(e.target.value)}
            />
            <Button
              size="sm"
              onClick={() => {
                let page = parseInt(goToPage);
                if (isNaN(page)) return;
                if (page < 1) page = 1;
                if (page > totalPages) page = totalPages;
                setCurrentPage(page);
              }}
              className="bg-emerald-500 hover:bg-emerald-600 text-white text-xs px-3 py-1"
            >
              Go
            </Button>
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
              onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
              className="dark:border-gray-600 dark:text-gray-200"
            >
              »
            </Button>
          </div>
        </div>
      </div>

      <AlertDialog open={openImport} onOpenChange={setOpenImport}>
        <AlertDialogContent
          className="
      !max-w-none w-[85vw] max-w-[1200px] h-[90vh]
      overflow-hidden flex flex-col
      bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700
      rounded-2xl shadow-2xl p-0 focus:outline-none
    "
        >
          {/* Header cố định */}
          <AlertDialogHeader className="flex-shrink-0 sticky top-0 z-10 bg-white/90 dark:bg-gray-900/90 backdrop-blur border-b px-6 py-4">
            <AlertDialogTitle className="text-emerald-600 text-xl font-bold">
              Nhập thiết bị vào kho
            </AlertDialogTitle>
            <p className="text-gray-500 dark:text-gray-400 text-sm">
              Chọn nhà cung cấp, loại thiết bị và xác nhận nhập hàng
            </p>
          </AlertDialogHeader>

          {/* Body hiển thị nội dung import */}
          <div className="flex-1 overflow-y-auto px-6 py-4">
            <EquipmentImportPage />
          </div>

          {/* Footer */}
          <AlertDialogFooter className="flex-shrink-0 sticky bottom-0 z-10 bg-white/90 dark:bg-gray-900/90 backdrop-blur border-t px-6 py-4 flex justify-end gap-3">
            <AlertDialogCancel className="bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700">
              Đóng
            </AlertDialogCancel>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
