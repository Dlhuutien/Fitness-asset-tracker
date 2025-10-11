import { useState, useMemo, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ChevronDown,
  ChevronUp,
  FileText,
  Search,
  Calendar,
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
import InvoiceService from "@/services/invoiceService";

const ITEMS_PER_PAGE = 5;

export default function InvoiceImportSection() {
  const [expandedInvoiceId, setExpandedInvoiceId] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [invoices, setInvoices] = useState([]);
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
    setExpandedInvoiceId((prev) => (prev === id ? null : id));
  };

  // =====================
  // 🧾 Gọi API lấy toàn bộ chi tiết hóa đơn
  // =====================
  useEffect(() => {
    const fetchData = async () => {
      try {
        const data = await InvoiceService.getAllDetails();

        // Nhóm các detail theo invoice id
        const grouped = data.reduce((acc, item) => {
          const inv = item.invoice;
          const det = item.detail;

          if (!acc[inv.id]) {
            acc[inv.id] = { invoice: inv, details: [] };
          }
          acc[inv.id].details.push(det);
          return acc;
        }, {});

        setInvoices(Object.values(grouped));
      } catch (err) {
        console.error("❌ Lỗi khi load danh sách hóa đơn:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // =====================
  // 🔍 Filter + Search Logic
  // =====================
  const filteredInvoices = useMemo(() => {
    return invoices.filter((inv) => {
      const { invoice, details } = inv;
      const search = searchTerm.toLowerCase();

      const matchesSearch =
        invoice.id.toLowerCase().includes(search) ||
        invoice.user_name.toLowerCase().includes(search) ||
        details.some((d) =>
          d.equipment_unit_id.toLowerCase().includes(search)
        );

      const createdAt = new Date(invoice.created_at);

      // 🧭 Lọc thời gian
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
    invoices,
    searchTerm,
    dateFilterType,
    selectedDay,
    selectedMonth,
    selectedYear,
    rangeStart,
    rangeEnd,
  ]);

  // =====================
  // 📄 Pagination
  // =====================
  const totalPages = Math.ceil(filteredInvoices.length / ITEMS_PER_PAGE);
  const paginatedInvoices = filteredInvoices.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  const goToPage = (page) => {
    if (page >= 1 && page <= totalPages) setCurrentPage(page);
  };

  if (loading)
    return (
      <div className="text-center py-10 text-gray-500">
        Đang tải danh sách hóa đơn...
      </div>
    );

  return (
    <div className="mt-6 bg-white dark:bg-gray-800 rounded-lg shadow p-5">
      {/* Header + Search */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <div className="flex items-center gap-2">
          <FileText className="text-emerald-500" />
          <h2 className="text-lg font-semibold text-emerald-600">
            📦 Danh sách hóa đơn nhập
          </h2>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-3 text-gray-400 w-4 h-4" />
            <Input
              placeholder="Tìm mã hóa đơn, thiết bị, người tạo..."
              className="pl-8 w-72 h-10 text-sm"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          {/* 🗓 Date filter */}
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

      {/* Table */}
      <Table>
        <TableHeader>
          <TableRow className="bg-gray-100 dark:bg-gray-700 text-sm font-semibold">
            <TableHead>#</TableHead>
            <TableHead>Mã hóa đơn</TableHead>
            <TableHead>Người tạo</TableHead>
            <TableHead>Chi nhánh</TableHead> {/* 🏢 Thêm cột */}
            <TableHead>Tổng tiền</TableHead>
            <TableHead>Ngày tạo</TableHead>
            <TableHead className="text-center">Chi tiết</TableHead>
          </TableRow>
        </TableHeader>

        <TableBody>
          {paginatedInvoices.length === 0 ? (
            <TableRow>
              <TableCell colSpan={7} className="text-center py-4 text-gray-500">
                Không tìm thấy hóa đơn nào.
              </TableCell>
            </TableRow>
          ) : (
            paginatedInvoices.map((inv, idx) => {
              // 🏢 Lấy chi nhánh từ thiết bị đầu tiên
              const branch =
                inv.details[0]?.equipment_unit?.branch_id || "—";

              return (
                <>
                  <TableRow
                    key={inv.invoice.id}
                    onClick={() => toggleExpand(inv.invoice.id)}
                    className="text-sm cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 transition"
                  >
                    <TableCell>
                      {(currentPage - 1) * ITEMS_PER_PAGE + idx + 1}
                    </TableCell>
                    <TableCell className="font-medium text-emerald-600">
                      {inv.invoice.id}
                    </TableCell>
                    <TableCell>{inv.invoice.user_name}</TableCell>
                    <TableCell>{branch}</TableCell>
                    <TableCell>
                      {inv.invoice.total.toLocaleString("vi-VN")}₫
                    </TableCell>
                    <TableCell>
                      {new Date(inv.invoice.created_at).toLocaleString("vi-VN")}
                    </TableCell>
                    <TableCell className="text-center">
                      {expandedInvoiceId === inv.invoice.id ? (
                        <ChevronUp className="mx-auto text-emerald-500" />
                      ) : (
                        <ChevronDown className="mx-auto text-gray-500" />
                      )}
                    </TableCell>
                  </TableRow>

                  <AnimatePresence>
                    {expandedInvoiceId === inv.invoice.id && (
                      <motion.tr
                        key={`${inv.invoice.id}-details`}
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        transition={{ duration: 0.25 }}
                        className="bg-emerald-50 dark:bg-gray-900/40"
                      >
                        <td colSpan={7} className="p-0">
                          <div className="overflow-hidden px-5 py-3">
                            <p className="text-sm font-semibold mb-2 text-gray-700 dark:text-gray-200">
                              Chi tiết thiết bị:
                            </p>
                            <Table className="min-w-[800px]">
                              <TableHeader>
                                <TableRow className="bg-emerald-100 dark:bg-gray-800 text-xs font-semibold">
                                  <TableHead>#</TableHead>
                                  <TableHead>Mã thiết bị</TableHead>
                                  <TableHead>Tên thiết bị</TableHead> {/* 🔄 đổi từ Chi nhánh */}
                                  <TableHead>Trạng thái</TableHead>
                                  <TableHead>Giá nhập</TableHead>
                                  <TableHead>Ngày tạo</TableHead>
                                </TableRow>
                              </TableHeader>
                              <TableBody>
                                {inv.details.map((d, i) => (
                                  <TableRow key={d.id} className="text-xs">
                                    <TableCell>{i + 1}</TableCell>
                                    <TableCell>{d.equipment_unit_id}</TableCell>
                                    <TableCell>
                                      {d.equipment_unit?.equipment_name || "Không rõ"}
                                    </TableCell>
                                    <TableCell>
                                      {d.equipment_unit?.status || "—"}
                                    </TableCell>
                                    <TableCell>
                                      {d.cost.toLocaleString("vi-VN")}₫
                                    </TableCell>
                                    <TableCell>
                                      {new Date(
                                        d.created_at
                                      ).toLocaleString("vi-VN")}
                                    </TableCell>
                                  </TableRow>
                                ))}
                              </TableBody>
                            </Table>
                          </div>
                        </td>
                      </motion.tr>
                    )}
                  </AnimatePresence>
                </>
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
