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
import { Grid } from "lucide-react";
import Status from "@/components/common/Status";
import { useEquipmentData } from "@/hooks/useEquipmentUnitData";
import { useNavigate } from "react-router-dom";
import {
  ColumnVisibilityButton,
  HeaderFilter,
  getUniqueValues,
  useGlobalFilterController,
  getStatusVN,
} from "@/components/common/ExcelTableTools";

const ITEMS_PER_PAGE = 8;

export default function EquipmentListPage() {
  const [activeGroup, setActiveGroup] = useState("all");
  const [search, setSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [goToPage, setGoToPage] = useState("");
  const navigate = useNavigate();

  // Gọi dữ liệu
  const { eqUnits, eqErr, unitLoading, cats, catErr, catLoading } =
    useEquipmentData();
  const groups = [{ id: "all", name: "Xem tất cả" }, ...(cats || [])];
  const units = eqUnits || [];

  // Hiển thị cột
  const [visibleColumns, setVisibleColumns] = useState({
    id: true,
    image: true,
    name: true,
    main: true,
    type: true,
    status: true,
    vendor: true,
    created_at: true,
  });

  // Bộ lọc Excel-style
  const [filters, setFilters] = useState({
    id: [],
    name: [],
    main: [],
    type: [],
    status: [],
    vendor: [],
  });
  const controller = useGlobalFilterController();

  // Tạo list value duy nhất
  const uniqueValues = useMemo(
    () => ({
      id: getUniqueValues(units, (u) => u.id),
      name: getUniqueValues(units, (u) => u.equipment?.name),
      main: getUniqueValues(units, (u) => u.equipment?.main_name),
      type: getUniqueValues(units, (u) => u.equipment?.type_name),
      vendor: getUniqueValues(units, (u) => u.equipment?.vendor_name),
      status: getUniqueValues(units, (u) => getStatusVN(u.status)),
    }),
    [units]
  );

  // 🧩 Lọc dữ liệu (chuẩn)
  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();

    return (units || []).filter((u) => {
      const name = u.equipment?.name?.trim() || "";
      const main = u.equipment?.main_name?.trim() || "";
      const type = u.equipment?.type_name?.trim() || "";
      const vendor = u.equipment?.vendor_name?.trim() || "";
      const id = u.id?.trim() || "";
      const statusVN = getStatusVN(u.status);

      // Tìm kiếm (ô search)
      const matchSearch =
        !q ||
        name.toLowerCase().includes(q) ||
        vendor.toLowerCase().includes(q) ||
        type.toLowerCase().includes(q) ||
        id.toLowerCase().includes(q);

      // Lọc theo nhóm (sidebar)
      const matchGroup = activeGroup === "all" || main === activeGroup;

      // Bộ lọc từng cột (Excel)
      const matchColumn = {
        id: filters.id.length === 0 || filters.id.includes(id),
        name: filters.name.length === 0 || filters.name.includes(name),
        main: filters.main.length === 0 || filters.main.includes(main),
        type: filters.type.length === 0 || filters.type.includes(type),
        status:
          filters.status.length === 0 || filters.status.includes(statusVN),
        vendor: filters.vendor.length === 0 || filters.vendor.includes(vendor),
      };

      // Kết hợp tất cả điều kiện
      return (
        matchSearch && matchGroup && Object.values(matchColumn).every(Boolean)
      );
    });
  }, [units, search, activeGroup, filters]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / ITEMS_PER_PAGE));
  const currentData = filtered.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  if (unitLoading || catLoading)
    return (
      <div className="p-4 animate-pulse text-gray-500">Đang tải dữ liệu...</div>
    );
  if (eqErr || catErr)
    return (
      <div className="p-4 text-red-500">Lỗi khi tải dữ liệu, thử lại sau.</div>
    );

  // ==== Giao diện ====
  return (
    <div className="grid grid-cols-12 gap-4">
      {/* Sidebar bên trái */}
      <div className="col-span-3 space-y-4">
        <h2 className="text-xl font-bold text-emerald-600 dark:text-emerald-400">
          Danh sách nhóm thiết bị
        </h2>

        {/* Ô tìm kiếm */}
        <div className="p-3 bg-white dark:bg-gray-800 rounded-lg shadow space-y-2">
          <h3 className="font-semibold text-sm dark:text-gray-200">Tìm kiếm</h3>
          <Input
            placeholder="Tìm tên, loại, nhà cung cấp..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setCurrentPage(1);
            }}
            className="dark:bg-gray-700 dark:text-gray-100"
          />
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setSearch("");
                setCurrentPage(1);
              }}
              className="dark:border-gray-600 dark:text-gray-200"
            >
              Reset
            </Button>
            <Button
              size="sm"
              className="bg-emerald-500 text-white hover:bg-emerald-600"
              onClick={() => setCurrentPage(1)}
            >
              Tìm
            </Button>
          </div>
        </div>

        {/* Nhóm thiết bị */}
        <div className="p-3 bg-white dark:bg-gray-800 rounded-lg shadow h-[340px] overflow-y-auto">
          <h3 className="font-semibold text-sm mb-2 dark:text-gray-200">
            Hiển thị theo nhóm
          </h3>
          <div className="flex flex-col gap-2">
            {groups.map((g, idx) => (
              <button
                key={g.id ?? idx}
                onClick={() => {
                  setActiveGroup(g.id === "all" ? "all" : g.name);
                  setCurrentPage(1);
                }}
                className={`flex items-center gap-3 px-2 py-2 rounded-md border text-sm transition ${
                  activeGroup === (g.id === "all" ? "all" : g.name)
                    ? "bg-emerald-100 border-emerald-500 text-emerald-700 dark:bg-emerald-900 dark:text-emerald-200"
                    : "bg-white border-gray-200 hover:bg-gray-50 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-200"
                }`}
              >
                {g.id === "all" ? (
                  <Grid size={18} className="text-emerald-500" />
                ) : g.image ? (
                  <img
                    src={g.image}
                    alt={g.name}
                    className="w-6 h-6 object-cover rounded-full border border-gray-300 dark:border-gray-500"
                  />
                ) : (
                  <Grid size={18} className="text-gray-400" />
                )}
                <span className="flex-1 truncate">{g.name}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Table chính */}
      <div className="col-span-9 space-y-3">
        <div className="flex justify-end">
          <ColumnVisibilityButton
            visibleColumns={visibleColumns}
            setVisibleColumns={setVisibleColumns}
            labels={{
              id: "Mã đơn vị",
              image: "Hình ảnh",
              name: "Tên thiết bị",
              main: "Nhóm",
              type: "Loại",
              status: "Trạng thái",
              vendor: "Nhà cung cấp",
              created_at: "Ngày tạo",
            }}
          />
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
          <div className="overflow-x-auto">
            <Table className="min-w-[1100px] border border-gray-200 dark:border-gray-600">
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
                    <TableHead className="border dark:border-gray-600">
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
                        onChange={(v) =>
                          setFilters((p) => ({ ...p, status: v }))
                        }
                        controller={controller}
                      />
                    </TableHead>
                  )}
                  {visibleColumns.vendor && (
                    <TableHead className="border dark:border-gray-600">
                      <HeaderFilter
                        selfKey="vendor"
                        label="Nhà cung cấp"
                        values={uniqueValues.vendor}
                        selected={filters.vendor}
                        onChange={(v) =>
                          setFilters((p) => ({ ...p, vendor: v }))
                        }
                        controller={controller}
                      />
                    </TableHead>
                  )}
                  {visibleColumns.created_at && (
                    <TableHead className="border dark:border-gray-600">
                      Ngày tạo
                    </TableHead>
                  )}
                </TableRow>
              </TableHeader>

              <TableBody>
                {currentData.map((row, idx) => (
                  <TableRow
                    key={row.id ?? idx}
                    onClick={() => navigate(`/app/equipment/${row.id}`)}
                    className="hover:bg-gray-50 dark:hover:bg-gray-700 text-sm transition cursor-pointer"
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
                    {visibleColumns.vendor && (
                      <TableCell>{row.equipment?.vendor_name}</TableCell>
                    )}
                    {visibleColumns.created_at && (
                      <TableCell>
                        {new Date(row.created_at).toLocaleString("vi-VN")}
                      </TableCell>
                    )}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {/* Pagination */}
          <div className="flex justify-between items-center border-t dark:border-gray-600 px-4 py-2 bg-gray-50 dark:bg-gray-700">
            <div className="flex items-center gap-2 text-sm">
              <span className="dark:text-gray-200">Go to:</span>
              <input
                type="number"
                min={1}
                max={totalPages}
                className="w-16 px-2 py-1 border rounded text-sm dark:bg-gray-700 dark:text-gray-100 dark:border-gray-600"
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
      </div>
    </div>
  );
}
