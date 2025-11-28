import React, { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ClockClockwise, Wrench, Archive } from "@phosphor-icons/react";
import Branch from "@/components/common/Branch";
import {
  UserCircle2,
  Search,
  ChevronDown,
  ChevronUp,
  Clock,
  MapPin,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  CalendarDays,
} from "lucide-react";

import MaintenanceRequestService from "@/services/MaintenanceRequestService";
import {
  format,
  startOfWeek,
  addDays,
  addWeeks,
  isSameDay,
  startOfMonth,
  endOfMonth,
  endOfWeek,
  eachDayOfInterval,
  addMonths,
  isSameMonth,
} from "date-fns";
import { vi } from "date-fns/locale";
console.log(">>> MyScheduleSection.jsx LOADED 1", Date.now());

// =============== CONSTANTS & HELPERS ===============

const fmtDateTime = (d) =>
  d ? format(new Date(d), "dd/MM/yyyy HH:mm", { locale: vi }) : "—";

const fmtDate = (d) =>
  d ? format(new Date(d), "dd/MM/yyyy", { locale: vi }) : "—";

const START_HOUR = 0;
const END_HOUR = 24;
const TOTAL_MINUTES = (END_HOUR - START_HOUR) * 60;

// Lấy id kỹ thuật viên từ record (tùy backend trả field nào)
const getItemTechnicianId = (item) =>
  item.confirmed_by || // id user confirm lịch
  item.confirmed_by_id || // nếu backend đặt tên như vậy
  item.candidate_tech_id || // id kỹ thuật viên được đề xuất
  item.technician_user_id ||
  item.technician_id ||
  item.user_id ||
  item.assigned_by ||
  null;

// Chuẩn hóa status của request
const getScheduleStatus = (item) =>
  (item.status || item.request_status || item.maintenance_status || "")
    .toString()
    .toLowerCase();

// Lịch nào được coi là “card xanh lá” cần show trong MySchedule
const isScheduleVisible = (item) => {
  const s = getScheduleStatus(item);
  if (!s) return false;

  // Chỉ show các lịch đã được confirm / đang thực hiện / đã xong
  // (tương ứng card xanh lá trong module xếp lịch)
  if (
    s === "confirmed" ||
    s === "confirm" ||
    s === "executed" ||
    s === "execute" ||
    s === "in_progress" ||
    s === "in-progress" ||
    s === "doing" ||
    s === "processing" ||
    s === "done" ||
    s === "completed" ||
    s === "finished"
  ) {
    return true;
  }

  // Nếu backend có cờ riêng
  if (item.is_confirmed === true) return true;

  return false;
};

// Xác định lịch đã hoàn tất để chuyển sang xanh lá gạch sọc
const isScheduleDone = (item) => {
  const unitsArr = Array.isArray(item.equipment_units)
    ? item.equipment_units
    : Array.isArray(item.units)
    ? item.units
    : [];

  if (!unitsArr.length) return false;

  const DONE_STATUS = ["ready", "active"];

  const allDone = unitsArr.every((u) => {
    const su = (u.status || u.state || "").toString().toLowerCase().trim();
    return DONE_STATUS.includes(su);
  });

  return allDone;
};

// Chip trạng thái hiển thị trong list (history / month)
const statusMeta = (item) => {
  const s = getScheduleStatus(item);
  const done = isScheduleDone(item);

  if (done) {
    return {
      label: "Đã hoàn tất lịch",
      color:
        "bg-emerald-50 text-emerald-700 border-emerald-300 dark:bg-emerald-900/20 dark:text-emerald-200",
      icon: CheckCircle2,
    };
  }

  if (
    s === "executed" ||
    s === "execute" ||
    s === "in_progress" ||
    s === "in-progress" ||
    s === "doing" ||
    s === "processing"
  ) {
    return {
      label: "Đang bảo trì",
      color:
        "bg-emerald-50 text-emerald-700 border-emerald-300 dark:bg-emerald-900/20 dark:text-emerald-200",
      icon: Clock,
    };
  }

  if (s === "confirmed" || s === "confirm") {
    return {
      label: "Đã xác nhận lịch",
      color:
        "bg-emerald-50 text-emerald-700 border-emerald-300 dark:bg-emerald-900/20 dark:text-emerald-200",
      icon: CalendarDays,
    };
  }

  // fallback
  return {
    label: "Lịch bảo trì",
    color:
      "bg-slate-50 text-slate-700 border-slate-200 dark:bg-slate-900/20 dark:text-slate-200",
    icon: Clock,
  };
};

// Tính vị trí event theo % timeline 0–24h
const computeEventPosition = (item) => {
  if (!item.start_date) {
    return { topPercent: 0, heightPercent: 8 };
  }

  const start = new Date(item.start_date);
  const end = item.end_date
    ? new Date(item.end_date)
    : new Date(start.getTime() + 60 * 60 * 1000); // default 1h

  let startMins = start.getHours() * 60 + start.getMinutes() - START_HOUR * 60;
  let endMins = end.getHours() * 60 + end.getMinutes() - START_HOUR * 60;

  if (isNaN(startMins) || isNaN(endMins)) {
    return { topPercent: 0, heightPercent: 8 };
  }

  startMins = Math.max(0, Math.min(TOTAL_MINUTES, startMins));
  endMins = Math.max(startMins + 15, Math.min(TOTAL_MINUTES, endMins)); // ít nhất 15'

  const topPercent = (startMins / TOTAL_MINUTES) * 100;
  const heightPercent = Math.max(
    ((endMins - startMins) / TOTAL_MINUTES) * 100,
    6
  );

  return { topPercent, heightPercent };
};

// Card thống kê nhỏ (stats) - STYLE BẢN CŨ ĐẸP
// ====================== STAT CARD (UI chuẩn bản cũ) ======================
const StatCard = ({ icon: Icon, label, value, sub }) => (
  <div className="flex flex-col rounded-2xl border border-slate-200 bg-white px-5 py-4">
    <div className="flex items-center gap-3">
      <div className="rounded-xl bg-emerald-50 p-2 text-emerald-600">
        <Icon className="w-4 h-4" />
      </div>

      <div className="flex flex-col">
        <span className="text-[12px] text-slate-600">{label}</span>
        <span className="text-[20px] font-semibold text-slate-900 leading-none">
          {value}
        </span>
      </div>
    </div>

    {sub && <span className="mt-2 text-[11px] text-slate-500">{sub}</span>}
  </div>
);
// const techStatsMap = useMemo(() => {
//   const map = {};
//   technicianGroups.forEach((g) => {
//     const items = g.items;

//     let filtered = items;

//     if (viewMode === "week") {
//       const start = currentWeek;
//       const end = addDays(currentWeek, 6);

//       filtered = items.filter((i) => {
//         const d = new Date(i.start_date);
//         return d >= start && d <= end;
//       });
//     }

//     if (viewMode === "month") {
//       filtered = items.filter((i) => {
//         return isSameMonth(new Date(i.start_date), currentMonth);
//       });
//     }

//     // Calculate stats
//     let active = 0;
//     let done = 0;

//     filtered.forEach((i) => {
//       if (isScheduleDone(i)) done++;
//       else active++;
//     });

//     map[g.technician_id] = { active, done, total: filtered.length };
//   });
//   return map;
// }, [technicianGroups, viewMode, currentWeek, currentMonth]);

// Card kỹ thuật viên trong thanh ngang
const TechnicianCard = ({
  group,
  selected,
  onClick,
  isMe,
  techStats,
  viewMode,
}) => {
  const initials = group.technician_name
    .split(" ")
    .slice(-2)
    .map((p) => p[0])
    .join("")
    .toUpperCase();

  return (
    <motion.button
      whileHover={{ y: -2 }}
      whileTap={{ scale: 0.97 }}
      onClick={onClick}
      className={`flex min-w-[220px] flex-col items-start rounded-2xl border px-3.5 py-3 text-left shadow-sm transition-all ${
        selected
          ? "border-emerald-500 bg-emerald-50/90 shadow-md"
          : "border-slate-200 bg-white hover:border-emerald-300 hover:bg-emerald-50/60"
      }`}
    >
      <div className="mb-2 flex w-full items-center gap-3">
        <div
          className={`flex h-9 w-9 items-center justify-center rounded-full text-sm font-semibold ${
            selected
              ? "bg-emerald-500 text-white"
              : "bg-emerald-100 text-emerald-700"
          }`}
        >
          {initials}
        </div>
        <div className="flex-1 min-w-0">
          <p className="line-clamp-1 text-sm font-semibold text-slate-900">
            {group.technician_name}
          </p>
          <p className="text-[11px] text-slate-500">
            {group.branch_count} chi nhánh · {group.total} lịch
          </p>

          {/* ➕ HIỂN THỊ CHI NHÁNH LÀM VIỆC */}
          {group.working_branch && (
            <div className="mt-1">
              <Branch id={group.working_branch} />
            </div>
          )}
        </div>
      </div>

      <div className="flex w-full items-center justify-between text-[11px] text-slate-600">
        {/* Lịch mở theo tuần/tháng/history */}
        <span className="inline-flex items-center gap-1">
          <span className="h-2 w-2 rounded-full bg-emerald-500" />
          <span>{techStats?.active ?? group.active}</span> Chưa xong
          {/* {viewMode === "week" && <span className="text-[10px]">/ tuần</span>}
          {viewMode === "month" && <span className="text-[10px]">/ tháng</span>} */}
        </span>

        {/* Lịch xong theo tuần/tháng/history */}
        <span className="inline-flex items-center gap-1">
          <span className="h-2 w-2 rounded-full border border-emerald-700 bg-emerald-100" />
          <span>{techStats?.done ?? group.done}</span> Đã xong
          {/* {viewMode === "week" && <span className="text-[10px]">/ tuần</span>}
          {viewMode === "month" && <span className="text-[10px]">/ tháng</span>} */}
        </span>
      </div>

      {isMe && (
        <span className="mt-1 text-[10px] font-semibold text-emerald-600">
          Đây là tài khoản của bạn
        </span>
      )}
    </motion.button>
  );
};
const BRANCH_MAP = {
  "FitX Gym Gò Vấp": "GV",
  "FitX Gym GV": "GV",
  GV: "GV",

  "FitX Gym Quận 3": "Q3",
  "FitX Gym Q3": "Q3",
  Q3: "Q3",
};

// =====================================================
//                 MAIN COMPONENT
// =====================================================
export default function MyScheduleSection() {
  console.log("🔵 RENDER: MyScheduleSection ĐANG ĐƯỢC SỬ DỤNG");
  const [loading, setLoading] = useState(true);
  const [rawData, setRawData] = useState([]);
  const [hoverItem, setHoverItem] = useState(null); // giữ lại logic cũ (dù hiện tại chưa dùng)
  const [currentUserBranch, setCurrentUserBranch] = useState(null);
  // ➕ THU NHỎ HEADER (TECH BAR + STAT CARDS)
  const [collapsedHeader, setCollapsedHeader] = useState(false);
  const [collapseTechBar, setCollapseTechBar] = useState(false);
  const [collapseStats, setCollapseStats] = useState(false);

  useEffect(() => {
    try {
      const auth = JSON.parse(localStorage.getItem("ftc_auth"));
      if (!auth) return;

      const attrs = auth.userAttributes || auth.attributes || auth || {};

      const branch =
        BRANCH_MAP[attrs.branch] ||
        BRANCH_MAP[attrs.branch_id] ||
        BRANCH_MAP[attrs.branch_name] ||
        null;

      setCurrentUserBranch(branch);
    } catch (err) {
      console.warn("LỖI LẤY BRANCH:", err);
    }
  }, []);

  const [selectedTech, setSelectedTech] = useState(null);
  const [searchTech, setSearchTech] = useState("");
  const [viewMode, setViewMode] = useState("week"); // "history" | "week" | "month"

  // 🔐 Lấy user hiện tại từ localStorage (ftc_auth → sub)
  const [currentUserId, setCurrentUserId] = useState(null);
  const [currentUserName, setCurrentUserName] = useState("");
  useEffect(() => {
    try {
      const auth = JSON.parse(localStorage.getItem("ftc_auth"));
      if (!auth) return;

      const attrs = auth.userAttributes || auth.attributes || auth || {};

      const sub = attrs.sub || attrs["sub"] || auth.sub || null;

      const name = attrs.name || attrs["name"] || auth.username || "Tài khoản";

      setCurrentUserId(sub);
      setCurrentUserName(name);

      console.log(">>> USER HIỆN TẠI:", sub, name);
    } catch (err) {
      console.warn("LỖI LẤY USER:", err);
    }
  }, []);

  const [selectedWeekDate, setSelectedWeekDate] = useState(null);
  const [expandedDayKey, setExpandedDayKey] = useState(null); // giữ lại cho DayGroup nếu cần

  const [currentWeek, setCurrentWeek] = useState(
    startOfWeek(new Date(), { weekStartsOn: 1 })
  );
  const [currentMonth, setCurrentMonth] = useState(startOfMonth(new Date()));
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [expandedRequest, setExpandedRequest] = useState(null);

  const hours = useMemo(() => Array.from({ length: 24 }, (_, i) => i), []);

  // 📥 Fetch maintenance requests (card xanh lá)
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        setLoading(true);
        const res = await MaintenanceRequestService.getAll();
        if (!mounted) return;
        const data = Array.isArray(res) ? res : res?.data || [];
        setRawData(data || []);
      } catch (err) {
        console.error("❌ Lỗi khi tải danh sách lịch bảo trì:", err);
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  // 🎯 Chuẩn hóa dữ liệu từ API + chỉ giữ lịch "card xanh lá"
  const scheduleData = useMemo(() => {
    if (!Array.isArray(rawData)) return [];

    return rawData
      .filter(isScheduleVisible)
      .map((item) => {
        const unit =
          Array.isArray(item.units) && item.units.length > 0
            ? item.units[0]
            : null;

        const start =
          item.start_date || item.scheduled_at || item.created_at || null;

        return {
          ...item,
          start_date: start,
          end_date: item.end_date || null,
          equipment_name:
            item.equipment_name ||
            unit?.equipment_name ||
            unit?.equipment_line_name ||
            null,
          equipment_unit_id:
            item.equipment_unit_id ||
            unit?.id ||
            unit?.equipment_unit_id ||
            null,
          branch_id:
            item.branch_id || unit?.branch_id || unit?.branch_name || null,
          technician_name:
            item.technician_name ||
            item.confirmed_by_name ||
            item.candidate_tech_name ||
            "Chưa có thông tin",
        };
      })
      .filter((i) => i.start_date);
  }, [rawData]);

  // 👤 Thống kê lịch mà chính user hiện tại phụ trách (toàn hệ thống)
  const myStats = useMemo(() => {
    if (!currentUserId) return null;
    const mine = scheduleData.filter(
      (item) => getItemTechnicianId(item) === currentUserId
    );
    if (!mine.length) return { total: 0, active: 0, done: 0 };

    let active = 0;
    let done = 0;

    mine.forEach((item) => {
      if (isScheduleDone(item)) done++;
      else active++;
    });

    return {
      total: mine.length,
      active,
      done,
    };
  }, [scheduleData, currentUserId]);

  // 👥 Group theo technician_name
  const technicianGroups = useMemo(() => {
    const map = {};

    scheduleData.forEach((item) => {
      const techName =
        item.technician_name ||
        item.confirmed_by_name ||
        item.candidate_tech_name ||
        "Chưa có thông tin";

      const key = techName;
      const techId = getItemTechnicianId(item);

      // Nếu chưa có entry → tạo mới
      if (!map[key]) {
        map[key] = {
          technician_name: techName,
          technician_id: techId,
          branch_count: 0,
          branch_ids: new Set(),
          branch_counter: {}, // <--- thêm cái này
          working_branch: null,
          total: 0,
          active: 0,
          done: 0,
          items: [],
        };
      }

      // ===== Thêm branch =====
      const br =
        item.branch_id ||
        BRANCH_MAP[item.branch] ||
        BRANCH_MAP[item.branch_name] ||
        BRANCH_MAP[item.branch_id] ||
        BRANCH_MAP[unit?.branch_name] ||
        "N/A";

      map[key].branch_ids.add(br);

      if (!map[key].branch_counter[br]) {
        map[key].branch_counter[br] = 0;
      }
      map[key].branch_counter[br]++;

      // ===== Đếm lịch =====
      map[key].total++;
      if (isScheduleDone(item)) map[key].done++;
      else map[key].active++;

      // ===== Lưu item =====
      map[key].items.push(item);
    });

    // Tính số chi nhánh + chi nhánh làm việc
    const list = Object.values(map).map((g) => {
      g.branch_count = g.branch_ids.size;

      // Lấy chi nhánh xuất hiện nhiều nhất → working branch
      const sortedBranches = Object.entries(g.branch_counter).sort(
        (a, b) => b[1] - a[1]
      );
      g.working_branch = sortedBranches[0]?.[0] || null;

      return g;
    });

    return list.sort((a, b) =>
      a.technician_name.localeCompare(b.technician_name)
    );
  }, [scheduleData]);

  // 🔍 Lọc theo tên kỹ thuật viên
  const visibleTechnicians = useMemo(() => {
    const q = searchTech.trim().toLowerCase();
    if (!q) return technicianGroups;
    return technicianGroups.filter((g) =>
      g.technician_name.toLowerCase().includes(q)
    );
  }, [technicianGroups, searchTech]);
  const techStatsMap = useMemo(() => {
    const map = {};
    technicianGroups.forEach((g) => {
      const items = g.items;

      let filtered = items;

      if (viewMode === "week") {
        const start = currentWeek;
        const end = addDays(currentWeek, 6);

        filtered = items.filter((i) => {
          const d = new Date(i.start_date);
          return d >= start && d <= end;
        });
      }

      if (viewMode === "month") {
        filtered = items.filter((i) => {
          return isSameMonth(new Date(i.start_date), currentMonth);
        });
      }

      // Calculate stats
      let active = 0;
      let done = 0;

      filtered.forEach((i) => {
        if (isScheduleDone(i)) done++;
        else active++;
      });

      map[g.technician_id] = { active, done, total: filtered.length };
    });
    return map;
  }, [technicianGroups, viewMode, currentWeek, currentMonth]);
  // Auto chọn technician (ưu tiên chính user hiện tại nếu có)
  useEffect(() => {
    if (!technicianGroups.length) return;

    if (!selectedTech && currentUserId) {
      const me = technicianGroups.find(
        (g) => g.technician_id === currentUserId
      );
      if (me) {
        setSelectedTech(me.technician_name);
        return;
      }
    }

    if (!selectedTech && technicianGroups[0]) {
      setSelectedTech(technicianGroups[0].technician_name);
    }
  }, [technicianGroups, selectedTech, currentUserId]);

  const selectedGroup = useMemo(
    () => technicianGroups.find((g) => g.technician_name === selectedTech),
    [technicianGroups, selectedTech]
  );

  // ===== Gom history theo ngày =====
  const dayGroups = useMemo(() => {
    if (!selectedGroup) return [];
    const map = {};
    selectedGroup.items.forEach((item) => {
      if (!item.start_date) return;
      const key = fmtDate(item.start_date);
      if (!map[key]) map[key] = [];
      map[key].push(item);
    });

    return Object.entries(map)
      .map(([dateLabel, items]) => ({
        dateLabel,
        items: items.sort(
          (a, b) =>
            new Date(a.start_date).getTime() - new Date(b.start_date).getTime()
        ),
      }))
      .sort((a, b) => {
        const da = a.items[0]?.start_date || a.dateLabel;
        const db = b.items[0]?.start_date || b.dateLabel;
        return new Date(db) - new Date(da); // mới nhất trước
      });
  }, [selectedGroup]);

  // =============== WEEK VIEW ===============
  const weekDays = useMemo(() => {
    return [...Array(7)].map((_, i) => {
      const d = addDays(currentWeek, i);
      return {
        date: d,
        key: format(d, "yyyy-MM-dd"),
        dayLabel: format(d, "EEE", { locale: vi }),
        dateLabel: format(d, "dd/MM", { locale: vi }),
      };
    });
  }, [currentWeek]);

  const weeklyMap = useMemo(() => {
    if (!selectedGroup) return {};
    const map = {};
    weekDays.forEach((d) => {
      map[d.key] = [];
    });
    selectedGroup.items.forEach((item) => {
      if (!item.start_date) return;
      const key = format(new Date(item.start_date), "yyyy-MM-dd");
      if (!map[key]) return; // ngoài tuần hiện tại
      map[key].push(item);
    });
    return map;
  }, [weekDays, selectedGroup]);

  // Chọn ngày mặc định cho week view (giống Outlook)
  useEffect(() => {
    if (viewMode !== "week") return;
    if (!selectedGroup) return;
    if (selectedWeekDate) return;

    const today = new Date();
    const weekEnd = addDays(currentWeek, 6);
    if (today >= currentWeek && today <= weekEnd) {
      setSelectedWeekDate(today);
    } else {
      setSelectedWeekDate(currentWeek);
    }
  }, [viewMode, selectedGroup, currentWeek, selectedWeekDate]);

  // =============== MONTH VIEW ===============
  const monthDays = useMemo(() => {
    const start = startOfWeek(startOfMonth(currentMonth), {
      weekStartsOn: 1,
    });
    const end = endOfWeek(endOfMonth(currentMonth), { weekStartsOn: 1 });
    return eachDayOfInterval({ start, end });
  }, [currentMonth]);

  const monthMap = useMemo(() => {
    if (!selectedGroup) return {};
    const map = {};
    monthDays.forEach((date) => {
      const key = format(date, "yyyy-MM-dd");
      map[key] = [];
    });
    selectedGroup.items.forEach((item) => {
      if (!item.start_date) return;
      const key = format(new Date(item.start_date), "yyyy-MM-dd");
      if (!map[key]) return;
      map[key].push(item);
    });
    return map;
  }, [monthDays, selectedGroup]);

  const selectedDateKey = format(selectedDate, "yyyy-MM-dd");
  const selectedDateItems = monthMap[selectedDateKey] || [];

  useEffect(() => {
    if (!selectedGroup) return;
    if (viewMode === "month") {
      const today = new Date();
      if (isSameMonth(today, currentMonth)) {
        setSelectedDate(today);
      } else {
        setSelectedDate(currentMonth);
      }
    }
  }, [selectedGroup, viewMode, currentMonth]);

  // ===== Stats theo group đã chọn =====
  const stats = useMemo(() => {
    const list = selectedGroup ? selectedGroup.items : scheduleData;
    const total = list.length;
    let done = 0;
    list.forEach((i) => {
      if (isScheduleDone(i)) done++;
    });
    const open = total - done;
    const green = list.filter((i) => isScheduleVisible(i)).length;
    return { total, open, done, green };
  }, [selectedGroup, scheduleData]);

  // Helper lấy list item theo selectedWeekDate
  const selectedWeekItems = useMemo(() => {
    if (!selectedWeekDate) return [];
    const key = format(selectedWeekDate, "yyyy-MM-dd");
    const items = weeklyMap[key] || [];
    return [...items].sort(
      (a, b) => new Date(a.start_date) - new Date(b.start_date)
    );
  }, [selectedWeekDate, weeklyMap]);
  // Items tương ứng theo ngày đã chọn (tự động theo viewMode)
  const dayItems = useMemo(() => {
    if (viewMode === "week") return selectedWeekItems;
    if (viewMode === "month") return selectedDateItems;
    return [];
  }, [viewMode, selectedWeekItems, selectedDateItems]);

  // ===== Tính thống kê theo NGÀY được chọn =====
  const dayStats = useMemo(() => {
    const items = dayItems || [];

    let totalSchedules = items.length;
    let doneSchedules = 0;
    let doingMachines = 0;
    let doneMachines = 0;

    items.forEach((item) => {
      const units = item.units || item.equipment_units || [];
      // Đếm trạng thái từng thiết bị
      const statusCount = units.reduce(
        (acc, u) => {
          const s = (u.status || u.state || "").toLowerCase().trim();

          acc.total++;

          if (s === "active") acc.active++;
          else if (s === "ready") acc.ready++;
          else if (s === "failed") acc.failed++;
          else if (s === "in progress" || s === "processing" || s === "doing")
            acc.inprogress++;
          else acc.other++;

          return acc;
        },
        { total: 0, active: 0, ready: 0, failed: 0, inprogress: 0, other: 0 }
      );

      const isDone =
        isScheduleDone(item) ||
        units.every((u) =>
          ["ready", "active"].includes(
            (u.status || u.state || "").toString().toLowerCase()
          )
        );

      if (isDone) doneSchedules++;

      units.forEach((u) => {
        const su = (u.status || u.state || "").toLowerCase();

        if (
          [
            "in_progress",
            "in-progress",
            "in progress",
            "doing",
            "processing",
            "executed",
          ].includes(su)
        )
          doingMachines++;

        if (["ready", "active"].includes(su)) doneMachines++;
      });
    });

    return {
      totalSchedules,
      doneSchedules,
      doingMachines,
      doneMachines,
    };
  }, [dayItems]);
  // ===== Summary trạng thái thiết bị trong NGÀY =====
  const dayStatusSummary = useMemo(() => {
    const counts = { active: 0, ready: 0, failed: 0, inprogress: 0 };

    dayItems.forEach((item) => {
      const units = item.units || item.equipment_units || [];

      units.forEach((u) => {
        const s = (u.status || u.state || "").toLowerCase().trim();

        if (s === "active") counts.active++;
        else if (s === "ready") counts.ready++;
        else if (s === "failed") counts.failed++;
        else if (
          ["in progress", "in_progress", "processing", "doing"].includes(s)
        )
          counts.inprogress++;
      });
    });

    return counts;
  }, [dayItems]);

  // =====================================================
  //                       RENDER
  // =====================================================
  return (
    <div
      id="myschedule-panel"
      className="relative flex max-h-[82vh] flex-col overflow-y-auto rounded-3xl border bg-slate-50/80"
    >
      {/* ===== HEADER PREMIUM — PHOSPHOR ICON ===== */}
      <div className="flex min-h-[100px] max-h-[100px] items-center justify-between border-b border-slate-200 bg-gradient-to-r from-emerald-500 via-cyan-500 to-blue-500 px-8 shadow-[0_4px_20px_rgba(0,0,0,0.15)]">
        {/* LEFT */}
        <div className="flex items-center gap-5">
          {/* ICON PREMIUM */}
          <div className="flex items-center gap-5">
            <div className="relative">
              <ClockClockwise
                size={42}
                weight="duotone"
                className="text-white drop-shadow-xl"
              />
              <div className="absolute inset-0 blur-xl bg-white/40 -z-10"></div>
            </div>

            <div className="flex flex-col text-white drop-shadow-sm">
              <h1 className="text-3xl font-bold tracking-wide">
                Lịch bảo trì theo kỹ thuật viên
              </h1>
              <p className="mt-1 text-[13px] opacity-90">
                Theo dõi – quản lý – giám sát lịch bảo trì
              </p>
            </div>
            {/* ➕ CHI NHÁNH LÀM VIỆC — THÊM TẠI ĐÂY */}
            {currentUserBranch && (
              <div className="flex items-center gap-2 mt-1 text-[12px] text-white">
                <MapPin className="w-3 h-3 opacity-90" />
                <Branch id={currentUserBranch} />
              </div>
            )}
          </div>
        </div>

        {/* RIGHT — MODE SWITCH */}
        <div className="inline-flex items-center rounded-full bg-white/30 backdrop-blur-md p-1 shadow-md">
          <button
            onClick={() => setViewMode("history")}
            className={`flex items-center gap-1 rounded-full px-5 py-2 text-[12px] font-semibold transition-all ${
              viewMode === "history"
                ? "bg-white text-emerald-700 shadow"
                : "text-white/90 hover:bg-white/20"
            }`}
          >
            📋 Lịch sử
          </button>

          <button
            onClick={() => setViewMode("week")}
            className={`flex items-center gap-1 rounded-full px-5 py-2 text-[12px] font-semibold transition-all ${
              viewMode === "week"
                ? "bg-white text-emerald-700 shadow"
                : "text-white/90 hover:bg-white/20"
            }`}
          >
            📅 Tuần
          </button>

          <button
            onClick={() => setViewMode("month")}
            className={`flex items-center gap-1 rounded-full px-5 py-2 text-[12px] font-semibold transition-all ${
              viewMode === "month"
                ? "bg-white text-emerald-700 shadow"
                : "text-white/90 hover:bg-white/20"
            }`}
          >
            🗓️ Tháng
          </button>
        </div>
      </div>

      {/* ===== 3) STATS + LỊCH ===== */}
      <div className="flex flex-1 flex-col gap-3 overflow-hidden px-4 pb-4 pt-3">
        {/* ===== HEADER PANEL COLLAPSIBLE ===== */}
        <div
          className={`relative border-b border-slate-200 bg-slate-50/80 transition-all duration-300
  ${collapsedHeader ? "h-[48px] overflow-hidden" : "h-auto"}`}
        >
          {/* NÚT THU GỌN / MỞ RỘNG */}
          <button
            onClick={() => setCollapsedHeader((v) => !v)}
            className="absolute right-3 top-3 z-10 p-1 rounded-full bg-white shadow text-slate-600 hover:bg-slate-100"
          >
            {collapsedHeader ? (
              <ChevronDown size={16} />
            ) : (
              <ChevronUp size={16} />
            )}
          </button>

          {/* ======= HEADER PANEL (2 PANEL COLLAPSE RIÊNG) ======= */}
          <div className="bg-slate-50/80">
            {/* ===================== PANEL 1: TECH BAR ===================== */}
            <div className="relative py-3 px-4 border-b border-slate-200">
              {/* Toggle nút */}
              <button
                onClick={() => setCollapseTechBar((v) => !v)}
                className="absolute right-3 top-3 z-10 p-1 rounded-full bg-white shadow text-slate-600 hover:bg-slate-100"
              >
                {collapseTechBar ? (
                  <ChevronDown size={16} />
                ) : (
                  <ChevronUp size={16} />
                )}
              </button>

              {/* --- Khi thu gọn --- */}
              {collapseTechBar ? (
                <div
                  className="font-bold text-[13px] text-slate-700 py-1 cursor-pointer"
                  onClick={() => setCollapseTechBar(false)}
                >
                  Các kỹ thuật viên
                </div>
              ) : (
                /* --- Khi mở rộng --- */
                <div className="mt-1">
                  {/* HEADER LINE: label + search + tổng số */}
                  <div className="mb-2 flex items-center justify-between gap-3">
                    {/* LEFT: Label + Search */}
                    <div className="flex items-center gap-3">
                      <span className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                        KỸ THUẬT VIÊN
                      </span>

                      {/* SEARCH */}
                      <div className="flex items-center gap-1 rounded-full border border-slate-300 bg-white px-2 py-1 text-[11px]">
                        <Search className="h-3.5 w-3.5 text-slate-400" />
                        <input
                          value={searchTech}
                          onChange={(e) => setSearchTech(e.target.value)}
                          placeholder="Tìm theo tên..."
                          className="w-[150px] bg-transparent text-[11px] outline-none placeholder:text-slate-400"
                        />
                      </div>
                    </div>

                    {/* RIGHT: Tổng số kỹ thuật viên */}
                    <div className="text-[11px] font-medium text-slate-500 pr-8">
                      Tổng số:{" "}
                      <span className="font-semibold text-slate-800">
                        {visibleTechnicians.length}
                      </span>
                    </div>
                  </div>

                  {/* LIST TECHNICIANS */}
                  <div className="flex gap-2 overflow-x-auto pb-2">
                    {visibleTechnicians.map((g) => (
                      <TechnicianCard
                        key={g.technician_name}
                        group={g}
                        selected={selectedTech === g.technician_name}
                        onClick={() => {
                          setSelectedTech(g.technician_name);
                          setSelectedWeekDate(null);
                          setExpandedRequest(null);
                        }}
                        isMe={
                          currentUserId && g.technician_id === currentUserId
                        }
                        techStats={techStatsMap[g.technician_id]}
                        viewMode={viewMode}
                      />
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* ===================== PANEL 2: STAT BAR ===================== */}
            <div className="relative py-3 px-4 border-b border-slate-200">
              {/* Toggle */}
              <button
                onClick={() => setCollapseStats((v) => !v)}
                className="absolute right-3 top-3 z-10 p-1 rounded-full bg-white shadow text-slate-600 hover:bg-slate-100"
              >
                {collapseStats ? (
                  <ChevronDown size={16} />
                ) : (
                  <ChevronUp size={16} />
                )}
              </button>

              {/* Khi thu gọn */}
              {collapseStats ? (
                <div
                  className="font-bold text-[13px] text-slate-700 py-1 cursor-pointer"
                  onClick={() => setCollapseStats(false)}
                >
                  Trạng thái theo lịch ngày
                </div>
              ) : (
                /* Khi mở rộng */
                <div className="mt-2 grid grid-cols-2 md:grid-cols-4 gap-2">
                  <StatCard
                    icon={CalendarDays}
                    label="Tổng lịch đảm nhận"
                    value={dayStats.totalSchedules}
                    sub="Trong ngày đã chọn"
                  />

                  <StatCard
                    icon={CheckCircle2}
                    label="Lịch đã bảo trì"
                    value={dayStats.doneSchedules}
                    sub="Đã hoàn tất"
                  />

                  <StatCard
                    icon={Wrench}
                    label="Máy đang bảo trì"
                    value={dayStats.doingMachines}
                    sub="Đang thực hiện"
                  />

                  <StatCard
                    icon={Clock}
                    label="Máy đã bảo trì xong"
                    value={dayStats.doneMachines}
                    sub={`Hoạt động: ${dayStatusSummary.active} · Sẵn: ${dayStatusSummary.ready} · Lỗi: ${dayStatusSummary.failed}`}
                  />
                </div>
              )}
            </div>
          </div>
        </div>

        {/* MAIN AREA */}
        <div className="flex-1 overflow-y-auto">
          {!selectedGroup ? (
            <div className="flex h-full items-center justify-center text-xs text-slate-400">
              Chọn một kỹ thuật viên ở thanh bên trên để xem lịch bảo trì.
            </div>
          ) : (
            <>
              {/* Header nhỏ cho kỹ thuật viên đang chọn */}
              <div className="mb-3 flex flex-col gap-2 border-b border-slate-200 pb-2 md:flex-row md:items-center md:justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-emerald-500 to-cyan-500 text-sm font-semibold text-white shadow-sm">
                    {selectedGroup.technician_name
                      .split(" ")
                      .slice(-2)
                      .map((p) => p[0])
                      .join("")
                      .toUpperCase()}
                  </div>
                  <div className="text-[11px] text-slate-600 leading-tight space-y-0.5">
                    <p>
                      Tổng số lịch trong tuần:
                      <span className="font-semibold text-slate-800">
                        {" "}
                        {selectedGroup.total}
                      </span>
                    </p>
                    <p>
                      Chưa xong:
                      <span className="font-semibold text-red-600">
                        {" "}
                        {selectedGroup.active}
                      </span>
                    </p>
                    <p>
                      Đã xong:
                      <span className="font-semibold text-emerald-700">
                        {" "}
                        {selectedGroup.done}
                      </span>
                    </p>
                  </div>
                </div>

                <div className="flex flex-col items-start gap-1 text-[11px] text-slate-500 md:items-end">
                  <div className="flex items-center gap-2">
                    <MapPin className="h-3.5 w-3.5" />
                    <span>
                      Phụ trách tại{" "}
                      <span className="font-semibold text-slate-700">
                        {selectedGroup.branch_count} chi nhánh
                      </span>
                    </span>
                  </div>
                  <span className="text-[10px] text-emerald-600">
                    {viewMode === "history"
                      ? "Đang xem chế độ Lịch sử"
                      : viewMode === "week"
                      ? "Đang xem Lịch tuần (timeline 00h–24h)"
                      : "Đang xem Lịch tháng"}
                  </span>
                </div>
              </div>

              {/* VIEW SWITCH */}
              {viewMode === "history" && (
                <div className="space-y-4">
                  {dayGroups.map((day) => (
                    <DayGroup
                      key={day.dateLabel}
                      day={day}
                      currentUserId={currentUserId}
                    />
                  ))}
                </div>
              )}

              {viewMode === "week" && (
                <div className="flex flex-col gap-3">
                  {/* Điều khiển tuần */}
                  <div className="mb-1 flex items-center justify-between px-1">
                    <button
                      onClick={() => {
                        setCurrentWeek(addWeeks(currentWeek, -1));
                        setSelectedWeekDate(null);
                        setExpandedRequest(null);
                      }}
                      className="flex h-8 w-8 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-600 shadow-sm transition-all hover:border-emerald-300 hover:bg-emerald-50 hover:text-emerald-600"
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </button>
                    <p className="text-sm font-semibold text-slate-700">
                      Tuần {format(currentWeek, "dd/MM")} –{" "}
                      {format(addDays(currentWeek, 6), "dd/MM")}
                    </p>
                    <button
                      onClick={() => {
                        setCurrentWeek(addWeeks(currentWeek, 1));
                        setSelectedWeekDate(null);
                        setExpandedRequest(null);
                      }}
                      className="flex h-8 w-8 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-600 shadow-sm transition-all hover:border-emerald-300 hover:bg-emerald-50 hover:text-emerald-600"
                    >
                      <ChevronRight className="h-4 w-4" />
                    </button>
                  </div>

                  {/* LAYOUT giống Outlook: left calendar, right detail panel */}
                  <div className="flex gap-3">
                    {/* LEFT: Week timeline */}
                    <div className="flex-1 overflow-x-auto rounded-2xl border border-slate-200 bg-white">
                      <div className="min-w-[820px]">
                        {/* Header days */}
                        <div className="flex border-b border-slate-200 bg-slate-50/80 text-[11px] font-medium text-slate-600">
                          <div className="w-16 border-r border-slate-200" />
                          <div className="flex flex-1">
                            {weekDays.map((d) => {
                              const isSelected =
                                selectedWeekDate &&
                                isSameDay(selectedWeekDate, d.date);
                              return (
                                <button
                                  key={d.key}
                                  onClick={() => setSelectedWeekDate(d.date)}
                                  className={`flex flex-1 flex-col items-center border-r border-slate-200 px-2 py-2 transition ${
                                    isSelected
                                      ? "bg-emerald-50 text-emerald-700"
                                      : "hover:bg-slate-100"
                                  }`}
                                >
                                  <span className="text-[11px] font-semibold">
                                    {d.dayLabel}
                                  </span>
                                  <span className="text-[11px]">
                                    {d.dateLabel}
                                  </span>
                                </button>
                              );
                            })}
                          </div>
                        </div>

                        {/* Body: time column + day columns */}
                        <div className="flex">
                          {/* Time axis */}
                          <div className="w-16 border-r border-slate-200 bg-slate-50 text-[10px] text-slate-400">
                            {hours.map((h) => (
                              <div
                                key={h}
                                className="flex h-10 items-start justify-end border-t border-slate-100 pr-1 pt-0.5"
                              >
                                {h}:00
                              </div>
                            ))}
                          </div>

                          {/* Day columns */}
                          <div className="flex flex-1">
                            {weekDays.map((d) => {
                              const key = d.key;
                              const items = weeklyMap[key] || [];
                              const sorted = [...items].sort(
                                (a, b) =>
                                  new Date(a.start_date) -
                                  new Date(b.start_date)
                              );
                              const isSelected =
                                selectedWeekDate &&
                                isSameDay(selectedWeekDate, d.date);

                              return (
                                <div
                                  key={d.key}
                                  className={`relative flex-1 border-r border-slate-100 ${
                                    isSelected ? "bg-emerald-50/40" : ""
                                  }`}
                                  onClick={() => setSelectedWeekDate(d.date)}
                                >
                                  {/* Grid 24h */}
                                  <div className="absolute inset-0">
                                    {hours.map((h) => (
                                      <div
                                        key={h}
                                        className="absolute left-0 right-0 border-t border-dashed border-slate-100"
                                        style={{
                                          top: `${(h / 24) * 100}%`,
                                        }}
                                      />
                                    ))}
                                  </div>

                                  {/* Container để events */}
                                  <div className="relative h-[960px]">
                                    {sorted.length === 0 && (
                                      <div className="absolute inset-0 flex items-center justify-center text-[10px] text-slate-300">
                                        —
                                      </div>
                                    )}

                                    {sorted.map((item, idx) => {
                                      const { topPercent, heightPercent } =
                                        computeEventPosition(item);
                                      const isReqSelected =
                                        expandedRequest?.id === item.id;

                                      return (
                                        <div
                                          key={idx}
                                          className="absolute left-1 right-1"
                                          style={{
                                            top: `${topPercent}%`,
                                            height: `${heightPercent}%`,
                                          }}
                                        >
                                          <div
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              setSelectedWeekDate(d.date);
                                              setExpandedRequest(item);
                                              setTimeout(() => {
                                                const el =
                                                  document.getElementById(
                                                    `schedule-${item.id}`
                                                  );
                                                if (el) {
                                                  el.scrollIntoView({
                                                    behavior: "smooth",
                                                    block: "start",
                                                  });
                                                }
                                              }, 80);
                                            }}
                                            className={`flex h-full cursor-pointer flex-col justify-center rounded-md px-2 py-1 text-[10px] font-semibold shadow-sm ${
                                              isReqSelected
                                                ? "bg-emerald-600 text-white"
                                                : "bg-emerald-100 text-emerald-700"
                                            }`}
                                            title={
                                              item.maintenance_request_id ||
                                              item.id
                                            }
                                          >
                                            <div className="truncate">
                                              {item.maintenance_request_id ||
                                                item.id}
                                            </div>
                                            <div className="truncate text-[9px] font-normal opacity-80">
                                              {item.equipment_name ||
                                                item.equipment_unit_id ||
                                                "Thiết bị"}
                                            </div>
                                          </div>
                                        </div>
                                      );
                                    })}
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* RIGHT: Panel chi tiết ngày được chọn */}
                    <div className="flex w-[380px] flex-shrink-0 flex-col rounded-2xl border border-slate-200 bg-white p-3">
                      {!selectedWeekDate ? (
                        <p className="text-[12px] text-slate-400 italic">
                          Chọn một ô ngày hoặc một block lịch bên trái để xem
                          chi tiết.
                        </p>
                      ) : (
                        <>
                          <p className="mb-2 text-[12px] font-semibold text-slate-600">
                            Lịch ngày{" "}
                            {format(selectedWeekDate, "EEEE, dd/MM/yyyy", {
                              locale: vi,
                            })}
                          </p>
                          <div className="flex-1 space-y-2 overflow-y-auto pr-1">
                            {selectedWeekItems.length === 0 ? (
                              <p className="text-[11px] text-slate-400 italic">
                                Không có lịch trong ngày này.
                              </p>
                            ) : (
                              selectedWeekItems.map((item) => (
                                <ScheduleItem
                                  key={item.id}
                                  item={item}
                                  isMine={
                                    currentUserId &&
                                    getItemTechnicianId(item) === currentUserId
                                  }
                                  expandedRequest={expandedRequest}
                                />
                              ))
                            )}
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {viewMode === "month" && (
                <div className="flex flex-col gap-4 lg:flex-row max-h-[64vh]">
                  {/* Calendar bên trái */}
                  <div className="w-full lg:w-[60%]">
                    <div className="mb-3 flex items-center justify-between px-1">
                      <button
                        onClick={() =>
                          setCurrentMonth(addMonths(currentMonth, -1))
                        }
                        className="flex h-8 w-8 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-600 shadow-sm transition-all hover:border-emerald-400 hover:bg-emerald-50 hover:text-emerald-600"
                      >
                        <ChevronLeft className="h-4 w-4" />
                      </button>
                      <p className="text-xs font-semibold text-slate-700">
                        Tháng{" "}
                        {format(currentMonth, "MM/yyyy", {
                          locale: vi,
                        })}
                      </p>
                      <button
                        onClick={() =>
                          setCurrentMonth(addMonths(currentMonth, 1))
                        }
                        className="flex h-8 w-8 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-600 shadow-sm transition-all hover:border-emerald-400 hover:bg-emerald-50 hover:text-emerald-600"
                      >
                        <ChevronRight className="h-4 w-4" />
                      </button>
                    </div>

                    <div className="flex max-h-[52vh] flex-col overflow-hidden rounded-xl border border-slate-200 bg-slate-50/70">
                      <div className="grid grid-cols-7 border-b border-slate-200 bg-slate-100/80 text-[11px] font-semibold text-slate-600">
                        {["T2", "T3", "T4", "T5", "T6", "T7", "CN"].map((d) => (
                          <div
                            key={d}
                            className="border-slate-200 py-1.5 text-center"
                          >
                            {d}
                          </div>
                        ))}
                      </div>
                      <div className="flex-1 overflow-y-auto">
                        <div className="grid auto-rows-[90px] grid-cols-7 text-[11px]">
                          {monthDays.map((date) => {
                            const key = format(date, "yyyy-MM-dd");
                            const items = monthMap[key] || [];
                            const inMonth = isSameMonth(date, currentMonth);
                            const isSelected = isSameDay(date, selectedDate);

                            return (
                              <button
                                key={key}
                                onClick={() => setSelectedDate(date)}
                                className={`flex flex-col items-stretch border border-slate-200/70 px-1.5 pb-1.5 pt-1.5 text-left transition-all ${
                                  isSelected
                                    ? "bg-emerald-50/90 ring-1 ring-emerald-400"
                                    : "bg-white hover:bg-slate-100/90"
                                }`}
                              >
                                <div className="mb-1 flex items-center justify-between">
                                  <span
                                    className={`text-[11px] font-semibold ${
                                      inMonth
                                        ? "text-slate-700"
                                        : "text-slate-400"
                                    }`}
                                  >
                                    {format(date, "d", { locale: vi })}
                                  </span>
                                  {items.length > 0 && (
                                    <span className="ml-1 rounded-full bg-emerald-100 px-1.5 py-0.5 text-[10px] font-semibold text-emerald-700">
                                      {items.length}
                                    </span>
                                  )}
                                </div>
                                <div className="space-y-0.5 overflow-hidden">
                                  {items.slice(0, 2).map((item) => (
                                    <div
                                      key={item.id}
                                      className="flex items-center gap-1 truncate text-[10px] text-slate-600"
                                    >
                                      <span className="h-1 w-1 rounded-full bg-emerald-500" />
                                      <span className="truncate">
                                        {item.equipment_name ||
                                          item.equipment_unit_id}
                                      </span>
                                    </div>
                                  ))}
                                  {items.length > 2 && (
                                    <div className="text-[10px] text-slate-400">
                                      +{items.length - 2} lịch nữa
                                    </div>
                                  )}
                                </div>
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Danh sách chi tiết ngày được chọn */}
                  <div className="flex w-full flex-col overflow-y-auto lg:w-[40%]">
                    <p className="mb-2 text-[11px] font-semibold text-slate-600">
                      Lịch ngày{" "}
                      {format(selectedDate, "EEEE, dd/MM/yyyy", {
                        locale: vi,
                      })}
                    </p>
                    <div className="space-y-2 pr-1">
                      {selectedDateItems.length === 0 && (
                        <p className="text-[11px] text-slate-400 italic">
                          Không có lịch trong ngày này.
                        </p>
                      )}
                      {selectedDateItems.map((item) => (
                        <ScheduleItem
                          key={item.id}
                          item={item}
                          isMine={
                            currentUserId &&
                            getItemTechnicianId(item) === currentUserId
                          }
                        />
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

// =====================================================
//        COMPONENT PHỤ: 1 ngày + list lịch (history)
// =====================================================
function DayGroup({ day, currentUserId }) {
  const [open, setOpen] = useState(true);

  return (
    <div className="relative">
      <div className="pointer-events-none absolute left-[10px] top-5 bottom-0 w-px bg-gradient-to-b from-emerald-400 via-cyan-400 to-slate-200" />

      <button
        onClick={() => setOpen((v) => !v)}
        className="group mb-2 flex w-full items-center gap-3"
      >
        <div className="relative z-10 flex h-6 w-6 items-center justify-center rounded-full bg-emerald-500 text-[11px] text-white shadow-md">
          <Clock className="h-3.5 w-3.5" />
        </div>
        <div className="flex flex-1 items-center justify-between rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 dark:border-slate-700 dark:bg-slate-900">
          <span className="text-xs font-semibold text-slate-700 dark:text-slate-100">
            {day.dateLabel}
          </span>
          <div className="flex items-center gap-2 text-[11px] text-slate-500">
            <span>{day.items.length} lịch</span>
            {open ? (
              <ChevronUp className="h-3.5 w-3.5" />
            ) : (
              <ChevronDown className="h-3.5 w-3.5" />
            )}
          </div>
        </div>
      </button>

      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.18 }}
            className="ml-8 space-y-2"
          >
            {day.items.map((item) => (
              <ScheduleItem
                key={item.id}
                item={item}
                isMine={
                  currentUserId && getItemTechnicianId(item) === currentUserId
                }
              />
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// =====================================================
//        COMPONENT PHỤ: CARD LỊCH (giữ nguyên logic)
// =====================================================
function ScheduleItem({ item, isMine = false, expandedRequest }) {
  const [open, setOpen] = React.useState(false);

  const units = item.units || item.equipment_units || [];

  // 🟢 FIX LỖI QUAN TRỌNG: Tạo statusCount
  const statusCount = units.reduce(
    (acc, u) => {
      const s = (u.status || u.state || "").toLowerCase().trim();

      acc.total++;

      if (s === "active") acc.active++;
      else if (s === "ready") acc.ready++;
      else if (s === "failed") acc.failed++;
      else if (
        ["in progress", "in_progress", "processing", "doing"].includes(s)
      )
        acc.inprogress++;
      else acc.other++;

      return acc;
    },
    { total: 0, active: 0, ready: 0, failed: 0, inprogress: 0, other: 0 }
  );

  const u0 = units[0] || {};
  const imgSrc =
    item.image ||
    u0.image ||
    u0.equipment_image ||
    u0.equipment?.image ||
    u0.equipment_line?.image ||
    "/no-image.png";

  const raw = (item.status || item.request_status || "").toLowerCase();
  const isConfirmed =
    raw === "confirmed" || raw === "confirm" || item.is_confirmed === true;

  const allUnitsActive = units.every((u) =>
    ["active", "ready"].includes(
      (u.status || u.state || "").toString().toLowerCase()
    )
  );

  const isDone =
    raw === "done" ||
    raw === "completed" ||
    raw === "finished" ||
    item.is_done === true ||
    allUnitsActive;

  const statusLabel = isDone
    ? "✔ Đã hoàn tất"
    : isConfirmed
    ? "Đã đảm nhận"
    : "Đang bảo trì";

  const statusClass = isDone
    ? "bg-emerald-200 text-emerald-700 border border-emerald-400"
    : "bg-purple-100 text-purple-700 border border-purple-300";

  return (
    <motion.div
      id={`schedule-${item.id}`}
      whileHover={{ scale: 1.02 }}
      className={`relative rounded-xl border bg-white p-3 shadow-sm transition hover:bg-emerald-50/60 hover:shadow-md ${
        expandedRequest?.id === item.id
          ? "border-emerald-600 ring-2 ring-emerald-500"
          : "border-emerald-300"
      }`}
    >
      <div className="flex flex-col gap-2">
        <div className="text-sm font-semibold text-emerald-700">
          {item.maintenance_request_id || item.id}
        </div>

        <div className="flex items-center justify-between">
          <div className="text-xs text-slate-600">
            ({units.length || 1} thiết bị)
          </div>

          <span className={`rounded-md px-2 py-0.5 text-[11px] ${statusClass}`}>
            {statusLabel}
          </span>
        </div>

        <div className="mt-1 flex items-start gap-3">
          <img
            src={imgSrc}
            className="h-12 w-12 rounded-lg border object-cover"
          />

          <div className="flex flex-col gap-1 text-[12px] text-slate-600">
            <div>
              👨‍🔧{" "}
              {item.technician_name ||
                item.confirmed_by_name ||
                item.candidate_tech_name ||
                "—"}
            </div>
            <div>🕒 {item.start_date ? fmtDateTime(item.start_date) : "—"}</div>
            <div>📌 {item.maintenance_reason || "—"}</div>
          </div>
        </div>

        <button
          onClick={() => setOpen((v) => !v)}
          className="mt-2 self-end text-xs text-slate-600 underline transition hover:text-emerald-600"
        >
          {open ? "Ẩn chi tiết thiết bị ▲" : "Chi tiết các thiết bị ▼"}
        </button>

        {open && (
          <div className="mt-3 overflow-hidden rounded-lg border border-emerald-200">
            <table className="w-full border-collapse text-xs">
              <thead className="bg-emerald-100/70 font-semibold text-slate-700">
                <tr>
                  <th className="px-3 py-2 text-left">Mã định danh</th>
                  <th className="px-3 py-2 text-left">Trạng thái</th>
                  <th className="px-3 py-2 text-left">Bảo trì gần nhất</th>
                </tr>
              </thead>
              <tbody>
                {units.map((u, idx) => (
                  <tr
                    key={u.id || idx}
                    className="border-t transition hover:bg-emerald-50"
                  >
                    <td className="px-3 py-2 font-medium">{u.id}</td>
                    <td className="px-3 py-2">{u.status || "—"}</td>
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
  );
}
