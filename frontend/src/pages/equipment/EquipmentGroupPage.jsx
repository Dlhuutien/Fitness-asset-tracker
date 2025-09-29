import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button"; // Button B hoa
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
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

// Các nhóm
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

// Fake dữ liệu 20 thiết bị
const data = Array.from({ length: 20 }).map((_, i) => ({
  id: i + 1,
  maTheKho: i % 2 === 0 ? "CAOTMJS" : "WEIHRDJS",
  img: "https://via.placeholder.com/60x40.png?text=Equip",
  ten: i % 2 === 0 ? "Designer treadmill" : "Xult Dumbbell Rack",
  nhom: i % 2 === 0 ? "Cardio Machines" : "Weights",
  loai: i % 2 === 0 ? "Treadmill" : "Rubber Dumbbells",
  nhaCC: "Johnson Fitness",
  ngayNhap: "Thứ 5, 27/08/2025 14:46",
}));

const ITEMS_PER_PAGE = 7;

export default function EquipmentGroupPage() {
  const [activeGroup, setActiveGroup] = useState("all");
  const [search, setSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [goToPage, setGoToPage] = useState("");

  // Lọc theo nhóm
  const filteredData = data.filter((d) => {
    const groupName = groups.find((g) => g.key === activeGroup)?.name;
    if (activeGroup === "all")
      return d.ten.toLowerCase().includes(search.toLowerCase());
    return (
      d.nhom === groupName && d.ten.toLowerCase().includes(search.toLowerCase())
    );
  });

  const totalPages = Math.ceil(filteredData.length / ITEMS_PER_PAGE);
  const currentData = filteredData.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
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
            placeholder="Nhập tên loại"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
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

        {/* Nhóm thiết bị */}
        <div className="p-3 bg-white dark:bg-gray-800 rounded-lg shadow h-[340px] overflow-y-auto">
          <h3 className="font-semibold text-sm mb-2 dark:text-gray-200">
            Hiển thị theo nhóm
          </h3>
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
                      : "bg-white border-gray-200 hover:bg-gray-50 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-200"
                  }`}
              >
                <g.icon size={16} />
                <span className="flex-1">{g.name}</span>
                <span className="text-xs text-gray-500 dark:text-gray-400">
                  {g.label}
                </span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="col-span-9 space-y-3">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
          <div className="overflow-x-auto">
            <Table className="min-w-[1000px] border border-gray-200 dark:border-gray-600">
              <TableHeader>
                <TableRow className="bg-gray-100 dark:bg-gray-700 text-sm font-semibold">
                  <TableHead className="text-center border dark:border-gray-600">
                    #
                  </TableHead>
                  <TableHead className="border dark:border-gray-600">
                    Mã thẻ kho
                  </TableHead>
                  <TableHead className="border dark:border-gray-600">
                    Hình ảnh
                  </TableHead>
                  <TableHead className="border dark:border-gray-600">
                    Tên thiết bị
                  </TableHead>
                  <TableHead className="border dark:border-gray-600">
                    Nhóm
                  </TableHead>
                  <TableHead className="border dark:border-gray-600">
                    Tên loại
                  </TableHead>
                  <TableHead className="border dark:border-gray-600">
                    Nhà cung cấp
                  </TableHead>
                  <TableHead className="border dark:border-gray-600">
                    Ngày tạo
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {currentData.map((row, idx) => (
                  <TableRow
                    key={row.id}
                    className="hover:bg-gray-50 dark:hover:bg-gray-700 text-sm"
                  >
                    <TableCell className="text-center border dark:border-gray-600">
                      {(currentPage - 1) * ITEMS_PER_PAGE + idx + 1}
                    </TableCell>
                    <TableCell className="border dark:border-gray-600">
                      {row.maTheKho}
                    </TableCell>
                    <TableCell className="border dark:border-gray-600">
                      <img
                        src={row.img}
                        alt={row.ten}
                        className="w-12 h-10 object-contain rounded"
                      />
                    </TableCell>
                    <TableCell className="border dark:border-gray-600">
                      {row.ten}
                    </TableCell>
                    <TableCell className="border dark:border-gray-600">
                      {row.nhom}
                    </TableCell>
                    <TableCell className="border italic text-gray-600 dark:text-gray-300">
                      {row.loai}
                    </TableCell>
                    <TableCell className="border dark:border-gray-600">
                      {row.nhaCC}
                    </TableCell>
                    <TableCell className="border dark:border-gray-600">
                      {row.ngayNhap}
                    </TableCell>
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
