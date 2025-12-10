import PageContainer from "@/components/common/PageContainer";
import { Button } from "@/components/ui/buttonn";
import {
  Users,
  Dumbbell,
  Truck,
  BarChart3,
  Trash2,
  AlertTriangle,
  Plus,
  FileBarChart2,
  Activity as ActivityIcon,
  Cpu,
  Gauge,
  UserCheck,
  Flame,
  Bell,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  ChevronUp, // ✅ UPGRADE: dùng hiển thị xu hướng
  LayoutGrid,
  BarChart2,
  Wrench,
  History,
  Sparkles,
  Upload, // ✅ UPGRADE: QuickActions thêm nút upload
} from "lucide-react";
import {
  motion,
  AnimatePresence,
  useMotionValue,
  animate,
} from "framer-motion";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  Legend,
  RadarChart,
  Radar,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  RadialBarChart,
  RadialBar,
  ScatterChart,
  Scatter,
  ZAxis,
  AreaChart, // ✅ UPGRADE: bổ sung import còn thiếu
  Area, // ✅ UPGRADE: bổ sung import còn thiếu
} from "recharts";
import ReactECharts from "echarts-for-react";
import "echarts-liquidfill";
import Particles from "react-tsparticles";
import { loadFull } from "tsparticles";
import { Toaster, toast } from "sonner";
import { useDashboardData } from "@/hooks/useDashboardData";
import Status from "@/components/common/Status";
import EquipmentImportPage from "@/pages/equipment/EquipmentImportPage";

import { CalendarDays } from "lucide-react";

import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogFooter,
  AlertDialogCancel,
} from "@/components/ui/alert-dialog";
import useAuthRole from "@/hooks/useAuthRole";
import BranchService from "@/services/branchService";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import MaintainService from "@/services/MaintainService";

/* ============================== Fake Data + Generators ============================== */
const COLORS = ["#10b981", "#ef4444", "#f59e0b"];

function genPieStatus(range = "month") {
  const base =
    range === "year"
      ? [65, 22, 13]
      : range === "quarter"
      ? [62, 24, 14]
      : [60, 25, 15];
  return [
    { name: "Hoạt động", value: base[0] },
    { name: "Ngừng tạm thời", value: base[1] },
    { name: "Đang bảo trì", value: base[2] },
  ];
}

function genScatterDevices(range = "month") {
  const n = range === "year" ? 24 : range === "quarter" ? 12 : 8;
  return Array.from({ length: n }).map((_, i) => ({
    x: +(5 + i * (range === "year" ? 1.2 : 1.6)).toFixed(1),
    y: 10 + ((i * (range === "year" ? 2 : 3)) % 40),
    z: 10 + ((i * 7) % 60),
    name: `TB-${i + 1}`,
  }));
}
function genHeatmap() {
  const weeks = 7,
    days = 7;
  return Array.from({ length: weeks }, () =>
    Array.from({ length: days }, () => Math.floor(Math.random() * 6))
  );
}
function genActivities() {
  return [
    {
      id: 1,
      time: "10:21",
      icon: <Dumbbell className="w-4 h-4" />,
      text: "Thêm thiết bị: Treadmill X9",
    },
    {
      id: 2,
      time: "09:58",
      icon: <Users className="w-4 h-4" />,
      text: "Nhân viên A cập nhật hồ sơ",
    },
    {
      id: 3,
      time: "09:42",
      icon: <AlertTriangle className="w-4 h-4" />,
      text: "Rowing #231 báo Ngừng tạm thời",
    },
    {
      id: 4,
      time: "08:10",
      icon: <Truck className="w-4 h-4" />,
      text: "Technogym gửi báo giá linh kiện",
    },
  ];
}
function genRanking() {
  const rows = [
    { name: "Treadmill Pro X9", count: 14 },
    { name: "Bike Studio S3", count: 10 },
    { name: "Rowing Air R2", count: 8 },
    { name: "Elliptical E5", count: 7 },
    { name: "Multi Gym M7", count: 5 },
  ];
  const max = rows.reduce((m, r) => Math.max(m, r.count), 0);
  return rows.map((r, i) => ({
    ...r,
    pct: Math.round((r.count / max) * 100),
    rank: i + 1,
  }));
}

/* ============================== UI helpers ============================== */
const greeting = () => {
  const h = new Date().getHours();
  if (h < 11) return "Chào buổi sáng";
  if (h < 17) return "Chào buổi chiều";
  return "Chào buổi tối";
};
function jitter(v, amt) {
  return v + (Math.random() - 0.5) * 2 * amt;
}
function clamp(v, min, max) {
  return Math.max(min, Math.min(max, Math.round(v)));
}
function heatColor(val) {
  const palette = [
    "#e5f9f1",
    "#bff3e1",
    "#8ee9ce",
    "#5bd8b8",
    "#2fc39f",
    "#10b981",
  ];
  return palette[Math.max(0, Math.min(5, val))];
}
function useAnimatedNumber(value, duration = 0.8) {
  const mv = useMotionValue(0);
  const [display, setDisplay] = useState(0);
  useEffect(() => {
    const controls = animate(mv, value, { duration, ease: "easeOut" });
    const unsub = mv.on("change", (v) => setDisplay(Math.floor(v)));
    return () => {
      controls.stop();
      unsub();
    };
  }, [value]);
  return display;
}

/* ============================== ECharts options ============================== */
function useLavaOption(percent) {
  const color =
    percent > 0.8 ? "#10b981" : percent > 0.5 ? "#facc15" : "#ef4444";
  return useMemo(
    () => ({
      series: [
        {
          type: "liquidFill",
          data: [percent, percent * 0.92, percent * 0.84],
          radius: "80%",
          color: [color],
          backgroundStyle: { color: "transparent" },
          outline: {
            borderDistance: 0,
            itemStyle: { borderWidth: 2, borderColor: color },
          },
          label: {
            fontSize: 18,
            color: "#000000ff",
            formatter: () => `Hoạt động\n${Math.round(percent * 100)}%`,
          },
        },
      ],
    }),
    [percent]
  );
}

/* ============================== Main Component ============================== */
export default function DashboardPage() {
  // 🧠 Lấy tên hiển thị từ localStorage.fitx_auth
  let userName = "Admin";
  try {
    const auth = JSON.parse(localStorage.getItem("fitx_auth"));
    // Ưu tiên lấy từ userAttributes
    if (auth?.userAttributes?.name) {
      userName = auth.userAttributes.name;
    } else if (auth?.user?.userAttributes?.name) {
      // fallback nếu backend lưu nested hơn
      userName = auth.user.userAttributes.name;
    } else if (auth?.username) {
      userName = auth.username;
    }
  } catch (e) {
    console.warn("Không thể parse fitx_auth:", e);
  }

  const [range, setRange] = useState("month"); // month | quarter | year
  const [tab, setTab] = useState("overview"); // overview | charts | maintenance | activity
  const { isTechnician, isOperator } = useAuthRole();

  const STATUS_MAP_VN = {
    Active: "Hoạt động",
    Inactive: "Ngưng sử dụng",
    "Temporary Urgent": "Ngừng tạm thời",
    "In Progress": "Đang bảo trì",
    "In Stock": "Thiết bị trong kho",
    Moving: "Đang vận chuyển",
    Ready: "Bảo trì thành công",
    Failed: "Bảo trì thất bại",
  };

  // 🎨 Bảng màu giống Status.jsx
  const STATUS_COLOR_HEX = {
    "Hoạt động": "#10b981",
    "Ngưng sử dụng": "#9ca3af",
    "Ngừng tạm thời": "#fbbf24",
    "Thiết bị trong kho": "#3b82f6",
    "Đang vận chuyển": "#6366f1",
    "Đang bảo trì": "#f59e0b",
    "Bảo trì thành công": "#22c55e",
    "Bảo trì thất bại": "#ef4444",
  };

  // 🧮 Format tiền Việt kiểu đọc: "1 tỷ 250 triệu đồng"
  const formatVND = (value) => {
    if (value >= 1_000_000_000) {
      const billions = Math.floor(value / 1_000_000_000);
      const millions = Math.floor((value % 1_000_000_000) / 1_000_000);

      // Nếu không có phần triệu → chỉ hiển thị "1 tỷ đồng"
      if (millions === 0) return `${billions} tỷ`;

      return `${billions} tỷ ${millions}tr`;
    } else if (value >= 1_000_000) {
      const millions = Math.floor(value / 1_000_000);
      return `${millions}tr`;
    } else {
      return `${value.toLocaleString("vi-VN")}đ`;
    }
  };

  // 🗓️ Xác định thời gian hiện hành
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth() + 1; // 1-12
  const currentQuarter = Math.floor((currentMonth - 1) / 3) + 1;

  const [openImport, setOpenImport] = useState(false);
  // 🏢 Super Admin: hiển thị filter theo chi nhánh
  const { isSuperAdmin } = useAuthRole();
  const [branches, setBranches] = useState([]);
  const [activeBranch, setActiveBranch] = useState("all");

  // 📦 Lấy danh sách chi nhánh từ API
  useEffect(() => {
    if (!isSuperAdmin) return;
    (async () => {
      try {
        const res = await BranchService.getAll();
        setBranches(res || []);
      } catch {
        toast.error("Không thể tải danh sách chi nhánh!");
      }
    })();
  }, [isSuperAdmin]);

  // 📊 Map type đúng cho từng API
  const trendType =
    range === "month" ? "week" : range === "year" ? "month" : "quarter";
  const statType =
    range === "month" ? "month" : range === "year" ? "year" : "quarter";

  // ⬅️ Call 1: statistics + hierarchy (lấy tổng cho các card Tổng quan)
  const statResp = useDashboardData({
    type: statType,
    year: currentYear,
    month: range === "month" ? currentMonth : undefined,
    quarter: range === "quarter" ? currentQuarter : undefined,
    branch_id: activeBranch !== "all" ? activeBranch : undefined,
  });
  const { statistics, hierarchy, statLoading, hierarchyLoading } = statResp;

  // ⬅️ Call 2: trend (giữ cho biểu đồ tuần/tháng/quý)
  const trendResp = useDashboardData({
    type: trendType,
    year: currentYear,
    month: range === "month" ? currentMonth : undefined,
    quarter: range === "quarter" ? currentQuarter : undefined,
    branch_id: activeBranch !== "all" ? activeBranch : undefined,
  });
  const { trend, trendLoading } = trendResp;

  // 📦 Tổng chi phí (lấy từ thống kê chính)
  const summary = statistics?.summary || {};

  const totalImportCost = summary.importCost || 0;
  const totalMaintenanceCost = summary.maintenanceCost || 0;
  const totalDisposalCost = summary.disposalCost || 0;

  // Lấy dữ liệu 5 kỳ gần nhất (VD: tháng 6 → tháng 10)
  // Bar Chart động theo loại kỳ
  // - range === "month" → 4 tuần gần nhất
  // - range === "year" → 5 tháng gần nhất
  // - range khác (quarter) → giữ nguyên toàn bộ trend
  // 📊 Dữ liệu Bar Chart: Tổng thiết bị & Còn bảo hành
  const barData = useMemo(() => {
    if (!Array.isArray(trend)) return [];

    const sliced =
      trendType === "week"
        ? trend.slice(-4)
        : trendType === "month"
        ? trend.slice(-5)
        : trend; // quý

    return sliced.map((item) => ({
      name: item.label || "",
      tổng_thiết_bị: item.totalEquipments || 0,
      còn_bảo_hành: item.warrantyValid || 0,
    }));
  }, [trend, trendType]);

  // 📈 Dữ liệu Line Chart: Chi phí nhập thiết bị
  const lineData = useMemo(() => {
    if (!Array.isArray(trend)) return [];

    const sliced =
      trendType === "week"
        ? trend.slice(-4)
        : trendType === "month"
        ? trend.slice(-5)
        : trend;

    return sliced.map((item) => ({
      name: item.label || "",
      chi_phi_nhap: (item.importCost || 0) / 1_000_000, // 👈 tính theo triệu đồng
    }));
  }, [trend, trendType]);

  // 📈 Dữ liệu 3 loại chi phí (triệu đồng)
  // 📈 Gom logic chung cho 3 loại chi phí
  const sliceTrend = useMemo(() => {
    if (!Array.isArray(trend)) return [];

    if (trendType === "week") {
      // Nếu là tuần → lấy 4 tuần gần nhất
      return trend.slice(-4);
    } else if (trendType === "month") {
      // Nếu là tháng → lấy 5 tháng gần nhất
      return trend.slice(-5);
    } else {
      // Quý → giữ nguyên 4 quý
      return trend;
    }
  }, [trend, trendType]);

  // 💸 Chi phí nhập thiết bị
  const lineImport = sliceTrend.map((t) => ({
    name: t.label || "",
    chi_phi_nhap: (t.importCost || 0) / 1_000_000,
  }));

  // 🧰 Chi phí bảo trì
  const lineMaintain = sliceTrend.map((t) => ({
    name: t.label || "",
    chi_phi_bao_tri: (t.maintenanceCost || 0) / 1_000_000,
  }));

  // 🗑️ Chi phí thanh lý
  const lineDisposal = sliceTrend.map((t) => ({
    name: t.label || "",
    chi_phi_thanh_ly: (t.disposalCost || 0) / 1_000_000,
  }));

  // 🔢 Tính chênh lệch thiết bị so với kỳ trước (month / quarter / year)
  let diffDevices = 0;

  if (Array.isArray(trend) && trend.length > 1) {
    // Lấy kỳ hiện tại (cuối mảng) và kỳ trước (liền trước)
    const last = trend[trend.length - 1];
    const prev = trend[trend.length - 2];

    const currTotal = last?.totalEquipments || 0;
    const prevTotal = prev?.totalEquipments || 0;
    diffDevices = currTotal - prevTotal;
  }

  // 👥 Tính chênh lệch nhân viên & nhà cung cấp
  let diffStaff = 0;
  let diffVendors = 0;

  if (Array.isArray(trend) && trend.length > 1) {
    const last = trend[trend.length - 1];
    const prev = trend[trend.length - 2];
    diffStaff = (last?.totalStaff || 0) - (prev?.totalStaff || 0);
    diffVendors = (last?.totalVendors || 0) - (prev?.totalVendors || 0);
  }

  // 🔢 Sparkline thực tế (giới hạn 4 kỳ gần nhất)
  const sparkDevices = Array.isArray(trend)
    ? trend.slice(-4).map((t) => t.totalEquipments || 0)
    : [];

  const sparkStaff = Array.isArray(trend)
    ? trend.slice(-4).map((t) => t.totalStaff || 0)
    : [];

  const sparkVendors = Array.isArray(trend)
    ? trend.slice(-4).map((t) => t.totalVendors || 0)
    : [];

  // 💸 Sparkline cho các chi phí
  const sparkImport = Array.isArray(trend)
    ? trend.slice(-4).map((t) => +(t.importCost / 1_000_000).toFixed(1))
    : [];

  const sparkMaintenance = Array.isArray(trend)
    ? trend.slice(-4).map((t) => +(t.maintenanceCost / 1_000_000).toFixed(1))
    : [];

  const sparkDisposal = Array.isArray(trend)
    ? trend.slice(-4).map((t) => +(t.disposalCost / 1_000_000).toFixed(1))
    : [];

  // 📊 Dữ liệu cho biểu đồ Radar: tổng unit_count theo nhóm
  const radarData = useMemo(() => {
    if (!Array.isArray(hierarchy)) return [];

    return hierarchy.map((group) => {
      const totalUnits =
        group.types?.reduce((sum, t) => {
          const eqSum =
            t.equipments?.reduce((s, e) => s + (e.unit_count || 0), 0) || 0;
          return sum + eqSum;
        }, 0) || 0;

      return {
        group: group.main_name || group.main_id, // hiển thị tên nhóm
        unit_count: totalUnits,
      };
    });
  }, [hierarchy]);

  // 📊 Dữ liệu Stacked Area Chart: Chi phí theo mảng
  const stackedCost = useMemo(() => {
    if (!Array.isArray(trend)) return [];

    const sliced =
      trendType === "week"
        ? trend.slice(-4)
        : trendType === "month"
        ? trend.slice(-5)
        : trend;

    return sliced.map((item) => ({
      name: item.label || "",
      import: (item.importCost || 0) / 1_000_000, // triệu đồng
      maintenance: (item.maintenanceCost || 0) / 1_000_000,
      disposal: (item.disposalCost || 0) / 1_000_000,
    }));
  }, [trend, trendType]);

  // 📊 Dữ liệu Bubble Chart: Chi phí vs Số lượng nhập
  const bubbleData = useMemo(() => {
    if (!Array.isArray(trend)) return [];

    const sliced =
      trendType === "week"
        ? trend.slice(-4)
        : trendType === "month"
        ? trend.slice(-5)
        : trend;

    return sliced.map((item) => ({
      name: item.label,
      x: (item.importCost || 0) / 1_000_000, // triệu đồng
      y: item.newEquipmentUnits || 0, // số nhập mới
      z: item.totalEquipments || 0, // tổng thiết bị
    }));
  }, [trend, trendType]);

  const readyCount = statistics?.summary?.equipmentStatusCount?.Ready || 0;
  const totalEquipments = statistics?.summary?.totalEquipments || 1; // tránh chia 0
  const readyRate = Math.round((readyCount / totalEquipments) * 100);

  const [collapse, setCollapse] = useState({
    charts: false,
    maintenance: false,
    activity: false,
  });

  // data blocks
  const donut = useMemo(() => genPieStatus(range), [range]);
  const bubble = useMemo(() => genScatterDevices(range), [range]);
  const activities = useMemo(() => genActivities(), []);
  const ranking = useMemo(() => genRanking(), []);
  const heatmap = useMemo(() => genHeatmap(), [range]);
  const totalPie = useMemo(
    () => donut.reduce((s, x) => s + x.value, 0),
    [donut]
  );

  // 🔥 Top thiết bị bảo trì nhiều nhất (từ dữ liệu thật)
  const [maintenanceRanking, setMaintenanceRanking] = useState([]);

  // 🔥 Top thiết bị bảo trì nhiều nhất — theo kỳ & chi nhánh hiện hành
  useEffect(() => {
    (async () => {
      try {
        const res = await MaintainService.getAll();
        let data = Array.isArray(res) ? res : [];

        // 🏢 Lọc theo chi nhánh nếu chọn cụ thể
        if (activeBranch !== "all") {
          data = data.filter((d) => d.branch_id === activeBranch);
        }

        // 🗓️ Lọc theo kỳ hiện hành (month / quarter / year)
        const now = new Date();
        const currentYear = now.getFullYear();
        const currentMonth = now.getMonth() + 1;
        const currentQuarter = Math.floor((currentMonth - 1) / 3) + 1;

        data = data.filter((item) => {
          if (!item.start_date) return false;
          const date = new Date(item.start_date);
          const year = date.getFullYear();
          const month = date.getMonth() + 1;
          const quarter = Math.floor((month - 1) / 3) + 1;

          if (range === "month")
            return year === currentYear && month === currentMonth;
          if (range === "quarter")
            return year === currentYear && quarter === currentQuarter;
          if (range === "year") return year === currentYear;
          return true;
        });

        // 🧮 Đếm số lần bảo trì theo equipment_name
        const countMap = {};
        data.forEach((item) => {
          const name = item.equipment_name?.trim();
          if (!name) return;
          countMap[name] = (countMap[name] || 0) + 1;
        });

        // 🔢 Sắp xếp & tính phần trăm
        const sorted = Object.entries(countMap)
          .map(([name, count]) => ({ name, count }))
          .sort((a, b) => b.count - a.count);

        const max = sorted[0]?.count || 1;
        const ranked = sorted.map((r, i) => ({
          ...r,
          rank: i + 1,
          pct: Math.round((r.count / max) * 100),
        }));

        setMaintenanceRanking(ranked.slice(0, 5));
      } catch (err) {
        console.error("❌ Lỗi khi tải ranking:", err);
      }
    })();
  }, [range, activeBranch]);

  // realtime KPIs
  const [cpu, setCpu] = useState(36);
  const [ram, setRam] = useState(48);
  const [online, setOnline] = useState(132);
  useEffect(() => {
    const i = setInterval(() => {
      setCpu((v) => clamp(jitter(v, 5), 12, 92));
      setRam((v) => clamp(jitter(v, 4), 20, 95));
      setOnline((v) => clamp(jitter(v, 8), 80, 320));
    }, 5000);
    return () => clearInterval(i);
  }, []);
  const onlineDisplay = useAnimatedNumber(online);

  // gauge %
  // 🧮 Tính tỉ lệ thiết bị Active / tổng
  const activeCount = statistics?.summary?.equipmentStatusCount?.Active || 0;
  const gauge = Math.min(1, activeCount / totalEquipments);

  // Tạo biểu đồ Lava
  const lavaOption = useLavaOption(gauge);

  // particles
  const particlesInit = async (engine) => {
    await loadFull(engine);
  };
  // ✅ UPGRADE: màu particle theo tab
  const particleColors =
    tab === "overview"
      ? ["#10b981", "#06b6d4", "#6366f1"]
      : tab === "charts"
      ? ["#06b6d4", "#22c55e", "#f59e0b"]
      : tab === "maintenance"
      ? ["#f59e0b", "#ef4444", "#fb7185"]
      : ["#22c55e", "#8b5cf6", "#38bdf8"];

  // 🔥 Lấy số thiết bị ngừng tạm thời thật từ DB
  const urgentCount =
    statistics?.summary?.equipmentStatusCount?.["Temporary Urgent"] || 0;

  // ⚠️ Nếu có >0 thì mới hiện cảnh báo
  useEffect(() => {
    if (!isOperator && urgentCount > 0) {
      toast.warning(`⚠️ Có ${urgentCount} thiết bị đang Ngừng tạm thời!`);
    }
  }, [urgentCount]);

  // totals
  const totals = {
    devices: statistics?.summary?.totalEquipments || 0,
    staff: statistics?.summary?.totalStaff || 0,
    vendors: statistics?.summary?.totalVendors || 0,
    revenue: `${Math.round(
      (statistics?.summary?.importCost || 0) / 1_000_000
    )}M ₫`,
  };

  // notifications dropdown
  const [openNotif, setOpenNotif] = useState(false);
  const notifRef = useRef(null);
  useEffect(() => {
    const onDoc = (e) => {
      if (notifRef.current && !notifRef.current.contains(e.target))
        setOpenNotif(false);
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);

  // confetti
  const fireConfetti = useCallback(async () => {
    try {
      const confetti = (await import("canvas-confetti")).default;
      confetti({
        particleCount: 140,
        spread: 70,
        origin: { y: 0.6 },
        colors: ["#10b981", "#06b6d4", "#f59e0b"], // ✅ UPGRADE: theo brand
      });
    } catch (e) {
      toast.info("Cài thêm: npm i canvas-confetti để bật pháo giấy nhé!");
    }
  }, []);

  // ✅ UPGRADE: trạng thái active slice của Pie để hover nảy
  const [activePie, setActivePie] = useState(0);
  const renderActiveShape = (props) => {
    const {
      cx,
      cy,
      innerRadius,
      outerRadius,
      startAngle,
      endAngle,
      payload,
      value,
    } = props;
    return (
      <g>
        {/* <text
          x={cx}
          y={cy - 4}
          textAnchor="middle"
          fill="#111827"
          className="dark:fill-white"
          style={{ fontWeight: 700 }}
        >
          {payload.name}
        </text> */}
        {/* <text
          x={cx}
          y={cy + 14}
          textAnchor="middle"
          className="fill-gray-500 dark:fill-gray-400"
          style={{ fontSize: 12 }}
        >
          {value}
        </text> */}
        <Sector // hiệu ứng scale nhẹ
          cx={cx}
          cy={cy}
          innerRadius={innerRadius}
          outerRadius={outerRadius + 6}
          startAngle={startAngle}
          endAngle={endAngle}
          fill={props.fill}
        />
      </g>
    );
  };

  return (
    <PageContainer title={`${greeting()}, ${userName} 👋`} username={userName}>
      {/* Particles background */}
      <Particles
        id="tsparticles"
        init={particlesInit}
        options={{
          background: { color: "transparent" },
          particles: {
            number: { value: 34 },
            color: { value: particleColors }, // ✅ UPGRADE
            links: { enable: true, color: "#cbd5e1" },
            move: { enable: true, speed: 1 },
            opacity: { value: 0.28 },
            size: { value: { min: 1, max: 3 } },
          },
        }}
        className="absolute inset-0 -z-10"
      />
      <Toaster position="top-right" richColors expand />

      {/* HERO + FILTER + NOTIF */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="relative overflow-hidden rounded-2xl p-6 mb-6 border border-white/10 dark:border-white/5"
        style={{
          background:
            "linear-gradient(120deg, rgba(16,185,129,0.12), rgba(59,130,246,0.12), rgba(99,102,241,0.12))",
        }}
      >
        {/* ✅ UPGRADE: viền gradient mờ */}
        <div
          className="pointer-events-none absolute inset-0 rounded-2xl"
          style={{
            border: "1px solid transparent",
            backgroundImage:
              "linear-gradient(#ffffff10, #ffffff10), radial-gradient(circle at top left, #22c55e55, #06b6d455, #8b5cf655)",
            backgroundOrigin: "border-box",
            backgroundClip: "content-box, border-box",
            opacity: 0.8,
          }}
        />

        <div className="flex flex-wrap items-center justify-between gap-4 relative">
          <div className="min-w-[240px]">
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-gray-900 dark:text-white">
              Tổng quan{" "}
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-emerald-500 to-cyan-400">
                FitX Gym
              </span>
            </h1>
            <p className="text-gray-600 dark:text-gray-300 mt-1">
              Chọn chi nhánh bên dưới để tập trung nội dung.
            </p>
          </div>

          {/* Tab pills */}
          <div className="flex items-center flex-wrap gap-2">
            <TabPill
              icon={<LayoutGrid className="w-4 h-4" />}
              active={tab === "overview"}
              onClick={() => setTab("overview")}
            >
              Tổng quan
            </TabPill>

            {/* 🚫 Ẩn tab Biểu đồ và Bảo trì với technician + operator */}
            {!isTechnician && !isOperator && (
              <>
                <TabPill
                  icon={<BarChart2 className="w-4 h-4" />}
                  active={tab === "charts"}
                  onClick={() => setTab("charts")}
                >
                  Biểu đồ
                </TabPill>

                <TabPill
                  icon={<Wrench className="w-4 h-4" />}
                  active={tab === "maintenance"}
                  onClick={() => setTab("maintenance")}
                >
                  Bảo trì
                </TabPill>
              </>
            )}
          </div>

          {/* Actions + Notifications */}
          <div className="flex items-center gap-3 flex-wrap">
            {/* 🗓 Ngày hiện tại */}
            <div
              className="
          flex items-center gap-2 px-3 py-1.5 rounded-lg
          bg-gradient-to-r from-emerald-500/10 via-cyan-500/10 to-indigo-500/10
          border border-emerald-400/40 dark:border-emerald-500/30
          shadow-sm backdrop-blur-sm
        "
            >
              <CalendarDays className="w-4 h-4 text-emerald-500 dark:text-emerald-400" />
              <span className="text-sm font-medium text-gray-800 dark:text-gray-100">
                {new Date().toLocaleDateString("vi-VN", {
                  weekday: "long",
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
              </span>
            </div>

            {/* Bộ lọc thời gian */}
            <div className="flex items-center rounded-xl bg-white/80 dark:bg-white/10 border border-white/30 px-2 py-1 backdrop-blur">
              <button
                onClick={() => setRange("month")}
                className={`px-3 py-1 text-sm rounded-lg ${
                  range === "month"
                    ? "bg-emerald-500 text-white"
                    : "text-gray-700 dark:text-gray-300 hover:bg-white/60 dark:hover:bg-white/5"
                }`}
              >
                Tháng
              </button>
              <button
                onClick={() => setRange("quarter")}
                className={`px-3 py-1 text-sm rounded-lg ${
                  range === "quarter"
                    ? "bg-emerald-500 text-white"
                    : "text-gray-700 dark:text-gray-300 hover:bg-white/60 dark:hover:bg-white/5"
                }`}
              >
                Quý
              </button>
              <button
                onClick={() => setRange("year")}
                className={`px-3 py-1 text-sm rounded-lg ${
                  range === "year"
                    ? "bg-emerald-500 text-white"
                    : "text-gray-700 dark:text-gray-300 hover:bg-white/60 dark:hover:bg-white/5"
                }`}
              >
                Năm
              </button>
            </div>

            {/* 🏢 Lọc theo chi nhánh (chỉ super-admin mới thấy) */}
            {isSuperAdmin && (
              <Select
                onValueChange={(v) => setActiveBranch(v)}
                defaultValue="all"
              >
                <SelectTrigger className="h-9 w-44 text-sm bg-white/70 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 shadow-sm">
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

            {!isTechnician && !isOperator && (
              <Button
                onClick={() => setOpenImport(true)}
                className="flex items-center gap-2 h-9 px-4 bg-gradient-to-r from-emerald-500 to-green-600 text-white font-medium rounded-lg shadow hover:opacity-90 hover:-translate-y-[1px] transition-all"
              >
                📥 Nhập thiết bị
              </Button>
            )}

            {/* <Button className="bg-sky-600 hover:bg-sky-700 text-white flex items-center gap-2">
        <FileBarChart2 size={16} /> Xuất báo cáo
      </Button> */}

            {/* 🧩 Modal import */}
            <AlertDialog open={openImport} onOpenChange={setOpenImport}>
              <AlertDialogContent
                className="
            !max-w-none w-[85vw] max-w-[1200px] h-[90vh]
            overflow-hidden flex flex-col
            bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700
            rounded-2xl shadow-2xl p-0 focus:outline-none
          "
              >
                {/* Header cố định */}
                <AlertDialogHeader className="flex-shrink-0 sticky top-0 z-10 bg-white/90 dark:bg-gray-900/90 backdrop-blur border-b px-6 py-4">
                  <AlertDialogTitle className="text-emerald-600 text-xl font-bold">
                    Nhập thiết bị vào kho
                  </AlertDialogTitle>
                  <p className="text-gray-500 dark:text-gray-400 text-sm">
                    Chọn nhà cung cấp, loại thiết bị và xác nhận nhập hàng
                  </p>
                </AlertDialogHeader>

                {/* Body hiển thị nội dung import */}
                <div className="flex-1 overflow-y-auto px-6 py-4">
                  <EquipmentImportPage />
                </div>

                {/* Footer */}
                <AlertDialogFooter className="flex-shrink-0 sticky bottom-0 z-10 bg-white/90 dark:bg-gray-900/90 backdrop-blur border-t px-6 py-4 flex justify-end gap-3">
                  <AlertDialogCancel className="bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700">
                    Đóng
                  </AlertDialogCancel>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </div>
      </motion.div>

      {/* WARNING BANNER */}
      {!isOperator && urgentCount > 0 && (
        <div className="mb-6 rounded-xl border border-amber-300/30 bg-amber-50/60 dark:bg-amber-500/10 px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <AlertTriangle className="text-amber-500" />
            <p className="text-amber-800 dark:text-amber-200 text-sm">
              Có <b>{urgentCount}</b> thiết bị đang <b>Ngừng tạm thời</b>. Vui
              lòng kiểm tra sớm.
            </p>
          </div>
          <a
            href="/app/maintenance"
            className="text-amber-700 dark:text-amber-300 text-sm underline hover:opacity-80"
          >
            Xem danh sách
          </a>
        </div>
      )}

      {/* CONTENT TABS */}
      <AnimatePresence mode="wait">
        {tab === "overview" && (
          <motion.div
            key="overview"
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 6 }}
            transition={{ duration: 0.25 }}
          >
            {/* Stats row */}
            {!isTechnician && !isOperator && (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 mb-8">
                <GlassStat
                  title="Tổng thiết bị"
                  value={String(totals.devices)}
                  subtitle={`${
                    diffDevices >= 0 ? "+" : ""
                  }${diffDevices} so với ${
                    range === "month"
                      ? "tháng"
                      : range === "quarter"
                      ? "quý"
                      : "năm"
                  } trước`}
                  icon={Dumbbell}
                  color="from-emerald-400/30 to-emerald-600/30"
                  spark={
                    sparkDevices.length > 1 ? sparkDevices : [totals.devices]
                  }
                />
                <GlassStat
                  title="Nhân viên"
                  value={String(totals.staff)}
                  subtitle={`${diffStaff >= 0 ? "+" : ""}${diffStaff} ${
                    range === "month"
                      ? "so với tháng trước"
                      : range === "quarter"
                      ? "so với quý trước"
                      : "so với năm trước"
                  }`}
                  icon={Users}
                  color="from-blue-400/30 to-indigo-600/30"
                  spark={sparkStaff}
                />
                <GlassStat
                  title="Nhà cung cấp"
                  value={String(totals.vendors)}
                  subtitle={
                    diffVendors === 0
                      ? "Ổn định"
                      : `${diffVendors > 0 ? "+" : ""}${diffVendors} ${
                          range === "month"
                            ? "so với tháng trước"
                            : range === "quarter"
                            ? "so với quý trước"
                            : "so với năm trước"
                        }`
                  }
                  icon={Truck}
                  color="from-indigo-400/30 to-purple-600/30"
                  spark={sparkVendors}
                />
                {/* 💸 Chi phí nhập thiết bị */}
                <GlassStat
                  title="Chi phí nhập thiết bị"
                  value={formatVND(totalImportCost)}
                  subtitle="Tổng chi phí nhập hàng trong kỳ"
                  icon={BarChart3}
                  color="from-amber-400/30 to-orange-500/30"
                  spark={sparkImport}
                />

                <GlassStat
                  title="Chi phí bảo trì"
                  value={formatVND(totalMaintenanceCost)}
                  subtitle="Tổng chi phí bảo trì trong kỳ"
                  icon={Wrench}
                  color="from-amber-300/30 to-amber-500/30"
                  spark={sparkMaintenance}
                />

                <GlassStat
                  title="Chi phí thanh lý"
                  value={formatVND(totalDisposalCost)}
                  subtitle="Tổng chi phí thanh lý trong kỳ"
                  icon={Trash2}
                  color="from-rose-400/30 to-rose-600/30"
                  spark={sparkDisposal}
                />
              </div>
            )}

            {/* Top section: Lava + Donut */}
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-8 mb-8">
              <ChartCard
                title="Tỷ lệ thiết bị hoạt động (Lava)"
                collapsible
                collapsed={false}
              >
                <div className="h-[320px] flex items-center justify-center">
                  <ReactECharts
                    option={lavaOption}
                    style={{ height: "100%", width: "100%" }}
                  />
                </div>
              </ChartCard>

              <ChartCard title="Tỷ lệ trạng thái thiết bị (Donut)" collapsible>
                <div className="relative">
                  <div className="max-h-[340px] overflow-y-auto rounded">
                    <ResponsiveContainer width="100%" height={300}>
                      <PieChart>
                        <Pie
                          data={Object.entries(
                            statistics?.summary?.equipmentStatusCount || {}
                          ).map(([key, value]) => ({
                            name: STATUS_MAP_VN[key] || key,
                            value,
                          }))}
                          dataKey="value"
                          nameKey="name"
                          cx="50%"
                          cy="50%"
                          innerRadius={64}
                          outerRadius={110}
                          label
                          activeIndex={activePie}
                          activeShape={renderActiveShape}
                          onMouseEnter={(_, idx) => setActivePie(idx)}
                        >
                          {Object.entries(
                            statistics?.summary?.equipmentStatusCount || {}
                          ).map(([key], i) => {
                            const vn = STATUS_MAP_VN[key] || key;
                            const color =
                              STATUS_COLOR_HEX[vn] || COLORS[i % COLORS.length];
                            return <Cell key={i} fill={color} />;
                          })}
                        </Pie>
                        <Legend />
                        <Tooltip
                          wrapperStyle={{ zIndex: 9999 }}
                          contentStyle={{
                            background: "#ffffffff",
                            borderRadius: 8,
                            color: "#000000ff",
                            border: "none",
                          }}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>

                  {/* Tổng thiết bị hiển thị giữa biểu đồ */}
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-gray-900 dark:text-white">
                        {statistics?.summary?.totalEquipments || 0}
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">
                        tổng thiết bị
                      </div>
                    </div>
                  </div>
                </div>
              </ChartCard>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-1 gap-8">
              <ChartCard
                title="Top thiết bị bảo trì nhiều nhất"
                collapsible
                collapsed={false}
              >
                <div className="max-h-[360px] overflow-y-auto rounded p-100">
                  <ul className="space-y-4">
                    {maintenanceRanking.length > 0 ? (
                      maintenanceRanking.map((d) => (
                        <li key={d.name} className="flex items-center gap-3">
                          <div className="w-7 h-7 rounded-lg bg-gray-100 dark:bg-white/10 flex items-center justify-center text-sm font-semibold">
                            {d.rank}
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center justify-between">
                              <span className="text-sm text-gray-900 dark:text-gray-100">
                                {d.name}
                              </span>
                              <span className="text-xs text-gray-600 dark:text-gray-300">
                                {d.count} lần
                              </span>
                            </div>
                            <div className="h-2 mt-2 rounded bg-gray-200 dark:bg-gray-700 overflow-hidden">
                              <div
                                className="h-full bg-gradient-to-r from-amber-400 to-red-500"
                                style={{ width: `${d.pct}%` }}
                              />
                            </div>
                          </div>
                          {d.rank === 1 && (
                            <span className="ml-2 inline-flex items-center gap-1 text-xs text-red-500">
                              <Flame size={14} />
                              hot
                            </span>
                          )}
                        </li>
                      ))
                    ) : (
                      <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-8">
                        Không có dữ liệu bảo trì.
                      </p>
                    )}
                  </ul>
                </div>
              </ChartCard>
            </div>

            {/* Quick Actions floating */}
            {/* <QuickActions onCelebrate={fireConfetti} /> */}
          </motion.div>
        )}

        {tab === "charts" && (
          <motion.div
            key="charts"
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 6 }}
            transition={{ duration: 0.25 }}
          >
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-8 mb-8">
              <ChartCard
                title="Tổng thiết bị & Thiết bị còn bảo hành (Bar)"
                collapsible
                collapsed={false}
              >
                <div className="max-h-[360px] overflow-y-auto rounded">
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={barData} barSize={26}>
                      <CartesianGrid
                        strokeDasharray="3 3"
                        className="stroke-gray-300 dark:stroke-gray-600"
                      />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <Tooltip
                        contentStyle={{
                          background: "#111827",
                          borderRadius: 8,
                          color: "#fff",
                          border: "none",
                        }}
                      />
                      <Bar
                        dataKey="tổng_thiết_bị"
                        fill="#10b981"
                        radius={[8, 8, 0, 0]}
                      />
                      <Bar
                        dataKey="còn_bảo_hành"
                        fill="#3b82f6"
                        radius={[8, 8, 0, 0]}
                      />
                      <Legend />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </ChartCard>

              <ChartCard title="Chi phí nhập thiết bị (Line)" collapsible>
                <div className="max-h-[360px] overflow-y-auto rounded">
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={lineData}>
                      <CartesianGrid
                        strokeDasharray="3 3"
                        className="stroke-gray-300 dark:stroke-gray-600"
                      />
                      <XAxis
                        dataKey="name"
                        tickMargin={10} // 👈 thêm khoảng cách cho label X
                      />
                      <YAxis
                        tickFormatter={(v) => `${v}M`} // 👈 đơn vị "triệu"
                        width={80} // 👈 chừa khoảng hiển thị số
                      />
                      <Tooltip
                        formatter={(v) =>
                          `${v.toLocaleString("vi-VN")} triệu đồng`
                        }
                        contentStyle={{
                          background: "#111827",
                          borderRadius: 8,
                          color: "#fff",
                          border: "none",
                        }}
                      />
                      <Line
                        type="monotone"
                        dataKey="chi_phi_nhap"
                        name="Chi phí nhập (triệu đồng)"
                        stroke="#f59e0b"
                        strokeWidth={3}
                        dot={{ r: 5 }}
                        activeDot={{ r: 8 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </ChartCard>
            </div>

            {/* === BIỂU ĐỒ CHI PHÍ === */}
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-8 mb-8">
              {/* 🧰 Chi phí bảo trì */}
              <ChartCard title="Chi phí bảo trì (Line)" collapsible>
                <div className="max-h-[360px] overflow-y-auto rounded">
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={lineMaintain}>
                      <CartesianGrid
                        strokeDasharray="3 3"
                        className="stroke-gray-300 dark:stroke-gray-600"
                      />
                      <XAxis dataKey="name" tickMargin={10} />
                      <YAxis tickFormatter={(v) => `${v}M`} width={80} />
                      <Tooltip
                        formatter={(v) =>
                          `${v.toLocaleString("vi-VN")} triệu đồng`
                        }
                        contentStyle={{
                          background: "#111827",
                          borderRadius: 8,
                          color: "#fff",
                          border: "none",
                        }}
                      />
                      <Line
                        type="monotone"
                        dataKey="chi_phi_bao_tri"
                        name="Chi phí bảo trì (triệu đồng)"
                        stroke="#3b82f6"
                        strokeWidth={3}
                        dot={{ r: 5 }}
                        activeDot={{ r: 8 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </ChartCard>

              {/* 🗑️ Chi phí thanh lý */}
              <ChartCard title="Chi phí thanh lý (Line)" collapsible>
                <div className="max-h-[360px] overflow-y-auto rounded">
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={lineDisposal}>
                      <CartesianGrid
                        strokeDasharray="3 3"
                        className="stroke-gray-300 dark:stroke-gray-600"
                      />
                      <XAxis dataKey="name" tickMargin={10} />
                      <YAxis tickFormatter={(v) => `${v}M`} width={80} />
                      <Tooltip
                        formatter={(v) =>
                          `${v.toLocaleString("vi-VN")} triệu đồng`
                        }
                        contentStyle={{
                          background: "#111827",
                          borderRadius: 8,
                          color: "#fff",
                          border: "none",
                        }}
                      />
                      <Line
                        type="monotone"
                        dataKey="chi_phi_thanh_ly"
                        name="Chi phí thanh lý (triệu đồng)"
                        stroke="#ef4444"
                        strokeWidth={3}
                        dot={{ r: 5 }}
                        activeDot={{ r: 8 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </ChartCard>
            </div>

            <div className="grid grid-cols-1 2xl:grid-cols-3 gap-8 mb-8">
              <ChartCard title="Chi phí theo mảng (Stacked Area)" collapsible>
                <div className="max-h-[360px] overflow-y-auto rounded">
                  <ResponsiveContainer width="100%" height={300}>
                    <AreaChart data={stackedCost}>
                      <CartesianGrid
                        strokeDasharray="3 3"
                        className="stroke-gray-300 dark:stroke-gray-600"
                      />
                      <XAxis dataKey="name" tickMargin={10} />
                      <YAxis tickFormatter={(v) => `${v}M`} width={80} />
                      <Legend />
                      <Tooltip
                        formatter={(v) =>
                          `${v.toLocaleString("vi-VN")} triệu đồng`
                        }
                        contentStyle={{
                          background: "#111827",
                          borderRadius: 8,
                          color: "#fff",
                          border: "none",
                        }}
                      />

                      {/* Gradient màu cho từng loại chi phí */}
                      <defs>
                        <linearGradient
                          id="gImport"
                          x1="0"
                          y1="0"
                          x2="0"
                          y2="1"
                        >
                          <stop
                            offset="5%"
                            stopColor="#f59e0b"
                            stopOpacity={0.7}
                          />
                          <stop
                            offset="95%"
                            stopColor="#f59e0b"
                            stopOpacity={0.1}
                          />
                        </linearGradient>
                        <linearGradient
                          id="gMaintain"
                          x1="0"
                          y1="0"
                          x2="0"
                          y2="1"
                        >
                          <stop
                            offset="5%"
                            stopColor="#3b82f6"
                            stopOpacity={0.7}
                          />
                          <stop
                            offset="95%"
                            stopColor="#3b82f6"
                            stopOpacity={0.1}
                          />
                        </linearGradient>
                        <linearGradient
                          id="gDisposal"
                          x1="0"
                          y1="0"
                          x2="0"
                          y2="1"
                        >
                          <stop
                            offset="5%"
                            stopColor="#ef4444"
                            stopOpacity={0.7}
                          />
                          <stop
                            offset="95%"
                            stopColor="#ef4444"
                            stopOpacity={0.1}
                          />
                        </linearGradient>
                      </defs>

                      {/* Các vùng stack theo mảng chi phí */}
                      {/* Chi phí nhập */}
                      <Area
                        type="monotone"
                        dataKey="import"
                        name="Chi phí nhập"
                        stroke="#f59e0b"
                        fill="url(#gImport)"
                        strokeWidth={2}
                        fillOpacity={0.3}
                      />

                      {/* Chi phí bảo trì */}
                      <Area
                        type="monotone"
                        dataKey="maintenance"
                        name="Chi phí bảo trì"
                        stroke="#3b82f6"
                        fill="url(#gMaintain)"
                        strokeWidth={2}
                        fillOpacity={0.3}
                      />

                      {/* Chi phí thanh lý */}
                      <Area
                        type="monotone"
                        dataKey="disposal"
                        name="Chi phí thanh lý"
                        stroke="#ef4444"
                        fill="url(#gDisposal)"
                        strokeWidth={2}
                        fillOpacity={0.3}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </ChartCard>

              <ChartCard
                title="Số lượng thiết bị theo nhóm (Radar)"
                collapsible
              >
                <div className="max-h-[360px] overflow-y-auto rounded">
                  <ResponsiveContainer width="100%" height={300}>
                    <RadarChart data={radarData} outerRadius={110}>
                      <PolarGrid />
                      <PolarAngleAxis dataKey="group" />
                      <PolarRadiusAxis angle={30} />
                      <Radar
                        name="Tổng thiết bị"
                        dataKey="unit_count"
                        stroke="#10b981"
                        fill="#10b981"
                        fillOpacity={0.4}
                      />
                      <Tooltip
                        formatter={(value) => `${value} thiết bị`}
                        contentStyle={{
                          background: "#111827",
                          borderRadius: 8,
                          color: "#fff",
                          border: "none",
                        }}
                      />
                    </RadarChart>
                  </ResponsiveContainer>
                </div>
              </ChartCard>

              <ChartCard title="Radial Gauge (mức dùng TB)" collapsible>
                <div className="relative h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <RadialBarChart
                      innerRadius="70%"
                      outerRadius="100%"
                      startAngle={180}
                      endAngle={0}
                      data={[{ name: "usage", value: Math.round(gauge * 100) }]}
                    >
                      <RadialBar
                        minAngle={15}
                        background
                        dataKey="value"
                        cornerRadius={10}
                        fill="#06b6d4"
                      />
                    </RadialBarChart>
                  </ResponsiveContainer>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="text-center">
                      <div className="text-3xl font-bold text-gray-900 dark:text-white">
                        {Math.round(gauge * 100)}%
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">
                        đang sử dụng
                      </div>
                    </div>
                  </div>
                </div>
              </ChartCard>
            </div>
          </motion.div>
        )}

        {tab === "maintenance" && (
          <motion.div
            key="maintenance"
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 6 }}
            transition={{ duration: 0.25 }}
          >
            <div className="grid grid-cols-1 2xl:grid-cols-2 gap-8">
              <ChartCard title="Tỷ lệ trạng thái thiết bị (Donut)" collapsible>
                <div className="relative">
                  <div className="max-h-[340px] overflow-y-auto rounded">
                    <ResponsiveContainer width="100%" height={300}>
                      <PieChart>
                        <Pie
                          data={Object.entries(
                            statistics?.summary?.equipmentStatusCount || {}
                          ).map(([key, value]) => ({
                            name: STATUS_MAP_VN[key] || key,
                            value,
                          }))}
                          dataKey="value"
                          nameKey="name"
                          cx="50%"
                          cy="50%"
                          innerRadius={64}
                          outerRadius={110}
                          label
                          activeIndex={activePie}
                          activeShape={renderActiveShape}
                          onMouseEnter={(_, idx) => setActivePie(idx)}
                        >
                          {Object.entries(
                            statistics?.summary?.equipmentStatusCount || {}
                          ).map(([key], i) => {
                            const vn = STATUS_MAP_VN[key] || key;
                            const color =
                              STATUS_COLOR_HEX[vn] || COLORS[i % COLORS.length];
                            return <Cell key={i} fill={color} />;
                          })}
                        </Pie>
                        <Legend />
                        <Tooltip
                          wrapperStyle={{ zIndex: 9999 }}
                          contentStyle={{
                            background: "#ffffffff",
                            borderRadius: 8,
                            color: "#000000ff",
                            border: "none",
                          }}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>

                  {/* Tổng thiết bị hiển thị giữa biểu đồ */}
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-gray-900 dark:text-white">
                        {statistics?.summary?.totalEquipments || 0}
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">
                        tổng thiết bị
                      </div>
                    </div>
                  </div>
                </div>
              </ChartCard>

              <ChartCard title="Radial — Thiết bị sẵn sàng" collapsible>
                <div className="relative h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <RadialBarChart
                      innerRadius="70%"
                      outerRadius="100%"
                      startAngle={180}
                      endAngle={0}
                      data={[
                        {
                          name: "Ready",
                          value: readyRate,
                        },
                      ]}
                    >
                      <RadialBar
                        minAngle={15}
                        background
                        dataKey="value"
                        cornerRadius={10}
                        fill="#22c55e"
                      />
                    </RadialBarChart>
                  </ResponsiveContainer>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="text-center">
                      <div className="text-3xl font-bold text-gray-900 dark:text-white">
                        {readyRate}%
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">
                        Thiết bị sẵn sàng
                      </div>
                    </div>
                  </div>
                </div>
              </ChartCard>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </PageContainer>
  );
}

/* ============================== Sub Components ============================== */

// ✅ UPGRADE: ChartCard viền gradient mờ + collapse animation giữ nguyên
function ChartCard({
  title,
  children,
  className = "",
  collapsible = false,
  collapsed = false,
}) {
  const [isOpen, setIsOpen] = useState(!collapsed);
  return (
    <div
      className={`relative p-4 rounded-2xl shadow bg-white/80 dark:bg-[#1e1e1e]/80 backdrop-blur-sm border border-gray-200/60 dark:border-white/10 transition ${className}`}
    >
      <div
        className="pointer-events-none absolute inset-0 rounded-2xl"
        style={{
          border: "1px solid transparent",
          backgroundImage:
            "linear-gradient(#ffffff10, #ffffff10), radial-gradient(circle at 20% -10%, #22c55e33, #06b6d433, #8b5cf633)",
          backgroundOrigin: "border-box",
          backgroundClip: "content-box, border-box",
          opacity: 0.7,
        }}
      />
      <div className="relative flex items-center justify-between mb-3">
        <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100">
          {title}
        </h3>
        <div className="flex items-center gap-2">
          {collapsible && (
            <button
              onClick={() => setIsOpen((v) => !v)}
              className="px-2 py-1 text-xs rounded-lg bg-white/70 dark:bg-white/10 border border-white/20 hover:opacity-80 flex items-center gap-1"
            >
              {isOpen ? (
                <ChevronDown className="w-4 h-4" />
              ) : (
                <ChevronRight className="w-4 h-4" />
              )}
              <span>{isOpen ? "Thu gọn" : "Mở ra"}</span>
            </button>
          )}
        </div>
      </div>
      <AnimatePresence initial={false}>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25 }}
          >
            {children}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ✅ UPGRADE: GlassStat có mũi tên ↑/↓ tự nhận biết xu hướng từ subtitle
function GlassStat({ title, value, subtitle, icon: Icon, color, spark }) {
  const numericVal = parseFloat(String(value).replace(/[^\d.]/g, "")) || 0;
  const val = useAnimatedNumber(numericVal, 0.9);

  const trend = useMemo(() => {
    // phân tích "+12", "-3", "+15%" ...
    const m = /([+-])\s*([\d.]+)/.exec(subtitle || "");
    if (!m) return "neutral";
    return m[1] === "+" ? "up" : "down";
  }, [subtitle]);

  const TrendIcon =
    trend === "up" ? ChevronUp : trend === "down" ? ChevronDown : null;
  const trendColor =
    trend === "up"
      ? "text-emerald-600 dark:text-emerald-400"
      : trend === "down"
      ? "text-rose-600 dark:text-rose-400"
      : "text-gray-500";

  return (
    <motion.div
      whileHover={{ scale: 1.02 }}
      className="relative overflow-hidden rounded-2xl p-5 border border-white/20 bg-white/60 dark:bg-white/5 backdrop-blur-md shadow-sm"
    >
      <div
        className={`absolute inset-0 pointer-events-none bg-gradient-to-br ${color}`}
      />
      <div className="relative z-10 flex items-start justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-wide text-gray-600 dark:text-gray-300">
            {title}
          </p>
          <div className="flex items-end gap-2 mt-1">
            <span className="text-3xl font-bold text-gray-900 dark:text-white">
              {isNaN(val) ? value : value}
            </span>
            {TrendIcon && (
              <TrendIcon className={`w-4 h-4 mb-1 ${trendColor}`} />
            )}
          </div>
          <p className={`text-xs mt-1 ${trendColor}`}>{subtitle}</p>
        </div>
        <div className="p-3 rounded-xl bg-white/70 dark:bg-white/10 border border-white/30">
          <Icon className="w-6 h-6 text-gray-800 dark:text-gray-100 transition-transform group-hover:scale-110" />
        </div>
      </div>
      <div className="mt-3 h-[60px]">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart
            data={spark.map((y, i) => ({ x: i + 1, y }))}
            margin={{ top: 8, right: 4, left: -16, bottom: 0 }}
          >
            <Tooltip
              contentStyle={{
                background: "#111827",
                border: "none",
                borderRadius: 8,
                color: "#fff",
                padding: 8,
              }}
              labelFormatter={() => ""}
            />
            <Line
              type="monotone"
              dataKey="y"
              stroke="#22d3ee"
              strokeWidth={2.5}
              dot={false}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </motion.div>
  );
}

function TabPill({ children, icon, active, onClick }) {
  return (
    <button
      onClick={onClick}
      className={`px-3 py-2 rounded-xl text-sm flex items-center gap-2 border transition
      ${
        active
          ? "bg-emerald-500 text-white border-transparent shadow"
          : "bg-white/70 dark:bg-white/10 text-gray-700 dark:text-gray-300 border-white/20 hover:opacity-90"
      }
    `}
    >
      {icon}
      {children}
    </button>
  );
}

function Badge({ children, color = "gray" }) {
  const map = {
    emerald:
      "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-200",
    indigo:
      "bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-200",
    gray: "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-200",
  };
  return (
    <span
      className={`inline-flex items-center text-xs px-2 py-1 rounded-lg border border-white/30 ${map[color]}`}
    >
      {children}
    </span>
  );
}

// ✅ UPGRADE: NotifItem có tone màu (warning/info/success)
function NotifItem({ icon, text, time, tone = "info" }) {
  const Icon =
    icon === "alert" ? AlertTriangle : icon === "user" ? Users : FileBarChart2;
  const bgMap = {
    warning:
      "bg-amber-50 dark:bg-amber-500/10 border-amber-200/60 dark:border-amber-400/20",
    info: "bg-sky-50 dark:bg-sky-500/10 border-sky-200/60 dark:border-sky-400/20",
    success:
      "bg-emerald-50 dark:bg-emerald-500/10 border-emerald-200/60 dark:border-emerald-400/20",
  };
  const iconBg = {
    warning: "bg-amber-100/70 dark:bg-amber-900/30",
    info: "bg-sky-100/70 dark:bg-sky-900/30",
    success: "bg-emerald-100/70 dark:bg-emerald-900/30",
  }[tone];

  return (
    <div
      className={`flex items-start gap-3 px-3 py-2 transition border-t ${bgMap[tone]}`}
    >
      <div
        className={`w-8 h-8 rounded-lg ${iconBg} border border-white/20 flex items-center justify-center`}
      >
        <Icon className="w-4 h-4" />
      </div>
      <div className="text-sm">
        <p className="text-gray-800 dark:text-gray-100">{text}</p>
        <span className="text-[11px] text-gray-500">{time}</span>
      </div>
    </div>
  );
}

// ✅ UPGRADE: QuickActions thêm Upload
// function QuickActions({ onCelebrate }) {
//   return (
//     <div className="fixed right-6 bottom-6 z-20 flex flex-col gap-3">
//       <button
//         title="Ăn mừng"
//         onClick={onCelebrate}
//         className="group w-12 h-12 rounded-2xl bg-gradient-to-br from-fuchsia-500 to-pink-500 text-white flex items-center justify-center shadow-lg hover:shadow-fuchsia-500/40 transition"
//       >
//         <Sparkles className="w-6 h-6 group-hover:scale-110 transition" />
//       </button>
//       <a
//         href="/app/maintenance"
//         title="Bảo trì tạm thời"
//         className="w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-400 to-red-500 text-white flex items-center justify-center shadow-lg hover:shadow-amber-500/40 transition"
//       >
//         <Wrench className="w-6 h-6" />
//       </a>
//       <a
//         href="/app/reports/upload"
//         title="Upload báo cáo"
//         className="w-12 h-12 rounded-2xl bg-gradient-to-br from-emerald-500 to-cyan-500 text-white flex items-center justify-center shadow-lg hover:shadow-emerald-500/40 transition"
//       >
//         <Upload className="w-6 h-6" />
//       </a>
//     </div>
//   );
// }

/* ============================== Recharts helper (active shape) ============================== */
// Recharts Sector cần import từ recharts/lib/shape/Sector hoặc recharts (tuỳ version).
// Hầu hết version mới export tại "recharts". Nếu project bạn báo lỗi, đổi import:
//   import { Sector } from "recharts";  // nếu lỗi -> `import { Sector } from "recharts/lib/shape/Sector";`
import { Sector } from "recharts";

/* ============================== Command Palette ============================== */
function CommandPalette() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");

  const mockData = [
    {
      type: "device",
      name: "Treadmill Pro X9",
      icon: Dumbbell,
      href: "/app/equipment/detail/1",
    },
    {
      type: "staff",
      name: "Nguyễn Văn A",
      icon: Users,
      href: "/app/staff/detail/12",
    },
    {
      type: "vendor",
      name: "Technogym",
      icon: Truck,
      href: "/app/vendor/detail/3",
    },
    {
      type: "report",
      name: "Báo cáo Quý 3",
      icon: FileBarChart2,
      href: "/app/reports/q3",
    },
  ];

  useEffect(() => {
    const handleKey = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setOpen((v) => !v);
      }
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, []);

  const results = mockData.filter((item) =>
    item.name.toLowerCase().includes(query.toLowerCase())
  );

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 bg-black/40 flex items-start justify-center z-[9999]">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="mt-24 w-full max-w-lg bg-white dark:bg-[#1e1e1e] rounded-2xl shadow-lg border border-gray-200 dark:border-white/10 overflow-hidden"
          >
            <div className="flex items-center gap-2 p-3 border-b border-gray-200 dark:border-white/10">
              <Search className="w-4 h-4 text-gray-400" />
              <input
                autoFocus
                placeholder="Tìm kiếm (thiết bị, nhân viên, vendor, báo cáo)..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="flex-1 border-0 bg-transparent focus:ring-0 text-sm outline-none"
              />
              <kbd className="text-[10px] px-2 py-1 rounded bg-gray-100 dark:bg-gray-700 text-gray-500">
                Esc
              </kbd>
            </div>
            <ul className="max-h-64 overflow-y-auto">
              {results.length > 0 ? (
                results.map((r, i) => (
                  <a
                    key={i}
                    href={r.href}
                    className="flex items-center gap-3 px-4 py-2 text-sm hover:bg-gray-100 dark:hover:bg-white/5 transition"
                    onClick={() => setOpen(false)}
                  >
                    <r.icon className="w-4 h-4 text-gray-500" />
                    <span>{r.name}</span>
                    <span className="ml-auto text-[10px] text-gray-400 uppercase">
                      {r.type}
                    </span>
                  </a>
                ))
              ) : (
                <li className="px-4 py-6 text-center text-sm text-gray-500">
                  Không tìm thấy kết quả
                </li>
              )}
            </ul>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
