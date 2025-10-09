import { useState, useRef, useEffect } from "react";
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
import { Grid, Settings, Filter } from "lucide-react";
import Status from "@/components/common/Status";
import { useEquipmentData } from "@/hooks/useEquipmentUnitData";
import { useNavigate } from "react-router-dom";

const ITEMS_PER_PAGE = 8;

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
  const navigate = useNavigate();
  const [activeGroup, setActiveGroup] = useState("all");
  const [search, setSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [goToPage, setGoToPage] = useState("");

  // ✅ Excel-style filters
  const [columnFilters, setColumnFilters] = useState({
    name: [],
    main: [],
    type: [],
    vendor: [],
    status: [],
  });
  const [openFilter, setOpenFilter] = useState(null);
  const [filterSearch, setFilterSearch] = useState("");
  const dropdownRef = useRef(null);

  // ✅ Show/Hide columns
  const [visibleColumns, setVisibleColumns] = useState({
    id: true,
    image: true,
    name: true,
    main: true,
    type: true,
    status: true,
    vendor: true,
    createdAt: true,
  });
  const [showColumnMenu, setShowColumnMenu] = useState(false);
  const columnMenuRef = useRef(null);

  useEffect(() => {
    const handleClick = (e) => {
      if (columnMenuRef.current && !columnMenuRef.current.contains(e.target)) {
        setShowColumnMenu(false);
      }
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setOpenFilter(null);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  // Fetch data
  const { eqUnits, eqErr, unitLoading, cats, catErr, catLoading } =
    useEquipmentData();
  const groups = [{ id: "all", name: "Xem tất cả" }, ...(cats || [])];
  const units = eqUnits || [];

  // ✅ Tạo danh sách giá trị duy nhất cho từng cột
  const uniqueValues = {
    name: [...new Set(units.map((u) => u.equipment?.name).filter(Boolean))],
    main: [...new Set(units.map((u) => u.equipment?.main_name).filter(Boolean))],
    type: [...new Set(units.map((u) => u.equipment?.type_name).filter(Boolean))],
    vendor: [
      ...new Set(units.map((u) => u.equipment?.vendor_name).filter(Boolean)),
    ],
    status: [
      ...new Set(
        units
          .map(
            (u) => STATUS_MAP[u.status?.trim()?.toLowerCase()] || "Không xác định"
          )
          .filter(Boolean)
      ),
    ],
  };

  // ✅ Lọc dữ liệu theo các bộ lọc Excel
  const filtered = units.filter((u) => {
    const matchesSearch =
      !search ||
      u.equipment?.name?.toLowerCase().includes(search.toLowerCase()) ||
      u.equipment?.vendor_name?.toLowerCase().includes(search.toLowerCase()) ||
      u.equipment?.type_name?.toLowerCase().includes(search.toLowerCase());

    const matchGroup =
      activeGroup === "all" || u.equipment?.main_name === activeGroup;

    const matchFilters = Object.keys(columnFilters).every((col) => {
      const selected = columnFilters[col];
      if (selected.length === 0) return true;
      const val =
        col === "status"
          ? STATUS_MAP[u.status?.trim()?.toLowerCase()] || "Không xác định"
          : u.equipment?.[`${col}_name`] || u.equipment?.[col];
      return selected.includes(val);
    });

    return matchesSearch && matchGroup && matchFilters;
  });

  const totalPages = Math.max(1, Math.ceil(filtered.length / ITEMS_PER_PAGE));
  const currentData = filtered.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  if (unitLoading || catLoading)
    return <div className="p-4 text-gray-500">Đang tải dữ liệu...</div>;
  if (eqErr || catErr)
    return <div className="p-4 text-red-500">Lỗi khi tải dữ liệu</div>;

  // ✅ Toggle chọn filter
  const toggleValue = (col, val) => {
    setColumnFilters((prev) => {
      const newVals = prev[col].includes(val)
        ? prev[col].filter((v) => v !== val)
        : [...prev[col], val];
      return { ...prev, [col]: newVals };
    });
  };

  return (
    <div className="grid grid-cols-12 gap-4">
      {/* Sidebar */}
      <div className="col-span-3 space-y-4">
        <h2 className="text-xl font-bold text-emerald-600 dark:text-emerald-400">
          Danh sách nhóm thiết bị
        </h2>

        {/* Tìm kiếm */}
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
              onClick={() => setSearch("")}
              className="dark:border-gray-600 dark:text-gray-200"
            >
              Reset
            </Button>
            <Button
              size="sm"
              className="bg-emerald-500 text-white hover:bg-emerald-600"
            >
              Tìm
            </Button>
          </div>
        </div>

        {/* Nhóm */}
        <div className="p-3 bg-white dark:bg-gray-800 rounded-lg shadow h-[340px] overflow-y-auto">
          <h3 className="font-semibold text-sm mb-2 dark:text-gray-200">
            Hiển thị theo nhóm
          </h3>
          <div className="flex flex-col gap-2">
            {groups.map((g) => (
              <button
                key={g.id}
                onClick={() => setActiveGroup(g.id === "all" ? "all" : g.name)}
                className={`flex items-center gap-3 px-2 py-2 rounded-md border text-sm transition ${
                  activeGroup === (g.id === "all" ? "all" : g.name)
                    ? "bg-emerald-100 border-emerald-500 text-emerald-700"
                    : "bg-white border-gray-200 hover:bg-gray-50"
                }`}
              >
                {g.id === "all" ? (
                  <Grid size={18} className="text-emerald-500" />
                ) : g.image ? (
                  <img
                    src={g.image}
                    alt={g.name}
                    className="w-6 h-6 object-cover rounded-full border border-gray-300"
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

      {/* Main */}
      <div className="col-span-9 space-y-3 relative">
        {/* ⚙️ Hiển thị cột */}
        <div className="flex justify-end" ref={columnMenuRef}>
          <Button
            size="icon"
            onClick={() => setShowColumnMenu(!showColumnMenu)}
            className="p-2 bg-white border hover:shadow transition"
          >
            <Settings size={16} />
          </Button>
          {showColumnMenu && (
            <div className="absolute right-0 mt-2 w-56 bg-white border rounded-md shadow-lg p-3 z-50">
              <p className="font-semibold text-sm mb-2 text-gray-600">
                Hiển thị cột
              </p>
              {Object.keys(visibleColumns).map((col) => (
                <label
                  key={col}
                  className="flex items-center gap-2 text-sm py-1 cursor-pointer"
                >
                  <input
                    type="checkbox"
                    checked={visibleColumns[col]}
                    onChange={() =>
                      setVisibleColumns((prev) => ({
                        ...prev,
                        [col]: !prev[col],
                      }))
                    }
                  />
                  {col === "id"
                    ? "Mã đơn vị"
                    : col === "image"
                    ? "Hình ảnh"
                    : col === "name"
                    ? "Tên thiết bị"
                    : col === "main"
                    ? "Nhóm"
                    : col === "type"
                    ? "Loại"
                    : col === "status"
                    ? "Trạng thái"
                    : col === "vendor"
                    ? "Nhà cung cấp"
                    : "Ngày tạo"}
                </label>
              ))}
            </div>
          )}
        </div>

        {/* 🧩 Table */}
        <div className="bg-white rounded-lg shadow overflow-hidden relative">
          <div className="overflow-x-auto">
            <Table className="min-w-[1100px] border border-gray-200">
              <TableHeader>
                <TableRow className="bg-gray-100 text-sm font-semibold">
                  {visibleColumns.name && (
                    <TableHead className="relative">
                      Tên thiết bị
                      <Filter
                        size={13}
                        className="inline ml-1 cursor-pointer text-gray-500 hover:text-emerald-500"
                        onClick={() =>
                          setOpenFilter(openFilter === "name" ? null : "name")
                        }
                      />
                      {openFilter === "name" && (
                        <div
                          ref={dropdownRef}
                          className="absolute top-8 left-0 bg-white border rounded-md shadow-lg p-2 z-50 w-48"
                        >
                          <Input
                            placeholder="Tìm..."
                            value={filterSearch}
                            onChange={(e) => setFilterSearch(e.target.value)}
                            className="h-7 text-xs mb-2"
                          />
                          <div className="max-h-40 overflow-y-auto text-sm">
                            {uniqueValues.name
                              .filter((v) =>
                                v
                                  ?.toLowerCase()
                                  .includes(filterSearch.toLowerCase())
                              )
                              .map((v) => (
                                <label
                                  key={v}
                                  className="flex items-center gap-2 py-1"
                                >
                                  <input
                                    type="checkbox"
                                    checked={columnFilters.name.includes(v)}
                                    onChange={() => toggleValue("name", v)}
                                  />
                                  {v}
                                </label>
                              ))}
                          </div>
                        </div>
                      )}
                    </TableHead>
                  )}

                  {visibleColumns.main && (
                    <TableHead className="relative">
                      Nhóm
                      <Filter
                        size={13}
                        className="inline ml-1 cursor-pointer text-gray-500 hover:text-emerald-500"
                        onClick={() =>
                          setOpenFilter(openFilter === "main" ? null : "main")
                        }
                      />
                      {openFilter === "main" && (
                        <div
                          ref={dropdownRef}
                          className="absolute top-8 left-0 bg-white border rounded-md shadow-lg p-2 z-50 w-48"
                        >
                          <div className="max-h-40 overflow-y-auto text-sm">
                            {uniqueValues.main.map((v) => (
                              <label
                                key={v}
                                className="flex items-center gap-2 py-1"
                              >
                                <input
                                  type="checkbox"
                                  checked={columnFilters.main.includes(v)}
                                  onChange={() => toggleValue("main", v)}
                                />
                                {v}
                              </label>
                            ))}
                          </div>
                        </div>
                      )}
                    </TableHead>
                  )}

                  {visibleColumns.type && (
                    <TableHead className="relative">
                      Loại
                      <Filter
                        size={13}
                        className="inline ml-1 cursor-pointer text-gray-500 hover:text-emerald-500"
                        onClick={() =>
                          setOpenFilter(openFilter === "type" ? null : "type")
                        }
                      />
                      {openFilter === "type" && (
                        <div
                          ref={dropdownRef}
                          className="absolute top-8 left-0 bg-white border rounded-md shadow-lg p-2 z-50 w-48"
                        >
                          <div className="max-h-40 overflow-y-auto text-sm">
                            {uniqueValues.type.map((v) => (
                              <label
                                key={v}
                                className="flex items-center gap-2 py-1"
                              >
                                <input
                                  type="checkbox"
                                  checked={columnFilters.type.includes(v)}
                                  onChange={() => toggleValue("type", v)}
                                />
                                {v}
                              </label>
                            ))}
                          </div>
                        </div>
                      )}
                    </TableHead>
                  )}

                  {visibleColumns.status && (
                    <TableHead className="relative text-center">
                      Trạng thái
                      <Filter
                        size={13}
                        className="inline ml-1 cursor-pointer text-gray-500 hover:text-emerald-500"
                        onClick={() =>
                          setOpenFilter(openFilter === "status" ? null : "status")
                        }
                      />
                      {openFilter === "status" && (
                        <div
                          ref={dropdownRef}
                          className="absolute top-8 left-0 bg-white border rounded-md shadow-lg p-2 z-50 w-48"
                        >
                          <div className="max-h-40 overflow-y-auto text-sm">
                            {uniqueValues.status.map((v) => (
                              <label
                                key={v}
                                className="flex items-center gap-2 py-1"
                              >
                                <input
                                  type="checkbox"
                                  checked={columnFilters.status.includes(v)}
                                  onChange={() => toggleValue("status", v)}
                                />
                                {v}
                              </label>
                            ))}
                          </div>
                        </div>
                      )}
                    </TableHead>
                  )}

                  {visibleColumns.vendor && (
                    <TableHead className="relative">
                      Nhà cung cấp
                      <Filter
                        size={13}
                        className="inline ml-1 cursor-pointer text-gray-500 hover:text-emerald-500"
                        onClick={() =>
                          setOpenFilter(openFilter === "vendor" ? null : "vendor")
                        }
                      />
                      {openFilter === "vendor" && (
                        <div
                          ref={dropdownRef}
                          className="absolute top-8 left-0 bg-white border rounded-md shadow-lg p-2 z-50 w-48"
                        >
                          <div className="max-h-40 overflow-y-auto text-sm">
                            {uniqueValues.vendor.map((v) => (
                              <label
                                key={v}
                                className="flex items-center gap-2 py-1"
                              >
                                <input
                                  type="checkbox"
                                  checked={columnFilters.vendor.includes(v)}
                                  onChange={() => toggleValue("vendor", v)}
                                />
                                {v}
                              </label>
                            ))}
                          </div>
                        </div>
                      )}
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
                      key={row.id}
                      onClick={() => navigate(`/app/equipment/${row.id}`)}
                      className="hover:bg-gray-50 text-sm cursor-pointer"
                    >
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
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        </div>
      </div>
    </div>
  );
}
