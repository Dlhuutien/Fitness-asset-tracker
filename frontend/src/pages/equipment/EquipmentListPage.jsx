import { useEffect, useMemo, useRef, useState } from "react";
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
import { Grid, Filter, Settings, X } from "lucide-react";
import Status from "@/components/common/Status";
import { useEquipmentData } from "@/hooks/useEquipmentUnitData";
import { useNavigate } from "react-router-dom";

const ITEMS_PER_PAGE = 8;

// 🟢 Dịch trạng thái
const STATUS_MAP = {
  active: "Hoạt động",
  inactive: "Ngưng hoạt động",
  "temporary urgent": "Ngừng tạm thời",
  "in progress": "Đang bảo trì",
  ready: "Bảo trì thành công",
  failed: "Bảo trì thất bại",
  moving: "Đang di chuyển",
  "in stock": "Thiết bị trong kho",
  deleted: "Đã xóa",
};

export default function EquipmentListPage() {
  const [activeGroup, setActiveGroup] = useState("all");
  const [search, setSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [goToPage, setGoToPage] = useState("");
  const navigate = useNavigate();

  // ==== Column visibility ====
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
  const [showColumnMenu, setShowColumnMenu] = useState(false);
  const columnMenuRef = useRef(null);

  // ==== Excel-like filter ====
  const [openFilter, setOpenFilter] = useState(null);
  const [filterSearch, setFilterSearch] = useState("");
  const [filters, setFilters] = useState({
    name: [],
    main: [],
    type: [],
    status: [],
    vendor: [],
  });
  const filterRef = useRef(null);

  // ==== Data ====
  const { eqUnits, eqErr, unitLoading, cats, catErr, catLoading } = useEquipmentData();
  const groups = [{ id: "all", name: "Xem tất cả" }, ...(cats || [])];
  const units = eqUnits || [];

  // ==== Click ngoài để đóng menu ====
  useEffect(() => {
    const handleClick = (e) => {
      if (columnMenuRef.current && !columnMenuRef.current.contains(e.target)) {
        setShowColumnMenu(false);
      }
      if (filterRef.current && !filterRef.current.contains(e.target)) {
        setOpenFilter(null);
        setFilterSearch("");
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  // ==== Unique values per column ====
  const uniqueValues = useMemo(() => {
    const names = new Set();
    const mains = new Set();
    const types = new Set();
    const vendors = new Set();
    const statuses = new Set();
    for (const u of units) {
      if (u.equipment?.name) names.add(u.equipment.name);
      if (u.equipment?.main_name) mains.add(u.equipment.main_name);
      if (u.equipment?.type_name) types.add(u.equipment.type_name);
      if (u.equipment?.vendor_name) vendors.add(u.equipment.vendor_name);
      statuses.add(STATUS_MAP[u.status?.trim()?.toLowerCase()] || "Không xác định");
    }
    const toSorted = (s) => Array.from(s).sort((a, b) => a.localeCompare(b, "vi"));
    return {
      name: toSorted(names),
      main: toSorted(mains),
      type: toSorted(types),
      vendor: toSorted(vendors),
      status: toSorted(statuses),
    };
  }, [units]);

  // ==== Filter logic ====
  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return units.filter((u) => {
      const matchSearch =
        !q ||
        u.equipment?.name?.toLowerCase().includes(q) ||
        u.equipment?.vendor_name?.toLowerCase().includes(q) ||
        u.equipment?.type_name?.toLowerCase().includes(q);

      const matchGroup = activeGroup === "all" || u.equipment?.main_name === activeGroup;

      const nameOK =
        filters.name.length === 0 ||
        filters.name.includes(u.equipment?.name);
      const mainOK =
        filters.main.length === 0 ||
        filters.main.includes(u.equipment?.main_name);
      const typeOK =
        filters.type.length === 0 ||
        filters.type.includes(u.equipment?.type_name);
      const statusVN = STATUS_MAP[u.status?.trim()?.toLowerCase()] || "Không xác định";
      const statusOK =
        filters.status.length === 0 || filters.status.includes(statusVN);
      const vendorOK =
        filters.vendor.length === 0 ||
        filters.vendor.includes(u.equipment?.vendor_name);

      return matchSearch && matchGroup && nameOK && mainOK && typeOK && statusOK && vendorOK;
    });
  }, [units, search, activeGroup, filters]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / ITEMS_PER_PAGE));
  const currentData = filtered.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

  // ==== Toggle filter value ====
  const toggleFilterValue = (col, val) => {
    setFilters((prev) => {
      const has = prev[col].includes(val);
      const next = has ? prev[col].filter((v) => v !== val) : [...prev[col], val];
      return { ...prev, [col]: next };
    });
  };

  // ==== Render filter dropdown ====
  const renderFilter = (col, label) => {
    const list = uniqueValues[col] || [];
    const filteredList = list.filter((v) =>
      v?.toLowerCase().includes(filterSearch.toLowerCase())
    );
    return (
      openFilter === col && (
        <div
          ref={filterRef}
          className="absolute z-50 top-[2rem] left-0 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-md shadow-lg w-56 p-2"
        >
          <div className="flex items-center gap-2 mb-2">
            <Input
              placeholder={`Tìm ${label.toLowerCase()}...`}
              value={filterSearch}
              onChange={(e) => setFilterSearch(e.target.value)}
              className="h-8 text-xs dark:bg-gray-700 dark:text-gray-100"
            />
            <button
              onClick={() => {
                setFilters((prev) => ({ ...prev, [col]: [] }));
                setFilterSearch("");
                setOpenFilter(null);
              }}
              className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
              title="Xóa bộ lọc"
            >
              <X size={14} />
            </button>
          </div>
          <div className="max-h-48 overflow-y-auto text-sm pr-1">
            {filteredList.length === 0 ? (
              <div className="text-xs text-gray-500 px-1 py-2">
                Không có giá trị phù hợp
              </div>
            ) : (
              filteredList.map((v) => (
                <label
                  key={v}
                  className="flex items-center gap-2 py-1 px-1 cursor-pointer"
                >
                  <input
                    type="checkbox"
                    checked={filters[col].includes(v)}
                    onChange={() => toggleFilterValue(col, v)}
                  />
                  <span className="truncate">{v}</span>
                </label>
              ))
            )}
          </div>
        </div>
      )
    );
  };

  if (unitLoading || catLoading)
    return <div className="p-4 text-gray-500 animate-pulse">Đang tải dữ liệu...</div>;
  if (eqErr || catErr)
    return <div className="p-4 text-red-500">Lỗi khi tải dữ liệu, thử lại sau.</div>;

  // ===== UI =====
  return (
    <div className="grid grid-cols-12 gap-4">
      {/* Sidebar bộ lọc */}
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

      {/* Main content */}
      <div className="col-span-9 space-y-3">
        {/* Hiển thị cột */}
        <div className="flex justify-end relative" ref={columnMenuRef}>
          <Button
            size="icon"
            onClick={() => setShowColumnMenu((s) => !s)}
            className="p-2 bg-white border hover:shadow transition dark:bg-gray-800 dark:border-gray-600"
            title="Hiển thị cột"
          >
            <Settings size={16} />
          </Button>
          {showColumnMenu && (
            <div className="absolute right-0 mt-2 w-56 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-md shadow-lg p-3 z-50">
              <p className="font-semibold text-sm mb-2 text-gray-600 dark:text-gray-300">
                Hiển thị cột
              </p>
              {Object.entries({
                id: "Mã đơn vị",
                image: "Hình ảnh",
                name: "Tên thiết bị",
                main: "Nhóm",
                type: "Loại",
                status: "Trạng thái",
                vendor: "Nhà cung cấp",
                created_at: "Ngày tạo",
              }).map(([key, label]) => (
                <label key={key} className="flex items-center gap-2 text-sm py-1 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={visibleColumns[key]}
                    onChange={() =>
                      setVisibleColumns((prev) => ({ ...prev, [key]: !prev[key] }))
                    }
                  />
                  {label}
                </label>
              ))}
            </div>
          )}
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
                      Mã đơn vị
                    </TableHead>
                  )}
                  {visibleColumns.image && (
                    <TableHead className="border dark:border-gray-600">
                      Hình ảnh
                    </TableHead>
                  )}
                  {visibleColumns.name && (
                    <TableHead className="border dark:border-gray-600 relative">
                      <div className="flex items-center gap-1">
                        <span>Tên thiết bị</span>
                        <Filter
                          size={14}
                          className="cursor-pointer text-gray-500 hover:text-emerald-600"
                          onClick={() =>
                            setOpenFilter((p) => (p === "name" ? null : "name"))
                          }
                        />
                      </div>
                      {renderFilter("name", "tên thiết bị")}
                    </TableHead>
                  )}
                  {visibleColumns.main && (
                    <TableHead className="border dark:border-gray-600 relative">
                      <div className="flex items-center gap-1">
                        <span>Nhóm</span>
                        <Filter
                          size={14}
                          className="cursor-pointer text-gray-500 hover:text-emerald-600"
                          onClick={() =>
                            setOpenFilter((p) => (p === "main" ? null : "main"))
                          }
                        />
                      </div>
                      {renderFilter("main", "nhóm")}
                    </TableHead>
                  )}
                  {visibleColumns.type && (
                    <TableHead className="border dark:border-gray-600 relative">
                      <div className="flex items-center gap-1">
                        <span>Loại</span>
                        <Filter
                          size={14}
                          className="cursor-pointer text-gray-500 hover:text-emerald-600"
                          onClick={() =>
                            setOpenFilter((p) => (p === "type" ? null : "type"))
                          }
                        />
                      </div>
                      {renderFilter("type", "loại")}
                    </TableHead>
                  )}
                  {visibleColumns.status && (
                    <TableHead className="border text-center dark:border-gray-600 relative">
                      <div className="flex justify-center items-center gap-1">
                        <span>Trạng thái</span>
                        <Filter
                          size={14}
                          className="cursor-pointer text-gray-500 hover:text-emerald-600"
                          onClick={() =>
                            setOpenFilter((p) => (p === "status" ? null : "status"))
                          }
                        />
                      </div>
                      {renderFilter("status", "trạng thái")}
                    </TableHead>
                  )}
                  {visibleColumns.vendor && (
                    <TableHead className="border dark:border-gray-600 relative">
                      <div className="flex items-center gap-1">
                        <span>Nhà cung cấp</span>
                        <Filter
                          size={14}
                          className="cursor-pointer text-gray-500 hover:text-emerald-600"
                          onClick={() =>
                            setOpenFilter((p) => (p === "vendor" ? null : "vendor"))
                          }
                        />
                      </div>
                      {renderFilter("vendor", "nhà cung cấp")}
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
                {currentData.map((row, idx) => {
                  const translated =
                    STATUS_MAP[row.status?.trim()?.toLowerCase()] ||
                    "Không xác định";
                  return (
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
                          <Status status={translated} />
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
                  );
                })}
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
