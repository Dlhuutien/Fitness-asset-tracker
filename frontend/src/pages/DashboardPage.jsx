import PageContainer from "@/components/common/PageContainer";
import { Button } from "@/components/ui/buttonn";
import {
  Users,
  Dumbbell,
  Truck,
  BarChart3,
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
  Treemap,
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

/* ============================== Fake Data + Generators ============================== */
const monthNames = [
  "T1",
  "T2",
  "T3",
  "T4",
  "T5",
  "T6",
  "T7",
  "T8",
  "T9",
  "T10",
  "T11",
  "T12",
];
const COLORS = ["#10b981", "#ef4444", "#f59e0b"];
const STACK_COLORS = { membership: "#22c55e", pt: "#38bdf8", merch: "#f59e0b" };

function genBarLineData(range = "month") {
  if (range === "month") {
    return {
      bar: [
        { name: "Tuần 1", thiết_bị: 40, nhân_viên: 15 },
        { name: "Tuần 2", thiết_bị: 48, nhân_viên: 18 },
        { name: "Tuần 3", thiết_bị: 55, nhân_viên: 22 },
        { name: "Tuần 4", thiết_bị: 60, nhân_viên: 25 },
      ],
      line: [
        { name: "Tuần 1", doanh_thu: 1200 },
        { name: "Tuần 2", doanh_thu: 1800 },
        { name: "Tuần 3", doanh_thu: 1500 },
        { name: "Tuần 4", doanh_thu: 2100 },
      ],
    };
  }
  if (range === "quarter") {
    return {
      bar: [
        { name: "T1", thiết_bị: 120, nhân_viên: 45 },
        { name: "T2", thiết_bị: 135, nhân_viên: 50 },
        { name: "T3", thiết_bị: 150, nhân_viên: 57 },
      ],
      line: [
        { name: "T1", doanh_thu: 4200 },
        { name: "T2", doanh_thu: 4800 },
        { name: "T3", doanh_thu: 5400 },
      ],
    };
  }
  return {
    bar: monthNames.map((m, i) => ({
      name: m,
      thiết_bị: 40 + i * 4 + (i % 3 === 0 ? 6 : 0),
      nhân_viên: 15 + Math.round(i * 1.2),
    })),
    line: monthNames.map((m, i) => ({
      name: m,
      doanh_thu: 1000 + i * 180 + (i % 4 ? 120 : 0),
    })),
  };
}
function genStackedArea(range = "month") {
  const labels =
    range === "month"
      ? ["Tuần 1", "Tuần 2", "Tuần 3", "Tuần 4"]
      : range === "quarter"
      ? ["T1", "T2", "T3"]
      : monthNames;
  return labels.map((name, i) => ({
    month: name,
    membership: +(8 + i * (range === "year" ? 0.6 : 1)).toFixed(1),
    pt: +(3.5 + i * (range === "year" ? 0.35 : 0.6)).toFixed(1),
    merch: +(1 + i * (range === "year" ? 0.25 : 0.4)).toFixed(1),
  }));
}
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
function genRadarUsage() {
  return [
    { metric: "Cardio", fit: 85, target: 80 },
    { metric: "Strength", fit: 72, target: 75 },
    { metric: "Stretch", fit: 64, target: 65 },
    { metric: "Functional", fit: 78, target: 70 },
    { metric: "Accessories", fit: 58, target: 60 },
  ];
}
function genTreemap() {
  return [
    {
      name: "Thiết bị",
      children: [
        { name: "Cardio", size: 50 },
        { name: "Strength", size: 35 },
        { name: "Functional", size: 25 },
        { name: "Stretching", size: 15 },
        { name: "Accessories", size: 10 },
      ],
    },
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
  const [range, setRange] = useState("month"); // month | quarter | year
  const [tab, setTab] = useState("overview"); // overview | charts | maintenance | activity

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

  // 🗓️ Xác định thời gian hiện hành
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth() + 1; // 1-12
  const currentQuarter = Math.floor((currentMonth - 1) / 3) + 1;

  // 📊 Gọi API dashboard theo thời gian thực
  const {
    statistics,
    trend,
    hierarchy,
    statLoading,
    trendLoading,
    hierarchyLoading,
  } = useDashboardData({
    type: range,
    year: currentYear,
    month: range === "month" ? currentMonth : undefined,
    quarter: range === "quarter" ? currentQuarter : undefined,
  });

  const readyCount = statistics?.summary?.equipmentStatusCount?.Ready || 0;
  const totalEquipments = statistics?.summary?.totalEquipments || 1; // tránh chia 0
  const readyRate = Math.round((readyCount / totalEquipments) * 100);

  const [collapse, setCollapse] = useState({
    charts: false,
    maintenance: false,
    activity: false,
  });

  // data blocks
  const { bar, line } = useMemo(() => genBarLineData(range), [range]);
  const stackedArea = useMemo(() => genStackedArea(range), [range]);
  const donut = useMemo(() => genPieStatus(range), [range]);
  const radar = useMemo(() => genRadarUsage(), []);
  const treemap = useMemo(() => genTreemap(), []);
  const bubble = useMemo(() => genScatterDevices(range), [range]);
  const activities = useMemo(() => genActivities(), []);
  const ranking = useMemo(() => genRanking(), []);
  const heatmap = useMemo(() => genHeatmap(), [range]);
  const totalPie = useMemo(
    () => donut.reduce((s, x) => s + x.value, 0),
    [donut]
  );

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

  // toast demo
  const urgentCount = 6;
  useEffect(() => {
    toast.warning("⚠️ Có 6 thiết bị đang Ngừng tạm thời!");
  }, []);

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
    <PageContainer title={`${greeting()}, Admin 👋`} username="Admin">
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
              Chọn khu vực bên dưới để tập trung nội dung.
            </p>
            <div className="mt-2 flex items-center gap-2">
              <Badge color="emerald">
                <CheckCircle2 className="w-3 h-3 mr-1" />
                Target Q3 đạt 92%
              </Badge>
              <Badge color="indigo">Realtime</Badge>
            </div>
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
            <TabPill
              icon={<History className="w-4 h-4" />}
              active={tab === "activity"}
              onClick={() => setTab("activity")}
            >
              Hoạt động
            </TabPill>
          </div>

          {/* Actions + Notifications */}
          <div className="flex items-center gap-2">
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
            <Button className="bg-emerald-600 hover:bg-emerald-700 text-white flex items-center gap-2">
              <Plus size={16} /> Thêm thiết bị
            </Button>
            <Button className="bg-sky-600 hover:bg-sky-700 text-white flex items-center gap-2">
              <FileBarChart2 size={16} /> Xuất báo cáo
            </Button>
          </div>
        </div>
      </motion.div>

      {/* WARNING BANNER */}
      {urgentCount > 0 && (
        <div className="mb-6 rounded-xl border border-amber-300/30 bg-amber-50/60 dark:bg-amber-500/10 px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <AlertTriangle className="text-amber-500" />
            <p className="text-amber-800 dark:text-amber-200 text-sm">
              Có <b>{urgentCount}</b> thiết bị đang <b>Ngừng tạm thời</b>. Vui
              lòng kiểm tra sớm.
            </p>
          </div>
          <a
            href="/app/maintenance/urgent"
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
            {/* KPI */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <MiniKPI
                icon={<Cpu className="w-4 h-4" />}
                label="CPU"
                value={`${cpu}%`}
                bar={cpu}
                barClass="bg-emerald-500"
                pulse={cpu > 80}
              />
              <MiniKPI
                icon={<Gauge className="w-4 h-4" />}
                label="RAM"
                value={`${ram}%`}
                bar={ram}
                barClass="bg-sky-500"
                pulse={ram > 85}
              />
              <MiniKPI
                icon={<UserCheck className="w-4 h-4" />}
                label="Online Users"
                value={onlineDisplay}
                bar={Math.min(100, (online / 320) * 100)}
                barClass="bg-indigo-500"
              />
            </div>

            {/* Stats row */}
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6 mb-8">
              <GlassStat
                title="Tổng thiết bị"
                value={String(totals.devices)}
                subtitle="+12 so với tháng trước"
                icon={Dumbbell}
                color="from-emerald-400/30 to-emerald-600/30"
                spark={[90, 96, 105, totals.devices]}
              />
              <GlassStat
                title="Nhân viên"
                value={String(totals.staff)}
                subtitle="+3 trong tháng này"
                icon={Users}
                color="from-blue-400/30 to-indigo-600/30"
                spark={[19, 21, 22, 25]}
              />
              <GlassStat
                title="Nhà cung cấp"
                value={String(totals.vendors)}
                subtitle="Ổn định"
                icon={Truck}
                color="from-indigo-400/30 to-purple-600/30"
                spark={[7, 8, 8, 8]}
              />
              <GlassStat
                title="Doanh thu"
                value={totals.revenue}
                subtitle="+15% so với tháng trước"
                icon={BarChart3}
                color="from-amber-400/30 to-orange-500/30"
                spark={[
                  13,
                  16,
                  17,
                  parseFloat(String(totals.revenue).replace(/[^\d.]/g, "")),
                ]}
              />
            </div>

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

            {/* Quick Actions floating */}
            <QuickActions onCelebrate={fireConfetti} />
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
                title="Thiết bị & Nhân viên (Bar)"
                collapsible
                collapsed={false}
              >
                <div className="max-h-[360px] overflow-y-auto rounded">
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={bar} barSize={26}>
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
                        dataKey="thiết_bị"
                        fill="#10b981"
                        radius={[8, 8, 0, 0]}
                      />
                      <Bar
                        dataKey="nhân_viên"
                        fill="#3b82f6"
                        radius={[8, 8, 0, 0]}
                      />
                      <Legend />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </ChartCard>

              <ChartCard title="Doanh thu (Line)" collapsible>
                <div className="max-h-[360px] overflow-y-auto rounded">
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={line}>
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
                      <Line
                        type="monotone"
                        dataKey="doanh_thu"
                        stroke="#06b6d4"
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
              <ChartCard title="So sánh nhóm (Radar)" collapsible>
                <div className="max-h-[360px] overflow-y-auto rounded">
                  <ResponsiveContainer width="100%" height={300}>
                    <RadarChart data={radar} outerRadius={110}>
                      <PolarGrid />
                      <PolarAngleAxis dataKey="metric" />
                      <PolarRadiusAxis angle={30} domain={[0, 100]} />
                      <Radar
                        name="Thực tế"
                        dataKey="fit"
                        stroke="#22c55e"
                        fill="#22c55e"
                        fillOpacity={0.35}
                      />
                      <Radar
                        name="Mục tiêu"
                        dataKey="target"
                        stroke="#3b82f6"
                        fill="#3b82f6"
                        fillOpacity={0.2}
                      />
                      <Legend />
                      <Tooltip
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

              <ChartCard title="Doanh thu theo mảng (Stacked Area)" collapsible>
                <div className="max-h-[360px] overflow-y-auto rounded">
                  <ResponsiveContainer width="100%" height={300}>
                    <AreaChart data={stackedArea}>
                      <CartesianGrid
                        strokeDasharray="3 3"
                        className="stroke-gray-300 dark:stroke-gray-600"
                      />
                      <XAxis dataKey="month" />
                      <YAxis />
                      <Legend />
                      <Tooltip
                        contentStyle={{
                          background: "#111827",
                          borderRadius: 8,
                          color: "#fff",
                          border: "none",
                        }}
                      />
                      <defs>
                        <linearGradient id="g1" x1="0" y1="0" x2="0" y2="1">
                          <stop
                            offset="5%"
                            stopColor={STACK_COLORS.membership}
                            stopOpacity={0.7}
                          />
                          <stop
                            offset="95%"
                            stopColor={STACK_COLORS.membership}
                            stopOpacity={0.1}
                          />
                        </linearGradient>
                        <linearGradient id="g2" x1="0" y1="0" x2="0" y2="1">
                          <stop
                            offset="5%"
                            stopColor={STACK_COLORS.pt}
                            stopOpacity={0.7}
                          />
                          <stop
                            offset="95%"
                            stopColor={STACK_COLORS.pt}
                            stopOpacity={0.1}
                          />
                        </linearGradient>
                        <linearGradient id="g3" x1="0" y1="0" x2="0" y2="1">
                          <stop
                            offset="5%"
                            stopColor={STACK_COLORS.merch}
                            stopOpacity={0.7}
                          />
                          <stop
                            offset="95%"
                            stopColor={STACK_COLORS.merch}
                            stopOpacity={0.1}
                          />
                        </linearGradient>
                      </defs>
                      <Area
                        stackId="rev"
                        type="monotone"
                        dataKey="membership"
                        stroke={STACK_COLORS.membership}
                        fill="url(#g1)"
                        strokeWidth={2}
                      />
                      <Area
                        stackId="rev"
                        type="monotone"
                        dataKey="pt"
                        stroke={STACK_COLORS.pt}
                        fill="url(#g2)"
                        strokeWidth={2}
                      />
                      <Area
                        stackId="rev"
                        type="monotone"
                        dataKey="merch"
                        stroke={STACK_COLORS.merch}
                        fill="url(#g3)"
                        strokeWidth={2}
                      />
                    </AreaChart>
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

            <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
              <ChartCard title="Bubble — Giá trị vs Tần suất" collapsible>
                <div className="max-h-[360px] overflow-y-auto rounded">
                  <ResponsiveContainer width="100%" height={300}>
                    <ScatterChart>
                      <CartesianGrid
                        strokeDasharray="3 3"
                        className="stroke-gray-300 dark:stroke-gray-600"
                      />
                      <XAxis dataKey="x" name="Giá trị (triệu ₫)" />
                      <YAxis dataKey="y" name="Tần suất" />
                      <ZAxis dataKey="z" range={[80, 400]} name="Lượt" />
                      <Tooltip
                        cursor={{ strokeDasharray: "3 3" }}
                        contentStyle={{
                          background: "#111827",
                          borderRadius: 8,
                          color: "#fff",
                          border: "none",
                        }}
                      />
                      <Scatter data={bubble} fill="#8b5cf6" />
                    </ScatterChart>
                  </ResponsiveContainer>
                </div>
              </ChartCard>

              <ChartCard title="Heatmap — Tần suất bảo trì" collapsible>
                <div className="max-h-[360px] overflow-y-auto rounded p-2">
                  <div className="flex gap-2">
                    {heatmap.map((week, i) => (
                      <div key={i} className="grid grid-rows-7 gap-1">
                        {week.map((val, j) => (
                          <div
                            key={j}
                            title={`Tuần ${i + 1}, Ngày ${j + 1}: ${val} ca`}
                            className="w-4 h-4 rounded-sm"
                            style={{ backgroundColor: heatColor(val) }}
                          />
                        ))}
                      </div>
                    ))}
                  </div>
                  <div className="flex items-center gap-2 mt-3 text-xs text-gray-500">
                    <span>Ít</span>
                    <div className="flex gap-1">
                      {[0, 1, 2, 3, 4, 5].map((v) => (
                        <div
                          key={v}
                          className="w-4 h-3 rounded-sm"
                          style={{ backgroundColor: heatColor(v) }}
                        />
                      ))}
                    </div>
                    <span>Nhiều</span>
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
            <div className="grid grid-cols-1 2xl:grid-cols-3 gap-8">
              <ChartCard
                title="Tổng quan bảo trì"
                collapsible
                collapsed={false}
              >
                <div className="max-h-[360px] overflow-y-auto rounded">
                  <ResponsiveContainer width="100%" height={300}>
                    <Treemap
                      data={treemap}
                      dataKey="size"
                      nameKey="name"
                      ratio={4 / 3}
                      stroke="#fff"
                      fill="#10b981"
                    />
                  </ResponsiveContainer>
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
                          ).map(([name, value]) => ({
                            name,
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
                          ).map((_, i) => (
                            <Cell key={i} fill={COLORS[i % COLORS.length]} />
                          ))}
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

        {tab === "activity" && (
          <motion.div
            key="activity"
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 6 }}
            transition={{ duration: 0.25 }}
          >
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
              <ChartCard
                title="Top thiết bị bảo trì nhiều nhất"
                collapsible
                collapsed={false}
              >
                <div className="max-h-[360px] overflow-y-auto rounded pr-2">
                  <ul className="space-y-4">
                    {ranking.map((d) => (
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
                    ))}
                  </ul>
                </div>
              </ChartCard>

              <ChartCard title="Nhật ký hoạt động gần đây" collapsible>
                <div className="relative pl-4 max-h-[360px] overflow-y-auto rounded pr-2">
                  <div className="absolute left-3 top-1 bottom-1 w-[2px] bg-gradient-to-b from-emerald-400 to-blue-500 opacity-60" />
                  <ul className="space-y-4">
                    {activities.map((a) => (
                      <li
                        key={a.id}
                        className="relative flex items-start gap-3"
                      >
                        <div className="w-6 h-6 rounded-full bg-white dark:bg-white/10 border border-white/40 flex items-center justify-center relative z-10">
                          {a.icon}
                        </div>
                        <div>
                          <p className="text-sm text-gray-900 dark:text-gray-100">
                            {a.text}
                          </p>
                          <span className="text-xs text-gray-500">
                            {a.time}
                          </span>
                        </div>
                      </li>
                    ))}
                  </ul>
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
              {isNaN(val)
                ? value
                : value.toString().includes("₫")
                ? `${val}M ₫`
                : val}
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

function MiniKPI({ icon, label, value, bar, barClass, pulse = false }) {
  return (
    <div className="rounded-xl border border-gray-200/60 dark:border-white/10 bg-white/70 dark:bg-[#151515]/70 backdrop-blur p-4 flex items-center gap-4">
      <div className="relative">
        <div className="w-8 h-8 rounded-lg bg-white/60 dark:bg-white/10 border border-white/30 flex items-center justify-center transition-transform hover:scale-110">
          {icon}
        </div>
        {pulse && (
          <span className="absolute -top-1 -right-1 flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
          </span>
        )}
      </div>
      <div className="flex-1">
        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-700 dark:text-gray-300">{label}</span>
          <span className="font-semibold text-gray-900 dark:text-white">
            {value}
          </span>
        </div>
        <div className="h-2 mt-2 rounded bg-gray-200 dark:bg-gray-700 overflow-hidden">
          <div
            className={`h-full ${barClass}`}
            style={{ width: `${Math.min(100, Math.max(0, bar))}%` }}
          />
        </div>
      </div>
    </div>
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
function QuickActions({ onCelebrate }) {
  return (
    <div className="fixed right-6 bottom-6 z-20 flex flex-col gap-3">
      <button
        title="Ăn mừng"
        onClick={onCelebrate}
        className="group w-12 h-12 rounded-2xl bg-gradient-to-br from-fuchsia-500 to-pink-500 text-white flex items-center justify-center shadow-lg hover:shadow-fuchsia-500/40 transition"
      >
        <Sparkles className="w-6 h-6 group-hover:scale-110 transition" />
      </button>
      <a
        href="/app/maintenance/urgent"
        title="Bảo trì tạm thời"
        className="w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-400 to-red-500 text-white flex items-center justify-center shadow-lg hover:shadow-amber-500/40 transition"
      >
        <Wrench className="w-6 h-6" />
      </a>
      <a
        href="/app/reports/upload"
        title="Upload báo cáo"
        className="w-12 h-12 rounded-2xl bg-gradient-to-br from-emerald-500 to-cyan-500 text-white flex items-center justify-center shadow-lg hover:shadow-emerald-500/40 transition"
      >
        <Upload className="w-6 h-6" />
      </a>
    </div>
  );
}

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
