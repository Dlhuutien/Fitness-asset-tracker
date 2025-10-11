import { useState, useMemo, useEffect, Fragment } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ChevronDown,
  ChevronUp,
  Wrench,
  Search,
  Filter as FilterIcon,
  Calendar as CalendarIcon,
  ClipboardList,
} from "lucide-react";
import DatePicker from "react-datepicker";
import { vi } from "date-fns/locale";
import "react-datepicker/dist/react-datepicker.css";

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
import {
  HeaderFilter,
  ColumnVisibilityButton,
  getUniqueValues,
  useGlobalFilterController,
} from "@/components/common/ExcelTableTools";

const ITEMS_PER_PAGE = 5;

/* ============ Bộ lọc khoảng giá ============ */
function NumberRangeHeaderFilter({ label, min, max, onChangeMin, onChangeMax }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="relative inline-flex items-center gap-1 select-none">
      <span className="text-sm font-medium text-gray-700 dark:text-gray-200">{label}</span>
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
          <div className="text-xs text-gray-500 dark:text-gray-400 mb-2">Nhập khoảng giá bảo trì (VND)</div>
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

/* ============ Bộ lọc khoảng ngày ============ */
function DateRangeHeaderFilter({ label, start, end, onChangeStart, onChangeEnd }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="relative inline-flex items-center gap-1 select-none">
      <span className="text-sm font-medium text-gray-700 dark:text-gray-200">{label}</span>
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
          <div className="text-xs text-gray-500 dark:text-gray-400 mb-2">Khoảng ngày</div>
          <div className="flex items-center gap-2">
            <DatePicker
              selected={start ? new Date(start) : null}
              onChange={(date) => onChangeStart(date ? date.toISOString().split("T")[0] : "")}
              dateFormat="dd/MM/yyyy"
              locale={vi}
              placeholderText="dd/mm/yyyy"
              className="h-8 text-sm border rounded-md px-2 dark:bg-gray-700 dark:text-white w-full"
            />
            <span className="text-gray-400">—</span>
            <DatePicker
              selected={end ? new Date(end) : null}
              onChange={(date) => onChangeEnd(date ? date.toISOString().split("T")[0] : "")}
              dateFormat="dd/MM/yyyy"
              locale={vi}
              placeholderText="dd/mm/yyyy"
              className="h-8 text-sm border rounded-md px-2 dark:bg-gray-700 dark:text-white w-full"
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

/* ============ Component chính ============ */
export default function InvoiceMaintenanceSection() {
  const [expandedId, setExpandedId] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [maintenances, setMaintenances] = useState([]);
  const [loading, setLoading] = useState(true);

  const [visibleColumns, setVisibleColumns] = useState({
    branch: true,
    unit_id: true,
    eq_name: true,
    cost: true,
    start_date: true,
    end_date: true,
    requested_by: true,
    technician: true,
  });

  const [fBranch, setFBranch] = useState([]);
  const [fUnitId, setFUnitId] = useState([]);
  const [fEqName, setFEqName] = useState([]);
  const [fRequestedBy, setFRequestedBy] = useState([]);
  const [fTechnician, setFTechnician] = useState([]);
  const [priceMin, setPriceMin] = useState("");
  const [priceMax, setPriceMax] = useState("");
  const [startFrom, setStartFrom] = useState("");
  const [startTo, setStartTo] = useState("");
  const [endFrom, setEndFrom] = useState("");
  const [endTo, setEndTo] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [gotoPage, setGotoPage] = useState("");

  const controller = useGlobalFilterController();
  const toggleExpand = (id) => setExpandedId((prev) => (prev === id ? null : id));

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

  useEffect(() => setCurrentPage(1), [
    searchTerm,
    fBranch,
    fUnitId,
    fEqName,
    fRequestedBy,
    fTechnician,
    priceMin,
    priceMax,
    startFrom,
    startTo,
    endFrom,
    endTo,
  ]);

  const uniqueValues = useMemo(
    () => ({
      branch: getUniqueValues(maintenances, (m) => m.branch_id),
      unit_id: getUniqueValues(maintenances, (m) => m.equipment_unit_id),
      eq_name: getUniqueValues(maintenances, (m) => m.equipment_name),
      requested_by: getUniqueValues(maintenances, (m) => m.requested_by_name),
      technician: getUniqueValues(maintenances, (m) => m.technician_name),
    }),
    [maintenances]
  );

  const filteredData = useMemo(() => {
    let list = maintenances || [];
    const q = (searchTerm || "").toLowerCase().trim();
    if (q)
      list = list.filter(
        (m) =>
          m.equipment_name?.toLowerCase().includes(q) ||
          m.equipment_unit_id?.toLowerCase().includes(q) ||
          m.maintenance_reason?.toLowerCase().includes(q) ||
          m.requested_by_name?.toLowerCase().includes(q) ||
          m.technician_name?.toLowerCase().includes(q)
      );
    if (fBranch.length) list = list.filter((m) => fBranch.includes(m.branch_id || "—"));
    if (fUnitId.length) list = list.filter((m) => fUnitId.includes(m.equipment_unit_id || "—"));
    if (fEqName.length) list = list.filter((m) => fEqName.includes(m.equipment_name || "—"));
    if (fRequestedBy.length)
      list = list.filter((m) => fRequestedBy.includes(m.requested_by_name || "—"));
    if (fTechnician.length)
      list = list.filter((m) => fTechnician.includes(m.technician_name || "—"));

    const min = priceMin ? Number(priceMin) : null;
    const max = priceMax ? Number(priceMax) : null;
    if (min !== null) list = list.filter((m) => Number(m.invoices?.[0]?.cost ?? 0) >= min);
    if (max !== null) list = list.filter((m) => Number(m.invoices?.[0]?.cost ?? 0) <= max);

    if (startFrom) list = list.filter((m) => new Date(m.start_date) >= new Date(startFrom));
    if (startTo) list = list.filter((m) => new Date(m.start_date) <= new Date(startTo));
    if (endFrom) list = list.filter((m) => new Date(m.end_date) >= new Date(endFrom));
    if (endTo) list = list.filter((m) => new Date(m.end_date) <= new Date(endTo));
    return list;
  }, [
    maintenances,
    searchTerm,
    fBranch,
    fUnitId,
    fEqName,
    fRequestedBy,
    fTechnician,
    priceMin,
    priceMax,
    startFrom,
    startTo,
    endFrom,
    endTo,
  ]);

  const totalPages = Math.max(1, Math.ceil(filteredData.length / ITEMS_PER_PAGE));
  const paginatedData = filteredData.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

  const goTo = (page) => {
    if (!Number.isFinite(page)) return;
    if (page < 1) page = 1;
    if (page > totalPages) page = totalPages;
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  if (loading)
    return <div className="text-center py-10 text-gray-500">Đang tải danh sách bảo trì...</div>;

  return (
    <div className="mt-6 bg-white dark:bg-gray-800 rounded-lg shadow p-5">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <div className="flex items-center gap-2">
          <Wrench className="text-emerald-500" />
          <h2 className="text-lg font-semibold text-emerald-600">🧾 Danh sách bảo trì thiết bị</h2>
        </div>

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

          <ColumnVisibilityButton
            visibleColumns={visibleColumns}
            setVisibleColumns={setVisibleColumns}
            labels={{
              branch: "Chi nhánh",
              unit_id: "Mã thiết bị",
              eq_name: "Tên thiết bị",
              cost: "Giá bảo trì",
              start_date: "Ngày bắt đầu",
              end_date: "Ngày kết thúc",
              requested_by: "Người yêu cầu",
              technician: "Kỹ thuật viên",
            }}
          />

          {/* Bộ lọc nhanh Tuần / Tháng / Năm */}
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-gray-600 dark:text-gray-300">Lọc nhanh:</span>
            <select
              className="border rounded-md px-2 py-1 text-sm dark:bg-gray-700 dark:text-gray-100"
              onChange={(e) => {
                const now = new Date();
                const value = e.target.value;
                let sFrom = "",
                  sTo = "",
                  eFrom = "",
                  eTo = "";
                if (value === "week") {
                  const first = new Date(now);
                  first.setDate(now.getDate() - now.getDay() + 1);
                  const last = new Date(first);
                  last.setDate(first.getDate() + 6);
                  sFrom = first.toISOString().split("T")[0];
                  eTo = last.toISOString().split("T")[0];
                } else if (value === "month") {
                  const first = new Date(now.getFullYear(), now.getMonth(), 1);
                  const last = new Date(now.getFullYear(), now.getMonth() + 1, 0);
                  sFrom = first.toISOString().split("T")[0];
                  eTo = last.toISOString().split("T")[0];
                } else if (value === "year") {
                  const first = new Date(now.getFullYear(), 0, 1);
                  const last = new Date(now.getFullYear(), 11, 31);
                  sFrom = first.toISOString().split("T")[0];
                  eTo = last.toISOString().split("T")[0];
                } else {
                  sFrom = sTo = eFrom = eTo = "";
                }
                setStartFrom(sFrom);
                setEndTo(eTo);
              }}
            >
              <option value="">Tất cả</option>
              <option value="week">Tuần này</option>
              <option value="month">Tháng này</option>
              <option value="year">Năm nay</option>
            </select>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto rounded-md border border-gray-200 dark:border-gray-700">
        <Table className="min-w-full">
          <TableHeader>
            <TableRow className="bg-gray-100 dark:bg-gray-700 text-sm font-semibold">
              <TableHead>#</TableHead>
              {visibleColumns.branch && (
                <TableHead>
                  <HeaderFilter label="Chi nhánh" values={uniqueValues.branch} selected={fBranch} onChange={setFBranch} selfKey="branch" controller={controller} />
                </TableHead>
              )}
              {visibleColumns.unit_id && (
                <TableHead>
                  <HeaderFilter label="Mã thiết bị" values={uniqueValues.unit_id} selected={fUnitId} onChange={setFUnitId} selfKey="unit_id" controller={controller} />
                </TableHead>
              )}
              {visibleColumns.eq_name && (
                <TableHead>
                  <HeaderFilter label="Tên thiết bị" values={uniqueValues.eq_name} selected={fEqName} onChange={setFEqName} selfKey="eq_name" controller={controller} />
                </TableHead>
              )}
              {visibleColumns.cost && (
                <TableHead>
                  <NumberRangeHeaderFilter label="Giá bảo trì" min={priceMin} max={priceMax} onChangeMin={setPriceMin} onChangeMax={setPriceMax} />
                </TableHead>
              )}
              {visibleColumns.start_date && (
                <TableHead>
                  <DateRangeHeaderFilter label="Ngày bắt đầu" start={startFrom} end={startTo} onChangeStart={setStartFrom} onChangeEnd={setStartTo} />
                </TableHead>
              )}
              {visibleColumns.end_date && (
                <TableHead>
                  <DateRangeHeaderFilter label="Ngày kết thúc" start={endFrom} end={endTo} onChangeStart={setEndFrom} onChangeEnd={setEndTo} />
                </TableHead>
              )}
              {visibleColumns.requested_by && (
                <TableHead>
                  <HeaderFilter label="Người yêu cầu" values={uniqueValues.requested_by} selected={fRequestedBy} onChange={setFRequestedBy} selfKey="requested_by" controller={controller} />
                </TableHead>
              )}
              {visibleColumns.technician && (
                <TableHead>
                  <HeaderFilter label="Kỹ thuật viên" values={uniqueValues.technician} selected={fTechnician} onChange={setFTechnician} selfKey="technician" controller={controller} />
                </TableHead>
              )}
              <TableHead className="text-center">Chi tiết</TableHead>
            </TableRow>
                   </TableHeader>

          <TableBody>
            {paginatedData.length === 0 ? (
              <TableRow>
                <TableCell colSpan={9} className="text-center py-4 text-gray-500">
                  Không có dữ liệu bảo trì.
                </TableCell>
              </TableRow>
            ) : (
              paginatedData.map((m, idx) => {
                const invoice = m.invoices?.[0];
                const cost = invoice?.cost ?? null;

                return (
                  <Fragment key={m.id}>
                    <TableRow
                      onClick={() => toggleExpand(m.id)}
                      className="text-sm cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 transition"
                    >
                      <TableCell>{(currentPage - 1) * ITEMS_PER_PAGE + idx + 1}</TableCell>

                      {visibleColumns.branch && <TableCell>{m.branch_id}</TableCell>}
                      {visibleColumns.unit_id && <TableCell>{m.equipment_unit_id}</TableCell>}
                      {visibleColumns.eq_name && (
                        <TableCell>{m.equipment_name || "Không rõ"}</TableCell>
                      )}
                      {visibleColumns.cost && (
                        <TableCell>
                          {cost === null ? "—" : `${Number(cost).toLocaleString("vi-VN")}₫`}
                        </TableCell>
                      )}
                      {visibleColumns.start_date && (
                        <TableCell>
                          {new Date(m.start_date).toLocaleDateString("vi-VN")}
                        </TableCell>
                      )}
                      {visibleColumns.end_date && (
                        <TableCell>
                          {new Date(m.end_date).toLocaleDateString("vi-VN")}
                        </TableCell>
                      )}
                      {visibleColumns.requested_by && (
                        <TableCell>{m.requested_by_name}</TableCell>
                      )}
                      {visibleColumns.technician && (
                        <TableCell>{m.technician_name}</TableCell>
                      )}

                      <TableCell className="text-center">
                        {expandedId === m.id ? (
                          <ChevronUp className="mx-auto text-emerald-500" />
                        ) : (
                          <ChevronDown className="mx-auto text-gray-500" />
                        )}
                      </TableCell>
                    </TableRow>

                    {/* Chi tiết mở rộng */}
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
                          <td colSpan={9} className="p-0">
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
                                    <TableCell className="max-w-[420px]">
                                      {m.maintenance_detail || "Không có ghi chú."}
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
        <div className="flex justify-between items-center border-t dark:border-gray-700 px-4 py-2 bg-gray-50 dark:bg-gray-700">
          {/* Go to Page */}
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
                !gotoPage ||
                Number(gotoPage) < 1 ||
                Number(gotoPage) > totalPages
              }
              className="bg-emerald-500 hover:bg-emerald-600 text-white text-xs px-3 py-1"
            >
              Go
            </Button>
          </div>

          {/* Pagination Buttons */}
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

