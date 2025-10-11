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
import { useEquipmentGroupData } from "@/hooks/useEquipmentGroupData";
import {
  HeaderFilter,
  ColumnVisibilityButton,
  useGlobalFilterController,
  getUniqueValues,
} from "@/components/common/ExcelTableTools";

const ITEMS_PER_PAGE = 7;

export default function EquipmentGroupPage() {
  const [activeGroup, setActiveGroup] = useState("all");
  const [search, setSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [goToPage, setGoToPage] = useState("");

  const { groups, groupErr, groupLoading, equipments, eqErr, eqLoading } =
    useEquipmentGroupData();

  const groupList = [{ id: "all", name: "Xem tất cả" }, ...(groups || [])];
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
    return (equipments || []).filter((d) => {
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
          filters.vendor.length === 0 || filters.vendor.includes(d.vendor_name),
      };

      return (
        matchSearch && matchGroup && Object.values(matchColumn).every(Boolean)
      );
    });
  }, [equipments, search, activeGroup, filters]);

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
    <div className="grid grid-cols-12 gap-4">
      {/* Sidebar */}
      <div className="col-span-3 space-y-4">
        <h2 className="text-xl font-bold text-emerald-600 dark:text-emerald-400">
          Danh sách nhóm thiết bị
        </h2>

        {/* Tìm kiếm */}
        <div className="p-3 bg-white dark:bg-gray-800 rounded-lg shadow space-y-2">
          <h3 className="font-semibold text-sm dark:text-gray-200">
            Tìm kiếm loại
          </h3>
          <Input
            placeholder="Nhập tên loại..."
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
            {groupList.map((g, idx) => (
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

      {/* Main content */}
      <div className="col-span-9 space-y-3">
        <div className="flex justify-end">
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

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
          <div className="overflow-x-auto">
            <Table className="min-w-[1000px] border border-gray-200 dark:border-gray-600">
              <TableHeader>
                <TableRow className="bg-gray-100 dark:bg-gray-700 text-sm font-semibold">
                  <TableHead className="text-center border dark:border-gray-600">
                    #
                  </TableHead>

                  {visibleColumns.id && (
                    <TableHead className="border dark:border-gray-600">
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
                        label="Tên loại"
                        values={uniqueValues.type}
                        selected={filters.type}
                        onChange={(v) => setFilters((p) => ({ ...p, type: v }))}
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
                    className="hover:bg-gray-50 dark:hover:bg-gray-700 text-sm"
                  >
                    <TableCell className="text-center border dark:border-gray-600">
                      {(currentPage - 1) * ITEMS_PER_PAGE + idx + 1}
                    </TableCell>

                    {visibleColumns.id && (
                      <TableCell className="border dark:border-gray-600">
                        {row.id}
                      </TableCell>
                    )}

                    {visibleColumns.image && (
                      <TableCell className="border dark:border-gray-600">
                        <img
                          src={row.image}
                          alt={row.name}
                          className="w-12 h-10 object-contain rounded"
                        />
                      </TableCell>
                    )}

                    {visibleColumns.name && (
                      <TableCell className="border dark:border-gray-600">
                        {row.name}
                      </TableCell>
                    )}

                    {visibleColumns.main && (
                      <TableCell className="border dark:border-gray-600">
                        {row.main_name}
                      </TableCell>
                    )}

                    {visibleColumns.type && (
                      <TableCell className="border italic text-gray-600 dark:text-gray-300 dark:border-gray-600">
                        {row.type_name}
                      </TableCell>
                    )}

                    {visibleColumns.vendor && (
                      <TableCell className="border dark:border-gray-600">
                        {row.vendor_name}
                      </TableCell>
                    )}

                    {visibleColumns.created_at && (
                      <TableCell className="border dark:border-gray-600">
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
        </div>
      </div>
    </div>
  );
}
