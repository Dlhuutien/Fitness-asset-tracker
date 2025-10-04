import { useState, useEffect } from "react";
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
import EquipmentService from "@/services/equipmentService";
import CategoryMainService from "@/services/categoryMainService";

const ITEMS_PER_PAGE = 7;

export default function EquipmentGroupPage() {
  const [groups, setGroups] = useState([]);
  const [activeGroup, setActiveGroup] = useState("all");
  const [equipments, setEquipments] = useState([]);
  const [search, setSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [goToPage, setGoToPage] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAll = async () => {
      setLoading(true);
      try {
        const [cats, eqs] = await Promise.all([
          CategoryMainService.getAll().catch((e) => {
            console.error("Lỗi load categoryMain:", e);
            return [];
          }),
          EquipmentService.getAll().catch((e) => {
            console.error("Lỗi load equipments:", e);
            return [];
          }),
        ]);
        // Thêm "Xem tất cả" lên đầu
        setGroups([{ id: "all", name: "Xem tất cả" }, ...cats]);
        setEquipments(eqs);
      } finally {
        setLoading(false);
      }
    };
    fetchAll();
  }, []);

  const filteredData = equipments.filter((d) => {
    const q = search.trim().toLowerCase();
    const matchSearch = !q || (d.name || "").toLowerCase().includes(q);
    if (activeGroup === "all") return matchSearch;
    return d.main_name === activeGroup && matchSearch;
  });

  const totalPages = Math.max(1, Math.ceil(filteredData.length / ITEMS_PER_PAGE));
  const currentData = filteredData.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  if (loading) return <div className="p-4">Đang tải dữ liệu thiết bị...</div>;

  return (
    <div className="grid grid-cols-12 gap-4">
      {/* Sidebar */}
      <div className="col-span-3 space-y-4">
        <h2 className="text-xl font-bold text-emerald-600 dark:text-emerald-400">
          Danh sách nhóm thiết bị
        </h2>

        {/* Tìm kiếm */}
        <div className="p-3 bg-white dark:bg-gray-800 rounded-lg shadow space-y-2">
          <h3 className="font-semibold text-sm dark:text-gray-200">Tìm kiếm loại</h3>
          <Input
            placeholder="Nhập tên loại"
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

        {/* Nhóm thiết bị (có ảnh thật từ API) */}
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
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
          <div className="overflow-x-auto">
            <Table className="min-w-[1000px] border border-gray-200 dark:border-gray-600">
              <TableHeader>
                <TableRow className="bg-gray-100 dark:bg-gray-700 text-sm font-semibold">
                  <TableHead className="text-center border dark:border-gray-600">#</TableHead>
                  <TableHead className="border dark:border-gray-600">Mã thẻ kho</TableHead>
                  <TableHead className="border dark:border-gray-600">Hình ảnh</TableHead>
                  <TableHead className="border dark:border-gray-600">Tên thiết bị</TableHead>
                  <TableHead className="border dark:border-gray-600">Nhóm</TableHead>
                  <TableHead className="border dark:border-gray-600">Tên loại</TableHead>
                  <TableHead className="border dark:border-gray-600">Nhà cung cấp</TableHead>
                  <TableHead className="border dark:border-gray-600">Ngày tạo</TableHead>
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
                    <TableCell className="border dark:border-gray-600">{row.id}</TableCell>
                    <TableCell className="border dark:border-gray-600">
                      <img
                        src={row.image}
                        alt={row.name}
                        className="w-12 h-10 object-contain rounded"
                      />
                    </TableCell>
                    <TableCell className="border dark:border-gray-600">{row.name}</TableCell>
                    <TableCell className="border dark:border-gray-600">{row.main_name}</TableCell>
                    <TableCell className="border italic text-gray-600 dark:text-gray-300">
                      {row.type_name}
                    </TableCell>
                    <TableCell className="border dark:border-gray-600">{row.vendor_name}</TableCell>
                    <TableCell className="border dark:border-gray-600">
                      {row.created_at
                        ? new Date(row.created_at).toLocaleString("vi-VN")
                        : "-"}
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
                onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
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
