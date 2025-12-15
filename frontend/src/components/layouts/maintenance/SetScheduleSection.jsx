import React, { useEffect, useMemo, useState } from "react";
import {
  addMonths,
  addWeeks,
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  format,
  isSameDay,
  isSameMonth,
  isSameWeek,
  isToday,
  startOfMonth,
  startOfWeek,
} from "date-fns";
import { ClockClockwise, Wrench, Archive } from "@phosphor-icons/react";
import { vi } from "date-fns/locale";
import { motion, AnimatePresence } from "framer-motion";
import {
  ChevronLeft,
  ChevronRight,
  CalendarDays,
  CalendarRange,
  LayoutGrid,
  Plus,
} from "lucide-react";
import MaintenancePlanService from "@/services/MaintenancePlanService";
import { Button } from "@/components/ui/buttonn";
import { toast } from "sonner";
import EquipmentService from "@/services/equipmentService";
import AddScheduleSection from "./AddScheduleSection";
import { X } from "lucide-react";
import MaintenanceRequestService from "@/services/MaintenanceRequestService";
import MaintainService from "@/services/MaintainService";
import BranchService from "@/services/branchService";
import useAuthRole from "@/hooks/useAuthRole";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
  AlertDialogAction,
} from "@/components/ui/alert-dialog";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import Status from "@/components/common/Status";

/* 🎨 Style mapping trạng thái */
const STATUS = {
  completed: {
    chip: "bg-gradient-to-r from-emerald-500 to-teal-500 text-white",
    icon: "✅",
    text: "Hoàn tất",
    border: "border-emerald-300/50",
  },
  in_progress: {
    chip: "bg-gradient-to-r from-cyan-500 to-blue-500 text-white",
    icon: "🔧",
    text: "Đang làm",
    border: "border-cyan-300/50",
  },
  pending: {
    chip: "bg-gradient-to-r from-amber-400 to-orange-400 text-white",
    icon: "⏳",
    text: "Chờ",
    border: "border-amber-300/50",
  },
  default: {
    chip: "bg-slate-300 text-slate-800",
    icon: "⚙️",
    text: "Khác",
    border: "border-slate-300/50",
  },
};

const normStatus = (s) => (s ? String(s).toLowerCase() : "pending");
function generateRecurringPlanEvents(plan, monthsAhead = 12) {
  const events = [];

  let cursor = new Date(plan.next_maintenance_date);

  const freq = String(plan.frequency || "").toLowerCase();
  const match = freq.match(/(\d+)_(\w+)/);

  const value = match ? Number(match[1]) : 1;
  const type = match ? match[2] : "month";

  for (let i = 0; i < monthsAhead; i++) {
    events.push({
      id: `${plan.id}_rec_${i}`,
      type: "plan",
      unitId: plan.equipment_id,
      unitGroup: plan.equipment_name,
      branch: "—",
      start: new Date(cursor),
      status: "plan",
      image: plan.image,
      color: "bg-amber-400 text-white",
      label: "🟠 Lịch định kỳ",
    });

    // tăng kỳ tiếp theo
    if (type.includes("month")) cursor = addMonths(cursor, value);
    else if (type.includes("week")) cursor = addWeeks(cursor, value);
    else if (type.includes("day")) cursor = addDays(cursor, value);
  }

  return events;
}

const fmtDayKey = (d) => format(d, "yyyy-MM-dd");

/* 🧩 Map dữ liệu từ API -> event chuẩn (lấy thêm tên dòng thiết bị) */
const mapEvent = async (item) => {
  const start = item.next_maintenance_date
    ? new Date(item.next_maintenance_date)
    : new Date();

  // Gọi EquipmentService để lấy tên dòng thiết bị
  let equipmentName = "—";
  try {
    const eq = await EquipmentService.getById(item.equipment_id);
    equipmentName = eq?.name || eq?.equipment_name || "—";
  } catch (e) {
    console.warn("⚠️ Không thể lấy tên dòng thiết bị:", e);
  }

  return {
    id: item.plan_id || item.id,
    unitId: item.equipment_id || "—",
    unitGroup: equipmentName, // ✅ tên dòng thiết bị
    branch: item.branch_name || item.branch_id || "—",
    start,
    status: normStatus(item.status || "pending"),
    technician: item.technician_name || "—",
    frequency: item.frequency,
    note: item.note || "",
  };
};

export default function SetScheduleSection() {
  const [events, setEvents] = useState([]);
  const { isSuperAdmin, isAdmin } = useAuthRole();
  const [cursor, setCursor] = useState(() => new Date()); // mốc hiển thị
  const [selectedDate, setSelectedDate] = useState(new Date()); // ngày được chọn
  const [loading, setLoading] = useState(true);
  // ====== Dialog states ======
  const [reloadLoading, setReloadLoading] = useState(false);

  const [assignOpen, setAssignOpen] = useState(false);
  const [assignMode, setAssignMode] = useState("confirm"); // confirm | loading | success
  const [selectedRequest, setSelectedRequest] = useState(null);

  const [cancelOpen, setCancelOpen] = useState(false);
  const [cancelMode, setCancelMode] = useState("confirm"); // confirm | loading | success

  const [pendingGroups, setPendingGroups] = useState([]);
  const [confirmedGroups, setConfirmedGroups] = useState([]);

  const [branches, setBranches] = useState([]);
  const [activeBranch, setActiveBranch] = useState("all");

  // Convert BE → status tiếng Việt đúng theo Status.jsx
  const UNIT_STATUS_MAP = {
    active: "Hoạt động",
    inactive: "Ngưng sử dụng",
    "temporary urgent": "Ngừng tạm thời",
    "in progress": "Đang bảo trì",
    ready: "Bảo trì thành công",
    failed: "Bảo trì thất bại",
    moving: "Đang điều chuyển",
    "in stock": "Thiết bị trong kho",
    deleted: "Đã xóa",
    disposed: "Đã thanh lý",
  };

  const convertUnitStatus = (status) => {
    if (!status) return "Không xác định";
    return UNIT_STATUS_MAP[status.toLowerCase()] || "Không xác định";
  };

  const auth = JSON.parse(localStorage.getItem("fitx_auth") || "{}");
  const currentUserSub = auth?.user?.sub || "";

  // load branch
  useEffect(() => {
    (async () => {
      try {
        const res = await BranchService.getAll();
        setBranches(res || []);
      } catch (err) {
        toast.error("Không thể tải danh sách chi nhánh!");
      }
    })();
  }, []);

  const handleAssign = async () => {
    try {
      // popup vẫn mở
      setAssignMode("loading");

      const requestId = selectedRequest.id;

      // 🔥 Update UI ngay lập tức
      setEvents((prev) =>
        prev.map((e) =>
          e.id === requestId
            ? {
                ...e,
                requestStatus: "confirmed",
                status: "confirmed",
                color: "bg-emerald-500 text-white",
              }
            : e
        )
      );

      await MaintenanceRequestService.confirm(requestId);
      await fetchPlans();

      setAssignMode("success"); // lúc này popup hiển thị success
    } catch (err) {
      toast.error("Không thể đảm nhận thiết bị!");
      setAssignOpen(false);
    }
  };

  const [view, setView] = useState("month"); // 'week' | 'month' | 'year'
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);

  const [editingRequest, setEditingRequest] = useState(null);

  const [hoverDay, setHoverDay] = useState(null);
  const [popupPos, setPopupPos] = useState({ x: 0, y: 0 });
  const popupHoverRef = React.useRef(false);
  const dayHoverRef = React.useRef(false);

  // 🔹 Lưu ID của yêu cầu đang mở "Chi tiết thiết bị"
  const [expandedRequest, setExpandedRequest] = useState(null);
  // 🟢 Bộ lọc loại lịch
  const [eventFilter, setEventFilter] = useState("all"); // all | plan | pending | confirmed

  /* ====== Fetch plans ====== */
  const fetchPlans = async () => {
    try {
      setReloadLoading(true);

      // 🔹 Gọi song song 2 API
      const [plansRes, reqRes] = await Promise.all([
        MaintenancePlanService.getAll(),
        MaintenanceRequestService.getAll(),
      ]);

      const plans = Array.isArray(plansRes) ? plansRes : plansRes?.data || [];
      const requests = Array.isArray(reqRes) ? reqRes : reqRes?.data || [];

      // 🔸 Lịch định kỳ (plan)
      // 🔥 Tạo lịch định kỳ cho nhiều kỳ tương lai
      let planEvents = [];
      for (const p of plans) {
        let eqImg = null;
        try {
          const eq = await EquipmentService.getById(p.equipment_id);
          eqImg = eq?.image || eq?.equipment_image || eq?.thumbnail || null;
        } catch (e) {}

        // Gán image vào plan object để dùng trong generator
        p.image = eqImg;

        // tạo 12 kỳ (có thể đổi monthsAhead nếu muốn)
        const rec = generateRecurringPlanEvents(p, 12);
        planEvents = [...planEvents, ...rec];
      }

      // 🔹 Request Events (đã FIX 100% lỗi cancelled + ghost event)
      const requestEvents = requests
        .filter((r) => !!r.scheduled_at)
        // .filter((r) => {
        //   const st = (r.status || "").trim().toLowerCase();
        //   return !["cancel", "canceled", "cancelled"].includes(st);
        // })
        .map((r) => {
          const status = String(r.status || "")
            .trim()
            .toLowerCase();
          const isConfirmed = status === "confirmed";

          return {
            key: r.id, // 🔥 FIX LỖI GHOST EVENT
            id: r.id,
            requestId: r.id,
            type: "request",
            branchId: r.branch_id,
            assigned_by: r.assigned_by,

            units: r.units || [],
            image: r.units?.[0]?.equipment_image,
            unitGroup: r.units?.[0]?.equipment_name,
            maintenance_reason: r.maintenance_reason,
            branch: r.units?.[0]?.branch_name || "—",

            start: new Date(r.scheduled_at.replace("Z", "")),
            scheduled_at: r.scheduled_at,
            originalScheduledAt: r.scheduled_at,

            requestStatus: status,
            status: status,
            confirmed_by_name: r.confirmed_by_name,
            candidate_tech_name: r.candidate_tech_name,

            color: isConfirmed
              ? "bg-emerald-500 text-white"
              : "bg-cyan-500 text-white",

            label: isConfirmed ? "🟩 Lịch đã đảm nhận" : "🟦 Lịch chờ đảm nhận",
          };
        });

      // 🔹 Gộp 2 loại event
      const allEvents = [...planEvents, ...requestEvents].sort(
        (a, b) => a.start - b.start
      );
      setEvents(allEvents);
    } catch (err) {
      console.error("❌ Lỗi khi tải dữ liệu lịch:", err);
      toast.error("Không thể tải lịch bảo trì!");
    } finally {
      setReloadLoading(false);
    }
  };

  useEffect(() => {
    fetchPlans();
  }, []);

  /* ====== Helpers phạm vi theo view ====== */
  const rangeForMonth = useMemo(() => {
    const start = startOfMonth(cursor);
    const gridStart = startOfWeek(start, { weekStartsOn: 1 });
    const end = endOfMonth(cursor);
    const gridEnd = endOfWeek(end, { weekStartsOn: 1 });
    return eachDayOfInterval({ start: gridStart, end: gridEnd });
  }, [cursor]);

  const rangeForWeek = useMemo(() => {
    const start = startOfWeek(cursor, { weekStartsOn: 1 });
    const end = endOfWeek(cursor, { weekStartsOn: 1 });
    return eachDayOfInterval({ start, end });
  }, [cursor]);
  // 🧮 Lọc sự kiện theo loại lịch được chọn
  const filteredEvents = useMemo(() => {
    return events
      .filter((e) => {
        if (e.type === "plan") return true; // giữ plan cho mọi chi nhánh
        return activeBranch === "all" || e.branchId === activeBranch;
      })

      .filter((e) => {
        // ⭐ GIỮ LỊCH VÀNG (plan)
        if (e.type === "plan") return true;

        // ⭐ Request
        if (e.type === "request") {
          const st = (e.requestStatus || "").toLowerCase();
          const st2 = (e.status || "").toLowerCase(); // 🟩 THÊM DÒNG NÀY

          // ⭐ Loại bỏ tuyệt đối cancelled (UI lẫn API)
          // if (
          //   ["cancel", "canceled", "cancelled"].includes(st) ||
          //   ["cancel", "canceled", "cancelled"].includes(st2)
          // ) {
          //   return false; // 🟩 KHÔNG CHO CANCELLED XUẤT HIỆN
          // }
          // ❌ LOẠI LUÔN executed khỏi calendar
          // if (st === "executed" || st2 === "executed") {
          //   return false;
          // }

          // ⭐ Không có ngày → bỏ
          if (!e.start) return false;

          return true;
        }

        return false;
      })
      .filter((e) => {
        // 🟢 Filter theo loại sự kiện user đang chọn
        if (eventFilter === "all") return true;
        if (eventFilter === "plan") return e.type === "plan";
        if (eventFilter === "pending")
          return e.type === "request" && e.requestStatus === "pending";
        if (eventFilter === "confirmed")
          return e.type === "request" && e.requestStatus === "confirmed";

        return true;
      });
  }, [events, activeBranch, eventFilter]);

  const eventsOfDay = (day) => {
    return filteredEvents
      .filter((e) => {
        if (!e.start) return false;

        const st = (e.requestStatus || "").toLowerCase();
        const st2 = (e.status || "").toLowerCase();

        // ❗ Chỉ cần chỗ này đúng → toàn hệ thống hết lỗi
        if (["cancel", "canceled", "cancelled"].includes(st)) return false;
        if (["cancel", "canceled", "cancelled"].includes(st2)) return false;
        // ❌ Loại lịch sử khỏi calendar
        if (st === "executed" || st2 === "executed") return false;

        return isSameDay(e.start, day);
      })
      .sort((a, b) => a.start - b.start);
  };

  // 🟢 Events hiển thị trong popup hover theo ngày
  const popupEvents = useMemo(() => {
    if (!hoverDay) return { confirmed: [], pending: [], plan: [] };

    const eventsToday = filteredEvents
      .filter((e) => isSameDay(e.start, hoverDay))
      .filter(
        (e) =>
          !["cancel", "canceled", "cancelled"].includes(
            (e.requestStatus || "").toLowerCase()
          )
      )

      .sort((a, b) => a.start - b.start);

    return {
      confirmed: eventsToday.filter((e) => e.requestStatus === "confirmed"),
      pending: eventsToday.filter((e) => e.requestStatus === "pending"),
      plan: eventsToday.filter((e) => e.type === "plan"),
    };
  }, [hoverDay, filteredEvents]);

  /* Lọc sự kiện trong phạm vi view + trạng thái pending cho panel phải */
  const inCurrentView = useMemo(() => {
    if (view === "month") {
      return (ev) => isSameMonth(ev.start, cursor);
    }
    if (view === "week") {
      return (ev) => isSameWeek(ev.start, cursor, { weekStartsOn: 1 });
    }
    // year
    return (ev) => format(ev.start, "yyyy") === format(cursor, "yyyy");
  }, [view, cursor]);

  const pendingInView = useMemo(() => {
    let base = filteredEvents.filter((e) => {
      const st = (e.requestStatus || "").toLowerCase();
      return (
        e.type === "request" &&
        st === "pending" &&
        !["cancel", "canceled", "cancelled"].includes(st) &&
        inCurrentView(e)
      );
    });

    if (eventFilter === "plan") return [];
    if (eventFilter === "pending") return base;
    if (eventFilter === "confirmed") return [];

    return base;
  }, [filteredEvents, inCurrentView, eventFilter]);

  const confirmedInView = useMemo(() => {
    let base = filteredEvents.filter((e) => {
      const st = (e.requestStatus || "").toLowerCase();
      // 🔥 Filter theo chi nhánh
      if (activeBranch !== "all" && e.branchId !== activeBranch) return false;
      return (
        e.type === "request" &&
        st === "confirmed" &&
        !["cancel", "canceled", "cancelled"].includes(st) &&
        inCurrentView(e)
      );
    });

    if (eventFilter === "plan") return [];
    if (eventFilter === "pending") return [];
    if (eventFilter === "confirmed") return base;

    return base;
  }, [filteredEvents, inCurrentView, eventFilter, activeBranch]);

  const historyInView = useMemo(() => {
    return filteredEvents.filter((e) => {
      const st = (e.requestStatus || "").toLowerCase();

      if (activeBranch !== "all" && e.branchId !== activeBranch) return false;

      return (
        e.type === "request" &&
        (st === "executed" || st === "cancelled" || st === "canceled") &&
        inCurrentView(e)
      );
    });
  }, [filteredEvents, inCurrentView, activeBranch]);

  // 🔹 Tab đang chọn ("pending" hoặc "confirmed")
  const [activeTab, setActiveTab] = useState("pending");

  /* ====== Điều hướng thời gian ====== */
  const goPrev = () => {
    if (view === "month") setCursor((d) => addMonths(d, -1));
    else if (view === "week") setCursor((d) => addWeeks(d, -1));
    else setCursor((d) => addMonths(d, -12));
  };
  const goNext = () => {
    if (view === "month") setCursor((d) => addMonths(d, +1));
    else if (view === "week") setCursor((d) => addWeeks(d, +1));
    else setCursor((d) => addMonths(d, +12));
  };
  const goToday = () => {
    const today = new Date();
    setSelectedDate(today);

    if (view === "month") {
      setCursor(startOfMonth(today));
    } else if (view === "week") {
      setCursor(startOfWeek(today, { weekStartsOn: 1 }));
    } else {
      const startOfYear = new Date(today.getFullYear(), 0, 1);
      setCursor(startOfYear);
    }
  };

  /* ====== Year View Stats (heatmap) ====== */
  const monthStats = useMemo(() => {
    if (view !== "year") return [];
    const y = Number(format(cursor, "yyyy"));
    const arr = Array.from({ length: 12 }, (_, m) => {
      const count = events.filter(
        (e) =>
          format(e.start, "yyyy") === String(y) &&
          Number(format(e.start, "M")) === m + 1
      ).length;
      return { month: m, count };
    });
    const max = Math.max(1, ...arr.map((i) => i.count));
    return arr.map((i) => ({
      ...i,
      intensity: i.count === 0 ? 0 : i.count / max, // 0..1
    }));
  }, [view, cursor, events]);

  const handleCancel = async () => {
    try {
      setCancelMode("loading");

      const requestId = selectedRequest.id;

      await MaintenanceRequestService.cancel(requestId);

      // 🟩 Lấy ngày cancel từ API (không bị lệch timezone)
      const cancelledDate = new Date(
        selectedRequest.originalScheduledAt ||
          selectedRequest.scheduled_at ||
          selectedRequest.start
      );

      // 🟩 Xóa toàn bộ event cùng ngày
      setEvents((prev) =>
        prev.map((e) =>
          e.id === requestId
            ? { ...e, requestStatus: "cancelled", status: "cancelled" }
            : e
        )
      );

      await fetchPlans();

      setCancelMode("success");
    } catch (err) {
      toast.error("Không thể hủy yêu cầu!");
      setCancelOpen(false);
    }
  };

  useEffect(() => {
    const loadGroups = async () => {
      // GROUP PENDING
      const gp = await Promise.all(
        Object.values(
          pendingInView.reduce((acc, ev) => {
            if (!acc[ev.id]) acc[ev.id] = { ...ev, units: [] };
            ev.units.forEach((u) => acc[ev.id].units.push(u));
            return acc;
          }, {})
        ).map(async (group) => {
          const unitsWithLatest = await Promise.all(
            group.units.map(async (u) => {
              try {
                const latest = await MaintainService.getLatestHistory(u.id);
                return {
                  ...u,
                  lastMaintenance: latest
                    ? latest.start_date.split("T")[0]
                    : "Chưa có",
                };
              } catch {
                return { ...u, lastMaintenance: "Chưa có" };
              }
            })
          );
          return { ...group, units: unitsWithLatest };
        })
      );

      // GROUP CONFIRMED
      const gc = await Promise.all(
        Object.values(
          confirmedInView.reduce((acc, ev) => {
            if (!acc[ev.id]) acc[ev.id] = { ...ev, units: [] };
            ev.units.forEach((u) => acc[ev.id].units.push(u));
            return acc;
          }, {})
        ).map(async (group) => {
          const unitsWithLatest = await Promise.all(
            group.units.map(async (u) => {
              try {
                const latest = await MaintainService.getLatestHistory(u.id);
                return {
                  ...u,
                  lastMaintenance: latest
                    ? latest.start_date.split("T")[0]
                    : "Chưa có",
                };
              } catch {
                return { ...u, lastMaintenance: "Chưa có" };
              }
            })
          );
          return { ...group, units: unitsWithLatest };
        })
      );

      setPendingGroups(gp);
      setConfirmedGroups(gc);
    };

    loadGroups();
  }, [pendingInView, confirmedInView]);

  /* ====== UI ====== */
  return (
    <div className="relative bg-white rounded-3xl shadow-lg border border-slate-200 overflow-hidden">
      {/* ====== Header ====== */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between px-5 py-4 bg-gradient-to-r from-emerald-500 via-cyan-500 to-teal-500 text-white">
        {/* Left: Navigation */}
        <div className="flex items-center gap-3">
          <button
            onClick={goPrev}
            className="p-2 rounded-xl hover:bg-white/20 transition-all duration-200"
            aria-label="Previous"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>

          <div className="text-lg font-semibold min-w-[180px] text-center tracking-wide drop-shadow-sm">
            {view === "year"
              ? format(cursor, "yyyy", { locale: vi })
              : format(
                  cursor,
                  view === "week" ? "'Tuần' w yyyy" : "MMMM yyyy",
                  { locale: vi }
                )}
          </div>

          <button
            onClick={goNext}
            className="p-2 rounded-xl hover:bg-white/20 transition-all duration-200"
            aria-label="Next"
          >
            <ChevronRight className="w-5 h-5" />
          </button>

          <button
            onClick={goToday}
            className="hidden md:inline-block ml-2 px-3 py-1.5 rounded-lg bg-slate-100/70 text-slate-700 font-medium text-sm
             border border-slate-300 hover:bg-slate-200 hover:shadow-[0_0_8px_rgba(100,116,139,0.2)]
             transition-all duration-200"
          >
            Hôm nay
          </button>
        </div>
        {/* === Chi nhánh === */}
        {isSuperAdmin && (
          <div className="ml-3">
            <Select
              onValueChange={(v) => setActiveBranch(v)}
              defaultValue="all"
            >
              <SelectTrigger className="h-9 w-40 text-sm bg-white text-slate-700 border border-white/40">
                <SelectValue placeholder="Chi nhánh" />
              </SelectTrigger>

              <SelectContent className="z-[9999] bg-white border border-gray-200 shadow-lg">
                <SelectItem
                  value="all"
                  className="bg-white hover:bg-gray-100 text-slate-700"
                >
                  Tất cả chi nhánh
                </SelectItem>

                {branches.map((b) => (
                  <SelectItem
                    key={b.id}
                    value={b.id}
                    className="bg-white hover:bg-gray-100 text-slate-700"
                  >
                    {b.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        {/* Right: View switch + Create */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 mt-3 md:mt-0">
          <div className="flex rounded-xl overflow-hidden border border-white/30">
            <button
              onClick={() => setView("week")}
              className={`flex items-center gap-1 px-3 py-1.5 text-sm ${
                view === "week"
                  ? "bg-white/90 text-emerald-700"
                  : "hover:bg-white/20"
              }`}
              title="Xem tuần"
            >
              <CalendarRange className="w-4 h-4" /> Tuần
            </button>
            <button
              onClick={() => setView("month")}
              className={`flex items-center gap-1 px-3 py-1.5 text-sm ${
                view === "month"
                  ? "bg-white/90 text-emerald-700"
                  : "hover:bg-white/20"
              }`}
              title="Xem tháng"
            >
              <CalendarDays className="w-4 h-4" /> Tháng
            </button>
            <button
              onClick={() => setView("year")}
              className={`flex items-center gap-1 px-3 py-1.5 text-sm ${
                view === "year"
                  ? "bg-white/90 text-emerald-700"
                  : "hover:bg-white/20"
              }`}
              title="Xem năm"
            >
              <LayoutGrid className="w-4 h-4" /> Năm
            </button>
          </div>

          {(isSuperAdmin || isAdmin) && (
            <Button
              onClick={() => {
                setEditingRequest(null); // reset để form load chế độ tạo mới
                setShowForm(true);
              }}
              className="bg-white text-emerald-600 hover:bg-emerald-50 font-semibold shadow-md
                flex items-center justify-center gap-1 w-full sm:w-auto"
            >
              <Plus className="w-4 h-4" /> Tạo kế hoạch
            </Button>
          )}

          <AnimatePresence>
            {showForm && (
              <>
                {/* Overlay + Form */}
                <AddScheduleSection
                  editing={editingRequest}
                  onClose={() => {
                    setShowForm(false);
                    setEditingRequest(null);
                  }}
                  onSaved={fetchPlans}
                />

                {/* Dấu X nổi góc ngoài — kiểu MaintenanceUrgentSection */}
                <motion.button
                  whileHover={{
                    rotate: [0, -8, 8, -8, 0],
                    transition: { duration: 0.5 },
                  }}
                  onClick={() => setShowForm(false)}
                  className="
    absolute top-3 right-3
    md:fixed md:top-5 md:right-[calc(50%-615px)]
    w-10 h-10 md:w-12 md:h-12
    rounded-full z-[10002]
    bg-gradient-to-r from-red-500 to-rose-500 text-white 
    flex items-center justify-center
    shadow-[0_6px_22px_rgba(244,63,94,0.55)]
    hover:shadow-[0_8px_30px_rgba(244,63,94,0.7)]
    hover:scale-110 active:scale-95
    border-[3px] border-white/90 ring-[3px] ring-white/70
    transition-all duration-300 ease-out
  "
                >
                  <X className="w-4 h-4 md:w-5 md:h-5" />
                </motion.button>
              </>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* ====== Body (2 cột): Lịch + Panel pending ====== */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 p-5 max-h-none lg:max-h-[78vh] overflow-x-auto lg:overflow-hidden">
        {/* ====== Left: Calendar View (scroll riêng) ====== */}
        <div className="lg:col-span-8 min-h-[60vh] max-h-[74vh] overflow-y-auto pr-1">
          {/* 🔹 Bộ lọc loại lịch (có thêm nút “Tất cả”) */}
          <div className="flex gap-3 mt-3 mb-3 text-sm overflow-x-auto whitespace-nowrap px-1 md:justify-center md:flex-wrap">
            {[
              { key: "all", color: "bg-emerald-100", label: "Tất cả" },
              {
                key: "plan",
                color: "bg-amber-400",
                label: "Lịch định kì dòng",
              },
              {
                key: "pending",
                color: "bg-cyan-500",
                label: "Lịch chờ đảm nhận",
              },
              {
                key: "confirmed",
                color: "bg-emerald-500",
                label: "Lịch đã đảm nhận",
              },
            ].map((item) => (
              <button
                key={item.key}
                onClick={() => setEventFilter(item.key)}
                className={`flex items-center gap-2 px-4 py-1.5 rounded-lg border text-sm font-medium transition-all duration-200 active:scale-95
        ${
          eventFilter === item.key
            ? item.key === "all"
              ? "bg-emerald-200 text-black border-emerald-300 shadow-md scale-[1.05]"
              : `${item.color} text-white shadow-md scale-[1.05]`
            : item.key === "all"
            ? "bg-emerald-50 text-black border border-emerald-200 hover:bg-emerald-100 hover:shadow-md hover:scale-[1.03]"
            : "bg-white border-slate-200 text-slate-700 hover:bg-slate-100 hover:shadow-md hover:scale-[1.03]"
        }`}
              >
                {item.key !== "all" && (
                  <span className={`w-3 h-3 rounded ${item.color}`}></span>
                )}
                {item.label}
              </button>
            ))}
          </div>

          {/* WEEK VIEW */}
          <AnimatePresence mode="wait">
            {view === "week" && (
              <motion.div
                key="week-view"
                initial={{ y: 12, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: 12, opacity: 0 }}
                transition={{ duration: 0.25 }}
                className="rounded-2xl bg-white border border-slate-200"
              >
                <div className="grid grid-cols-7 gap-2 p-3 border-b">
                  {["T2", "T3", "T4", "T5", "T6", "T7", "CN"].map((d) => (
                    <div
                      key={d}
                      className="text-[12px] text-center font-semibold text-slate-600 uppercase"
                    >
                      {d}
                    </div>
                  ))}
                </div>
                <div className="grid grid-cols-7 gap-2 p-3">
                  {rangeForWeek.map((day) => {
                    const dayEvents = eventsOfDay(day);

                    const selected = isSameDay(day, selectedDate);
                    return (
                      <div
                        key={fmtDayKey(day)}
                        onClick={() => setSelectedDate(day)}
                        onMouseEnter={(e) => {
                          dayHoverRef.current = true;

                          if (dayEvents.length > 0) {
                            setHoverDay(day);
                            setPopupPos({ x: e.clientX, y: e.clientY });
                          } else {
                            setHoverDay(null); // 🟢 KHÔNG CÓ EVENT → TẮT POPUP NGAY
                          }
                        }}
                        onMouseMove={(e) => {
                          if (hoverDay) {
                            setPopupPos({ x: e.clientX, y: e.clientY });
                          }
                        }}
                        onMouseLeave={() => {
                          dayHoverRef.current = false;

                          setTimeout(() => {
                            if (
                              !popupHoverRef.current &&
                              !dayHoverRef.current
                            ) {
                              setHoverDay(null);
                            }
                          }, 80);
                        }}
                        className={`p-3 rounded-xl border min-h-[120px] cursor-pointer transition ${
                          selected
                            ? "border-emerald-400 bg-emerald-50"
                            : "border-slate-200 hover:bg-slate-50"
                        }`}
                      >
                        {/* Header ngày + hôm nay */}
                        <div className="flex justify-between mb-1 text-[11px] font-medium">
                          <span className="text-slate-700">
                            {format(day, "d", { locale: vi })}
                          </span>

                          {isToday(day) && (
                            <span className="hidden md:inline-block px-1.5 py-0.5 text-[10px] bg-emerald-100 text-emerald-700 rounded-full border border-emerald-200">
                              Hôm nay
                            </span>
                          )}
                        </div>

                        {/* Event list */}
                        <div className="space-y-1">
                          {dayEvents
                            // ưu tiên lịch plan trước
                            .sort((a, b) => {
                              const priority = {
                                plan: 1,
                                pending: 2,
                                confirmed: 3,
                              };

                              const pa =
                                priority[
                                  a.type === "plan" ? "plan" : a.requestStatus
                                ];
                              const pb =
                                priority[
                                  b.type === "plan" ? "plan" : b.requestStatus
                                ];

                              return pa - pb || a.start - b.start;
                            })

                            // cho phép nhiều hơn 3 lịch để không mất plan
                            .slice(0, 5)

                            .map((ev) => (
                              <div
                                key={ev.key}
                                className={`px-2 py-1 rounded-md text-[11px] truncate font-medium ${ev.color}`}
                              >
                                {ev.type === "plan" ? ev.unitGroup : ev.id}
                              </div>
                            ))}

                          {dayEvents.length > 3 && (
                            <div className="text-[10px] text-slate-500">
                              +{dayEvents.length - 3} nữa…
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </motion.div>
            )}

            {/* MONTH VIEW */}
            {view === "month" && (
              <motion.div
                key="month-view"
                initial={{ y: 12, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: 12, opacity: 0 }}
                transition={{ duration: 0.25 }}
                className="rounded-2xl bg-white border border-slate-200"
              >
                <div className="grid grid-cols-7 gap-2 p-3 border-b">
                  {["T2", "T3", "T4", "T5", "T6", "T7", "CN"].map((d) => (
                    <div
                      key={d}
                      className="text-[12px] text-center font-semibold text-slate-600 uppercase"
                    >
                      {d}
                    </div>
                  ))}
                </div>

                <div className="grid grid-cols-7 gap-2 p-3">
                  {rangeForMonth.map((day) => {
                    const inMonth = isSameMonth(day, cursor);
                    const dayEvents = eventsOfDay(day);

                    const selected = isSameDay(day, selectedDate);

                    return (
                      <motion.div
                        key={fmtDayKey(day)}
                        //  id={`card-${group.id}`}
                        whileHover={{ scale: 1.02 }}
                        onClick={() => setSelectedDate(day)}
                        onMouseEnter={(e) => {
                          dayHoverRef.current = true;

                          const realEvents = dayEvents.filter(
                            (e) =>
                              !["cancel", "canceled", "cancelled"].includes(
                                (e.requestStatus || "").toLowerCase()
                              )
                          );

                          if (realEvents.length > 0) {
                            setHoverDay(day);
                          } else {
                            setHoverDay(null);
                          }
                        }}
                        onMouseMove={(e) => {
                          if (hoverDay) {
                            setPopupPos({ x: e.clientX, y: e.clientY });
                          }
                        }}
                        onMouseLeave={() => {
                          dayHoverRef.current = false;

                          setTimeout(() => {
                            if (
                              !popupHoverRef.current &&
                              !dayHoverRef.current
                            ) {
                              setHoverDay(null);
                            }
                          }, 80);
                        }}
                        className={`p-2 rounded-xl border cursor-pointer min-h-[110px] transition-all ${
                          selected
                            ? "border-emerald-400 bg-gradient-to-br from-emerald-50 to-white shadow-sm"
                            : inMonth
                            ? "border-slate-200 hover:bg-slate-50"
                            : "border-slate-100 bg-slate-50/60"
                        }`}
                      >
                        {/* ==== Header ngày ==== */}
                        <div className="flex justify-between mb-1 text-[11px] font-medium">
                          <span
                            className={
                              inMonth ? "text-slate-700" : "text-slate-400"
                            }
                          >
                            {format(day, "d", { locale: vi })}
                          </span>

                          {isToday(day) && (
                            <span className="hidden md:inline-block px-1.5 py-0.5 text-[10px] bg-emerald-100 text-emerald-700 rounded-full border border-emerald-200">
                              Hôm nay
                            </span>
                          )}
                        </div>

                        {/* ==== Events trong ngày ==== */}
                        <div className="space-y-1">
                          {dayEvents
                            .sort((a, b) => {
                              const priority = {
                                plan: 1,
                                pending: 2,
                                confirmed: 3,
                              };

                              const pa =
                                priority[
                                  a.type === "plan" ? "plan" : a.requestStatus
                                ];
                              const pb =
                                priority[
                                  b.type === "plan" ? "plan" : b.requestStatus
                                ];

                              return pa - pb;
                            })

                            .slice(0, 3)
                            .map((ev) => (
                              <div
                                key={ev.key}
                                className={`px-2 py-1 rounded-md text-[11px] truncate font-medium ${ev.color}`}
                              >
                                {ev.type === "plan" ? ev.unitGroup : ev.id}
                              </div>
                            ))}

                          {dayEvents.length > 3 && (
                            <div className="text-[10px] text-slate-500">
                              +{dayEvents.length - 3} nữa…
                            </div>
                          )}
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              </motion.div>
            )}

            {/* YEAR VIEW */}
            {view === "year" && (
              <motion.div
                key="year-view"
                initial={{ y: 12, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: 12, opacity: 0 }}
                transition={{ duration: 0.25 }}
                className="rounded-2xl bg-white border border-slate-200 p-4"
              >
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {monthStats.map(({ month, count, intensity }) => {
                    const monthDate = new Date(
                      Number(format(cursor, "yyyy")),
                      month,
                      1
                    );
                    const bg =
                      intensity === 0
                        ? "bg-slate-50"
                        : intensity < 0.34
                        ? "bg-emerald-50"
                        : intensity < 0.67
                        ? "bg-emerald-100"
                        : "bg-emerald-200";
                    return (
                      <div
                        key={month}
                        onClick={() => {
                          // chuyển qua month view của tháng đó
                          setCursor(monthDate);
                          setView("month");
                        }}
                        className={`p-4 rounded-xl border ${bg} border-slate-200 hover:shadow-md transition cursor-pointer`}
                        title={`${count} kế hoạch trong tháng`}
                      >
                        <div className="flex items-center justify-between mb-3">
                          <div className="font-semibold text-slate-700">
                            {format(monthDate, "MMMM", { locale: vi })}
                          </div>
                          <div className="text-xs px-2 py-0.5 rounded-full bg-white/70 border border-white text-emerald-700 font-medium">
                            {count} kế hoạch
                          </div>
                        </div>
                        {/* mini grid trong tháng (heat dots) */}
                        <div className="grid grid-cols-7 gap-1">
                          {Array.from({ length: 28 }).map((_, i) => (
                            <div
                              key={i}
                              className={`h-2 rounded-sm ${
                                intensity === 0
                                  ? "bg-slate-200/60"
                                  : intensity < 0.34
                                  ? "bg-emerald-300/50"
                                  : intensity < 0.67
                                  ? "bg-emerald-400/80"
                                  : "bg-emerald-600"
                              }`}
                            />
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* ====== Right: Panel “Thiết bị chờ đảm nhận” (giao diện tối giản, 4 dòng) ====== */}
        <div className="lg:col-span-4">
          {/* Header - PREMIUM ICON TABS */}
          <div className="flex justify-around items-center py-3 border-b bg-white/70 backdrop-blur-xl shadow-[0_3px_12px_rgba(0,0,0,0.06)] z-10">
            {/* Pending */}
            <button
              onClick={() => setActiveTab("pending")}
              className={`
      flex flex-col items-center gap-1 px-3 py-1.5 transition-all duration-300
      ${
        activeTab === "pending"
          ? "text-cyan-600 scale-110 font-semibold"
          : "text-slate-500 hover:text-slate-700 scale-100"
      }
    `}
            >
              <div
                className={`
      p-2 rounded-xl transition-all duration-300
      ${
        activeTab === "pending"
          ? "bg-cyan-100 shadow-[0_4px_14px_rgba(34,211,238,0.35)]"
          : "bg-slate-100"
      }
    `}
              >
                <ClockClockwise
                  size={22}
                  weight={activeTab === "pending" ? "fill" : "regular"}
                  className="transition-transform duration-300"
                  style={{
                    transform:
                      activeTab === "pending" ? "translateY(-2px)" : "none",
                  }}
                />
              </div>
              <span className="text-[11px]">
                Chờ nhận ({pendingInView.length})
              </span>
            </button>

            {/* Confirmed */}
            <button
              onClick={() => setActiveTab("confirmed")}
              className={`
      flex flex-col items-center gap-1 px-3 py-1.5 transition-all duration-300
      ${
        activeTab === "confirmed"
          ? "text-emerald-600 scale-110 font-semibold"
          : "text-slate-500 hover:text-slate-700 scale-100"
      }
    `}
            >
              <div
                className={`
      p-2 rounded-xl transition-all duration-300
      ${
        activeTab === "confirmed"
          ? "bg-emerald-100 shadow-[0_4px_14px_rgba(16,185,129,0.35)]"
          : "bg-slate-100"
      }
    `}
              >
                <Wrench
                  size={22}
                  weight={activeTab === "confirmed" ? "fill" : "regular"}
                  className="transition-transform duration-300"
                  style={{
                    transform:
                      activeTab === "confirmed" ? "translateY(-2px)" : "none",
                  }}
                />
              </div>
              <span className="text-[11px]">
                Chờ bảo trì ({confirmedInView.length})
              </span>
            </button>

            {/* History */}
            <button
              onClick={() => setActiveTab("history")}
              className={`
      flex flex-col items-center gap-1 px-3 py-1.5 transition-all duration-300
      ${
        activeTab === "history"
          ? "text-purple-600 scale-110 font-semibold"
          : "text-slate-500 hover:text-slate-700 scale-100"
      }
    `}
            >
              <div
                className={`
      p-2 rounded-xl transition-all duration-300
      ${
        activeTab === "history"
          ? "bg-purple-100 shadow-[0_4px_14px_rgba(168,85,247,0.35)]"
          : "bg-slate-100"
      }
    `}
              >
                <Archive
                  size={22}
                  weight={activeTab === "history" ? "fill" : "regular"}
                  className="transition-transform duration-300"
                  style={{
                    transform:
                      activeTab === "history" ? "translateY(-2px)" : "none",
                  }}
                />
              </div>
              <span className="text-[11px]">
                Lịch sử ({historyInView.length})
              </span>
            </button>
          </div>
          {/* ==== PANEL LIST (pending / confirmed / history) ==== */}
          <div className="p-3 space-y-3 overflow-y-auto max-h-[70vh]">
            {/* ==== GOM NHÓM DỮ LIỆU ==== */}
            {(() => {
              const groupedPending = pendingGroups;
              const groupedConfirmed = confirmedGroups;

              return (
                <>
                  {/* ==== TAB: PENDING ==== */}
                  {activeTab === "pending" && (
                    <div className="max-h-[60vh] overflow-y-auto pr-1 space-y-3">
                      {groupedPending.length === 0 ? (
                        <div className="text-sm text-slate-400 italic text-center py-8">
                          Không có mục nào đang chờ đảm nhận.
                        </div>
                      ) : (
                        groupedPending
                          .sort((a, b) => {
                            const now = new Date();

                            const aStart = new Date(a.start);
                            const bStart = new Date(b.start);

                            const aExpired = aStart < now;
                            const bExpired = bStart < now;

                            // 1️⃣ Việc còn hạn luôn ở trên → quá hạn xuống cuối
                            if (aExpired && !bExpired) return 1;
                            if (!aExpired && bExpired) return -1;

                            // 2️⃣ Hai việc đều còn hạn → cái nào gần hết hạn hơn lên trước
                            const diffA = Math.abs(aStart - now);
                            const diffB = Math.abs(bStart - now);

                            return diffA - diffB;
                          })
                          .map((group) => (
                            <motion.div
                              id={`card-${group.id}`}
                              whileHover={{ scale: 1.02 }}
                              key={group.id}
                              className="relative"
                            >
                              {/* ⭐ Viền pulse khi còn <= 3 giờ nữa đến hạn ⭐ */}
                              {new Date(group.start) - new Date() <=
                                3 * 60 * 60 * 1000 &&
                                new Date(group.start) > new Date() && (
                                  <div className="absolute inset-0 rounded-xl ring-2 ring-red-400 animate-[pulse_1.4s_ease-in-out_infinite] pointer-events-none"></div>
                                )}

                              {/* ⭐ CARD CHÍNH – không pulse ⭐ */}
                              <div
                                className={`
                                  relative p-3 rounded-xl border bg-white 
                                  hover:bg-cyan-50/60 shadow-sm hover:shadow-md transition
                                  ${
                                    group.requestStatus === "pending"
                                      ? "border-cyan-300"
                                      : "border-emerald-300"
                                  }
                                `}
                              >
                                <div className="flex flex-col gap-2">
                                  {/* ID */}
                                  <div className="text-cyan-700 font-semibold text-sm">
                                    {group.id}
                                  </div>

                                  {/* số lượng + chip */}
                                  <div className="flex items-center justify-between">
                                    <div className="text-xs text-slate-600">
                                      ({group.units?.length || 1} thiết bị)
                                    </div>

                                    <span className="text-[11px] px-2 py-0.5 rounded-md bg-amber-100 text-amber-700 border border-amber-200">
                                      ⏳ Chờ đảm nhận
                                    </span>
                                  </div>

                                  {/* ảnh + info */}
                                  <div className="flex items-start gap-3 mt-1">
                                    <img
                                      src={group.image}
                                      className="w-12 h-12 rounded-lg border object-cover"
                                    />

                                    <div className="text-[12px] flex flex-col gap-1 text-slate-600">
                                      <div className="font-semibold text-emerald-700">
                                        📍 Chi nhánh:{" "}
                                        {group.branchId || group.branch || "—"}
                                      </div>

                                      <div
                                        className={
                                          new Date(group.start) - new Date() <=
                                            3 * 60 * 60 * 1000 &&
                                          new Date(group.start) > new Date()
                                            ? "text-red-500 font-semibold"
                                            : "text-slate-600"
                                        }
                                      >
                                        🕒{" "}
                                        {format(
                                          group.start,
                                          "dd/MM/yyyy HH:mm",
                                          { locale: vi }
                                        )}
                                        {new Date(group.start) - new Date() <=
                                          3 * 60 * 60 * 1000 &&
                                          new Date(group.start) >
                                            new Date() && (
                                            <span className="ml-1 text-red-500 font-semibold">
                                              (Sắp đến hạn)
                                            </span>
                                          )}
                                      </div>

                                      <div>
                                        📌 {group.maintenance_reason || "—"}
                                      </div>
                                    </div>
                                  </div>

                                  {/* Buttons */}
                                  <div className="flex flex-wrap items-center justify-between gap-2 mt-2">
                                    <div className="flex items-center gap-2">
                                      {/* ❌ Nếu đã quá thời hạn */}
                                      {new Date(group.start) < new Date() ? (
                                        <div
                                          className="flex items-center gap-1 text-red-500 text-xs font-semibold cursor-not-allowed"
                                          title="Đã quá thời hạn"
                                        >
                                          ❌ Đã quá thời hạn
                                        </div>
                                      ) : (
                                        <Button
                                          size="sm"
                                          onClick={() => {
                                            setSelectedRequest(group);
                                            setAssignMode("confirm");
                                            setAssignOpen(true);
                                          }}
                                          className="bg-cyan-500 hover:bg-cyan-600 text-white text-xs font-medium px-3 py-1"
                                        >
                                          🧰 Đảm nhận
                                        </Button>
                                      )}

                                      {(isSuperAdmin ||
                                        (isAdmin &&
                                          group.assigned_by ===
                                            currentUserSub)) && (
                                        <Button
                                          size="sm"
                                          onClick={() => {
                                            setEditingRequest(group);
                                            setShowForm(true);
                                          }}
                                          className="bg-amber-500 hover:bg-amber-600 text-white text-xs font-medium px-3 py-1"
                                        >
                                          ✏️ Cập nhật
                                        </Button>
                                      )}
                                      {(isSuperAdmin ||
                                        (isAdmin &&
                                          group.assigned_by ===
                                            currentUserSub)) && (
                                        <Button
                                          size="sm"
                                          onClick={() => {
                                            setSelectedRequest(group);
                                            setCancelMode("confirm");
                                            setCancelOpen(true);
                                          }}
                                          className="bg-red-500 hover:bg-red-600 text-white text-xs font-medium px-3 py-1"
                                        >
                                          Hủy lịch
                                        </Button>
                                      )}
                                    </div>

                                    <button
                                      onClick={() =>
                                        setExpandedRequest((prev) =>
                                          prev === group.id ? null : group.id
                                        )
                                      }
                                      className="text-xs text-slate-600 hover:text-cyan-600 underline transition"
                                    >
                                      {expandedRequest === group.id
                                        ? "Ẩn chi tiết thiết bị ▲"
                                        : "Chi tiết các thiết bị ▼"}
                                    </button>
                                  </div>

                                  {/* DETAIL TABLE */}
                                  {expandedRequest === group.id && (
                                    <div className="mt-3 border border-cyan-200 rounded-lg overflow-hidden">
                                      <table className="w-full text-xs border-collapse">
                                        <thead className="bg-cyan-100/70 text-slate-700 font-semibold">
                                          <tr>
                                            <th className="px-3 py-2 text-left">
                                              Mã định danh
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
                                          {(group.units || []).map((u) => (
                                            <tr
                                              key={u.id}
                                              className="border-t hover:bg-cyan-50 transition"
                                            >
                                              <td className="px-3 py-2 font-medium">
                                                {u.id}
                                              </td>
                                              <td className="px-3 py-2">
                                                <Status
                                                  status={convertUnitStatus(
                                                    u.status
                                                  )}
                                                />
                                              </td>
                                              <td className="px-3 py-2 text-slate-600">
                                                {u.lastMaintenance || "—"}
                                              </td>
                                            </tr>
                                          ))}
                                        </tbody>
                                      </table>
                                    </div>
                                  )}
                                </div>
                              </div>
                            </motion.div>
                          ))
                      )}
                    </div>
                  )}

                  {/* ==== TAB: CONFIRMED ==== */}
                  {activeTab === "confirmed" &&
                    (groupedConfirmed.length === 0 ? (
                      <div className="text-sm text-slate-400 italic text-center py-8">
                        Không có mục nào đang chờ bảo trì.
                      </div>
                    ) : (
                      groupedConfirmed
                        .sort((a, b) => a.start - b.start)
                        .map((group) => (
                          <motion.div
                            id={`card-${group.id}`}
                            whileHover={{ scale: 1.02 }}
                            key={group.id}
                            className="relative p-3 rounded-xl border bg-white 
                  hover:bg-emerald-50/60 shadow-sm hover:shadow-md 
                  transition border-emerald-300"
                          >
                            <div className="flex flex-col gap-2">
                              {/* ID */}
                              <div className="text-emerald-700 font-semibold text-sm">
                                {group.id}
                              </div>

                              <div className="flex items-center justify-between">
                                <div className="text-xs text-slate-600">
                                  ({group.units?.length || 1} thiết bị)
                                </div>

                                <span className="text-[11px] px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-700 border border-emerald-200">
                                  🔧 Chờ bảo trì
                                </span>
                              </div>

                              <div className="flex items-start gap-3 mt-1">
                                <img
                                  src={group.image}
                                  className="w-12 h-12 rounded-lg object-cover border"
                                />

                                <div className="flex flex-col gap-1 text-[12px] text-slate-600">
                                  <div className="font-semibold text-emerald-700">
                                    📍 Chi nhánh:{" "}
                                    {group.branchId || group.branch || "—"}
                                  </div>
                                  <div>
                                    👨‍🔧{" "}
                                    {group.confirmed_by_name ||
                                      group.candidate_tech_name ||
                                      "—"}
                                  </div>

                                  <div>
                                    🕒{" "}
                                    {format(group.start, "dd/MM/yyyy HH:mm", {
                                      locale: vi,
                                    })}
                                  </div>

                                  <div>
                                    📌 {group.maintenance_reason || "—"}
                                  </div>
                                </div>
                              </div>

                              <div className="flex items-center justify-end mt-2">
                                <button
                                  onClick={() =>
                                    setExpandedRequest((prev) =>
                                      prev === group.id ? null : group.id
                                    )
                                  }
                                  className="text-xs text-slate-600 hover:text-emerald-600 underline transition"
                                >
                                  {expandedRequest === group.id
                                    ? "Ẩn chi tiết thiết bị ▲"
                                    : "Chi tiết các thiết bị ▼"}
                                </button>
                              </div>

                              {expandedRequest === group.id && (
                                <div className="mt-3 border border-emerald-200 rounded-lg overflow-hidden">
                                  <table className="w-full text-xs border-collapse">
                                    <thead className="bg-emerald-100/70 text-slate-700 font-semibold">
                                      <tr>
                                        <th className="px-3 py-2 text-left">
                                          Mã định danh
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
                                      {(group.units || []).map((u) => (
                                        <tr
                                          key={u.id}
                                          className="border-t hover:bg-emerald-50 transition"
                                        >
                                          <td className="px-3 py-2 font-medium">
                                            {u.id}
                                          </td>
                                          <td className="px-3 py-2">
                                            <Status
                                              status={convertUnitStatus(
                                                u.status
                                              )}
                                            />
                                          </td>
                                          <td className="px-3 py-2 text-slate-600">
                                            {u.lastMaintenance || "—"}
                                          </td>
                                        </tr>
                                      ))}
                                    </tbody>
                                  </table>
                                </div>
                              )}
                            </div>
                          </motion.div>
                        ))
                    ))}

                  {/* ==== TAB: HISTORY ==== */}
                  {activeTab === "history" &&
                    (historyInView.length === 0 ? (
                      <div className="text-sm text-slate-400 italic text-center py-8">
                        Không có lịch sử bảo trì.
                      </div>
                    ) : (
                      historyInView
                        .sort((a, b) => b.start - a.start)
                        .map((group) => (
                          <motion.div
                            id={`card-${group.id}`}
                            whileHover={{ scale: 1.02 }}
                            key={group.id}
                            className={`relative p-3 rounded-xl border bg-white shadow-sm hover:shadow-md transition
  ${
    group.requestStatus === "cancelled" || group.status === "cancelled"
      ? "border-red-300 hover:bg-red-50/60"
      : "border-purple-300 hover:bg-purple-50/60"
  }
`}
                          >
                            <div className="flex flex-col gap-2">
                              <div className="text-purple-700 font-semibold text-sm">
                                {group.id}
                              </div>

                              <div className="flex items-center justify-between">
                                <div className="text-xs text-slate-600">
                                  ({group.units?.length || 1} thiết bị)
                                </div>

                                <span
                                  className={`text-[11px] px-2 py-0.5 rounded-md border
                                  ${
                                    group.requestStatus === "cancelled" ||
                                    group.status === "cancelled"
                                      ? "bg-red-100 text-red-700 border-red-300"
                                      : "bg-purple-100 text-purple-700 border-purple-200"
                                  }
                                `}
                                >
                                  {group.requestStatus === "cancelled" ||
                                  group.status === "cancelled"
                                    ? "❌ Đã hủy lịch"
                                    : "✔️ Đã đảm nhận"}
                                </span>
                              </div>

                              <div className="flex items-start gap-3 mt-1">
                                <img
                                  src={group.image}
                                  className="w-12 h-12 rounded-lg object-cover border"
                                />

                                <div className="flex flex-col text-[12px] text-slate-600 gap-1">
                                  <div className="font-semibold text-emerald-700">
                                    📍 Chi nhánh:{" "}
                                    {group.branchId || group.branch || "—"}
                                  </div>
                                  {![
                                    "cancelled",
                                    "canceled",
                                    "cancel",
                                  ].includes(
                                    (
                                      group.requestStatus ||
                                      group.status ||
                                      ""
                                    ).toLowerCase()
                                  ) && (
                                    <div>
                                      👨‍🔧{" "}
                                      {group.confirmed_by_name ||
                                        group.candidate_tech_name ||
                                        "—"}
                                    </div>
                                  )}

                                  <div>
                                    🕒{" "}
                                    {format(group.start, "dd/MM/yyyy HH:mm", {
                                      locale: vi,
                                    })}
                                  </div>

                                  <div>
                                    📌 {group.maintenance_reason || "—"}
                                  </div>
                                </div>
                              </div>

                              <div className="flex items-center justify-end mt-2">
                                <button
                                  onClick={() =>
                                    setExpandedRequest((prev) =>
                                      prev === group.id ? null : group.id
                                    )
                                  }
                                  className={`text-xs underline transition
                                    ${
                                      group.requestStatus === "cancelled" ||
                                      group.status === "cancelled"
                                        ? "text-slate-600 hover:text-red-600"
                                        : "text-slate-600 hover:text-purple-600"
                                    }
                                  `}
                                >
                                  {expandedRequest === group.id
                                    ? "Ẩn chi tiết thiết bị ▲"
                                    : "Chi tiết các thiết bị ▼"}
                                </button>
                              </div>

                              {expandedRequest === group.id && (
                                <div className="mt-3 border border-purple-200 rounded-lg overflow-hidden">
                                  <table className="w-full text-xs border-collapse">
                                    <thead className="bg-purple-100/70 text-slate-700 font-semibold">
                                      <tr>
                                        <th className="px-3 py-2 text-left">
                                          Mã định danh
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
                                      {(group.units || []).map((u) => (
                                        <tr
                                          key={u.id}
                                          className="border-t hover:bg-purple-50 transition"
                                        >
                                          <td className="px-3 py-2 font-medium">
                                            {u.id}
                                          </td>

                                          <td className="px-3 py-2">
                                            <Status
                                              status={convertUnitStatus(
                                                u.status
                                              )}
                                            />
                                          </td>

                                          <td className="px-3 py-2 text-slate-600">
                                            {/* ⭐ giống Chờ nhận — load đúng lastMaintenance */}
                                            {u.lastMaintenance || "Chưa có"}
                                          </td>
                                        </tr>
                                      ))}
                                    </tbody>
                                  </table>
                                </div>
                              )}
                            </div>
                          </motion.div>
                        ))
                    ))}
                </>
              );
            })()}
          </div>
        </div>
        {/* ====== POPUP ĐẢM NHẬN ====== */}
        <AlertDialog open={assignOpen} onOpenChange={setAssignOpen}>
          <AlertDialogContent className="max-w-md z-[300000]">
            {assignMode === "confirm" && (
              <>
                <AlertDialogHeader>
                  <AlertDialogTitle>Xác nhận đảm nhận</AlertDialogTitle>
                  <AlertDialogDescription>
                    Bạn có chắc muốn đảm nhận yêu cầu bảo trì <br />
                    <strong>{selectedRequest?.units?.length || 1}</strong> thiết
                    bị?
                  </AlertDialogDescription>
                </AlertDialogHeader>

                <AlertDialogFooter>
                  <AlertDialogCancel>Hủy</AlertDialogCancel>
                  <button
                    onClick={handleAssign}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-md"
                  >
                    Xác nhận
                  </button>
                </AlertDialogFooter>
              </>
            )}

            {assignMode === "loading" && (
              <div className="py-6 flex flex-col items-center">
                <div className="w-10 h-10 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mb-4"></div>
                <p className="text-slate-700 font-medium">
                  Đang xử lý yêu cầu...
                </p>
              </div>
            )}

            {assignMode === "success" && (
              <div className="py-6 flex flex-col items-center">
                <div className="w-12 h-12 bg-emerald-500 rounded-full flex items-center justify-center text-white text-xl mb-3">
                  ✓
                </div>
                <p className="text-emerald-700 font-semibold">
                  Đảm nhận thành công!
                </p>

                <div className="mt-4">
                  <AlertDialogAction
                    onClick={() => setAssignOpen(false)}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-md"
                  >
                    Đóng
                  </AlertDialogAction>
                </div>
              </div>
            )}
          </AlertDialogContent>
        </AlertDialog>
        {/* ===== POPUP HỦY YÊU CẦU ===== */}
        <AlertDialog open={cancelOpen} onOpenChange={setCancelOpen}>
          <AlertDialogContent className="max-w-md z-[300000]">
            {cancelMode === "confirm" && (
              <>
                <AlertDialogHeader>
                  <AlertDialogTitle>Xác nhận hủy yêu cầu</AlertDialogTitle>
                  <AlertDialogDescription>
                    Bạn có chắc muốn HỦY yêu cầu bảo trì này?
                    <br />
                    <strong>ID: {selectedRequest?.id}</strong>
                  </AlertDialogDescription>
                </AlertDialogHeader>

                <AlertDialogFooter>
                  <AlertDialogCancel>Đóng</AlertDialogCancel>

                  <button
                    onClick={handleCancel}
                    className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-md"
                  >
                    Xác nhận hủy
                  </button>
                </AlertDialogFooter>
              </>
            )}

            {cancelMode === "loading" && (
              <div className="py-6 flex flex-col items-center">
                <div className="w-10 h-10 border-4 border-red-500 border-t-transparent rounded-full animate-spin mb-4"></div>
                <p className="text-slate-700 font-medium">
                  Đang xử lý yêu cầu...
                </p>
              </div>
            )}

            {cancelMode === "success" && (
              <div className="py-6 flex flex-col items-center">
                <div className="w-12 h-12 bg-red-500 rounded-full flex items-center justify-center text-white text-xl mb-3">
                  ✓
                </div>
                <p className="text-red-700 font-semibold">
                  Hủy yêu cầu thành công!
                </p>

                <div className="mt-4">
                  <AlertDialogAction
                    onClick={() => setCancelOpen(false)}
                    className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-md"
                  >
                    Đóng
                  </AlertDialogAction>
                </div>
              </div>
            )}
          </AlertDialogContent>
        </AlertDialog>
      </div>

      <AnimatePresence>
        {hoverDay && (
          <motion.div
            onMouseEnter={() => {
              popupHoverRef.current = true;
            }}
            onMouseLeave={() => {
              popupHoverRef.current = false;

              setTimeout(() => {
                if (!popupHoverRef.current && !dayHoverRef.current) {
                  setHoverDay(null);
                }
              }, 80);
            }}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 6 }}
            className="
        fixed z-[999999]
        w-80 p-4 rounded-2xl
        bg-white border border-slate-200 
        shadow-[0_6px_20px_rgba(0,0,0,0.15)]
      "
            style={{
              top: popupPos.y + 10,
              left: popupPos.x + 10,
            }}
          >
            <div className="font-semibold text-slate-700 text-sm mb-3 border-b pb-2">
              Lịch bảo trì ngày {format(hoverDay, "dd/MM/yyyy", { locale: vi })}
            </div>

            <div className="space-y-3 max-h-[300px] overflow-y-auto pr-1">
              {/* CONFIRMED */}
              {popupEvents.confirmed.length > 0 && (
                <>
                  <div className="text-emerald-600 font-semibold text-xs mb-1">
                    🔧 Lịch đã đảm nhận
                  </div>

                  {popupEvents.confirmed.map((ev) => (
                    <div
                      key={ev.id}
                      onClick={() => {
                        const el = document.getElementById(`card-${ev.id}`);
                        if (el) {
                          el.scrollIntoView({
                            behavior: "smooth",
                            block: "center",
                          });
                          el.classList.add("ring-4", "ring-emerald-400");

                          setTimeout(() => {
                            el.classList.remove("ring-4", "ring-emerald-400");
                          }, 1500);
                        }
                      }}
                      className="
                  flex items-center gap-3 p-2 rounded-lg 
                  border border-emerald-300 hover:bg-emerald-50 cursor-pointer
                "
                    >
                      <img
                        src={ev.image}
                        className="w-10 h-10 rounded-md object-cover border"
                      />
                      <div className="text-[12px] font-medium text-slate-700">
                        {ev.id}
                      </div>
                    </div>
                  ))}
                </>
              )}

              {/* PENDING */}
              {popupEvents.pending.length > 0 && (
                <>
                  <div className="text-cyan-600 font-semibold text-xs mb-1">
                    ⏳ Lịch chờ đảm nhận
                  </div>

                  {popupEvents.pending.map((ev) => (
                    <div
                      key={ev.id}
                      onClick={() => {
                        const el = document.getElementById(`card-${ev.id}`);
                        if (el) {
                          el.scrollIntoView({
                            behavior: "smooth",
                            block: "center",
                          });
                          el.classList.add("ring-4", "ring-cyan-400");

                          setTimeout(() => {
                            el.classList.remove("ring-4", "ring-cyan-400");
                          }, 1500);
                        }
                      }}
                      className="
                  flex items-center gap-3 p-2 rounded-lg 
                  border border-cyan-300 hover:bg-cyan-50 cursor-pointer
                "
                    >
                      <img
                        src={ev.image}
                        className="w-10 h-10 rounded-md object-cover border"
                      />
                      <div className="text-[12px] font-medium text-slate-700">
                        {ev.id}
                      </div>
                    </div>
                  ))}
                </>
              )}

              {/* PLAN */}
              {popupEvents.plan.length > 0 && (
                <>
                  <div className="text-amber-600 font-semibold text-xs mb-1">
                    🟠 Lịch bảo trì định kỳ
                  </div>

                  {popupEvents.plan.map((ev) => (
                    <div
                      key={ev.id}
                      className="
                  flex items-center gap-3 p-2 rounded-lg 
                  border border-amber-300 bg-white
                "
                    >
                      <img
                        src={ev.image || "/placeholder.jpg"}
                        className="w-10 h-10 rounded-md object-cover border"
                      />
                      <div className="text-[12px]">{ev.unitGroup}</div>
                    </div>
                  ))}
                </>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
