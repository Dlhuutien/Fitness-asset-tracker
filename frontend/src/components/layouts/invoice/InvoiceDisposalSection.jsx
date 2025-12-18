import { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, ChevronUp, FileText, Search } from "lucide-react";
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
import {
  ColumnVisibilityButton,
  HeaderFilter,
  getUniqueValues,
  useGlobalFilterController,
} from "@/components/common/ExcelTableTools";
import EquipmentDisposalService from "@/services/EquipmentDisposalService";
import DatePicker from "react-datepicker";
import { vi } from "date-fns/locale";
import "react-datepicker/dist/react-datepicker.css";
import { Calendar } from "lucide-react";

const ITEMS_PER_PAGE = 6;

function DateRangeHeaderFilter({
  label,
  start,
  end,
  onChangeStart,
  onChangeEnd,
}) {
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
      >
        <Calendar size={14} />
      </button>

      {open && (
        <div
          className="absolute z-[9999] top-[120%] left-0 min-w-[280px] bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-md shadow-lg p-3"
          onMouseDown={(e) => e.stopPropagation()}
        >
          <div className="text-xs text-gray-500 mb-2">Khoảng ngày tạo</div>
          <div className="flex items-center gap-2">
            <DatePicker
              selected={start ? new Date(start) : null}
              onChange={(d) =>
                onChangeStart(d ? d.toISOString().split("T")[0] : "")
              }
              dateFormat="dd/MM/yyyy"
              locale={vi}
              placeholderText="dd/mm/yyyy"
              className="h-8 text-sm border rounded-md px-2 w-full"
            />
            <span>—</span>
            <DatePicker
              selected={end ? new Date(end) : null}
              onChange={(d) =>
                onChangeEnd(d ? d.toISOString().split("T")[0] : "")
              }
              dateFormat="dd/MM/yyyy"
              locale={vi}
              placeholderText="dd/mm/yyyy"
              className="h-8 text-sm border rounded-md px-2 w-full"
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

export default function InvoiceDisposalSection() {
  const [expandedId, setExpandedId] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);

  const [currentPage, setCurrentPage] = useState(1);
  const [gotoPage, setGotoPage] = useState("");

  const [dateStart, setDateStart] = useState("");
  const [dateEnd, setDateEnd] = useState("");

  const [visibleColumns, setVisibleColumns] = useState({
    id: true,
    user: true,
    branch: true,
    total: true,
    created_at: true,
    note: true,
  });

  const [filterBranch, setFilterBranch] = useState([]);
  const [filterUser, setFilterUser] = useState([]);

  const controller = useGlobalFilterController();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const data = await EquipmentDisposalService.getAll();
        // sắp xếp theo ngày mới nhất
        const sorted = [...data].sort(
          (a, b) => new Date(b.created_at) - new Date(a.created_at)
        );
        setInvoices(sorted);
      } catch (err) {
        console.error("❌ Lỗi khi tải hóa đơn thanh lý:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, filterBranch, filterUser, dateStart, dateEnd]);

  const toggleExpand = (id) =>
    setExpandedId((prev) => (prev === id ? null : id));

  const allBranches = useMemo(
    () => getUniqueValues(invoices, (i) => i.branch_name),
    [invoices]
  );
  const allUsers = useMemo(
    () => getUniqueValues(invoices, (i) => i.user_name),
    [invoices]
  );

  const filtered = useMemo(() => {
    let list = invoices;
    if (searchTerm) {
      const s = searchTerm.toLowerCase();
      list = list.filter(
        (i) =>
          i.id.toLowerCase().includes(s) ||
          i.user_name.toLowerCase().includes(s) ||
          i.note.toLowerCase().includes(s) ||
          i.details.some((d) => d.equipment_name.toLowerCase().includes(s))
      );
    }
    if (filterBranch.length > 0)
      list = list.filter((i) => filterBranch.includes(i.branch_name));
    if (filterUser.length > 0)
      list = list.filter((i) => filterUser.includes(i.user_name));
    if (dateStart) {
      const start = new Date(dateStart);
      list = list.filter((i) => new Date(i.created_at) >= start);
    }
    if (dateEnd) {
      const end = new Date(dateEnd);
      end.setHours(23, 59, 59, 999);
      list = list.filter((i) => new Date(i.created_at) <= end);
    }
    return list;
  }, [invoices, searchTerm, filterBranch, filterUser, dateStart, dateEnd]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / ITEMS_PER_PAGE));
  const paginated = filtered.slice(
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

  if (loading)
    return (
      <div className="text-center py-10 text-gray-500">
        Đang tải danh sách hóa đơn thanh lý...
      </div>
    );

  return (
    <div className="mt-6 bg-white dark:bg-gray-800 rounded-lg shadow p-5">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <div className="flex items-center gap-2">
          <FileText className="text-rose-500" />
          <h2 className="text-lg font-semibold text-rose-600">
            Danh sách hóa đơn thanh lý
          </h2>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-3 text-gray-400 w-4 h-4" />
            <Input
              placeholder="Tìm mã, người tạo, ghi chú, thiết bị..."
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
              total: "Tổng giá trị",
              created_at: "Ngày tạo",
              note: "Ghi chú",
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
              {visibleColumns.id && <TableHead>Mã hóa đơn</TableHead>}
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
              {visibleColumns.total && <TableHead>Tổng giá trị</TableHead>}
              {visibleColumns.note && <TableHead>Ghi chú</TableHead>}
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
                <TableCell
                  colSpan={8}
                  className="text-center py-4 text-gray-500"
                >
                  Không có hóa đơn nào.
                </TableCell>
              </TableRow>
            ) : (
              paginated.map((inv, i) => (
                <>
                  <TableRow
                    key={inv.id}
                    onClick={() => toggleExpand(inv.id)}
                    className="text-sm cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 transition"
                  >
                    <TableCell>
                      {(currentPage - 1) * ITEMS_PER_PAGE + i + 1}
                    </TableCell>
                    {visibleColumns.id && (
                      <TableCell className="font-medium text-rose-600">
                        {inv.id}
                      </TableCell>
                    )}
                    {visibleColumns.user && (
                      <TableCell>{inv.user_name}</TableCell>
                    )}
                    {visibleColumns.branch && (
                      <TableCell>{inv.branch_name}</TableCell>
                    )}
                    {visibleColumns.total && (
                      <TableCell>
                        {Number(inv.total_value).toLocaleString("vi-VN")}₫
                      </TableCell>
                    )}
                    {visibleColumns.note && (
                      <TableCell>{inv.note || "—"}</TableCell>
                    )}
                    {visibleColumns.created_at && (
                      <TableCell>
                        {new Date(inv.created_at).toLocaleString("vi-VN")}
                      </TableCell>
                    )}
                    <TableCell className="text-center">
                      {expandedId === inv.id ? (
                        <ChevronUp className="mx-auto text-rose-500" />
                      ) : (
                        <ChevronDown className="mx-auto text-gray-500" />
                      )}
                    </TableCell>
                  </TableRow>

                  <AnimatePresence>
                    {expandedId === inv.id && (
                      <motion.tr
                        key={`${inv.id}-details`}
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        transition={{ duration: 0.25 }}
                        className="bg-rose-50 dark:bg-gray-900/40"
                      >
                        <td colSpan={8} className="p-0">
                          <div className="overflow-hidden px-5 py-3">
                            <p className="text-sm font-semibold mb-2 text-gray-700 dark:text-gray-200">
                              Thiết bị đã thanh lý:
                            </p>
                            <Table className="min-w-[800px]">
                              <TableHeader>
                                <TableRow className="bg-rose-100 dark:bg-gray-800 text-xs font-semibold">
                                  <TableHead>#</TableHead>
                                  <TableHead>Mã thiết bị</TableHead>
                                  <TableHead>Tên thiết bị</TableHead>
                                  <TableHead>Giá gốc</TableHead>
                                  <TableHead>Giá thu hồi</TableHead>
                                  <TableHead>Ngày tạo</TableHead>
                                </TableRow>
                              </TableHeader>
                              <TableBody>
                                {inv.details.map((d, idx) => (
                                  <TableRow key={d.id} className="text-xs">
                                    <TableCell>{idx + 1}</TableCell>
                                    <TableCell>{d.equipment_unit_id}</TableCell>
                                    <TableCell>{d.equipment_name}</TableCell>
                                    <TableCell>
                                      {Number(d.cost_original).toLocaleString(
                                        "vi-VN"
                                      )}
                                      ₫
                                    </TableCell>
                                    <TableCell>
                                      {Number(d.value_recovered).toLocaleString(
                                        "vi-VN"
                                      )}
                                      ₫
                                    </TableCell>
                                    <TableCell>
                                      {new Date(d.created_at).toLocaleString(
                                        "vi-VN"
                                      )}
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
              ))
            )}
          </TableBody>
        </Table>
      </div>

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
            disabled={
              !gotoPage || Number(gotoPage) < 1 || Number(gotoPage) > totalPages
            }
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
  );
}
