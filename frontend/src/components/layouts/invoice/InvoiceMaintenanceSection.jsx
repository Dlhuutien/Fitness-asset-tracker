import { useState, useMemo, useEffect, Fragment } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ChevronDown,
  ChevronUp,
  Wrench,
  Search,
  Calendar,
  ClipboardList,
} from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/buttonn";
import MaintainService from "@/services/MaintainService";

const ITEMS_PER_PAGE = 5;

export default function InvoiceMaintenanceSection() {
  const [expandedId, setExpandedId] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [maintenances, setMaintenances] = useState([]);
  const [loading, setLoading] = useState(true);

  // 🗓 Lọc thời gian
  const [dateFilterType, setDateFilterType] = useState("all");
  const [selectedDay, setSelectedDay] = useState("");
  const [selectedMonth, setSelectedMonth] = useState("");
  const [selectedYear, setSelectedYear] = useState("");
  const [rangeStart, setRangeStart] = useState("");
  const [rangeEnd, setRangeEnd] = useState("");
  const [currentPage, setCurrentPage] = useState(1);

  const toggleExpand = (id) => {
    setExpandedId((prev) => (prev === id ? null : id));
  };

  // 🧭 Fetch API
  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await MaintainService.getAll();
        setMaintenances(res || []);
      } catch (err) {
        console.error("❌ Lỗi khi load danh sách bảo trì:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  // 🔍 Filter & Search
  const filteredData = useMemo(() => {
    return maintenances.filter((m) => {
      const search = searchTerm.toLowerCase();
      const matchesSearch =
        (m.equipment_name || "").toLowerCase().includes(search) ||
        (m.equipment_unit_id || "").toLowerCase().includes(search) ||
        (m.maintenance_reason || "").toLowerCase().includes(search) ||
        (m.requested_by_name || "").toLowerCase().includes(search) ||
        (m.technician_name || "").toLowerCase().includes(search);

      const createdAt = new Date(m.start_date);
      let matchesDate = true;

      if (dateFilterType === "day" && selectedDay) {
        const selected = new Date(selectedDay);
        matchesDate = createdAt.toDateString() === selected.toDateString();
      } else if (dateFilterType === "month" && selectedMonth) {
        const [year, month] = selectedMonth.split("-");
        matchesDate =
          createdAt.getFullYear() === parseInt(year) &&
          createdAt.getMonth() + 1 === parseInt(month);
      } else if (dateFilterType === "year" && selectedYear) {
        matchesDate = createdAt.getFullYear() === parseInt(selectedYear);
      } else if (dateFilterType === "range" && rangeStart && rangeEnd) {
        const start = new Date(rangeStart);
        const end = new Date(rangeEnd);
        matchesDate = createdAt >= start && createdAt <= end;
      }

      return matchesSearch && matchesDate;
    });
  }, [
    searchTerm,
    dateFilterType,
    selectedDay,
    selectedMonth,
    selectedYear,
    rangeStart,
    rangeEnd,
    maintenances,
  ]);

  // 📄 Pagination
  const totalPages = Math.ceil(filteredData.length / ITEMS_PER_PAGE);
  const paginatedData = filteredData.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  const goToPage = (page) => {
    if (page >= 1 && page <= totalPages) setCurrentPage(page);
  };

  if (loading)
    return (
      <div className="text-center py-10 text-gray-500">
        Đang tải danh sách bảo trì...
      </div>
    );

  // ===================== UI =====================
  return (
    <div className="mt-6 bg-white dark:bg-gray-800 rounded-lg shadow p-5">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <div className="flex items-center gap-2">
          <Wrench className="text-emerald-500" />
          <h2 className="text-lg font-semibold text-emerald-600">
            🧾 Danh sách bảo trì thiết bị
          </h2>
        </div>

        {/* Search + Filter */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-3 text-gray-400 w-4 h-4" />
            <Input
              placeholder="Tìm thiết bị, kỹ thuật viên, người yêu cầu..."
              className="pl-8 w-80 h-10 text-sm"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <div className="flex items-center gap-2">
            <Calendar className="text-gray-500" />
            <select
              className="border border-gray-300 dark:border-gray-700 rounded-md px-2 py-1.5 text-sm bg-white dark:bg-gray-900"
              value={dateFilterType}
              onChange={(e) => setDateFilterType(e.target.value)}
            >
              <option value="all">Tất cả thời gian</option>
              <option value="day">Theo ngày</option>
              <option value="month">Theo tháng</option>
              <option value="year">Theo năm</option>
              <option value="range">Khoảng thời gian</option>
            </select>

            {dateFilterType === "day" && (
              <Input
                type="date"
                value={selectedDay}
                onChange={(e) => setSelectedDay(e.target.value)}
                className="h-9 text-sm"
              />
            )}
            {dateFilterType === "month" && (
              <Input
                type="month"
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
                className="h-9 text-sm"
              />
            )}
            {dateFilterType === "year" && (
              <Input
                type="number"
                placeholder="Năm (vd: 2025)"
                value={selectedYear}
                onChange={(e) => setSelectedYear(e.target.value)}
                className="h-9 text-sm w-24"
              />
            )}
            {dateFilterType === "range" && (
              <>
                <Input
                  type="date"
                  value={rangeStart}
                  onChange={(e) => setRangeStart(e.target.value)}
                  className="h-9 text-sm"
                />
                <span className="text-gray-500">-</span>
                <Input
                  type="date"
                  value={rangeEnd}
                  onChange={(e) => setRangeEnd(e.target.value)}
                  className="h-9 text-sm"
                />
              </>
            )}
          </div>
        </div>
      </div>

      {/* Table chính */}
      <Table>
        <TableHeader>
          <TableRow className="bg-gray-100 dark:bg-gray-700 text-sm font-semibold">
            <TableHead>#</TableHead>
            <TableHead>Chi nhánh</TableHead>
            <TableHead>Mã thiết bị</TableHead>
            <TableHead>Tên thiết bị</TableHead>
            <TableHead>Giá bảo trì</TableHead>
            <TableHead>Ngày bắt đầu</TableHead>
            <TableHead>Ngày kết thúc</TableHead>
            <TableHead className="text-center">Chi tiết</TableHead>
          </TableRow>
        </TableHeader>

        <TableBody>
          {paginatedData.length === 0 ? (
            <TableRow>
              <TableCell colSpan={8} className="text-center py-4 text-gray-500">
                Không có dữ liệu bảo trì.
              </TableCell>
            </TableRow>
          ) : (
            paginatedData.map((m, idx) => {
              const invoice = m.invoices?.[0];
              return (
                <Fragment key={m.id}>
                  <TableRow
                    onClick={() => toggleExpand(m.id)}
                    className="text-sm cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 transition"
                  >
                    <TableCell>
                      {(currentPage - 1) * ITEMS_PER_PAGE + idx + 1}
                    </TableCell>
                    <TableCell>{m.branch_id}</TableCell>
                    <TableCell>{m.equipment_unit_id}</TableCell>
                    <TableCell>{m.equipment_name || "Không rõ"}</TableCell>
                    <TableCell>
                      {invoice
                        ? `${invoice.cost.toLocaleString("vi-VN")}₫`
                        : "—"}
                    </TableCell>
                    <TableCell>
                      {new Date(m.start_date).toLocaleString("vi-VN")}
                    </TableCell>
                    <TableCell>
                      {new Date(m.end_date).toLocaleString("vi-VN")}
                    </TableCell>
                    <TableCell className="text-center">
                      {expandedId === m.id ? (
                        <ChevronUp className="mx-auto text-emerald-500" />
                      ) : (
                        <ChevronDown className="mx-auto text-gray-500" />
                      )}
                    </TableCell>
                  </TableRow>

                  {/* Chi tiết */}
                  <AnimatePresence>
                    {expandedId === m.id && (
                      <motion.tr
                        key={`${m.id}-details`}
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        transition={{ duration: 0.25 }}
                        className="bg-emerald-50 dark:bg-gray-900/40"
                      >
                        <td colSpan={8} className="p-0">
                          <div className="overflow-hidden px-5 py-3">
                            <div className="flex items-center gap-2 mb-2 font-semibold text-emerald-600">
                              <ClipboardList className="w-4 h-4" />
                              Chi tiết bảo trì
                            </div>

                            <Table className="min-w-[700px]">
                              <TableHeader>
                                <TableRow className="bg-emerald-100 dark:bg-gray-800 text-xs font-semibold">
                                  <TableHead>#</TableHead>
                                  <TableHead>Lý do bảo trì</TableHead>
                                  <TableHead>Chi tiết bảo trì</TableHead>
                                  <TableHead>Người yêu cầu</TableHead>
                                  <TableHead>Kỹ thuật viên</TableHead>
                                </TableRow>
                              </TableHeader>
                              <TableBody>
                                <TableRow className="text-xs">
                                  <TableCell>1</TableCell>
                                  <TableCell>{m.maintenance_reason}</TableCell>
                                  <TableCell className="max-w-[300px]">
                                    {m.maintenance_detail ||
                                      "Không có ghi chú."}
                                  </TableCell>
                                  <TableCell>{m.requested_by_name}</TableCell>
                                  <TableCell>{m.technician_name}</TableCell>
                                </TableRow>
                              </TableBody>
                            </Table>
                          </div>
                        </td>
                      </motion.tr>
                    )}
                  </AnimatePresence>
                </Fragment>
              );
            })
          )}
        </TableBody>
      </Table>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-end mt-4 items-center gap-2">
          <Button
            size="sm"
            variant="outline"
            disabled={currentPage === 1}
            onClick={() => goToPage(currentPage - 1)}
          >
            ← Trước
          </Button>
          <span className="text-sm text-gray-600 dark:text-gray-300">
            Trang {currentPage} / {totalPages}
          </span>
          <Button
            size="sm"
            variant="outline"
            disabled={currentPage === totalPages}
            onClick={() => goToPage(currentPage + 1)}
          >
            Tiếp →
          </Button>
        </div>
      )}
    </div>
  );
}
