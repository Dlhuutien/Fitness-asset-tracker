import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/buttonn";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Pencil, Trash2 } from "lucide-react";
import {
  Activity,
  Dumbbell,
  Layers,
  Armchair,
  BarChart2,
  Weight,
  Package,
  Grid,
} from "lucide-react";

// Nhóm thiết bị
const groups = [
  { key: "all", name: "Xem tất cả", label: "Tất cả", icon: Grid },
  { key: "cardio", name: "Cardio Machines", label: "Cardio", icon: Activity },
  {
    key: "strength",
    name: "Strength Machines",
    label: "Kháng lực",
    icon: Dumbbell,
  },
  {
    key: "multi",
    name: "Multi-Functional Stations",
    label: "Đa năng",
    icon: Layers,
  },
  { key: "benches", name: "Benches", label: "Ghế tập", icon: Armchair },
  { key: "barbells", name: "Barbells", label: "Thanh đòn", icon: BarChart2 },
  { key: "weights", name: "Weights", label: "Tạ đơn", icon: Weight },
  { key: "accessories", name: "Accessories", label: "Phụ kiện", icon: Package },
];

// Fake data
const data = Array.from({ length: 50 }).map((_, i) => ({
  id: i + 1,
  maTheKho: "CAOTMJS",
  sku: `CAOTMJS-${String(i + 1).padStart(3, "0")}`,
  img: "https://via.placeholder.com/60x40.png?text=Equip",
  ten: `Thiết bị số ${i + 1}`,
  nhom:
    i % 7 === 0
      ? "Cardio Machines"
      : i % 7 === 1
      ? "Strength Machines"
      : i % 7 === 2
      ? "Multi-Functional Stations"
      : i % 7 === 3
      ? "Benches"
      : i % 7 === 4
      ? "Barbells"
      : i % 7 === 5
      ? "Weights"
      : "Accessories",
  ngayNhap: `27/08/2025 14:${(i % 60).toString().padStart(2, "0")}`,
  trangThai: i % 3 === 0 ? "active" : i % 3 === 1 ? "maintenance" : "inactive",
  baoHanh: `${12 + (i % 3) * 6} tháng`,
  nhaCC: i % 2 === 0 ? "Technogym" : "Life Fitness",
  congSuat: `${2.0 + (i % 3) * 0.5} HP`,
}));

const ITEMS_PER_PAGE = 7;

export default function EquipmentGroupPage() {
  const [activeGroup, setActiveGroup] = useState("all");
  const [search, setSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [goToPage, setGoToPage] = useState("");
  const [sortConfig, setSortConfig] = useState({ key: null, direction: "asc" });

  // Filter theo nhóm
  const filteredData = data.filter((d) => {
    const groupName = groups.find((g) => g.key === activeGroup)?.name;
    if (activeGroup === "all") {
      return d.ten.toLowerCase().includes(search.toLowerCase());
    }
    return (
      d.nhom === groupName && d.ten.toLowerCase().includes(search.toLowerCase())
    );
  });

  const totalPages = Math.ceil(filteredData.length / ITEMS_PER_PAGE);
  const currentData = filteredData.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  // Sort logic
  const sortedData = [...currentData].sort((a, b) => {
    if (!sortConfig.key) return 0;
    const valueA = a[sortConfig.key];
    const valueB = b[sortConfig.key];
    if (valueA < valueB) return sortConfig.direction === "asc" ? -1 : 1;
    if (valueA > valueB) return sortConfig.direction === "asc" ? 1 : -1;
    return 0;
  });

  const requestSort = (key) => {
    let direction = "asc";
    if (sortConfig.key === key && sortConfig.direction === "asc") {
      direction = "desc";
    }
    setSortConfig({ key, direction });
  };

  const SortIcon = ({ column }) => {
    if (sortConfig.key !== column) return <span className="opacity-30">⇅</span>;
    return sortConfig.direction === "asc" ? (
      <span className="text-emerald-600">▲</span>
    ) : (
      <span className="text-emerald-600">▼</span>
    );
  };

  return (
    <div className="grid grid-cols-12 gap-4">
      {/* Cột trái */}
      <div className="col-span-3 space-y-4">
        <h2 className="text-xl font-bold text-emerald-600">
          Danh sách nhóm thiết bị
        </h2>

        {/* Tìm kiếm */}
        <div className="p-3 rounded-lg shadow space-y-2 bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200">
          <h3 className="font-semibold text-sm">Tìm kiếm thông tin</h3>
          <Input
            placeholder="Tìm kiếm"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="dark:bg-gray-700 dark:text-gray-200"
          />
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setSearch("")}
              className="dark:border-gray-600"
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

        {/* Nhóm thiết bị */}
        <div className="p-3 rounded-lg shadow h-[340px] overflow-y-auto bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200">
          <h3 className="font-semibold text-sm mb-2">Hiển thị theo nhóm</h3>
          <div className="flex flex-col gap-2">
            {groups.map((g) => (
              <button
                key={g.key}
                onClick={() => {
                  setActiveGroup(g.key);
                  setCurrentPage(1);
                }}
                className={`flex items-center gap-2 px-2 py-2 rounded-md border text-sm transition
                    ${
                      activeGroup === g.key
                        ? "bg-emerald-100 border-emerald-500 text-emerald-700 dark:bg-emerald-900 dark:text-emerald-200"
                        : "bg-white border-gray-200 hover:bg-gray-50 dark:bg-gray-700 dark:border-gray-600 dark:hover:bg-gray-600"
                    }`}
              >
                <g.icon size={16} />
                <span className="flex-1">{g.name}</span>
                <span className="text-xs text-gray-500">{g.label}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Cột phải */}
      <div className="col-span-9 space-y-3">
        {/* Bảng */}
        <div className="rounded-lg shadow overflow-hidden bg-white dark:bg-gray-800">
          <div className="overflow-x-auto">
            <Table className="min-w-full border border-gray-200 dark:border-gray-700 text-gray-800 dark:text-gray-200">
              <TableHeader>
                <TableRow className="bg-gray-100 dark:bg-gray-700 text-sm font-semibold">
                  <TableHead
                    onClick={() => requestSort("id")}
                    className="text-center min-w-[60px] border border-gray-200 dark:border-gray-600 cursor-pointer"
                  >
                    # <SortIcon column="id" />
                  </TableHead>
                  <TableHead
                    onClick={() => requestSort("maTheKho")}
                    className="min-w-[120px] border border-gray-200 dark:border-gray-600 cursor-pointer"
                  >
                    Mã thẻ kho <SortIcon column="maTheKho" />
                  </TableHead>
                  <TableHead
                    onClick={() => requestSort("sku")}
                    className="min-w-[120px] border border-gray-200 dark:border-gray-600 cursor-pointer"
                  >
                    Mã SKU <SortIcon column="sku" />
                  </TableHead>
                  <TableHead className="min-w-[100px] border border-gray-200 dark:border-gray-600">
                    Hình
                  </TableHead>
                  <TableHead
                    onClick={() => requestSort("ten")}
                    className="min-w-[200px] border border-gray-200 dark:border-gray-600 cursor-pointer"
                  >
                    Tên thiết bị <SortIcon column="ten" />
                  </TableHead>
                  <TableHead className="min-w-[160px] border border-gray-200 dark:border-gray-600">
                    Nhóm
                  </TableHead>
                  <TableHead
                    onClick={() => requestSort("ngayNhap")}
                    className="min-w-[160px] border border-gray-200 dark:border-gray-600 cursor-pointer"
                  >
                    Ngày nhập <SortIcon column="ngayNhap" />
                  </TableHead>
                  <TableHead className="min-w-[140px] border border-gray-200 dark:border-gray-600">
                    Trạng thái
                  </TableHead>
                  <TableHead className="min-w-[120px] border border-gray-200 dark:border-gray-600">
                    Bảo hành
                  </TableHead>
                  <TableHead className="min-w-[150px] border border-gray-200 dark:border-gray-600">
                    Nhà cung cấp
                  </TableHead>
                  <TableHead className="min-w-[120px] border border-gray-200 dark:border-gray-600">
                    Công suất
                  </TableHead>
                  <TableHead className="min-w-[120px] text-right border border-gray-200 dark:border-gray-600">
                    Hành động
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sortedData.map((row) => (
                  <TableRow
                    key={row.id}
                    className="hover:bg-gray-50 dark:hover:bg-gray-700 text-sm"
                  >
                    <TableCell className="text-center border border-gray-200 dark:border-gray-600">
                      {row.id}
                    </TableCell>
                    <TableCell className="border border-gray-200 dark:border-gray-600">
                      {row.maTheKho}
                    </TableCell>
                    <TableCell className="border border-gray-200 dark:border-gray-600">
                      {row.sku}
                    </TableCell>
                    <TableCell className="border border-gray-200 dark:border-gray-600">
                      <img
                        src={row.img}
                        alt={row.ten}
                        className="w-12 h-10 object-contain rounded"
                      />
                    </TableCell>
                    <TableCell className="border border-gray-200 dark:border-gray-600">
                      {row.ten}
                    </TableCell>
                    <TableCell className="border border-gray-200 dark:border-gray-600">
                      {row.nhom}
                    </TableCell>
                    <TableCell className="border border-gray-200 dark:border-gray-600">
                      {row.ngayNhap}
                    </TableCell>
                    <TableCell className="border border-gray-200 dark:border-gray-600">
                      {row.trangThai === "active" && (
                        <Badge className="bg-emerald-500 text-white">
                          Hoạt động
                        </Badge>
                      )}
                      {row.trangThai === "maintenance" && (
                        <Badge className="bg-yellow-500 text-white">
                          Bảo trì
                        </Badge>
                      )}
                      {row.trangThai === "inactive" && (
                        <Badge className="bg-red-500 text-white">Ngưng</Badge>
                      )}
                    </TableCell>
                    <TableCell className="border border-gray-200 dark:border-gray-600">
                      {row.baoHanh}
                    </TableCell>
                    <TableCell className="border border-gray-200 dark:border-gray-600">
                      {row.nhaCC}
                    </TableCell>
                    <TableCell className="border border-gray-200 dark:border-gray-600">
                      {row.congSuat}
                    </TableCell>
                    <TableCell className="border border-gray-200 dark:border-gray-600 text-right space-x-1">
                      <Button size="icon" variant="outline" className="h-7 w-7">
                        <Pencil size={14} />
                      </Button>
                      <Button
                        size="icon"
                        variant="destructive"
                        className="h-7 w-7"
                      >
                        <Trash2 size={14} />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {/* Pagination */}
          <div className="flex justify-between items-center border-t px-4 py-2 bg-gray-50 dark:bg-gray-700">
            {/* Go to page */}
            <div className="flex items-center gap-2 text-sm">
              <span>Go to:</span>
              <input
                type="number"
                min={1}
                max={totalPages}
                className="w-16 px-2 py-1 border rounded text-sm dark:bg-gray-600 dark:text-gray-200"
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

            {/* Nút phân trang */}
            <div className="flex gap-1">
              <Button
                size="sm"
                variant="outline"
                onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
                className="dark:border-gray-600"
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
                      ? "bg-emerald-500 text-white font-semibold shadow-md"
                      : "hover:bg-gray-200 dark:hover:bg-gray-600 dark:text-gray-200"
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
                className="dark:border-gray-600"
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
