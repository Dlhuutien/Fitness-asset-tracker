import { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import DatePicker from "react-datepicker";
import { vi } from "date-fns/locale";
import "react-datepicker/dist/react-datepicker.css";

import {
  ChevronDown,
  ChevronUp,
  FileText,
  Search,
  Filter as FilterIcon,
  Calendar as CalendarIcon,
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
import {
  HeaderFilter,
  ColumnVisibilityButton,
  getUniqueValues,
  useGlobalFilterController,
} from "@/components/common/ExcelTableTools";

/* ====== Bộ lọc khoảng tổng tiền ====== */
function NumberRangeHeaderFilter({ label, min, max, onChangeMin, onChangeMax }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="relative inline-flex items-center gap-1 select-none">
      <span className="text-sm font-medium text-gray-700 dark:text-gray-200">
        {label}
      </span>
      <button
        onClick={(e) => {
          e.stopPropagation();
          setOpen((p) => !p);
        }}
        className={`w-4 h-4 opacity-70 hover:opacity-100 ${
          open ? "text-emerald-500" : "text-gray-400 dark:text-gray-300"
        }`}
        title="Lọc khoảng (min/max)"
      >
        <FilterIcon size={14} />
      </button>
      {open && (
        <div
          className="absolute z-[9999] top-[120%] left-0 min-w-[220px] bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-md shadow-lg p-2"
          onMouseDown={(e) => e.stopPropagation()}
        >
          <div className="text-xs text-gray-500 dark:text-gray-400 mb-2">
            Nhập khoảng tổng tiền (VND)
          </div>
          <div className="flex items-center gap-2">
            <Input
              type="number"
              placeholder="Min"
              value={min ?? ""}
              onChange={(e) => onChangeMin(e.target.value)}
              className="h-8 text-sm"
            />
            <span className="text-gray-400">—</span>
            <Input
              type="number"
              placeholder="Max"
              value={max ?? ""}
              onChange={(e) => onChangeMax(e.target.value)}
              className="h-8 text-sm"
            />
          </div>
          <div className="flex justify-end gap-2 mt-2">
            <Button
              size="sm"
              variant="outline"
              onClick={() => {
                onChangeMin("");
                onChangeMax("");
                setOpen(false);
              }}
            >
              Xóa
            </Button>
            <Button size="sm" onClick={() => setOpen(false)}>
              Áp dụng
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

/* ====== Bộ lọc khoảng ngày ====== */
/* ====== Bộ lọc khoảng ngày (dùng react-datepicker) ====== */
function DateRangeHeaderFilter({ label, start, end, onChangeStart, onChangeEnd }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="relative inline-flex items-center gap-1 select-none">
      <span className="text-sm font-medium text-gray-700 dark:text-gray-200">
        {label}
      </span>
      <button
        onClick={(e) => {
          e.stopPropagation();
          setOpen((p) => !p);
        }}
        className={`w-4 h-4 opacity-70 hover:opacity-100 ${
          open ? "text-emerald-500" : "text-gray-400 dark:text-gray-300"
        }`}
        title="Lọc theo khoảng ngày"
      >
        <CalendarIcon size={14} />
      </button>

      {open && (
        <div
          className="absolute z-[9999] top-[120%] left-0 min-w-[280px] bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-md shadow-lg p-3"
          onMouseDown={(e) => e.stopPropagation()}
        >
          <div className="text-xs text-gray-500 dark:text-gray-400 mb-2">
            Khoảng ngày tạo
          </div>
          <div className="flex items-center gap-2">
            {/* 🟩 Ngày bắt đầu */}
            <DatePicker
              selected={start ? new Date(start) : null}
              onChange={(date) =>
                onChangeStart(date ? date.toISOString().split("T")[0] : "")
              }
              dateFormat="dd/MM/yyyy"
              locale={vi}
              placeholderText="dd/mm/yyyy"
              className="h-8 text-sm border rounded-md px-2 dark:bg-gray-700 dark:text-white w-full"
              portalId="root"
              popperClassName="z-[99999]"
            />
            <span className="text-gray-400">—</span>
            {/* 🟩 Ngày kết thúc */}
            <DatePicker
              selected={end ? new Date(end) : null}
              onChange={(date) =>
                onChangeEnd(date ? date.toISOString().split("T")[0] : "")
              }
              dateFormat="dd/MM/yyyy"
              locale={vi}
              placeholderText="dd/mm/yyyy"
              className="h-8 text-sm border rounded-md px-2 dark:bg-gray-700 dark:text-white w-full"
              portalId="root"
              popperClassName="z-[99999]"
            />
          </div>
          <div className="flex justify-end gap-2 mt-3">
            <Button
              size="sm"
              variant="outline"
              onClick={() => {
                onChangeStart("");
                onChangeEnd("");
                setOpen(false);
              }}
            >
              Xóa
            </Button>
            <Button size="sm" onClick={() => setOpen(false)}>
              Áp dụng
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}


/* ====== Main Component ====== */
const ITEMS_PER_PAGE = 6;

export default function InvoiceImportSection() {
  const [expandedInvoiceId, setExpandedInvoiceId] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);

  const [currentPage, setCurrentPage] = useState(1);
  const [gotoPage, setGotoPage] = useState("");

  const [visibleColumns, setVisibleColumns] = useState({
    id: true,
    user: true,
    branch: true,
    total: true,
    created_at: true,
  });

  const [filterId, setFilterId] = useState([]);
  const [filterUser, setFilterUser] = useState([]);
  const [filterBranch, setFilterBranch] = useState([]);
  const [totalMin, setTotalMin] = useState("");
  const [totalMax, setTotalMax] = useState("");
  const [dateStart, setDateStart] = useState("");
  const [dateEnd, setDateEnd] = useState("");

  const controller = useGlobalFilterController();

  const toggleExpand = (id) => {
    setExpandedInvoiceId((prev) => (prev === id ? null : id));
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        const data = await InvoiceService.getAllDetails();
        const grouped = data.reduce((acc, item) => {
          const inv = item.invoice;
          const det = item.detail;
          if (!acc[inv.id]) acc[inv.id] = { invoice: inv, details: [] };
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

  // Reset trang khi filter/search thay đổi
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, filterId, filterUser, filterBranch, totalMin, totalMax, dateStart, dateEnd]);

  const allIds = useMemo(() => getUniqueValues(invoices, (i) => i.invoice.id), [invoices]);
  const allUsers = useMemo(() => getUniqueValues(invoices, (i) => i.invoice.user_name), [invoices]);
  const allBranches = useMemo(
    () => getUniqueValues(invoices, (i) => i.details[0]?.equipment_unit?.branch_id),
    [invoices]
  );

  // Lọc dữ liệu
  const filteredInvoices = useMemo(() => {
    let list = invoices;

    if (searchTerm) {
      const s = searchTerm.toLowerCase();
      list = list.filter(
        (inv) =>
          inv.invoice.id.toLowerCase().includes(s) ||
          inv.invoice.user_name.toLowerCase().includes(s) ||
          inv.details.some((d) => d.equipment_unit_id?.toLowerCase().includes(s))
      );
    }

    if (filterId.length > 0) list = list.filter((inv) => filterId.includes(inv.invoice.id));
    if (filterUser.length > 0) list = list.filter((inv) => filterUser.includes(inv.invoice.user_name));
    if (filterBranch.length > 0)
      list = list.filter((inv) => filterBranch.includes(inv.details[0]?.equipment_unit?.branch_id || "—"));

    const min = totalMin ? Number(totalMin) : null;
    const max = totalMax ? Number(totalMax) : null;
    if (min !== null) list = list.filter((inv) => Number(inv.invoice.total) >= min);
    if (max !== null) list = list.filter((inv) => Number(inv.invoice.total) <= max);

    if (dateStart) {
      const start = new Date(dateStart);
      list = list.filter((inv) => new Date(inv.invoice.created_at) >= start);
    }
    if (dateEnd) {
      const end = new Date(dateEnd);
      end.setHours(23, 59, 59, 999);
      list = list.filter((inv) => new Date(inv.invoice.created_at) <= end);
    }

    return list;
  }, [invoices, searchTerm, filterId, filterUser, filterBranch, totalMin, totalMax, dateStart, dateEnd]);

  const totalPages = Math.max(1, Math.ceil(filteredInvoices.length / ITEMS_PER_PAGE));
  const paginated = filteredInvoices.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  const goTo = (page) => {
    if (!Number.isFinite(page)) return;
    if (page < 1) page = 1;
    if (page > totalPages) page = totalPages;
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  if (loading) {
    return <div className="text-center py-10 text-gray-500">Đang tải danh sách hóa đơn...</div>;
  }

  return (
    <div className="mt-6 bg-white dark:bg-gray-800 rounded-lg shadow p-5">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <div className="flex items-center gap-2">
          <FileText className="text-emerald-500" />
          <h2 className="text-lg font-semibold text-emerald-600">📦 Danh sách hóa đơn nhập</h2>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-3 text-gray-400 w-4 h-4" />
            <Input
              placeholder="Tìm mã, người tạo, thiết bị..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-8 w-72 h-10 text-sm"
            />
          </div>

          <ColumnVisibilityButton
            visibleColumns={visibleColumns}
            setVisibleColumns={setVisibleColumns}
            labels={{
              id: "Mã hóa đơn",
              user: "Người tạo",
              branch: "Chi nhánh",
              total: "Tổng tiền",
              created_at: "Ngày tạo",
            }}
          />
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto rounded-md border border-gray-200 dark:border-gray-700">
        <Table className="min-w-full">
          <TableHeader>
            <TableRow className="bg-gray-100 dark:bg-gray-700 text-sm font-semibold">
              <TableHead>#</TableHead>

              {visibleColumns.id && (
                <TableHead>
                  <HeaderFilter
                    label="Mã hóa đơn"
                    values={allIds}
                    selected={filterId}
                    onChange={setFilterId}
                    selfKey="id"
                    controller={controller}
                  />
                </TableHead>
              )}

              {visibleColumns.user && (
                <TableHead>
                  <HeaderFilter
                    label="Người tạo"
                    values={allUsers}
                    selected={filterUser}
                    onChange={setFilterUser}
                    selfKey="user"
                    controller={controller}
                  />
                </TableHead>
              )}

              {visibleColumns.branch && (
                <TableHead>
                  <HeaderFilter
                    label="Chi nhánh"
                    values={allBranches}
                    selected={filterBranch}
                    onChange={setFilterBranch}
                    selfKey="branch"
                    controller={controller}
                  />
                </TableHead>
              )}

              {visibleColumns.total && (
                <TableHead>
                  <NumberRangeHeaderFilter
                    label="Tổng tiền"
                    min={totalMin}
                    max={totalMax}
                    onChangeMin={setTotalMin}
                    onChangeMax={setTotalMax}
                  />
                </TableHead>
              )}

              {visibleColumns.created_at && (
                <TableHead>
                  <DateRangeHeaderFilter
                    label="Ngày tạo"
                    start={dateStart}
                    end={dateEnd}
                    onChangeStart={setDateStart}
                    onChangeEnd={setDateEnd}
                  />
                </TableHead>
              )}

              <TableHead className="text-center">Chi tiết</TableHead>
            </TableRow>
          </TableHeader>

          <TableBody>
            {paginated.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-4 text-gray-500">
                  Không tìm thấy hóa đơn nào.
                </TableCell>
              </TableRow>
            ) : (
              paginated.map((inv, i) => {
                const branch = inv.details[0]?.equipment_unit?.branch_id || "—";
                return (
                  <>
                    <TableRow
                      key={inv.invoice.id}
                      onClick={() => toggleExpand(inv.invoice.id)}
                      className="text-sm cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 transition"
                    >
                      <TableCell>{(currentPage - 1) * ITEMS_PER_PAGE + i + 1}</TableCell>

                      {visibleColumns.id && (
                        <TableCell className="font-medium text-emerald-600">{inv.invoice.id}</TableCell>
                      )}
                      {visibleColumns.user && <TableCell>{inv.invoice.user_name}</TableCell>}
                      {visibleColumns.branch && <TableCell>{branch}</TableCell>}
                      {visibleColumns.total && (
                        <TableCell>{Number(inv.invoice.total).toLocaleString("vi-VN")}₫</TableCell>
                      )}
                      {visibleColumns.created_at && (
                        <TableCell>{new Date(inv.invoice.created_at).toLocaleString("vi-VN")}</TableCell>
                      )}

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
                                    <TableHead>Mã định danh thiết bị</TableHead>
                                    <TableHead>Tên thiết bị</TableHead>
                                    <TableHead>Trạng thái</TableHead>
                                    <TableHead>Giá nhập</TableHead>
                                    <TableHead>Ngày tạo</TableHead>
                                  </TableRow>
                                </TableHeader>
                                <TableBody>
                                  {inv.details.map((d, idx) => (
                                    <TableRow key={d.id} className="text-xs">
                                      <TableCell>{idx + 1}</TableCell>
                                      <TableCell>{d.equipment_unit_id}</TableCell>
                                      <TableCell>{d.equipment_unit?.equipment_name || "Không rõ"}</TableCell>
                                      <TableCell>{d.equipment_unit?.status || "—"}</TableCell>
                                      <TableCell>{Number(d.cost).toLocaleString("vi-VN")}₫</TableCell>
                                      <TableCell>{new Date(d.created_at).toLocaleString("vi-VN")}</TableCell>
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
        <div className="flex justify-between items-center border-t dark:border-gray-700 px-4 py-2 bg-gray-50 dark:bg-gray-700">
          <div className="flex items-center gap-2 text-sm">
            <span className="dark:text-gray-200">Go to:</span>
            <input
              type="number"
              min={1}
              max={totalPages}
              className="w-16 px-2 py-1 border rounded text-sm dark:bg-gray-700 dark:text-gray-100 dark:border-gray-600"
              value={gotoPage}
              onChange={(e) => setGotoPage(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") goTo(Number(gotoPage));
              }}
            />
            <Button
              size="sm"
              onClick={() => goTo(Number(gotoPage))}
              disabled={!gotoPage || Number(gotoPage) < 1 || Number(gotoPage) > totalPages}
              className="bg-emerald-500 hover:bg-emerald-600 text-white text-xs px-3 py-1"
            >
              Go
            </Button>
          </div>

          <div className="flex gap-1">
            <Button
              size="sm"
              variant="outline"
              onClick={() => goTo(currentPage - 1)}
              disabled={currentPage === 1}
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
                onClick={() => goTo(i + 1)}
              >
                {i + 1}
              </Button>
            ))}

            <Button
              size="sm"
              variant="outline"
              onClick={() => goTo(currentPage + 1)}
              disabled={currentPage === totalPages}
              className="dark:border-gray-600 dark:text-gray-200"
            >
              »
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
