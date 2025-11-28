import React, { Fragment, useState, useEffect } from "react";
import { motion } from "framer-motion";
import { CalendarDays, Clock, UserRound, ListChecks } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/buttonn";
import { toast } from "sonner";
import {
  startOfMonth,
  startOfWeek,
  endOfMonth,
  endOfWeek,
  eachDayOfInterval,
  format,
  isSameMonth,
  isSameDay,
  isToday,
  startOfDay,
} from "date-fns";
import { vi } from "date-fns/locale";
import MaintenancePlanService from "@/services/MaintenancePlanService";
import EquipmentUnitService from "@/services/equipmentUnitService";
import UserService from "@/services/UserService";
import MaintenanceRequestService from "@/services/MaintenanceRequestService";
import useAuthRole from "@/hooks/useAuthRole";
import BranchService from "@/services/branchService";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogTrigger,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
  AlertDialogAction,
} from "@/components/ui/alert-dialog";
import MaintainService from "@/services/MaintainService";

export default function AddScheduleSection({ editing, onClose, onSaved }) {
  const [maintenancePlans, setMaintenancePlans] = useState([]);
  const [users, setUsers] = useState([]);
  const [requests, setRequests] = useState([]);
  const [maintenanceReason, setMaintenanceReason] = useState("");
  const [selectedUser, setSelectedUser] = useState("");
  const [expandedEquipment, setExpandedEquipment] = useState(null);
  const [selectedUnits, setSelectedUnits] = useState({});
  const [time, setTime] = useState("");
  const [cursor, setCursor] = useState(new Date());
  const [selectedDateObj, setSelectedDateObj] = useState(new Date());
  const [equipmentUnits, setEquipmentUnits] = useState({});
  const { isSuperAdmin, branchId } = useAuthRole();
  const [branches, setBranches] = useState([]);
  const [activeBranch, setActiveBranch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 6;
  const [requestPage, setRequestPage] = useState(1);
  const REQUESTS_PER_PAGE = 6;

  const [confirmOpen, setConfirmOpen] = useState(false);
  const [successOpen, setSuccessOpen] = useState(false);
  const [confirmMode, setConfirmMode] = useState("confirm");
  // confirm | loading | success
  // ===== VALIDATION ERRORS =====
  const [errors, setErrors] = useState({
    date: false,
    time: false,
    reason: false,
  });

  const daysInView = eachDayOfInterval({
    start: startOfWeek(startOfMonth(cursor), { weekStartsOn: 1 }),
    end: endOfWeek(endOfMonth(cursor), { weekStartsOn: 1 }),
  });

  // ===== Kế hoạch bảo trì định kỳ =====
  useEffect(() => {
    const fetchData = async () => {
      try {
        const data = await MaintenancePlanService.getAll();
        setMaintenancePlans(data);
      } catch (err) {
        console.error("❌ Lỗi khi tải kế hoạch bảo trì:", err);
        toast.error("Không thể tải danh sách kế hoạch bảo trì");
      }
    };
    fetchData();
  }, []);

  // ===== User (kỹ thuật viên) =====
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const allUsers = await UserService.getAll();
        const technicians =
          allUsers?.filter((u) => u.roles?.includes("technician")) || [];
        setUsers(technicians);
      } catch (err) {
        console.error("❌ Lỗi khi tải danh sách user:", err);
        toast.error("Không thể tải danh sách kỹ thuật viên");
      }
    };

    fetchUsers();
  }, []);

  // ===== Lịch bảo trì hiện có (pending + confirmed) =====
  useEffect(() => {
    const fetchRequests = async () => {
      try {
        const data = await MaintenanceRequestService.getAll();

        const filtered = data.filter(
          (r) => r.status === "pending" || r.status === "confirmed"
        );

        setRequests(filtered);
      } catch (err) {
        console.error("❌ Lỗi khi tải yêu cầu bảo trì:", err);
        toast.error("Không thể tải danh sách yêu cầu bảo trì");
      }
    };

    fetchRequests();
  }, []);

  // ===== Chi nhánh (cho super admin) =====
  useEffect(() => {
    const loadBranches = async () => {
      try {
        const res = await BranchService.getAll();
        setBranches(res || []);

        // vì danh sách kế hoạch dùng chung, activeBranch chỉ dùng để filter UNIT
        if (!editing) {
          setActiveBranch(isSuperAdmin ? res?.[0]?.id || "" : branchId || "");
        }
      } catch (err) {
        console.error("❌ Lỗi load chi nhánh:", err);
      }
    };
    loadBranches();
  }, [isSuperAdmin, branchId]);

  // Khi đổi chi nhánh → reset unit đã load & chọn
  useEffect(() => {
    if (!activeBranch) return;
    if (editing) return; // 🔥 ĐANG UPDATE THÌ KHÔNG RESET CHỌN

    setEquipmentUnits({});
    setSelectedUnits({});

    // ❗ KHÔNG RESET DÒNG nếu đang chọn dòng
    setExpandedEquipment((prev) => prev);

    setCurrentPage(1);
  }, [activeBranch, editing]);

  // ===== CHỌN UNIT =====
  const toggleUnit = (equipmentId, unitId) => {
    setSelectedUnits((prev) => {
      const eq = prev[equipmentId] || [];
      if (eq.includes(unitId)) {
        return { ...prev, [equipmentId]: eq.filter((id) => id !== unitId) };
      } else {
        return { ...prev, [equipmentId]: [...eq, unitId] };
      }
    });
  };
  // ===== Pagination for maintenance requests =====
  const totalRequestPages = Math.max(
    1,
    Math.ceil((requests?.length || 0) / REQUESTS_PER_PAGE)
  );

  const paginatedRequests = requests.slice(
    (requestPage - 1) * REQUESTS_PER_PAGE,
    requestPage * REQUESTS_PER_PAGE
  );

  // Format frequency → chu kỳ + tần suất
  const parseFrequency = (freq) => {
    if (!freq) return { cycle: "—", interval: "—" };

    const [num, unitRaw] = freq.split("_");
    const n = parseInt(num);
    const unit =
      unitRaw === "weeks" ? "Tuần" : unitRaw === "months" ? "Tháng" : "Năm";

    const freqLabel =
      unitRaw === "weeks"
        ? `${n} tuần/lần`
        : unitRaw === "months"
        ? `${n} tháng/lần`
        : `${n} năm/lần`;

    return { cycle: unit, interval: freqLabel };
  };

  const loadUnitsForEquipment = async (equipmentId, branchFilter) => {
    try {
      const res = await EquipmentUnitService.getByStatusGroup([
        "Active",
        "In Stock",
        "Temporary Urgent",
      ]);

      // Lọc theo dòng + chi nhánh
      const filtered = res.filter((u) => {
        if (u.equipment_id !== equipmentId) return false;
        if (!branchFilter) return true;
        return u.branch_id === branchFilter;
      });

      // Lấy bảo trì gần nhất
      const withLatest = await Promise.all(
        filtered.map(async (u) => {
          try {
            const latest = await MaintainService.getLatestHistory(u.id);
            return {
              ...u,
              lastMaintenance: latest
                ? latest.start_date?.split("T")[0]
                : "Chưa có",
            };
          } catch {
            return { ...u, lastMaintenance: "Chưa có" };
          }
        })
      );

      // Sort: unit đã có lịch xuống cuối
      const sorted = withLatest.sort((a, b) => {
        if (a.isScheduleLocked === b.isScheduleLocked) return 0;
        return a.isScheduleLocked ? 1 : -1;
      });

      // 🔥 Nếu đang mở popup cập nhật → MỞ KHÓA toàn bộ unit thuộc request
      if (editing) {
        const editingUnitIds = editing.units?.map((u) => u.id) || [];

        sorted.forEach((u) => {
          if (
            editingUnitIds.includes(u.id) ||
            selectedUnits[equipmentId]?.includes(u.id)
          ) {
            u.isScheduleLocked = false;
          }
        });
      }

      // Lưu vào state
      setEquipmentUnits((prev) => ({
        ...prev,
        [equipmentId]: sorted,
      }));
    } catch (err) {
      console.error("❌ Lỗi load unit:", err);
      toast.error("Không thể tải danh sách thiết bị con.");
    }
  };

  const handleRealSave = async () => {
    setConfirmMode("loading");

    try {
      const scheduledISO = `${format(
        selectedDateObj,
        "yyyy-MM-dd"
      )}T${time}:00`;

      const allUnitIds = Object.values(selectedUnits).flat();

      if (editing) {
        await MaintenanceRequestService.update(editing.id, {
          scheduled_at: scheduledISO,
          maintenance_reason: maintenanceReason,
          equipment_unit_id: allUnitIds,
          candidate_tech_id: selectedUser || null,
        });

        toast.success("Cập nhật yêu cầu thành công!");
        onSaved();
        onClose();
        return;
      }

      const payload = {
        equipment_unit_id: allUnitIds,
        maintenance_reason: maintenanceReason,
        scheduled_at: scheduledISO,
      };

      if (selectedUser) payload.candidate_tech_id = selectedUser;

      await MaintenanceRequestService.create(payload);

      setConfirmMode("success");

      // đóng sau 1.2s
      setTimeout(() => {
        setConfirmOpen(false);
        setSuccessOpen(true);
        onSaved?.();
      }, 1200);
    } catch (err) {
      toast.error(err?.error || "❌ Không thể tạo yêu cầu bảo trì");
      console.error(err);
      setConfirmMode("confirm");
    }
  };

  const isValidToSave =
    Object.values(selectedUnits).flat().length > 0 && // có unit
    time && // có giờ
    selectedDateObj && // có ngày
    maintenanceReason.trim(); // có lý do

  // ===== Nếu đang cập nhật yêu cầu =====
  useEffect(() => {
    if (!editing) return;

    const r = editing;

    // 1) Set branch đúng theo request
    setActiveBranch(r.units?.[0]?.branch_id || "");

    // 2) Set selected units + dòng đang mở
    const eqId = r.units[0].equipment_id;
    const unitIds = r.units.map((u) => u.id);
    setSelectedUnits({ [eqId]: unitIds });
    setExpandedEquipment(eqId);

    // 3) Ngày + giờ + lý do
    setSelectedDateObj(new Date(r.scheduled_at));
    const t = r.scheduled_at.split("T")[1].slice(0, 5);
    setTime(t);
    setMaintenanceReason(r.maintenance_reason || "");

    // 4) Load lại unit theo đúng branch của request
    loadUnitsForEquipment(eqId, r.units[0].branch_id);
  }, [editing]);

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 40 }}
        transition={{ duration: 0.25 }}
        className="fixed inset-0 z-[10001] bg-black/60 backdrop-blur-sm flex items-center justify-center"
      >
        <div className="relative bg-white rounded-3xl w-[90vw] max-w-[1200px] max-h-[90vh] overflow-y-auto overflow-x-hidden p-6 shadow-2xl border border-slate-200 space-y-6 text-slate-900">
          {/* ===== CARD 1 ===== */}
          <div className="p-4 rounded-2xl border border-emerald-300 bg-white">
            <h2 className="font-semibold mb-3 flex items-center gap-2 text-emerald-700">
              <ListChecks className="w-4 h-4" /> Danh sách thiết bị đến hạn bảo
              trì (bảo trì theo dòng)
            </h2>

            {/* === BẢNG DANH SÁCH THIẾT BỊ === */}
            <div className="border border-emerald-200 bg-white rounded-xl p-3 mb-5">
              <div className="flex justify-between items-center mb-2">
                <h3 className="font-semibold text-emerald-700">
                  Danh sách thiết bị đến hạn
                </h3>
              </div>

              <table className="min-w-full text-sm border border-emerald-200 rounded-lg overflow-hidden bg-white text-slate-900">
                <thead className="bg-emerald-100/70">
                  <tr className="font-semibold">
                    <th className="px-3 py-2 text-left">Mã dòng</th>
                    <th className="px-3 py-2 text-left">Hình</th>
                    <th className="px-3 py-2 text-left">Tên dòng</th>
                    <th className="px-3 py-2 text-left">Chu kỳ</th>
                    <th className="px-3 py-2 text-left">Tần suất</th>
                    <th className="px-3 py-2 text-left">Ngày bảo trì tới</th>
                  </tr>
                </thead>
                <tbody>
                  {maintenancePlans.map((plan) => {
                    const isLocked =
                      Object.keys(selectedUnits).length > 0 &&
                      !selectedUnits[plan.equipment_id];
                    const isActive = expandedEquipment === plan.equipment_id;

                    return (
                      <tr
                        key={plan.equipment_id}
                        onClick={async () => {
                          if (isLocked) return;
                          setExpandedEquipment(plan.equipment_id);
                          setCurrentPage(1);

                          // Nếu đã tải unit của dòng này rồi, bỏ qua
                          if (equipmentUnits[plan.equipment_id]) return;

                          try {
                            await loadUnitsForEquipment(
                              plan.equipment_id,
                              isSuperAdmin ? activeBranch : branchId
                            );
                          } catch (err) {
                            console.error(
                              "❌ Lỗi khi tải equipment units:",
                              err
                            );
                            toast.error(
                              "Không thể tải danh sách thiết bị con."
                            );
                          }
                        }}
                        className={`border-t transition cursor-pointer ${
                          isActive ? "bg-emerald-100/60" : "hover:bg-emerald-50"
                        } ${isLocked ? "opacity-50 cursor-not-allowed" : ""}`}
                      >
                        <td className="px-3 py-2">{plan.equipment_id}</td>
                        <td className="px-3 py-2">
                          <img
                            src={plan.equipment_img}
                            alt={plan.equipment_name}
                            className="w-12 h-12 object-cover rounded border"
                          />
                        </td>
                        <td className="px-3 py-2 font-medium">
                          {plan.equipment_name}
                        </td>
                        {(() => {
                          const { cycle, interval } = parseFrequency(
                            plan.frequency
                          );
                          return (
                            <>
                              <td className="px-3 py-2">{cycle}</td>
                              <td className="px-3 py-2">{interval}</td>
                            </>
                          );
                        })()}
                        <td className="px-3 py-2">
                          {plan.next_maintenance_date.split("T")[0]}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>

              {/* Ghi chú khi đã chọn dòng */}
              {Object.keys(selectedUnits).length > 0 && (
                <div className="mt-3 text-sm text-amber-600 font-medium flex items-center gap-2">
                  <span>🔒</span>
                  {(() => {
                    const firstKey = Object.keys(selectedUnits)[0];
                    const plan = maintenancePlans.find(
                      (p) => p.equipment_id === firstKey
                    );
                    return (
                      <span>
                        Đã chọn thiết bị thuộc dòng{" "}
                        <span className="font-semibold text-amber-700">
                          {plan?.equipment_name || firstKey}
                        </span>
                        . Nếu muốn chọn dòng khác, hãy bấm "Bỏ chọn tất cả".
                      </span>
                    );
                  })()}
                </div>
              )}
            </div>

            {/* ==== CHỌN CHI NHÁNH (Đưa lên trên) ==== */}
            <div className="mb-3">
              {isSuperAdmin ? (
                <div className="flex items-center gap-3">
                  <span className="text-sm text-slate-700 font-medium">
                    Chi nhánh:
                  </span>
                  <Select
                    value={activeBranch}
                    onValueChange={async (v) => {
                      if (editing) return; // NGĂN KHÔNG CHO ĐỔI NHÁNH KHI CẬP NHẬT
                      setActiveBranch(v);

                      // THÊM CODE — reset unit nhưng KHÔNG reset dòng
                      setSelectedUnits({});

                      if (expandedEquipment) {
                        // load lại unit theo chi nhánh mới cho dòng đang chọn
                        try {
                          if (expandedEquipment) {
                            await loadUnitsForEquipment(expandedEquipment, v);
                          }
                        } catch (err) {
                          console.error(
                            "❌ Lỗi khi reload unit theo chi nhánh:",
                            err
                          );
                          toast.error("Không thể tải danh sách thiết bị con.");
                        }
                      }
                    }}
                  >
                    <SelectTrigger
                      disabled={editing}
                      className="h-9 w-48 text-sm border-emerald-300"
                    >
                      <SelectValue placeholder="Chi nhánh" />
                    </SelectTrigger>
                    <SelectContent className="z-[20000] bg-white">
                      {branches.map((b) => (
                        <SelectItem key={b.id} value={b.id}>
                          {b.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              ) : (
                <div className="text-sm font-semibold text-emerald-600">
                  Chi nhánh hiện tại:{" "}
                  <span className="font-bold">{branchId}</span>
                </div>
              )}
            </div>

            {/* === BẢNG CHI TIẾT UNIT === */}
            <div className="border border-emerald-200 bg-white rounded-xl p-3">
              <div className="flex justify-between items-center mb-2">
                <h3 className="font-semibold text-emerald-700">
                  Chi tiết thiết bị
                </h3>

                {/* Nút bỏ chọn tất cả */}
                {Object.keys(selectedUnits).length > 0 && (
                  <Button
                    onClick={() => {
                      setSelectedUnits({});
                      setExpandedEquipment(null);
                      toast.info("🔄 Đã bỏ chọn tất cả thiết bị.");
                    }}
                    variant="outline"
                    className="text-sm border-emerald-300 text-amber-600 hover:bg-emerald-50"
                  >
                    Bỏ chọn tất cả
                  </Button>
                )}
              </div>

              {!expandedEquipment ? (
                <p className="text-slate-500 text-sm italic">
                  Chọn một thiết bị ở bảng trên để xem danh sách unit.
                </p>
              ) : (
                <>
                  {(() => {
                    const allUnits = equipmentUnits[expandedEquipment] || [];
                    const totalPages = Math.max(
                      1,
                      Math.ceil(allUnits.length / ITEMS_PER_PAGE)
                    );
                    const paginatedUnits = allUnits.slice(
                      (currentPage - 1) * ITEMS_PER_PAGE,
                      currentPage * ITEMS_PER_PAGE
                    );

                    return (
                      <>
                        <table className="w-full text-sm border border-emerald-200 rounded-lg overflow-hidden bg-white">
                          <thead className="bg-emerald-100/60">
                            <tr className="text-slate-900 font-medium">
                              <th className="px-3 py-2 text-left">Chọn</th>
                              <th className="px-3 py-2 text-left">
                                Mã định danh thiết bị
                              </th>
                              <th className="px-3 py-2 text-left">
                                Tên thiết bị
                              </th>
                              <th className="px-3 py-2 text-left">
                                Trạng thái
                              </th>
                              <th className="px-3 py-2 text-left">
                                Bảo trì gần nhất
                              </th>
                            </tr>
                          </thead>
                          <tbody>
                            {paginatedUnits.map((unit) => {
                              const checked = selectedUnits[
                                expandedEquipment
                              ]?.includes(unit.id);
                              const locked =
                                editing &&
                                selectedUnits[expandedEquipment]?.includes(
                                  unit.id
                                )
                                  ? false // unit đang được chỉnh sửa -> mở chọn
                                  : unit.isScheduleLocked;

                              return (
                                <tr
                                  key={unit.id}
                                  className={`border-t transition ${
                                    locked
                                      ? "bg-slate-100 text-slate-400 cursor-not-allowed"
                                      : "hover:bg-emerald-50"
                                  } ${checked ? "bg-emerald-100/40" : ""}`}
                                >
                                  <td className="px-2 py-2 relative">
                                    {locked ? (
                                      <span className="text-[10px] bg-amber-200 text-amber-800 px-2 py-0.5 rounded font-medium">
                                        Đã lên lịch
                                      </span>
                                    ) : (
                                      <input
                                        type="checkbox"
                                        checked={checked}
                                        onChange={() =>
                                          toggleUnit(expandedEquipment, unit.id)
                                        }
                                        className="w-4 h-4 accent-emerald-600"
                                      />
                                    )}
                                  </td>
                                  <td className="px-3 py-2">{unit.id}</td>
                                  <td className="px-3 py-2">
                                    <span
                                      className={
                                        unit.branch_id === "GV"
                                          ? "text-emerald-600 font-semibold"
                                          : unit.branch_id === "Q3"
                                          ? "text-blue-600 font-semibold"
                                          : "text-slate-700"
                                      }
                                    >
                                      {unit.equipment?.name}
                                    </span>
                                  </td>
                                  <td className="px-3 py-2">{unit.status}</td>
                                  <td className="px-3 py-2 text-slate-600">
                                    {unit.lastMaintenance}
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>

                        {/* === Thanh phân trang nhỏ === */}
                        {allUnits.length > ITEMS_PER_PAGE && (
                          <div className="flex justify-between items-center mt-3 text-sm text-slate-600">
                            <span>
                              Trang {currentPage} / {totalPages}
                            </span>
                            <div className="flex gap-1">
                              <Button
                                size="sm"
                                variant="outline"
                                disabled={currentPage === 1}
                                onClick={() =>
                                  setCurrentPage((p) => Math.max(1, p - 1))
                                }
                                className="h-7 text-xs border-slate-300"
                              >
                                «
                              </Button>
                              {Array.from({ length: totalPages }).map(
                                (_, i) => (
                                  <Button
                                    key={i}
                                    size="sm"
                                    variant={
                                      currentPage === i + 1
                                        ? "default"
                                        : "outline"
                                    }
                                    onClick={() => setCurrentPage(i + 1)}
                                    className={`h-7 w-7 text-xs ${
                                      currentPage === i + 1
                                        ? "bg-emerald-500 text-white"
                                        : "border-slate-300"
                                    }`}
                                  >
                                    {i + 1}
                                  </Button>
                                )
                              )}
                              <Button
                                size="sm"
                                variant="outline"
                                disabled={currentPage === totalPages}
                                onClick={() =>
                                  setCurrentPage((p) =>
                                    Math.min(totalPages, p + 1)
                                  )
                                }
                                className="h-7 text-xs border-slate-300"
                              >
                                »
                              </Button>
                            </div>
                          </div>
                        )}
                      </>
                    );
                  })()}
                </>
              )}
            </div>
          </div>

          {/* ===== CARD 2: Thời gian bảo trì (có lịch hiển thị) ===== */}
          <div className="p-4 rounded-2xl border border-slate-300 bg-white">
            <h2 className="font-semibold mb-3 flex items-center gap-2 text-slate-900">
              <CalendarDays className="w-4 h-4" /> Thời gian bảo trì (Chọn ngày
              bảo trì bên dưới)
            </h2>
            {/* === Mini Month Calendar === */}
            <div className="border border-emerald-200 rounded-2xl p-4 bg-white">
              <div className="flex justify-between items-center mb-3">
                <button
                  onClick={() =>
                    setCursor(
                      (d) => new Date(d.getFullYear(), d.getMonth() - 1, 1)
                    )
                  }
                  className="px-2 py-1 rounded-md hover:bg-emerald-50 text-emerald-700"
                >
                  ‹
                </button>
                <h3 className="font-semibold text-emerald-700">
                  {format(cursor, "MMMM yyyy", { locale: vi })}
                </h3>
                <button
                  onClick={() =>
                    setCursor(
                      (d) => new Date(d.getFullYear(), d.getMonth() + 1, 1)
                    )
                  }
                  className="px-2 py-1 rounded-md hover:bg-emerald-50 text-emerald-700"
                >
                  ›
                </button>
              </div>

              <div className="grid grid-cols-7 gap-2 text-center text-[12px] font-semibold text-slate-500 mb-2">
                {["T2", "T3", "T4", "T5", "T6", "T7", "CN"].map((d) => (
                  <div key={d}>{d}</div>
                ))}
              </div>

              <div className="grid grid-cols-7 gap-2">
                {daysInView.map((day) => {
                  const inMonth = isSameMonth(day, cursor);
                  const selected = isSameDay(day, selectedDateObj);
                  const today = new Date();
                  const isPast = day < startOfDay(today);

                  const dayRequests = requests.filter(
                    (r) =>
                      r.scheduled_at.split("T")[0] === format(day, "yyyy-MM-dd")
                  );

                  const matchedPlans = maintenancePlans.filter(
                    (p) =>
                      p.next_maintenance_date.split("T")[0] ===
                      format(day, "yyyy-MM-dd")
                  );

                  const hasNextMaintenance = matchedPlans.length > 0;
                  const hasEvents = dayRequests.length > 0;

                  const highlightColor = hasNextMaintenance
                    ? "border-amber-400 bg-amber-50"
                    : hasEvents
                    ? "border-emerald-400 bg-emerald-50"
                    : "border-slate-200 hover:bg-slate-50";

                  return (
                    <div
                      key={format(day, "yyyy-MM-dd")}
                      onClick={() => {
                        if (!isPast) setSelectedDateObj(day);
                      }}
                      className={`p-2 rounded-xl border text-[12px] min-h-[85px] transition-all flex flex-col justify-between cursor-pointer
        ${selected ? "border-emerald-500 bg-emerald-50" : highlightColor}
        ${!inMonth ? "opacity-50" : ""}
        ${isPast ? "opacity-40 pointer-events-none" : ""}
      `}
                    >
                      <div className="flex justify-between items-center">
                        <span className="font-medium text-slate-700">
                          {format(day, "d", { locale: vi })}
                        </span>
                        {isToday(day) && (
                          <span className="px-1 text-[10px] rounded-full bg-emerald-100 text-emerald-700 border border-emerald-200">
                            Hôm nay
                          </span>
                        )}
                      </div>

                      <div className="text-[10px] mt-1 space-y-0.5 truncate">
                        {hasNextMaintenance &&
                          matchedPlans.map((p) => (
                            <div
                              key={p.id}
                              className="text-amber-600 font-medium truncate"
                            >
                              • Lịch đúng hẹn
                              <div className="text-amber-700 text-[10px] font-normal truncate">
                                {p.equipment_name}
                              </div>
                            </div>
                          ))}

                        {hasEvents &&
                          dayRequests.map((r) => (
                            <div
                              key={r.id}
                              className="text-emerald-600 font-medium truncate mt-0.5"
                            >
                              • Có lịch
                              {r.units?.[0]?.equipment_name && (
                                <div className="text-emerald-700 text-[10px] font-normal truncate">
                                  {r.units[0].equipment_name}
                                </div>
                              )}
                            </div>
                          ))}

                        {!hasNextMaintenance && !hasEvents && (
                          <div className="text-slate-400">&nbsp;</div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* === Xác nhận ngày + giờ + lý do === */}
            <div className="mt-5 space-y-4">
              {/* ===== FIELD 1: NGÀY BẢO TRÌ ===== */}
              <div>
                <p className="font-medium text-slate-700 flex items-center gap-1">
                  <span className="text-red-500 font-bold">*</span>
                  <span className="text-red-500 text-sm">
                    Bắt buộc: Phải chọn ngày bảo trì
                  </span>
                </p>

                <p className="font-medium text-slate-700 mt-1 flex items-center gap-1">
                  📅 Ngày được chọn:
                  <span className="text-emerald-700 font-semibold">
                    {selectedDateObj
                      ? format(selectedDateObj, "EEEE, dd/MM/yyyy", {
                          locale: vi,
                        })
                      : "— Chưa chọn"}
                  </span>
                </p>

                {errors?.date && (
                  <p className="text-red-500 text-xs mt-1">
                    Vui lòng chọn ngày bảo trì
                  </p>
                )}
              </div>

              {/* ===== FIELD 2: GIỜ BẮT ĐẦU ===== */}
              <div className="flex flex-col">
                <div className="flex items-start gap-1 flex-col">
                  <div className="flex items-center gap-1">
                    <span className="text-red-500 font-bold">*</span>
                    <span className="text-red-500 text-sm">
                      Bắt buộc: Phải chọn giờ bắt đầu
                    </span>
                  </div>

                  <label className="text-sm text-slate-600">
                    🕒 Giờ bắt đầu:
                  </label>
                </div>

                <Input
                  type="time"
                  value={time}
                  className={`w-40 mt-1 ${
                    errors?.time ? "border-red-500" : ""
                  }`}
                  min={
                    format(selectedDateObj, "yyyy-MM-dd") ===
                    format(new Date(), "yyyy-MM-dd")
                      ? format(new Date(), "HH:mm")
                      : undefined
                  }
                  onChange={(e) => {
                    setErrors((prev) => ({ ...prev, time: false }));
                    setTime(e.target.value);
                  }}
                />

                {errors?.time && (
                  <p className="text-red-500 text-xs mt-1">
                    Vui lòng chọn giờ bắt đầu
                  </p>
                )}
              </div>

              {/* ===== FIELD 3: LÝ DO BẢO TRÌ ===== */}
              <div className="flex flex-col">
                <div className="flex flex-col gap-1">
                  <div className="flex items-center gap-1">
                    <span className="text-red-500 font-bold">*</span>
                    <span className="text-red-500 text-sm">
                      Bắt buộc: Phải nhập lý do bảo trì
                    </span>
                  </div>

                  <label className="text-sm text-slate-600 font-medium">
                    📝 Lý do bảo trì:
                  </label>
                </div>

                <Input
                  placeholder="Nhập lý do bảo trì..."
                  value={maintenanceReason}
                  className={`${errors?.reason ? "border-red-500" : ""} mt-1`}
                  onChange={(e) => {
                    setErrors((prev) => ({ ...prev, reason: false }));
                    setMaintenanceReason(e.target.value);
                  }}
                />

                {errors?.reason && (
                  <p className="text-red-500 text-xs mt-1">
                    Vui lòng nhập lý do bảo trì
                  </p>
                )}
              </div>
            </div>

            {/* === Danh sách thiết bị có lịch trong ngày === */}
            <div className="mt-5">
              <h4 className="text-sm font-semibold text-emerald-700 mb-2">
                Thiết bị đã có lịch trong ngày này:
              </h4>
              {(() => {
                const selDay = format(selectedDateObj, "yyyy-MM-dd");
                const sameDay = requests.filter(
                  (r) => r.scheduled_at.split("T")[0] === selDay
                );

                if (sameDay.length === 0)
                  return (
                    <p className="text-sm text-slate-500 italic">
                      Không có thiết bị nào được lên lịch.
                    </p>
                  );

                return (
                  <ul className="text-sm space-y-2">
                    {sameDay.map((r) => (
                      <li
                        key={r.id}
                        className="p-2 border border-emerald-200 rounded-lg bg-emerald-50 flex justify-between"
                      >
                        <div>
                          <div className="font-medium text-emerald-700">
                            {r.units?.[0]?.equipment_name}
                          </div>
                          <div className="text-xs text-slate-500">
                            🕒 {r.scheduled_at.split("T")[1] || "Không rõ giờ"}
                          </div>

                          {r.assigned_to ? (
                            <div className="text-xs text-slate-600 mt-0.5">
                              👨‍🔧 Người đảm nhận:{" "}
                              <span className="font-medium text-emerald-700">
                                {r.assigned_to}
                              </span>
                            </div>
                          ) : (
                            <div className="text-xs text-slate-500 mt-0.5 italic">
                              👷 Chưa có người đảm nhận
                            </div>
                          )}
                        </div>

                        <span
                          className={`px-2 py-0.5 text-xs rounded-md self-start ${
                            r.status === "confirmed"
                              ? "bg-emerald-100 text-emerald-700"
                              : "bg-amber-100 text-amber-700"
                          }`}
                        >
                          {r.status === "confirmed"
                            ? "Đã lên lịch"
                            : "Chờ xác nhận"}
                        </span>
                      </li>
                    ))}
                  </ul>
                );
              })()}
            </div>
          </div>

          {/* ===== CARD 3: Chọn kỹ thuật viên ===== */}
          <div className="p-4 rounded-2xl border border-slate-300 bg-white">
            <h2 className="font-semibold mb-3 flex items-center gap-2">
              <UserRound className="w-4 h-4" /> Chọn kỹ thuật viên (Không bắt
              buộc)
            </h2>
            <div className="text-sm text-slate-600 mb-2 bg-slate-50 p-2 rounded-md border border-slate-200">
              • Chọn kỹ thuật viên để giao lịch ngay.
              <br />• Nếu không chọn, hệ thống sẽ gửi thông báo để các kỹ thuật
              viên tự nhận lịch.
            </div>

            <div className="border rounded-xl overflow-hidden">
              <table className="min-w-full text-sm bg-white">
                <thead className="bg-emerald-100/70 text-slate-800">
                  <tr>
                    <th className="px-3 py-2 text-left">Chọn</th>
                    <th className="px-3 py-2 text-left">Tên</th>
                    <th className="px-3 py-2 text-left">Chi nhánh</th>
                    <th className="px-3 py-2 text-left">Email</th>
                    <th className="px-3 py-2 text-left">Role</th>
                  </tr>
                </thead>

                <tbody>
                  {users
                    .filter((u) => {
                      const techBranch = u.attributes?.["custom:branch_id"];

                      return isSuperAdmin
                        ? techBranch === activeBranch
                        : techBranch === branchId;
                    })
                    .map((u) => {
                      const sub = u.attributes?.sub;
                      const name = u.attributes?.name || u.username;
                      const branch = u.attributes?.["custom:branch_id"] || "—";
                      const email = u.attributes?.email || "—";
                      const roles = u.roles?.join(", ");
                      const checked = selectedUser === sub;

                      return (
                        <tr
                          key={sub}
                          className={`border-t hover:bg-emerald-50 transition ${
                            checked ? "bg-emerald-100/40" : ""
                          }`}
                        >
                          <td className="px-3 py-2">
                            <input
                              type="checkbox"
                              checked={checked}
                              onChange={() =>
                                setSelectedUser((prev) =>
                                  prev === sub ? "" : sub
                                )
                              }
                              className="w-4 h-4 accent-emerald-600"
                            />
                          </td>
                          <td className="px-3 py-2 font-medium">{name}</td>
                          <td className="px-3 py-2">{branch}</td>
                          <td className="px-3 py-2">{email}</td>
                          <td className="px-3 py-2">{roles}</td>
                        </tr>
                      );
                    })}
                </tbody>
              </table>
            </div>

            {selectedUser && (
              <p className="mt-3 text-sm text-emerald-700 font-medium">
                👨‍🔧 Đã chọn kỹ thuật viên:{" "}
                <span className="font-semibold">
                  {
                    users.find((u) => u.attributes?.sub === selectedUser)
                      ?.attributes?.name
                  }
                </span>
              </p>
            )}
          </div>

          {/* ===== CARD 4: Lịch bảo trì hiện có ===== */}
          <div className="p-4 rounded-2xl border border-slate-300 bg-white">
            <h2 className="font-semibold mb-3 flex items-center gap-2 text-slate-900">
              <Clock className="w-4 h-4" /> Lịch bảo trì hiện có
            </h2>

            <table className="min-w-full text-sm border border-slate-200 rounded-lg overflow-hidden bg-white">
              <thead className="bg-emerald-100/70">
                <tr>
                  <th className="px-3 py-2 text-left">Mã</th>
                  <th className="px-3 py-2 text-left">Tên thiết bị</th>
                  <th className="px-3 py-2 text-left">Thời gian</th>
                  <th className="px-3 py-2 text-left">Trạng thái</th>
                </tr>
              </thead>
              <tbody>
                {paginatedRequests.map((r) => (
                  <Fragment key={r.id}>
                    <tr
                      onClick={() =>
                        setExpandedEquipment((prev) =>
                          prev === r.id ? null : r.id
                        )
                      }
                      className={`border-t cursor-pointer hover:bg-emerald-50 transition ${
                        expandedEquipment === r.id ? "bg-emerald-100/60" : ""
                      }`}
                    >
                      <td className="px-3 py-2 font-medium text-emerald-700">
                        {r.id}
                      </td>
                      <td className="px-3 py-2">
                        {r.units?.[0]?.equipment_name}
                      </td>
                      <td className="px-3 py-2">{r.scheduled_at}</td>
                      <td className="px-3 py-2 capitalize">{r.status}</td>
                    </tr>

                    {expandedEquipment === r.id && (
                      <tr
                        key={`${r.id}-details`}
                        className="bg-emerald-50 transition"
                      >
                        <td colSpan={4} className="p-0">
                          <div className="px-5 py-3">
                            <p className="text-sm font-semibold mb-2 text-emerald-700">
                              Các unit sẽ được bảo trì:
                            </p>

                            <table className="min-w-full text-xs border border-emerald-200 rounded-md overflow-hidden bg-white">
                              <thead className="bg-emerald-100/70">
                                <tr>
                                  <th className="px-3 py-2 text-left">
                                    Mã định danh thiết bị
                                  </th>
                                  <th className="px-3 py-2 text-left">
                                    Tên thiết bị
                                  </th>
                                  <th className="px-3 py-2 text-left">
                                    Trạng thái thiết bị
                                  </th>
                                </tr>
                              </thead>
                              <tbody>
                                {r.units.map((u) => (
                                  <tr
                                    key={u.id}
                                    className="border-t hover:bg-emerald-50"
                                  >
                                    <td className="px-3 py-2">{u.id}</td>
                                    <td className="px-3 py-2">
                                      {u.equipment_name}
                                    </td>
                                    <td className="px-3 py-2">
                                      {u.status || "—"}
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        </td>
                      </tr>
                    )}
                  </Fragment>
                ))}
              </tbody>
            </table>

            {requests.length > REQUESTS_PER_PAGE && (
              <div className="flex justify-between items-center mt-3 text-sm text-slate-600">
                <span>
                  Trang {requestPage} / {totalRequestPages}
                </span>

                <div className="flex gap-1">
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={requestPage === 1}
                    onClick={() => setRequestPage((p) => Math.max(1, p - 1))}
                    className="h-7 text-xs border-slate-300"
                  >
                    «
                  </Button>

                  {Array.from({ length: totalRequestPages }).map((_, i) => (
                    <Button
                      key={i}
                      size="sm"
                      variant={requestPage === i + 1 ? "default" : "outline"}
                      onClick={() => setRequestPage(i + 1)}
                      className={`h-7 w-7 text-xs ${
                        requestPage === i + 1
                          ? "bg-emerald-500 text-white"
                          : "border-slate-300"
                      }`}
                    >
                      {i + 1}
                    </Button>
                  ))}

                  <Button
                    size="sm"
                    variant="outline"
                    disabled={requestPage === totalRequestPages}
                    onClick={() =>
                      setRequestPage((p) => Math.min(totalRequestPages, p + 1))
                    }
                    className="h-7 text-xs border-slate-300"
                  >
                    »
                  </Button>
                </div>
              </div>
            )}
          </div>

          {/* FOOTER */}
          <div className="flex justify-end pt-4">
            <Button
              onClick={() => {
                const newErrors = {
                  date: !selectedDateObj,
                  time: !time,
                  reason: !maintenanceReason.trim(),
                };

                setErrors(newErrors);

                if (newErrors.date || newErrors.time || newErrors.reason) {
                  toast.error("Vui lòng nhập đầy đủ thông tin bắt buộc!");
                  return;
                }

                setConfirmMode("confirm");
                setConfirmOpen(true);
              }}
              disabled={!isValidToSave}
              className={`px-6 font-semibold text-white 
      ${
        !isValidToSave
          ? "bg-slate-300 cursor-not-allowed"
          : "bg-gradient-to-r from-emerald-500 to-cyan-500"
      }`}
            >
              💾 Lưu
            </Button>
          </div>
        </div>
      </motion.div>
      {/* ===== ALERT XÁC NHẬN ===== */}
      <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogContent className="max-w-md z-[200000]">
          {confirmMode === "confirm" && (
            <>
              <AlertDialogHeader>
                <AlertDialogTitle>
                  {editing
                    ? "Xác nhận cập nhật lịch bảo trì"
                    : "Xác nhận tạo lịch bảo trì"}
                </AlertDialogTitle>

                <AlertDialogDescription>
                  {editing ? (
                    <>
                      Bạn có chắc muốn <strong>cập nhật</strong> lịch bảo trì
                      cho{" "}
                      <strong>
                        {Object.values(selectedUnits).flat().length}
                      </strong>{" "}
                      thiết bị?
                    </>
                  ) : (
                    <>
                      Bạn có chắc muốn <strong>tạo</strong> lịch bảo trì cho{" "}
                      <strong>
                        {Object.values(selectedUnits).flat().length}
                      </strong>{" "}
                      thiết bị?
                    </>
                  )}
                </AlertDialogDescription>
              </AlertDialogHeader>

              <AlertDialogFooter>
                <AlertDialogCancel>Hủy</AlertDialogCancel>
                <button
                  onClick={handleRealSave}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-md"
                >
                  Xác nhận
                </button>
              </AlertDialogFooter>
            </>
          )}

          {/* LOADING */}
          {confirmMode === "loading" && (
            <div className="py-6 flex flex-col items-center">
              <div className="w-10 h-10 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mb-4"></div>
              <p className="text-slate-700 font-medium">
                {editing
                  ? "Đang cập nhật lịch bảo trì..."
                  : "Đang tạo lịch bảo trì..."}
              </p>
            </div>
          )}

          {/* SUCCESS */}
          {confirmMode === "success" && (
            <div className="py-6 flex flex-col items-center">
              <div className="w-12 h-12 bg-emerald-500 rounded-full flex items-center justify-center text-white text-xl mb-3">
                ✓
              </div>
              <p className="text-emerald-700 font-semibold">
                {editing ? "Cập nhật lịch thành công!" : "Tạo lịch thành công!"}
              </p>
            </div>
          )}
        </AlertDialogContent>
      </AlertDialog>

      {/* ===== ALERT THÀNH CÔNG ===== */}
      <AlertDialog open={successOpen} onOpenChange={setSuccessOpen}>
        <AlertDialogContent className="max-w-md z-[300000]">
          <AlertDialogHeader>
            <AlertDialogTitle
              className={editing ? "text-blue-700" : "text-emerald-700"}
            >
              {editing
                ? "🎉 Cập nhật lịch bảo trì thành công!"
                : "🎉 Tạo lịch bảo trì thành công!"}
            </AlertDialogTitle>

            <AlertDialogDescription>
              {editing
                ? "Hệ thống đã cập nhật yêu cầu bảo trì và đồng bộ lại trạng thái thiết bị."
                : "Hệ thống đã tạo yêu cầu bảo trì và cập nhật trạng thái thiết bị."}
            </AlertDialogDescription>
          </AlertDialogHeader>

          <AlertDialogFooter>
            <AlertDialogAction
              className={`text-white ${
                editing
                  ? "bg-blue-600 hover:bg-blue-700"
                  : "bg-emerald-600 hover:bg-emerald-700"
              }`}
              onClick={() => {
                setSuccessOpen(false);
                onClose?.(); // đóng modal chính
              }}
            >
              Đóng
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
