import { useEffect, useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
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
import Status from "@/components/common/Status";
import { Loader2 } from "lucide-react";
import EquipmentUnitService from "@/services/equipmentUnitService";
import MaintainService from "@/services/MaintainService";
// import MaintenanceMiniSection from "./MaintenanceMiniSection";
import { X } from "lucide-react"; // icon đóng overlay
import SetScheduleSection from "./SetScheduleSection";

import { toast } from "sonner";
import {
  HeaderFilter,
  ColumnVisibilityButton,
  useGlobalFilterController,
  getUniqueValues,
} from "@/components/common/ExcelTableTools";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import BranchService from "@/services/branchService";
import useAuthRole from "@/hooks/useAuthRole";

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

const ITEMS_PER_PAGE = 8;

export default function MaintenanceUrgentSection() {
  const [equipments, setEquipments] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [selected, setSelected] = useState(null);
  const [maintenanceSteps, setMaintenanceSteps] = useState({});
  const [cost, setCost] = useState("");
  const [note, setNote] = useState("");
  const [loading, setLoading] = useState(true);
  const [loadingStart, setLoadingStart] = useState(false);
  const [loadingComplete, setLoadingComplete] = useState(false);

  const [search, setSearch] = useState("");
  const [activeGroup, setActiveGroup] = useState("all");
  const [activeBranch, setActiveBranch] = useState("all");
  const [branches, setBranches] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);

  const { isSuperAdmin } = useAuthRole();
  const [showSchedule, setShowSchedule] = useState(false);
  // 🚫 Ngăn scroll & nền trắng khi mở modal
  useEffect(() => {
    if (showSchedule) document.body.classList.add("modal-open");
    else document.body.classList.remove("modal-open");
  }, [showSchedule]);

  const controller = useGlobalFilterController();
  const [filters, setFilters] = useState({
    id: [],
    name: [],
    main_name: [],
    type_name: [],
    vendor_name: [],
    branch_id: [],
    status: [],
  });

  const [visibleColumns, setVisibleColumns] = useState({
    id: true,
    image: true,
    name: true,
    main_name: true,
    type_name: true,
    status: true,
    vendor_name: true,
    branch_id: true,
  });

  // 🧭 Load dữ liệu
  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        const data = await EquipmentUnitService.getByStatusGroup([
          "Temporary Urgent",
          "In Progress",
        ]);
        setEquipments(data);
        setFiltered(data);
      } catch (err) {
        console.error("❌ Lỗi load thiết bị:", err);
        toast.error("Không thể tải danh sách thiết bị ngừng khẩn cấp");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  // 🏢 Load chi nhánh
  useEffect(() => {
    (async () => {
      try {
        const res = await BranchService.getAll();
        setBranches(res || []);
      } catch {
        toast.error("Không thể tải danh sách chi nhánh!");
      }
    })();
  }, []);

  // 🔎 Tìm kiếm + Lọc nhóm + Chi nhánh
  useEffect(() => {
    const q = search.trim().toLowerCase();
    const f = equipments.filter((u) => {
      const matchSearch =
        !q ||
        u.equipment?.name?.toLowerCase().includes(q) ||
        u.vendor_name?.toLowerCase().includes(q) ||
        u.equipment?.type_name?.toLowerCase().includes(q);

      const matchGroup =
        activeGroup === "all" || u.equipment?.main_name === activeGroup;
      const matchBranch =
        activeBranch === "all" || u.branch_id === activeBranch;

      return matchSearch && matchGroup && matchBranch;
    });
    setFiltered(f);
    setCurrentPage(1);
  }, [search, activeGroup, activeBranch, equipments]);

  // 📊 Excel-style filter
  const uniqueValues = useMemo(
    () => ({
      id: getUniqueValues(equipments, (e) => e.id),
      name: getUniqueValues(equipments, (e) => e.equipment?.name),
      main_name: getUniqueValues(equipments, (e) => e.equipment?.main_name),
      type_name: getUniqueValues(equipments, (e) => e.equipment?.type_name),
      vendor_name: getUniqueValues(equipments, (e) => e.vendor_name),
      branch_id: getUniqueValues(equipments, (e) => e.branch_id),
      status: getUniqueValues(
        equipments,
        (e) => STATUS_MAP[e.status?.toLowerCase()]
      ),
    }),
    [equipments]
  );

  const filteredByColumn = useMemo(() => {
    return (filtered || []).filter((e) => {
      const match = Object.keys(filters).every((key) => {
        if (!filters[key] || filters[key].length === 0) return true;
        let val = "";
        switch (key) {
          case "id":
            val = e.id;
            break;
          case "name":
            val = e.equipment?.name;
            break;
          case "main_name":
            val = e.equipment?.main_name;
            break;
          case "type_name":
            val = e.equipment?.type_name;
            break;
          case "vendor_name":
            val = e.vendor_name;
            break;
          case "branch_id":
            val = e.branch_id;
            break;
          case "status":
            val = STATUS_MAP[e.status?.toLowerCase()];
            break;
          default:
            val = "";
        }
        return filters[key].includes(val);
      });
      return match;
    });
  }, [filtered, filters]);

  const totalPages = Math.max(
    1,
    Math.ceil(filteredByColumn.length / ITEMS_PER_PAGE)
  );
  const currentData = filteredByColumn.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  const checkWarranty = (equipment) => {
    const today = new Date();
    return new Date(equipment.warranty_end_date) > today;
  };

  // 🟦 Bắt đầu bảo trì
  const handleStart = async () => {
    if (!selected) return;
    try {
      setLoadingStart(true);
      const m = await MaintainService.getByUnit(selected.id);
      if (!m) {
        toast.error("Không tìm thấy yêu cầu bảo trì đang hoạt động!");
        return;
      }
      await MaintainService.progress(m.id);
      toast.success("🔧 Đã bắt đầu bảo trì");
      setEquipments((prev) =>
        prev.map((eq) =>
          eq.id === selected.id ? { ...eq, status: "In Progress" } : eq
        )
      );
      setSelected({ ...selected, status: "In Progress" });
      setMaintenanceSteps((prev) => ({ ...prev, [selected.id]: 2 }));
      setCost(checkWarranty(selected) ? "0" : "");
    } catch {
      toast.error("Không thể bắt đầu bảo trì");
    } finally {
      setLoadingStart(false);
    }
  };

  // 🟩 Hoàn tất bảo trì
  const finishMaintenance = async (result) => {
    if (!selected) return;
    try {
      setLoadingComplete(true);
      const m = await MaintainService.getByUnit(selected.id);
      if (!m) {
        toast.error("Không tìm thấy maintenance để hoàn tất!");
        return;
      }

      const payload = {
        status: result === "Bảo trì thành công" ? "Ready" : "Failed",
        cost: parseInt(cost || "0"),
        maintenance_detail: note,
      };

      const resultStatus = result === "Bảo trì thành công" ? "Ready" : "Failed";
      await MaintainService.complete(m.id, payload);

      toast.success(
        resultStatus === "Ready"
          ? "🎉 Bảo trì thành công — Thiết bị đã cập nhật trạng thái!"
          : "⚠️ Bảo trì thất bại — Đã ghi nhận kết quả!"
      );

      setTimeout(() => {
        setEquipments((prev) => prev.filter((eq) => eq.id !== selected.id));
        setSelected(null);
      }, 2000);
    } catch {
      toast.error("Không thể hoàn tất bảo trì");
    } finally {
      setLoadingComplete(false);
    }
  };

  if (loading)
    return (
      <div className="p-6 text-gray-500 dark:text-gray-300 animate-pulse">
        Đang tải danh sách thiết bị...
      </div>
    );

  return (
    <div className="space-y-4">
      {/* ====== Toolbar ====== */}
      <div className="flex flex-wrap justify-between items-center gap-3 p-3 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl shadow-sm">
        <div className="flex flex-wrap items-center gap-2">
          <Input
            placeholder="🔍 Tìm tên, loại, nhà cung cấp..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="h-9 w-64 border-gray-300 dark:border-gray-700 focus:ring-2 focus:ring-emerald-400 text-sm"
          />
          <Select
            onValueChange={(v) => {
              setActiveGroup(v);
              setCurrentPage(1);
            }}
            defaultValue="all"
          >
            <SelectTrigger className="h-9 w-44 border-gray-300 dark:border-gray-700 text-sm bg-gray-50 dark:bg-gray-800 focus:ring-emerald-400 transition">
              <SelectValue placeholder="Nhóm thiết bị" />
            </SelectTrigger>
            <SelectContent className="z-[9999] bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 shadow-md rounded-md">
              {[
                { id: "all", name: "Tất cả nhóm" },
                ...Array.from(
                  new Set(equipments.map((e) => e.equipment?.main_name))
                ).map((n) => ({ id: n, name: n })),
              ].map((g) => (
                <SelectItem
                  key={g.id}
                  value={g.id}
                  className="text-sm cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800"
                >
                  {g.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {isSuperAdmin && (
            <Select
              onValueChange={(v) => {
                setActiveBranch(v);
                setCurrentPage(1);
              }}
              defaultValue="all"
            >
              <SelectTrigger className="h-9 w-40 text-sm bg-gray-50 dark:bg-gray-800 border-gray-300 dark:border-gray-700">
                <SelectValue placeholder="Chi nhánh" />
              </SelectTrigger>
              <SelectContent className="z-[9999] bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 shadow-md">
                <SelectItem value="all" className="text-sm">
                  Tất cả chi nhánh
                </SelectItem>
                {branches.map((b) => (
                  <SelectItem key={b.id} value={b.id} className="text-sm">
                    {b.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </div>
        <Button
          onClick={() => setShowSchedule(true)}
          className="bg-emerald-500 hover:bg-emerald-600 text-white font-semibold shadow-sm"
        >
          🗓️ Xếp lịch bảo trì
        </Button>

        <ColumnVisibilityButton
          visibleColumns={visibleColumns}
          setVisibleColumns={setVisibleColumns}
          labels={{
            id: "Mã định danh thiết bị",
            image: "Ảnh",
            name: "Tên thiết bị",
            main_name: "Nhóm",
            type_name: "Loại",
            status: "Trạng thái",
            vendor_name: "Nhà cung cấp",
            branch_id: "Chi nhánh",
          }}
        />
      </div>

      {/* ====== Table ====== */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md overflow-hidden">
        <div className="overflow-x-auto">
          <Table className="min-w-[1000px] border border-gray-200 dark:border-gray-700">
            <TableHeader>
              <TableRow className="bg-gray-100 dark:bg-gray-700 text-sm font-semibold">
                <TableHead>#</TableHead>
                {Object.entries(visibleColumns).map(([key, visible]) => {
                  if (!visible) return null;

                  const COLUMN_LABELS = {
                    id: "Mã định danh thiết bị",
                    image: "Ảnh",
                    name: "Tên thiết bị",
                    main_name: "Nhóm thiết bị",
                    type_name: "Loại thiết bị",
                    status: "Trạng thái",
                    vendor_name: "Nhà cung cấp",
                    branch_id: "Chi nhánh",
                  };

                  // 🧩 Bỏ filter cho cột "image"
                  const noFilterColumns = ["image"];

                  return (
                    <TableHead key={key}>
                      {noFilterColumns.includes(key) ? (
                        COLUMN_LABELS[key]
                      ) : (
                        <HeaderFilter
                          selfKey={key}
                          label={COLUMN_LABELS[key] || key}
                          values={uniqueValues[key]}
                          selected={filters[key]}
                          onChange={(v) =>
                            setFilters((p) => ({ ...p, [key]: v }))
                          }
                          controller={controller}
                        />
                      )}
                    </TableHead>
                  );
                })}
              </TableRow>
            </TableHeader>

            <TableBody>
              {currentData.map((row, idx) => {
                const normalized = row.status?.trim().toLowerCase();
                const translated = STATUS_MAP[normalized] || "Không xác định";
                return (
                  <TableRow
                    key={row.id}
                    className={`cursor-pointer transition ${
                      selected?.id === row.id
                        ? "bg-emerald-50 dark:bg-emerald-900/30"
                        : "hover:bg-gray-50 dark:hover:bg-gray-700"
                    }`}
                    onClick={async () => {
                      setSelected(row);
                      const m = await MaintainService.getByUnit(row.id);
                      if (m) {
                        setSelected((prev) => ({
                          ...prev,
                          maintenance_reason: m.maintenance_reason,
                          requested_by_name: m.requested_by_name,
                          technician_name: m.technician_name,
                        }));
                      }
                      if (row.status?.toLowerCase() === "in progress") {
                        setMaintenanceSteps((prev) => ({
                          ...prev,
                          [row.id]: 2,
                        }));
                      }
                    }}
                  >
                    <TableCell className="text-center">
                      {(currentPage - 1) * ITEMS_PER_PAGE + idx + 1}
                    </TableCell>
                    {visibleColumns.id && <TableCell>{row.id}</TableCell>}
                    {visibleColumns.image && (
                      <TableCell>
                        <img
                          src={row.equipment?.image}
                          alt={row.equipment?.name}
                          className="w-12 h-10 object-contain rounded"
                        />
                      </TableCell>
                    )}
                    {visibleColumns.name && (
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <span
                            className={`font-semibold truncate max-w-[220px] ${
                              row.branch_id === "GV"
                                ? "text-emerald-600 dark:text-emerald-400"
                                : row.branch_id === "Q3"
                                ? "text-blue-600 dark:text-blue-400"
                                : "text-gray-800 dark:text-gray-200"
                            }`}
                          >
                            {row.equipment?.name}
                          </span>
                        </div>
                      </TableCell>
                    )}
                    {visibleColumns.main_name && (
                      <TableCell>{row.equipment?.main_name}</TableCell>
                    )}
                    {visibleColumns.type_name && (
                      <TableCell>{row.equipment?.type_name}</TableCell>
                    )}
                    {visibleColumns.status && (
                      <TableCell>
                        <Status status={translated} />
                      </TableCell>
                    )}
                    {visibleColumns.vendor_name && (
                      <TableCell>{row.vendor_name}</TableCell>
                    )}
                    {visibleColumns.branch_id && (
                      <TableCell>{row.branch_id}</TableCell>
                    )}
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>

        {/* Pagination */}
        <div className="flex justify-between items-center border-t dark:border-gray-600 px-4 py-2 bg-gray-50 dark:bg-gray-700 text-sm">
          <div className="text-gray-700 dark:text-gray-300">
            Tổng: {filteredByColumn.length} thiết bị
          </div>
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
              disabled={currentPage === 1}
              className="dark:border-gray-600 dark:text-gray-200 disabled:opacity-50"
            >
              «
            </Button>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
              <button
                key={page}
                onClick={() => setCurrentPage(page)}
                className={`w-8 h-8 flex items-center justify-center rounded-md border text-sm font-medium transition-all ${
                  currentPage === page
                    ? "bg-emerald-500 text-white border-emerald-500"
                    : "bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700"
                }`}
              >
                {page}
              </button>
            ))}
            <Button
              size="sm"
              variant="outline"
              onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
              disabled={currentPage === totalPages}
              className="dark:border-gray-600 dark:text-gray-200 disabled:opacity-50"
            >
              »
            </Button>
          </div>
        </div>
      </div>

      {/* ====== Panel chi tiết (FitX Style) ====== */}
      {selected && (
        <motion.div
          key={selected.id}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 20 }}
          transition={{ duration: 0.25 }}
          className="bg-white dark:bg-[#1e1e1e] shadow-lg rounded-2xl p-6 border border-gray-200 dark:border-gray-700 space-y-6"
        >
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-100">
              Chi tiết thiết bị
            </h2>
            <Status
              status={
                STATUS_MAP[selected.status?.toLowerCase()] ||
                selected.status ||
                "Không xác định"
              }
            />
          </div>

          <div className="flex gap-6">
            <img
              src={selected.equipment?.image}
              alt={selected.equipment?.name}
              className="w-44 h-36 object-contain border rounded-lg shadow-sm"
            />
            <div className="grid grid-cols-2 gap-x-10 gap-y-2 text-sm">
              <p>
                <strong>Tên:</strong> {selected.equipment?.name}
              </p>
              <p>
                <strong>Nhà cung cấp:</strong> {selected.vendor_name}
              </p>
              <p>
                <strong>Nhóm:</strong> {selected.equipment?.main_name}
              </p>
              <p>
                <strong>Chi nhánh:</strong> {selected.branch_id}
              </p>
              <p>
                <strong>Bảo hành đến:</strong>{" "}
                {selected.warranty_end_date?.slice(0, 10) || "Không rõ"}
              </p>
              <p>
                <strong>Bảo hành:</strong>{" "}
                {checkWarranty(selected) ? (
                  <span className="text-green-600 font-semibold">
                    ✅ Còn hạn
                  </span>
                ) : (
                  <span className="text-red-600 font-semibold">❌ Hết hạn</span>
                )}
              </p>
            </div>
          </div>

          <div className="border-t border-gray-200 dark:border-gray-700 pt-4 space-y-4">
            <h3 className="text-base font-semibold text-gray-800 dark:text-gray-100">
              Phiếu bảo trì
            </h3>
            <p>
              <strong>Lý do:</strong> {selected.maintenance_reason || "—"}
            </p>
            <p>
              <strong>Người yêu cầu:</strong>{" "}
              {selected.requested_by_name || "—"}
            </p>
            {selected.status?.toLowerCase() === "in progress" && (
              <p>
                <strong>Người bảo trì:</strong>{" "}
                {selected.technician_name || "—"}
              </p>
            )}

            {/* Step 1 */}
            {(!maintenanceSteps[selected.id] ||
              maintenanceSteps[selected.id] === 1) && (
              <Button
                onClick={handleStart}
                disabled={loadingStart}
                className="w-full bg-emerald-500 hover:bg-emerald-600 text-white font-semibold flex items-center justify-center gap-2"
              >
                {loadingStart ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" /> Đang xử lý...
                  </>
                ) : (
                  "🔧 Bắt đầu bảo trì"
                )}
              </Button>
            )}

            {/* Step 2 */}
            {maintenanceSteps[selected.id] === 2 && (
              <div className="space-y-3">
                {checkWarranty(selected) ? (
                  <div className="p-3 rounded-md bg-emerald-50 border border-emerald-200 text-emerald-700 text-sm font-medium">
                    ✅ Còn bảo hành — Chi phí: 0đ
                  </div>
                ) : (
                  <div>
                    <p className="text-red-600 font-semibold mb-1 text-sm">
                      Hết hạn bảo hành — nhập chi phí
                    </p>
                    <Input
                      type="number"
                      value={cost}
                      onChange={(e) => setCost(e.target.value)}
                      placeholder="Nhập chi phí"
                      className="w-1/2"
                    />
                  </div>
                )}

                <div>
                  <label className="block text-sm mb-1 text-gray-700 dark:text-gray-300">
                    Ghi chú:
                  </label>
                  <Input
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    placeholder="Nhập ghi chú bảo trì"
                  />
                </div>

                <div className="flex gap-3">
                  <Button
                    onClick={() => finishMaintenance("Bảo trì thành công")}
                    disabled={loadingComplete}
                    className="flex-1 bg-emerald-500 hover:bg-emerald-600 text-white font-semibold flex items-center justify-center gap-2"
                  >
                    {loadingComplete ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" /> Đang gửi...
                      </>
                    ) : (
                      "✅ Bảo trì thành công"
                    )}
                  </Button>

                  <Button
                    onClick={() => finishMaintenance("Bảo trì thất bại")}
                    disabled={loadingComplete}
                    className="flex-1 bg-red-500 hover:bg-red-600 text-white font-semibold flex items-center justify-center gap-2"
                  >
                    {loadingComplete ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" /> Đang gửi...
                      </>
                    ) : (
                      "❌ Bảo trì thất bại"
                    )}
                  </Button>
                </div>
              </div>
            )}
          </div>
        </motion.div>
      )}

      {/* === Overlay FitX Calendar (1 lớp, tối nền, nút X lộ góc ngoài) === */}
      {showSchedule && (
        <AnimatePresence>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="fixed inset-0 z-[9999] flex items-center justify-center 
                 bg-black/60 backdrop-blur-[6px]"
          >
            {/* 📅 Lịch chính */}
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              transition={{ type: "spring", duration: 0.4 }}
              className="relative w-[95vw] max-w-[1350px] max-h-[92vh]
                   overflow-visible rounded-3xl bg-white 
                   shadow-[0_12px_40px_rgba(0,0,0,0.2)]"
            >
              {/* ✅ Lịch */}
              <SetScheduleSection />

              {/* ❌ Nút đóng – lộ ra ngoài góc phải trên */}
              <motion.button
                whileHover={{
                  rotate: [0, -8, 8, -8, 0],
                  transition: { duration: 0.5 },
                }}
                onClick={() => setShowSchedule(false)}
                className="absolute -top-4 -right-4 w-12 h-12 rounded-full z-[10000]
                     bg-gradient-to-r from-red-500 to-rose-500 text-white 
                     flex items-center justify-center
                     shadow-[0_6px_22px_rgba(244,63,94,0.55)]
                     hover:shadow-[0_8px_30px_rgba(244,63,94,0.7)]
                     hover:scale-110 active:scale-95
                     border-[3px] border-white/90 ring-[3px] ring-white/70
                     transition-all duration-300 ease-out"
                style={{
                  transform: "translate(6px, -6px)", // 🔥 đẩy chéo ra ngoài mép
                }}
              >
                <X className="w-5 h-5" />
              </motion.button>
            </motion.div>
          </motion.div>
        </AnimatePresence>
      )}
    </div>
  );
}
