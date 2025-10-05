import { useState, useEffect } from "react";
import {
  LayoutDashboard,
  Dumbbell,
  Users,
  Truck,
  BarChart3,
  ChevronLeft,
  ChevronRight,
  FileX,
} from "lucide-react";
import { motion } from "framer-motion";
import { useLocation } from "react-router-dom";
import oldLogo from "@/assets/FitXGym.png";
import SidebarItem from "./SidebarItem";

export default function Sidebar() {
  const [collapsed, setCollapsed] = useState(false);
  const [theme, setTheme] = useState(localStorage.getItem("theme") || "light");
  const location = useLocation();

  useEffect(() => {
    const observer = new MutationObserver(() => {
      setTheme(
        document.documentElement.classList.contains("dark") ? "dark" : "light"
      );
    });
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class"],
    });
    return () => observer.disconnect();
  }, []);

  const menuItems = [
    {
      key: "dashboard",
      label: "Dashboard",
      icon: LayoutDashboard,
      path: "/app",
    },
    {
      key: "equipment",
      label: "Quản lý thiết bị",
      icon: Dumbbell,
      children: [
        { label: "Danh sách từng thiết bị", path: "/app/equipment/list" },
        { label: "Danh sách loại thiết bị", path: "/app/equipment/page" },
        { label: "Tạo thông tin thiết bị", path: "/app/equipment/add-group" },
        // { label: "Thêm thẻ kho, thông số", path: "/app/equipment/add-card" },
        { label: "Nhập thiết bị", path: "/app/equipment/import" },
      ],
    },
    {
      key: "staff",
      label: "Quản lý nhân viên",
      icon: Users,
      children: [
        { label: "Danh sách nhân viên", path: "/app/staff" },
        { label: "Thêm nhân viên", path: "/app/staff/add" },
      ],
    },
    {
      key: "vendor",
      label: "Quản lý thông tin NCC",
      icon: Truck,
      children: [
        { label: "Danh sách nhà cung cấp", path: "/app/vendor" },
        { label: "Thêm thông tin NCC", path: "/app/vendor/add" },
      ],
    },
    {
      key: "invoice",
      label: "Quản lý hóa đơn",
      icon: BarChart3,
      children: [
        { label: "Danh sách hóa đơn", path: "/app/invoice" },
        { label: "Tạo hóa đơn", path: "/app/invoice/add" },
      ],
    },
    {
      key: "maintenance",
      label: "Bảo trì thiết bị",
      icon: FileX,
      children: [
        { label: "Các thiết bị cần bảo trì", path: "/app/maintenance/urgent" },
        { label: "Chờ phê duyệt", path: "/app/maintenance/ready" },
      ],
    },
  ];

  const sidebarTheme =
    theme === "dark"
      ? "bg-gradient-to-b from-[#0f2027] via-[#203a43] to-[#2c5364] text-white"
      : "bg-gradient-to-b from-white to-gray-100 text-gray-800";

  return (
    <motion.aside
      animate={{ width: collapsed ? 80 : 260 }}
      transition={{ duration: 0.35, ease: "easeInOut" }}
      className={`relative shadow-2xl flex flex-col transition-colors ${sidebarTheme}`}
    >
      {/* Logo */}
      <div className="flex items-center gap-4 px-6 py-8 justify-center">
        <img
          src={oldLogo}
          alt="FitX Gym"
          className="w-14 h-14 object-contain animate-glow"
        />
        {!collapsed && (
          <motion.span
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.3 }}
            className="text-2xl font-bold tracking-wide bg-gradient-to-r 
              from-emerald-400 via-cyan-400 to-blue-400 bg-clip-text text-transparent"
          >
            FitX Gym
          </motion.span>
        )}
      </div>

      {/* Menu */}
      <nav className="mt-4 flex-1 overflow-y-auto px-2">
        <ul
          className={`${
            collapsed ? "flex flex-col items-center gap-6" : "space-y-4"
          }`}
        >
          {menuItems.map((item, idx) => (
            <SidebarItem
              key={item.key}
              item={item}
              collapsed={collapsed}
              location={location}
              isLast={idx === menuItems.length - 1}
            />
          ))}
        </ul>
      </nav>

      {/* Footer nhỏ FitX Gym */}
      <div className="mt-auto px-4 py-4 border-t dark:border-gray-700 flex items-center justify-center">
        <img
          src={oldLogo}
          alt="FitX Gym"
          className="w-8 h-8 object-contain opacity-80"
        />
        {!collapsed && (
          <span className="ml-2 text-sm font-semibold text-gray-600 dark:text-gray-300">
            FitX Gym
          </span>
        )}
      </div>

      {/* Toggle Collapse */}
      <button
        onClick={() => setCollapsed(!collapsed)}
        className="absolute top-1/2 -right-3 transform -translate-y-1/2 
          w-8 h-8 rounded-full bg-gradient-to-r from-emerald-400 to-cyan-500 
          text-white flex items-center justify-center shadow-lg 
          hover:scale-110 hover:shadow-[0_0_15px_rgba(6,182,212,0.6)] transition"
      >
        {collapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
      </button>
    </motion.aside>
  );
}
