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
  const [cursor, setCursor] = useState(() => new Date()); // mốc hiển thị
  const [selectedDate, setSelectedDate] = useState(new Date()); // ngày được chọn
  const [loading, setLoading] = useState(true);

  const [view, setView] = useState("month"); // 'week' | 'month' | 'year'
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  // 🔹 Lưu ID của yêu cầu đang mở "Chi tiết thiết bị"
  const [expandedRequest, setExpandedRequest] = useState(null);
  // 🟢 Bộ lọc loại lịch
  const [eventFilter, setEventFilter] = useState("all"); // all | plan | pending | confirmed

  /* ====== Fetch plans ====== */
  const fetchPlans = async () => {
    try {
      setLoading(true);

      // 🔹 Gọi song song 2 API
      const [plansRes, reqRes] = await Promise.all([
        MaintenancePlanService.getAll(),
        MaintenanceRequestService.getAll(),
      ]);

      const plans = Array.isArray(plansRes) ? plansRes : plansRes?.data || [];
      const requests = Array.isArray(reqRes) ? reqRes : reqRes?.data || [];

      // 🔸 Lịch định kỳ (plan)
      const planEvents = plans.map((p) => ({
        id: p.id,
        type: "plan",
        unitId: p.equipment_id,
        unitGroup: p.equipment_name,
        branch: "—",
        start: new Date(p.next_maintenance_date),
        status: "plan",
        color: "bg-amber-400 text-white",
        label: "🟠 Lịch đúng hẹn",
      }));

      // 🔹 Yêu cầu bảo trì (request)
      const requestEvents = requests.flatMap((r) =>
        (r.units || []).map((u) => ({
          id: r.id,
          type: "request",
          unitId: u.id,
          unitGroup: u.equipment_name || "—",
          image: u.equipment_image,
          maintenance_reason: r.maintenance_reason,
          branch: u.branch_name || "—",
          start: new Date(r.scheduled_at),
          status: r.status,
          confirmed_by_name: r.confirmed_by_name,
          candidate_tech_name: r.candidate_tech_name,
          requestStatus: r.status,
          statusRaw: u.status,
          color:
            r.status === "confirmed"
              ? "bg-emerald-500 text-white"
              : "bg-cyan-500 text-white",
          label:
            r.status === "confirmed"
              ? "🟩 Lịch bảo trì"
              : "🟦 Lịch chờ đảm nhận",
        }))
      );

      // 🔹 Gộp 2 loại event
      const allEvents = [...planEvents, ...requestEvents].sort(
        (a, b) => a.start - b.start
      );

      setEvents(allEvents);
    } catch (err) {
      console.error("❌ Lỗi khi tải dữ liệu lịch:", err);
      toast.error("Không thể tải lịch bảo trì!");
    } finally {
      setLoading(false);
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
    if (eventFilter === "all") return events;
    if (eventFilter === "plan") return events.filter((e) => e.type === "plan");
    if (eventFilter === "pending")
      return events.filter((e) => e.status === "pending");
    if (eventFilter === "confirmed")
      return events.filter((e) => e.status === "confirmed");
    return events;
  }, [events, eventFilter]);

  /* Sự kiện trong ngày */
  const eventsOfDay = (day) =>
    filteredEvents
      .filter((e) => isSameDay(e.start, day))
      .sort((a, b) => a.start - b.start);

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

  // 🔹 Danh sách pending/confirmed theo view + eventFilter
  const pendingInView = useMemo(() => {
    let base = events.filter(
      (e) =>
        e.type === "request" &&
        e.requestStatus === "pending" &&
        inCurrentView(e)
    );
    if (eventFilter === "plan") base = []; // ẩn khi chỉ xem lịch chu kỳ
    if (eventFilter === "confirmed")
      base = base.filter((e) => e.status === "confirmed");
    if (eventFilter === "pending")
      base = base.filter((e) => e.status === "pending");
    return base;
  }, [events, inCurrentView, eventFilter]);

  const confirmedInView = useMemo(() => {
    let base = events.filter(
      (e) =>
        e.type === "request" &&
        e.requestStatus === "confirmed" &&
        inCurrentView(e)
    );
    if (eventFilter === "plan") base = []; // ẩn khi chỉ xem lịch chu kỳ
    if (eventFilter === "pending")
      base = base.filter((e) => e.status === "pending");
    if (eventFilter === "confirmed")
      base = base.filter((e) => e.status === "confirmed");
    return base;
  }, [events, inCurrentView, eventFilter]);

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
            className="ml-2 px-3 py-1.5 rounded-lg bg-slate-100/70 text-slate-700 font-medium text-sm
             border border-slate-300 hover:bg-slate-200 hover:shadow-[0_0_8px_rgba(100,116,139,0.2)]
             transition-all duration-200"
          >
            Hôm nay
          </button>
        </div>

        {/* Right: View switch + Create */}
        <div className="flex items-center gap-2 mt-3 md:mt-0">
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

          <Button
            onClick={() => setShowForm(true)}
            className="bg-white text-emerald-600 hover:bg-emerald-50 font-semibold shadow-md flex items-center gap-1"
          >
            <Plus className="w-4 h-4" /> Tạo kế hoạch
          </Button>

          <AnimatePresence>
            {showForm && (
              <>
                {/* Overlay + Form */}
                <AddScheduleSection
                  onClose={() => setShowForm(false)}
                  onSaved={fetchPlans}
                />

                {/* Dấu X nổi góc ngoài — kiểu MaintenanceUrgentSection */}
                <motion.button
                  whileHover={{
                    rotate: [0, -8, 8, -8, 0],
                    transition: { duration: 0.5 },
                  }}
                  onClick={() => setShowForm(false)}
                  className="fixed top-5 right-[calc(50%-615px)] w-12 h-12 rounded-full z-[10002]
    bg-gradient-to-r from-red-500 to-rose-500 text-white 
    flex items-center justify-center
    shadow-[0_6px_22px_rgba(244,63,94,0.55)]
    hover:shadow-[0_8px_30px_rgba(244,63,94,0.7)]
    hover:scale-110 active:scale-95
    border-[3px] border-white/90 ring-[3px] ring-white/70
    transition-all duration-300 ease-out"
                >
                  <X className="w-5 h-5" />
                </motion.button>
              </>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* ====== Body (2 cột): Lịch + Panel pending ====== */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 p-5 max-h-[78vh] overflow-hidden">
        {/* ====== Left: Calendar View (scroll riêng) ====== */}
        <div className="lg:col-span-8 min-h-[60vh] max-h-[74vh] overflow-y-auto pr-1">
          {/* 🔹 Bộ lọc loại lịch (có thêm nút “Tất cả”) */}
          <div className="flex justify-center flex-wrap gap-3 mt-3 mb-3 text-sm">
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
                        className={`p-3 rounded-xl border min-h-[120px] cursor-pointer transition ${
                          selected
                            ? "border-emerald-400 bg-emerald-50"
                            : "border-slate-200 hover:bg-slate-50"
                        }`}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-[12px] font-medium text-slate-700">
                            {format(day, "EEE dd/MM", { locale: vi })}
                          </span>
                          {isToday(day) && (
                            <span className="px-1.5 py-0.5 text-[10px] bg-emerald-100 text-emerald-700 rounded-full border border-emerald-200">
                              Hôm nay
                            </span>
                          )}
                        </div>
                        <div className="space-y-1">
                          {dayEvents.slice(0, 4).map((ev) => (
                            <div
                              key={ev.id}
                              className={`px-2 py-1 rounded-md text-[11px] truncate ${
                                STATUS[ev.status]?.chip
                              }`}
                              title={`${ev.unitId} • ${ev.unitName}`}
                            >
                              {ev.unitId}
                            </div>
                          ))}
                          {dayEvents.length > 4 && (
                            <div className="text-[10px] text-slate-500">
                              +{dayEvents.length - 4} nữa…
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
                        whileHover={{ scale: 1.02 }}
                        onClick={() => setSelectedDate(day)}
                        className={`p-2 rounded-xl border cursor-pointer min-h-[110px] transition-all ${
                          selected
                            ? "border-emerald-400 bg-gradient-to-br from-emerald-50 to-white shadow-sm"
                            : inMonth
                            ? "border-slate-200 hover:bg-slate-50"
                            : "border-slate-100 bg-slate-50/60"
                        }`}
                      >
                        <div className="flex justify-between mb-1 text-[11px] font-medium">
                          <span
                            className={
                              inMonth ? "text-slate-700" : "text-slate-400"
                            }
                          >
                            {format(day, "d", { locale: vi })}
                          </span>
                          {isToday(day) && (
                            <span className="px-1.5 py-0.5 text-[10px] bg-emerald-100 text-emerald-700 rounded-full border border-emerald-200">
                              Hôm nay
                            </span>
                          )}
                        </div>

                        <div className="space-y-1">
                          {dayEvents
                            .sort((a, b) => {
                              const priority = {
                                plan: 1,
                                pending: 2,
                                confirmed: 3,
                              };
                              return (
                                (priority[a.status] || 0) -
                                (priority[b.status] || 0)
                              );
                            })
                            .slice(0, 3)
                            .map((ev) => (
                              <div
                                key={ev.id + ev.unitId}
                                className={`px-2 py-1 rounded-md text-[11px] truncate font-medium ${ev.color}`}
                                title={`${ev.label} • ${ev.unitGroup || ""}`}
                              >
                                {ev.unitId}
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
          <div className="rounded-2xl bg-white shadow-[0_6px_20px_rgba(0,0,0,0.05)] overflow-hidden border border-slate-200 sticky top-4 max-h-[74vh] flex flex-col">
            {/* Header */}
            {/* 🔹 Tabs header: Chờ đảm nhận / Chờ bảo trì */}
            <div className="flex border-b bg-gradient-to-r from-emerald-50 to-cyan-50">
              <button
                onClick={() => setActiveTab("pending")}
                className={`flex-1 px-4 py-3 font-semibold text-sm transition-all ${
                  activeTab === "pending"
                    ? "text-emerald-700 border-b-2 border-emerald-500 bg-white"
                    : "text-slate-600 hover:bg-white/50"
                }`}
              >
                Danh sách các thiết bị chờ Đảm nhận ({pendingInView.length})
              </button>

              <button
                onClick={() => setActiveTab("confirmed")}
                className={`flex-1 px-4 py-3 font-semibold text-sm transition-all ${
                  activeTab === "confirmed"
                    ? "text-cyan-700 border-b-2 border-cyan-500 bg-white"
                    : "text-slate-600 hover:bg-white/50"
                }`}
              >
                Danh sách các thiết bị chờ đến ngày Bảo trì (
                {confirmedInView.length})
              </button>
            </div>

            <div className="p-3 space-y-3 overflow-y-auto max-h-[70vh]">
              {/* ==== Gom nhóm dữ liệu ==== */}
              {(() => {
                // 🔹 Gom pending theo request.id
                const groupedPending = Object.values(
                  pendingInView.reduce((acc, ev) => {
                    if (!acc[ev.id])
                      acc[ev.id] = { ...ev, units: [], image: ev.image };

                    acc[ev.id].units.push({
                      id: ev.unitId,
                      status: ev.statusRaw || "-",
                      lastMaintenance: ev.lastMaintenance || "-",
                    });

                    return acc;
                  }, {})
                );

                // 🔹 Gom confirmed theo request.id
                const groupedConfirmed = Object.values(
                  confirmedInView.reduce((acc, ev) => {
                    if (!acc[ev.id])
                      acc[ev.id] = { ...ev, units: [], image: ev.image };

                    acc[ev.id].units.push({
                      id: ev.unitId,
                      status: ev.statusRaw || "-",
                      lastMaintenance: ev.lastMaintenance || "-",
                    });

                    return acc;
                  }, {})
                );

                return (
                  <>
                    {/* === TAB: PENDING === */}
                    {activeTab === "pending" &&
                      (groupedPending.length === 0 ? (
                        <div className="text-sm text-slate-400 italic text-center py-8">
                          Không có mục nào đang chờ đảm nhận.
                        </div>
                      ) : (
                        groupedPending
                          .sort((a, b) => a.start - b.start)
                          .map((group) => (
                            <motion.div
                              whileHover={{ scale: 1.02 }}
                              key={group.id}
                              className={`relative p-3 rounded-xl border bg-white hover:bg-emerald-50/60 shadow-sm hover:shadow-md transition ${
                                STATUS[group.status]?.border
                              }`}
                            >
                              <div className="flex flex-col gap-2">
                                {/* ====== Header ====== */}
                                <div className="flex items-center justify-between">
                                  <div className="text-emerald-700 font-semibold text-sm truncate max-w-[220px]">
                                    {group.id}{" "}
                                    <span className="text-xs text-slate-500">
                                      ({group.units?.length || 1} thiết bị)
                                    </span>
                                  </div>
                                  <span className="text-[11px] px-2 py-0.5 rounded-md bg-amber-100 text-amber-700 border border-amber-200">
                                    ⏳ Chờ đảm nhận
                                  </span>
                                </div>

                                {/* ====== Ngày ====== */}
                                <div className="flex items-start gap-3">
                                  <img
                                    src={group.image}
                                    alt={group.unitGroup}
                                    className="w-12 h-12 rounded-lg object-cover border"
                                  />

                                  <div className="flex flex-col gap-1">
                                    <div className="text-[12px] text-slate-500">
                                      🕒{" "}
                                      {format(group.start, "dd/MM/yyyy HH:mm", {
                                        locale: vi,
                                      })}
                                    </div>

                                    <div className="text-[12px] text-slate-500">
                                      📌 {group.maintenance_reason || "—"}
                                    </div>
                                  </div>
                                </div>

                                {/* ====== Nút hành động ====== */}
                                <div className="flex items-center justify-between mt-2">
                                  <Button
                                    size="sm"
                                    className="bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-medium px-3 py-1"
                                    onClick={async () => {
                                      try {
                                        await MaintenanceRequestService.confirm(
                                          group.id
                                        );
                                        toast.success(
                                          `✅ Đã đảm nhận yêu cầu ${group.id}`
                                        );
                                        fetchPlans();
                                      } catch (err) {
                                        toast.error(
                                          "❌ Lỗi khi đảm nhận yêu cầu bảo trì"
                                        );
                                      }
                                    }}
                                  >
                                    🧰 Đảm nhận
                                  </Button>

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

                                {/* ====== Bảng chi tiết ====== */}
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
                                              {u.status || "—"}
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

                    {/* === TAB: CONFIRMED === */}
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
                              whileHover={{ scale: 1.02 }}
                              key={group.id}
                              className="relative p-3 rounded-xl border bg-white hover:bg-cyan-50/60 shadow-sm hover:shadow-md transition border-cyan-300/50"
                            >
                              <div className="flex flex-col gap-2">
                                {/* ====== Header ====== */}
                                <div className="flex items-center justify-between">
                                  <div className="text-emerald-700 font-semibold text-sm truncate max-w-[220px]">
                                    {group.id}{" "}
                                    <span className="text-xs text-slate-500">
                                      ({group.units?.length || 1} thiết bị)
                                    </span>
                                  </div>
                                  <span className="text-[11px] px-2 py-0.5 rounded-md bg-cyan-100 text-cyan-700 border border-cyan-200">
                                    🔧 Chờ bảo trì
                                  </span>
                                </div>

                                {/* ====== Thông tin ====== */}
                                <div className="flex items-start gap-3">
                                  <img
                                    src={group.image}
                                    alt={group.unitGroup}
                                    className="w-12 h-12 rounded-lg object-cover border"
                                  />
                                  <div className="flex flex-col gap-1">
                                    <div className="text-[12px] text-slate-500">
                                      👨‍🔧{" "}
                                      {group.confirmed_by_name &&
                                      group.confirmed_by_name !==
                                        "Chưa có thông tin"
                                        ? group.confirmed_by_name
                                        : group.candidate_tech_name &&
                                          group.candidate_tech_name !==
                                            "Chưa có thông tin"
                                        ? group.candidate_tech_name
                                        : "—"}
                                    </div>
                                    <div className="text-[12px] text-slate-500">
                                      🕒{" "}
                                      {format(group.start, "dd/MM/yyyy HH:mm", {
                                        locale: vi,
                                      })}
                                    </div>

                                    <div className="text-[12px] text-slate-500">
                                      📌 {group.maintenance_reason || "—"}
                                    </div>
                                  </div>
                                </div>

                                {/* ====== Chi tiết các thiết bị ====== */}
                                <div className="flex items-center justify-end mt-2">
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
                                              {u.status || "—"}
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
                  </>
                );
              })()}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
