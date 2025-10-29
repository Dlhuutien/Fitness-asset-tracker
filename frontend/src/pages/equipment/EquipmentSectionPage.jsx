import { useMemo, useState } from "react";
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
import { ArrowDownUp, Plus, Download } from "lucide-react";
import { useEquipmentData } from "@/hooks/useEquipmentData";
import {
  HeaderFilter,
  ColumnVisibilityButton,
  useGlobalFilterController,
  getUniqueValues,
} from "@/components/common/ExcelTableTools";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { exportToExcel } from "@/services/Files";
import EquipmentAddCardPage from "@/pages/equipment/EquipmentAddCardPage";
import { useRef } from "react";
import useAuthRole from "@/hooks/useAuthRole";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

const ITEMS_PER_PAGE = 8;

export default function EquipmentSectionPage() {
  const [activeGroup, setActiveGroup] = useState("all");
  const [search, setSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [goToPage, setGoToPage] = useState("");
  const [sortNewestFirst, setSortNewestFirst] = useState(true);
  const [highlightedId, setHighlightedId] = useState(null);
  const [openAddCard, setOpenAddCard] = useState(false);
  const navigate = useNavigate();
  const [loadingSubmit, setLoadingSubmit] = useState(false);
  const { isTechnician } = useAuthRole();

  const { groups, groupErr, groupLoading, equipments, eqErr, eqLoading } =
    useEquipmentData();

  const controller = useGlobalFilterController();

  const [visibleColumns, setVisibleColumns] = useState({
    id: true,
    image: true,
    name: true,
    main: true,
    type: true,
    created_at: true,
  });

  const [filters, setFilters] = useState({
    id: [],
    name: [],
    main: [],
    type: [],
  });

  const uniqueValues = useMemo(
    () => ({
      id: getUniqueValues(equipments, (u) => u.id),
      name: getUniqueValues(equipments, (u) => u.name),
      main: getUniqueValues(equipments, (u) => u.main_name),
      type: getUniqueValues(equipments, (u) => u.type_name),
    }),
    [equipments]
  );
  const addCardRef = useRef();

  const filteredData = useMemo(() => {
    const q = search.trim().toLowerCase();
    return (equipments || [])
      .filter((d) => {
        const name = d.name?.toLowerCase() || "";
        const main = d.main_name?.toLowerCase() || "";
        const type = d.type_name?.toLowerCase() || "";
        const id = d.id?.toLowerCase() || "";

        const matchSearch =
          !q || name.includes(q) || type.includes(q) || id.includes(q);

        const matchGroup = activeGroup === "all" || d.main_name === activeGroup;

        const matchColumn = {
          id: filters.id.length === 0 || filters.id.includes(d.id),
          name: filters.name.length === 0 || filters.name.includes(d.name),
          main: filters.main.length === 0 || filters.main.includes(d.main_name),
          type: filters.type.length === 0 || filters.type.includes(d.type_name),
        };

        return (
          matchSearch && matchGroup && Object.values(matchColumn).every(Boolean)
        );
      })
      .sort((a, b) =>
        sortNewestFirst
          ? new Date(b.created_at) - new Date(a.created_at)
          : new Date(a.created_at) - new Date(b.created_at)
      );
  }, [equipments, search, activeGroup, filters, sortNewestFirst]);

  const totalPages = Math.max(
    1,
    Math.ceil(filteredData.length / ITEMS_PER_PAGE)
  );
  const currentData = filteredData.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  if (groupLoading || eqLoading)
    return (
      <div className="p-4 animate-pulse text-gray-500">Đang tải dữ liệu...</div>
    );
  if (groupErr || eqErr)
    return (
      <div className="p-4 text-red-500">Lỗi khi tải dữ liệu, thử lại sau.</div>
    );

  const handleAddSuccess = (newEquipment) => {
    if (!newEquipment?.id) return;
    setOpenAddCard(false);
    setHighlightedId(newEquipment.id);
    setTimeout(() => {
      document.getElementById(`equipment-${newEquipment.id}`)?.scrollIntoView({
        behavior: "smooth",
        block: "center",
      });
    }, 200);
    setTimeout(() => setHighlightedId(null), 30000);
  };
  const handleCreateClick = () => {
    const isValid = addCardRef.current?.validateAll?.();
    if (!isValid) {
      toast.error("⚠️ Vui lòng kiểm tra lại các trường bị lỗi!");
      return;
    }
    const form = document.querySelector("form");
    form?.requestSubmit();
  };

  return (
    <div className="p-4 space-y-4 font-jakarta">
      {/* ==== Toolbar ==== */}
      <div className="sticky top-0 z-10 flex flex-wrap items-center justify-between gap-3 p-3 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl shadow-sm">
        <div className="flex items-center gap-2">
          <h2 className="text-base md:text-lg font-semibold text-emerald-600 mr-2">
            Danh sách dòng thiết bị
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

          <Button
            onClick={() => setSortNewestFirst((p) => !p)}
            className="flex items-center gap-1 bg-emerald-500 hover:bg-emerald-600 text-white text-sm px-3"
          >
            <ArrowDownUp size={16} />
            {sortNewestFirst ? "Mới → Cũ" : "Cũ → Mới"}
          </Button>

          <Button
            onClick={() => {
              if (!filteredData || filteredData.length === 0) {
                toast.warning("⚠️ Không có dữ liệu để xuất!");
                return;
              }
              const data = filteredData.map((d) => ({
                "Mã phân loại dòng thiết bị": d.id,
                "Tên thiết bị": d.name,
                Nhóm: d.main_name,
                "Tên loại": d.type_name,

                "Ngày tạo": new Date(d.created_at).toLocaleString("vi-VN"),
              }));
              exportToExcel(data, "Danh_sach_thiet_bi");
              toast.success(`✅ Đã xuất ${data.length} thiết bị ra Excel!`);
            }}
            className="flex items-center gap-2 h-9 rounded-lg border border-gray-200 bg-white text-gray-700 font-medium shadow-sm hover:border-emerald-400 hover:text-emerald-600 hover:bg-emerald-50 transition-all"
          >
            <Download className="w-4 h-4" />
            Export Excel
          </Button>
        </div>

        <div className="flex items-center gap-2">
          {!isTechnician && (
            <Button
              onClick={() => setOpenAddCard(true)}
              className="flex items-center gap-2 h-9 px-3 text-sm font-medium rounded-lg bg-emerald-500 hover:bg-emerald-600 text-white transition-all"
            >
              <Plus size={16} /> Thêm dòng thiết bị
            </Button>
          )}

          <ColumnVisibilityButton
            visibleColumns={visibleColumns}
            setVisibleColumns={setVisibleColumns}
            labels={{
              id: "Mã dòng thiết bị",
              image: "Hình ảnh",
              name: "Tên thiết bị",
              main: "Nhóm",
              type: "Tên loại",

              created_at: "Ngày tạo",
            }}
          />
        </div>
      </div>

      {/* ==== Modal thêm thiết bị ==== */}
      <AlertDialog open={openAddCard} onOpenChange={setOpenAddCard}>
        <AlertDialogContent
          className="
    !max-w-none
    w-[80vw]
    max-w-[1100px]
    h-[90vh]                     /* 👈 chuyển từ max-h sang h cố định */
    overflow-hidden              /* 👈 không cuộn ở lớp ngoài */
    flex flex-col                /* 👈 để chia header/body/footer theo cột */
    bg-white dark:bg-gray-900
    border border-gray-300 dark:border-gray-700
    rounded-2xl shadow-2xl
    p-0
    focus:outline-none focus-visible:ring-0
  "
        >
          {/* Header cố định */}
          <AlertDialogHeader className="flex-shrink-0 sticky top-0 z-10 bg-white/90 dark:bg-gray-900/90 backdrop-blur border-b px-6 py-4">
            <AlertDialogTitle className="text-emerald-600 text-xl font-bold">
              Thêm dòng thiết bị mới
            </AlertDialogTitle>
            <p className="text-gray-500 dark:text-gray-400 text-sm">
              Điền thông tin cơ bản, phân loại và khai báo thông số kỹ thuật
            </p>
          </AlertDialogHeader>

          {/* Body cuộn */}
          <div className="flex-1 overflow-y-auto px-6 py-4">
            <EquipmentAddCardPage
              ref={addCardRef}
              onSuccessAdd={handleAddSuccess}
              onLoadingChange={setLoadingSubmit}
            />
          </div>

          {/* Footer cố định */}
          <AlertDialogFooter className="flex-shrink-0 sticky bottom-0 z-10 bg-white/90 dark:bg-gray-900/90 backdrop-blur border-t px-6 py-4 flex justify-end gap-3">
            <AlertDialogCancel className="bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700">
              Hủy
            </AlertDialogCancel>

            <Button
              type="button"
              disabled={loadingSubmit}
              onClick={() => {
                // ✅ Gọi validateAll() trong EquipmentAddCardPage
                const isValid = addCardRef.current?.validateAll?.();

                if (!isValid) {
                  // ⚠️ Nếu chưa hợp lệ → không submit + báo lỗi
                  toast.error(
                    "⚠️ Vui lòng kiểm tra lại các trường bị thiếu hoặc sai!"
                  );
                  return;
                }

                // ✅ Nếu hợp lệ → submit form
                const form = document.querySelector("form");
                form?.requestSubmit();
              }}
              className="h-10 text-sm px-6 bg-gradient-to-r from-emerald-500 to-purple-500 text-white hover:opacity-90 flex items-center gap-2 rounded-lg shadow-md"
            >
              {loadingSubmit && (
                <span className="mr-2 inline-block animate-spin border-2 border-white border-t-transparent rounded-full w-4 h-4" />
              )}
              {loadingSubmit ? "Đang tạo..." : "Tạo dòng thiết bị"}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* ==== Bảng dữ liệu ==== */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow overflow-hidden">
        <div className="overflow-x-auto">
          <Table className="min-w-[1100px] border border-gray-300 dark:border-gray-700 border-collapse">
            <TableHeader>
              <TableRow className="bg-gray-100 dark:bg-gray-700 text-sm font-semibold border-b border-gray-300 dark:border-gray-600">
                <TableHead className="text-center border border-gray-300 dark:border-gray-600">
                  #
                </TableHead>
                {visibleColumns.id && (
                  <TableHead className="border border-gray-300 dark:border-gray-600">
                    <HeaderFilter
                      selfKey="id"
                      label="Mã dòng thiết bị"
                      values={uniqueValues.id}
                      selected={filters.id}
                      onChange={(v) => setFilters((p) => ({ ...p, id: v }))}
                      controller={controller}
                    />
                  </TableHead>
                )}
                {visibleColumns.image && (
                  <TableHead className="border border-gray-300 dark:border-gray-600">
                    Hình ảnh
                  </TableHead>
                )}
                {visibleColumns.name && (
                  <TableHead className="border border-gray-300 dark:border-gray-600">
                    <HeaderFilter
                      selfKey="name"
                      label="Tên dòng thiết bị"
                      values={uniqueValues.name}
                      selected={filters.name}
                      onChange={(v) => setFilters((p) => ({ ...p, name: v }))}
                      controller={controller}
                    />
                  </TableHead>
                )}
                {visibleColumns.main && (
                  <TableHead className="border border-gray-300 dark:border-gray-600">
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
                  <TableHead className="border border-gray-300 dark:border-gray-600">
                    <HeaderFilter
                      selfKey="type"
                      label="Tên loại"
                      values={uniqueValues.type}
                      selected={filters.type}
                      onChange={(v) => setFilters((p) => ({ ...p, type: v }))}
                      controller={controller}
                    />
                  </TableHead>
                )}

                {visibleColumns.created_at && (
                  <TableHead className="border border-gray-300 dark:border-gray-600 text-center">
                    Ngày tạo
                  </TableHead>
                )}
              </TableRow>
            </TableHeader>
            <TableBody>
              {currentData.map((row, idx) => (
                <TableRow
                  key={row.id ?? idx}
                  id={`equipment-${row.id}`}
                  onClick={() => navigate(`/app/equipment/specs/${row.id}`)}
                  className={`hover:bg-gray-50 dark:hover:bg-gray-700 text-sm cursor-pointer border-b border-gray-200 dark:border-gray-700 transition ${
                    highlightedId === row.id
                      ? "bg-emerald-100 dark:bg-emerald-700/40"
                      : ""
                  }`}
                >
                  <TableCell className="text-center border border-gray-300 dark:border-gray-600">
                    {(currentPage - 1) * ITEMS_PER_PAGE + idx + 1}
                  </TableCell>
                  {visibleColumns.id && (
                    <TableCell className="border border-gray-300 dark:border-gray-600">
                      {row.id}
                    </TableCell>
                  )}
                  {visibleColumns.image && (
                    <TableCell className="text-center border border-gray-300 dark:border-gray-600">
                      <img
                        src={row.image}
                        alt={row.name}
                        className="inline-block w-12 h-10 object-contain rounded"
                      />
                    </TableCell>
                  )}
                  {visibleColumns.name && (
                    <TableCell className="border border-gray-300 dark:border-gray-600">
                      {row.name}
                    </TableCell>
                  )}
                  {visibleColumns.main && (
                    <TableCell className="border border-gray-300 dark:border-gray-600">
                      {row.main_name}
                    </TableCell>
                  )}
                  {visibleColumns.type && (
                    <TableCell className="italic text-gray-600 dark:text-gray-300 border border-gray-300 dark:border-gray-600">
                      {row.type_name}
                    </TableCell>
                  )}

                  {visibleColumns.created_at && (
                    <TableCell className="text-center border border-gray-300 dark:border-gray-600">
                      {row.created_at
                        ? new Date(row.created_at).toLocaleString("vi-VN")
                        : "-"}
                    </TableCell>
                  )}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
        {/* ===== Pagination (kiểu Unit) ===== */}
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
    </div>
  );
}
