import { useState, useEffect } from "react";
import {
  LayoutDashboard,
  Dumbbell,
  Users,
  Truck,
  Building2,
  BarChart3,
  ChevronLeft,
  ChevronRight,
  FileX,
} from "lucide-react";
import { motion } from "framer-motion";
import { useLocation } from "react-router-dom";
import oldLogo from "@/assets/FitXGym.png";
import SidebarItem from "./SidebarItem";
import useAuthRole from "@/hooks/useAuthRole";

export default function Sidebar() {
  const [collapsed, setCollapsed] = useState(false);
  const [theme, setTheme] = useState(localStorage.getItem("theme") || "light");
  const location = useLocation();
  const { isTechnician, isOperator } = useAuthRole();

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

  let menuItems = [
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
        { label: "Danh mục nhóm", path: "/app/equipment/group" },
        { label: "Danh mục loại", path: "/app/equipment/type" },
        { label: "Danh mục dòng", path: "/app/equipment/list" },
        { label: "Danh mục thiết bị", path: "/app/equipment/unit" },
        // { label: "Nhập thiết bị", path: "/app/equipment/import" },
        { label: "Chuyển thiết bị", path: "/app/equipment/transfer" },
        { label: "Bảo trì thiết bị", path: "/app/maintenance" },
        { label: "Thanh lý thiết bị", path: "/app/equipment/disposal" },
      ],
    },
    {
      key: "staff",
      label: "Quản lý nhân viên",
      icon: Users,
      path: "/app/staff",
    },
    {
      key: "vendor",
      label: "Quản lý nhà cung cấp",
      icon: Truck,
      path: "/app/vendor",
    },
    {
      key: "branch",
      label: "Quản lý chi nhánh",
      icon: Building2,
      path: "/app/branch",
    },
    {
      key: "invoice",
      label: "Danh sách hóa đơn",
      icon: BarChart3,
      path: "/app/invoice",
    },
  ];

  // 🧩 Lọc bỏ “Chuyển thiết bị” cho technician & operator
  if (isTechnician || isOperator) {
    menuItems = menuItems.map((item) => {
      if (item.key === "equipment") {
        return {
          ...item,
          children: item.children.filter(
            (child) =>
              child.path !== "/app/equipment/transfer" &&
              child.path !== "/app/equipment/disposal"
          ),
        };
      }
      return item;
    });
  }

  // 🧩 Lọc bỏ “Chuyển thiết bị”, “Thanh lý thiết bị”, “Bảo trì thiết bị” cho technician & operator
  menuItems = menuItems.map((item) => {
    if (item.key === "equipment") {
      let filteredChildren = item.children;

      // 🚫 Operator
      if (isOperator) {
        filteredChildren = filteredChildren.filter(
          (child) =>
            child.path !== "/app/equipment/transfer" &&
            child.path !== "/app/equipment/disposal" &&
            child.path !== "/app/maintenance"
        );
      }

      // 🚫 Technician
      if (isTechnician) {
        filteredChildren = filteredChildren.filter(
          (child) =>
            child.path !== "/app/equipment/transfer" &&
            child.path !== "/app/equipment/disposal"
        );
      }

      return { ...item, children: filteredChildren };
    }
    return item;
  });

  // 🧩 Ẩn “Chi nhánh”, “Danh sách hóa đơn”, “Quản lý nhân viên” cho technician & operator
  // 🧩 Ẩn thêm “Nhà cung cấp” cho technician
  if (isTechnician || isOperator) {
    menuItems = menuItems.filter((item) => {
      if (isTechnician) {
        // Technician: ẩn branch, invoice, staff, vendor
        return (
          item.key !== "branch" &&
          item.key !== "invoice" &&
          item.key !== "staff" &&
          item.key !== "vendor"
        );
      }
      // Operator: ẩn branch, invoice, staff (vẫn giữ vendor)
      return (
        item.key !== "branch" && item.key !== "invoice" && item.key !== "staff"
      );
    });
  }

  const sidebarTheme =
    theme === "dark"
      ? "bg-gradient-to-b from-[#0f2027] via-[#203a43] to-[#2c5364] text-white"
      : "bg-gradient-to-b from-white to-gray-100 text-gray-800";

  return (
    <motion.aside
      animate={{ width: collapsed ? 80 : 260 }}
      transition={{ duration: 0.35, ease: "easeInOut" }}
      className={`h-full flex flex-col shadow-2xl transition-colors ${sidebarTheme}`}
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
      <nav className="mt-4 flex-1 overflow-y-auto px-2 hide-scrollbar">
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
