import { useState } from "react";
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

const ITEMS_PER_PAGE = 8;

// 🟢 Dịch trạng thái
const STATUS_MAP = {
  active: "Hoạt động",
  inactive: "Ngưng hoạt động",
  "temporary urgent": "Ngừng khẩn cấp",
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

  // SWR fetch — chỉ gọi API 1 lần, tự cache 5 phút
  const { eqUnits, eqErr, unitLoading, cats, catErr, catLoading } = useEquipmentData();

  // Kết hợp dữ liệu
  const groups = [{ id: "all", name: "Xem tất cả" }, ...(cats || [])];
  const units = eqUnits || [];

  // Lọc dữ liệu
  const filtered = units.filter((u) => {
    const q = search.trim().toLowerCase();
    const matchSearch =
      !q ||
      u.equipment?.name?.toLowerCase().includes(q) ||
      u.equipment?.vendor_name?.toLowerCase().includes(q) ||
      u.equipment?.type_name?.toLowerCase().includes(q);
    if (activeGroup === "all") return matchSearch;
    return u.equipment?.main_name === activeGroup && matchSearch;
  });

  const totalPages = Math.max(1, Math.ceil(filtered.length / ITEMS_PER_PAGE));
  const currentData = filtered.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  // Loading state
  if (unitLoading || catLoading)
    return <div className="p-4 animate-pulse text-gray-500">Đang tải dữ liệu...</div>;
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
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
          <div className="overflow-x-auto">
            <Table className="min-w-[1100px] border border-gray-200 dark:border-gray-600">
              <TableHeader>
                <TableRow className="bg-gray-100 dark:bg-gray-700 text-sm font-semibold">
                  <TableHead className="text-center border dark:border-gray-600">#</TableHead>
                  <TableHead className="border dark:border-gray-600">Mã đơn vị</TableHead>
                  <TableHead className="border dark:border-gray-600">Hình ảnh</TableHead>
                  <TableHead className="border dark:border-gray-600">Tên thiết bị</TableHead>
                  <TableHead className="border dark:border-gray-600">Nhóm</TableHead>
                  <TableHead className="border dark:border-gray-600">Loại</TableHead>
                  <TableHead className="border dark:border-gray-600 text-center">Trạng thái</TableHead>
                  <TableHead className="border dark:border-gray-600">Nhà cung cấp</TableHead>
                  <TableHead className="border dark:border-gray-600">Ngày tạo</TableHead>
                </TableRow>
              </TableHeader>

              <TableBody>
                {currentData.map((row, idx) => {
                  const normalized =
                    typeof row.status === "string"
                      ? row.status.trim().toLowerCase()
                      : "unknown";
                  const translated = STATUS_MAP[normalized] || "Không xác định";

                  return (
                    <TableRow
                      key={row.id ?? idx}
                      className="hover:bg-gray-50 dark:hover:bg-gray-700 text-sm transition"
                    >
                      <TableCell className="text-center border dark:border-gray-600">
                        {(currentPage - 1) * ITEMS_PER_PAGE + idx + 1}
                      </TableCell>
                      <TableCell className="border dark:border-gray-600 font-medium">
                        {row.id}
                      </TableCell>
                      <TableCell className="border dark:border-gray-600">
                        <img
                          src={row.equipment?.image}
                          alt={row.equipment?.name}
                          className="w-12 h-10 object-contain rounded"
                        />
                      </TableCell>
                      <TableCell className="border dark:border-gray-600">
                        {row.equipment?.name}
                      </TableCell>
                      <TableCell className="border dark:border-gray-600">
                        {row.equipment?.main_name}
                      </TableCell>
                      <TableCell className="border dark:border-gray-600">
                        {row.equipment?.type_name}
                      </TableCell>
                      <TableCell className="border text-center dark:border-gray-600">
                        <Status status={translated} />
                      </TableCell>
                      <TableCell className="border dark:border-gray-600">
                        {row.equipment?.vendor_name}
                      </TableCell>
                      <TableCell className="border dark:border-gray-600">
                        {new Date(row.created_at).toLocaleString("vi-VN")}
                      </TableCell>
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
