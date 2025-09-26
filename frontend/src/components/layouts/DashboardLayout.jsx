import { useState, useEffect } from "react";
import {
  LayoutDashboard,
  Dumbbell,
  Users,
  Truck,
  BarChart3,
  ChevronDown,
  ChevronUp,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Link, Outlet, useLocation } from "react-router-dom";
import oldLogo from "@/assets/FitXGym.png";
import Header from "@/components/layouts/header/Header";

export default function DashboardLayout() {
  const [openMenus, setOpenMenus] = useState({});
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

  const toggleMenu = (menu) => {
    setOpenMenus((prev) => ({ ...prev, [menu]: !prev[menu] }));
  };

  const menuItems = [
    { key: "dashboard", label: "Dashboard", icon: LayoutDashboard, path: "/app" },
    {
      key: "equipment",
      label: "Quản lý thiết bị",
      icon: Dumbbell,
      children: [
        { label: "Danh sách loại thiết bị", path: "/app/equipment/page" },
        { label: "Danh sách từng thiết bị", path: "/app/equipment/list" },
        { label: "Thêm thiết bị", path: "/app/equipment/add" },
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
      label: "Quản lý NCC",
      icon: Truck,
      children: [
        { label: "Danh sách nhà cung cấp", path: "/app/vendor" },
        { label: "Thêm thông tin NCC", path: "/app/vendor/add" },
      ],
    },
    { key: "stats", label: "Thống kê", icon: BarChart3, path: "/app/stats" },
  ];

  // 🎨 Sidebar theme styles
  const sidebarTheme =
    theme === "dark"
      ? "bg-gradient-to-b from-[#0f2027] via-[#203a43] to-[#2c5364] text-white"
      : "bg-gradient-to-b from-white to-gray-100 text-gray-800";

  return (
    <div className="flex min-h-screen bg-bg-light dark:bg-bg-dark font-sans transition-colors relative">
      {/* Sidebar */}
      <motion.aside
        animate={{ width: collapsed ? 80 : 260 }}
        transition={{ duration: 0.35, ease: "easeInOut" }}
        className={`relative shadow-2xl flex flex-col transition-colors ${sidebarTheme}`}
      >
        {/* Logo */}
        <div className="flex items-center gap-4 px-6 py-8 justify-center">
          <img src={oldLogo} alt="FitX Gym" className="w-14 h-14 object-contain animate-glow" />
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
        <nav className="mt-4 flex-1 overflow-y-auto">
          <ul className={`${collapsed ? "flex flex-col items-center gap-6" : "space-y-4 px-2"}`}>
            {menuItems.map((item, idx) => (
              <li key={item.key} className="w-full">
                {item.path && !item.children ? (
                  <Link
                    to={item.path}
                    className={`flex items-center w-full px-4 py-3 rounded-lg transition group relative
                      ${collapsed ? "justify-center" : "justify-between"}
                      ${
                        location.pathname === item.path
                          ? "bg-cyan-500/20 text-cyan-500 font-semibold"
                          : "hover:bg-cyan-500/10 hover:text-cyan-600"
                      }`}
                  >
                    <motion.div
                      whileHover={{ scale: 1.08 }}
                      className={`flex ${
                        collapsed ? "flex-col items-center gap-1" : "flex-row items-center gap-3"
                      }`}
                    >
                      <item.icon size={collapsed ? 28 : 22} />
                      {!collapsed && <span className="text-[16px] font-medium">{item.label}</span>}
                    </motion.div>
                  </Link>
                ) : (
                  <div
                    onClick={() => (item.children ? toggleMenu(item.key) : null)}
                    className={`flex items-center cursor-pointer ${
                      collapsed ? "justify-center" : "justify-between"
                    } w-full px-4 py-3 rounded-lg hover:bg-cyan-500/10 transition group relative`}
                  >
                    <motion.div
                      whileHover={{ scale: 1.08 }}
                      className={`flex ${
                        collapsed ? "flex-col items-center gap-1" : "flex-row items-center gap-3"
                      }`}
                    >
                      <item.icon size={collapsed ? 28 : 22} />
                      {!collapsed && <span className="text-[16px] font-medium">{item.label}</span>}
                    </motion.div>
                    {!collapsed &&
                      item.children &&
                      (openMenus[item.key] ? <ChevronUp size={18} /> : <ChevronDown size={18} />)}
                  </div>
                )}

                <AnimatePresence>
                  {item.children && openMenus[item.key] && !collapsed && (
                    <motion.ul
                      initial={{ opacity: 0, y: -5, height: 0 }}
                      animate={{ opacity: 1, y: 0, height: "auto" }}
                      exit={{ opacity: 0, y: -5, height: 0 }}
                      transition={{ duration: 0.25, ease: "easeInOut" }}
                      className="ml-6 mt-3 mb-1 space-y-1 text-[13px] text-gray-600 dark:text-gray-300 overflow-hidden"
                    >
                      {item.children.map((sub, idx) => (
                        <motion.li
                          key={idx}
                          whileHover={{ x: 3 }}
                          transition={{ type: "spring", stiffness: 200 }}
                        >
                          <Link
                            to={sub.path}
                            className={`block px-4 py-2 rounded-md transition ${
                              location.pathname === sub.path
                                ? "bg-cyan-500/20 text-cyan-500 font-semibold"
                                : "hover:text-cyan-600 hover:bg-cyan-50 dark:hover:bg-white/5"
                            }`}
                          >
                            {sub.label}
                          </Link>
                        </motion.li>
                      ))}
                    </motion.ul>
                  )}
                </AnimatePresence>

                {!collapsed && idx !== menuItems.length - 1 && (
                  <div className="border-b border-gray-200 dark:border-white/10 my-2"></div>
                )}
              </li>
            ))}
          </ul>
        </nav>

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

      {/* Content */}
      <div className="flex-1 flex flex-col relative">
        <Header />
        <main className="flex-1 p-6 overflow-y-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
