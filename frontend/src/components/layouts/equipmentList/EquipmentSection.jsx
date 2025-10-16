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
import { ArrowDownUp } from "lucide-react";
import { useEquipmentData } from "@/hooks/useEquipmentData";
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
import { useNavigate } from "react-router-dom";
import EquipmentAddCardPage from "@/pages/equipment/EquipmentAddCardPage";
import { PlusCircle, XCircle } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const ITEMS_PER_PAGE = 7;

export default function EquipmentGroupPage() {
  const [activeGroup, setActiveGroup] = useState("all");
  const [search, setSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [goToPage, setGoToPage] = useState("");
  const [sortNewestFirst, setSortNewestFirst] = useState(true);
  const navigate = useNavigate();
  const [showAddCard, setShowAddCard] = useState(false);

  const { groups, groupErr, groupLoading, equipments, eqErr, eqLoading } =
    useEquipmentData();

  const groupList = [{ id: "all", name: "Tất cả nhóm" }, ...(groups || [])];
  const controller = useGlobalFilterController();

  const [visibleColumns, setVisibleColumns] = useState({
    id: true,
    image: true,
    name: true,
    main: true,
    type: true,
    vendor: true,
    created_at: true,
  });

  const [filters, setFilters] = useState({
    id: [],
    name: [],
    main: [],
    type: [],
    vendor: [],
  });

  const uniqueValues = useMemo(
    () => ({
      id: getUniqueValues(equipments, (u) => u.id),
      name: getUniqueValues(equipments, (u) => u.name),
      main: getUniqueValues(equipments, (u) => u.main_name),
      type: getUniqueValues(equipments, (u) => u.type_name),
      vendor: getUniqueValues(equipments, (u) => u.vendor_name),
    }),
    [equipments]
  );

  const filteredData = useMemo(() => {
    const q = search.trim().toLowerCase();
    return (equipments || [])
      .filter((d) => {
        const name = d.name?.toLowerCase() || "";
        const main = d.main_name?.toLowerCase() || "";
        const type = d.type_name?.toLowerCase() || "";
        const vendor = d.vendor_name?.toLowerCase() || "";
        const id = d.id?.toLowerCase() || "";

        const matchSearch =
          !q ||
          name.includes(q) ||
          type.includes(q) ||
          vendor.includes(q) ||
          id.includes(q);

        const matchGroup = activeGroup === "all" || d.main_name === activeGroup;

        const matchColumn = {
          id: filters.id.length === 0 || filters.id.includes(d.id),
          name: filters.name.length === 0 || filters.name.includes(d.name),
          main: filters.main.length === 0 || filters.main.includes(d.main_name),
          type: filters.type.length === 0 || filters.type.includes(d.type_name),
          vendor:
            filters.vendor.length === 0 ||
            filters.vendor.includes(d.vendor_name),
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

  return (
    <div className="p-4 space-y-4 font-jakarta">
      <Button
        onClick={() => setShowAddCard((prev) => !prev)}
        className={`flex items-center gap-2 ${
          showAddCard
            ? "bg-red-500 hover:bg-red-600"
            : "bg-emerald-500 hover:bg-emerald-600"
        } text-white transition-all`}
      >
        {showAddCard ? (
          <>
            <XCircle size={18} /> Hủy thêm
          </>
        ) : (
          <>
            <PlusCircle size={18} /> Thêm thiết bị
          </>
        )}
      </Button>
      <AnimatePresence>
        {showAddCard && (
          <motion.div
            key="add-equipment-card"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.3 }}
            className="bg-gray-50 dark:bg-gray-900 rounded-xl border border-emerald-300 dark:border-emerald-700 shadow-inner p-4"
          >
            <EquipmentAddCardPage />
          </motion.div>
        )}
      </AnimatePresence>
      {/* ==== Thanh Toolbar trên ==== */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-3 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl shadow-sm">
        <div className="flex flex-wrap items-center gap-2">
          <Input
            placeholder="🔍 Tìm kiếm thiết bị"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setCurrentPage(1);
            }}
            className="h-9 w-52 border-gray-300 dark:border-gray-700 text-sm"
          />

          <Select
            onValueChange={(v) => {
              setActiveGroup(v);
              setCurrentPage(1);
            }}
            defaultValue="all"
          >
            <SelectTrigger className="h-9 w-40 text-sm bg-gray-50 dark:bg-gray-800 border-gray-300 dark:border-gray-700">
              <SelectValue placeholder="Tất cả nhóm" />
            </SelectTrigger>
            <SelectContent className="z-[9999] bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 shadow-md">
              {groupList.map((g) => (
                <SelectItem
                  key={g.id}
                  value={g.id === "all" ? "all" : g.name}
                  className="text-sm"
                >
                  {g.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Button
            variant="outline"
            onClick={() => setSortNewestFirst((p) => !p)}
            className="flex items-center gap-1 border-emerald-400 text-emerald-600 hover:bg-emerald-50 dark:hover:bg-gray-800"
            title="Sắp xếp theo ngày tạo"
          >
            <ArrowDownUp size={16} />
            {sortNewestFirst ? "Mới → Cũ" : "Cũ → Mới"}
          </Button>
        </div>

        {/* Hiển thị cột */}
        <ColumnVisibilityButton
          visibleColumns={visibleColumns}
          setVisibleColumns={setVisibleColumns}
          labels={{
            id: "Mã phân loại thiết bị",
            image: "Hình ảnh",
            name: "Tên thiết bị",
            main: "Nhóm",
            type: "Tên loại",
            vendor: "Nhà cung cấp",
            created_at: "Ngày tạo",
          }}
        />
      </div>

      {/* ==== Bảng dữ liệu ==== */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow overflow-hidden">
        <div className="overflow-x-auto">
          <Table className="min-w-[1100px] border border-gray-200 dark:border-gray-700">
            <TableHeader>
              <TableRow className="bg-gray-100 dark:bg-gray-700 text-sm font-semibold">
                <TableHead className="text-center border dark:border-gray-600">
                  #
                </TableHead>
                {visibleColumns.id && (
                  <TableHead>
                    <HeaderFilter
                      selfKey="id"
                      label="Mã phân loại thiết bị"
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
                {visibleColumns.main && (
                  <TableHead>
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
                  <TableHead>
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
                {visibleColumns.vendor && (
                  <TableHead>
                    <HeaderFilter
                      selfKey="vendor"
                      label="Nhà cung cấp"
                      values={uniqueValues.vendor}
                      selected={filters.vendor}
                      onChange={(v) => setFilters((p) => ({ ...p, vendor: v }))}
                      controller={controller}
                    />
                  </TableHead>
                )}
                {visibleColumns.created_at && <TableHead>Ngày tạo</TableHead>}
              </TableRow>
            </TableHeader>

            <TableBody>
              {currentData.map((row, idx) => (
                <TableRow
                  key={row.id ?? idx}
                  onClick={() => navigate(`/app/equipment/specs/${row.id}`)}
                  className="hover:bg-gray-50 dark:hover:bg-gray-700 text-sm cursor-pointer transition"
                >
                  <TableCell className="text-center border dark:border-gray-600">
                    {(currentPage - 1) * ITEMS_PER_PAGE + idx + 1}
                  </TableCell>
                  {visibleColumns.id && <TableCell>{row.id}</TableCell>}
                  {visibleColumns.image && (
                    <TableCell className="text-center">
                      <img
                        src={row.image}
                        alt={row.name}
                        className="inline-block w-12 h-10 object-contain rounded"
                      />
                    </TableCell>
                  )}
                  {visibleColumns.name && <TableCell>{row.name}</TableCell>}
                  {visibleColumns.main && (
                    <TableCell>{row.main_name}</TableCell>
                  )}
                  {visibleColumns.type && (
                    <TableCell className="italic text-gray-600 dark:text-gray-300">
                      {row.type_name}
                    </TableCell>
                  )}
                  {visibleColumns.vendor && (
                    <TableCell>{row.vendor_name}</TableCell>
                  )}
                  {visibleColumns.created_at && (
                    <TableCell className="text-center">
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

        {/* Pagination */}
        <div className="flex justify-between items-center border-t dark:border-gray-600 px-4 py-3 bg-gray-50 dark:bg-gray-700 text-sm">
          <div className="text-gray-700 dark:text-gray-300">
            Trang {currentPage} / {totalPages} — Tổng: {filteredData.length}{" "}
            thiết bị
          </div>

          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              className="dark:border-gray-600 dark:text-gray-200"
            >
              «
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              className="dark:border-gray-600 dark:text-gray-200"
            >
              »
            </Button>

            <div className="flex items-center gap-2">
              <span className="dark:text-gray-200">Đi đến:</span>
              <Input
                value={goToPage}
                onChange={(e) => setGoToPage(e.target.value)}
                className="w-16 h-8 text-center dark:bg-gray-600 dark:text-white"
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    const page = parseInt(goToPage);
                    if (!isNaN(page) && page >= 1 && page <= totalPages) {
                      setCurrentPage(page);
                    }
                  }
                }}
              />
              <Button
                size="sm"
                className="bg-emerald-500 text-white hover:bg-emerald-600"
                onClick={() => {
                  const page = parseInt(goToPage);
                  if (!isNaN(page) && page >= 1 && page <= totalPages) {
                    setCurrentPage(page);
                  }
                }}
              >
                Go
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
