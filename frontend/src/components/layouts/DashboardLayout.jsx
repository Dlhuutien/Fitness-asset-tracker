import { useState } from "react";
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
import PageTransition from "@/components/common/PageTransition";
import oldLogo from "@/assets/FitXGym.png";

export default function DashboardLayout({ children }) {
  const [openMenus, setOpenMenus] = useState({});
  const [collapsed, setCollapsed] = useState(false);

  const toggleMenu = (menu) => {
    setOpenMenus((prev) => ({ ...prev, [menu]: !prev[menu] }));
  };

  const menuItems = [
    { key: "dashboard", label: "Dashboard", icon: LayoutDashboard },
    {
      key: "equipment",
      label: "Quản lý thiết bị",
      icon: Dumbbell,
      children: [
        "Danh sách loại thiết bị",
        "Danh sách từng thiết bị",
        "Thêm thiết bị",
      ],
    },
    {
      key: "staff",
      label: "Quản lý nhân viên",
      icon: Users,
      children: ["Danh sách nhân viên", "Thêm nhân viên"],
    },
    {
      key: "vendor",
      label: "Quản lý NCC",
      icon: Truck,
      children: ["Danh sách nhà cung cấp", "Thêm thông tin NCC"],
    },
    { key: "stats", label: "Thống kê", icon: BarChart3 },
  ];

  return (
    <div className="flex min-h-screen bg-gray-100 font-sans">
      {/* Sidebar */}
      <motion.aside
        animate={{ width: collapsed ? 80 : 260 }}
        transition={{ duration: 0.35, ease: "easeInOut" }}
        className="relative bg-gradient-to-b from-[#0f2027] via-[#203a43] to-[#2c5364] 
        text-white shadow-2xl flex flex-col"
      >
        {/* Logo */}
        <div className="flex items-center gap-3 px-4 py-6 justify-center">
          <img
            src={oldLogo}
            alt="FitX Gym"
            className="w-8 h-8 object-contain animate-glow"
          />
          {!collapsed && (
            <motion.span
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3 }}
              className="text-xl font-bold tracking-wide bg-gradient-to-r 
                from-emerald-400 via-cyan-400 to-blue-400 bg-clip-text text-transparent"
            >
              FitX Gym
            </motion.span>
          )}
        </div>

        {/* Toggle Collapse */}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="absolute top-1/2 -right-3 transform -translate-y-1/2 
            w-7 h-7 rounded-full bg-gradient-to-r from-emerald-400 to-cyan-500 
            text-white flex items-center justify-center shadow-lg 
            hover:scale-110 transition"
        >
          {collapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
        </button>

        {/* Menu */}
        <nav className="mt-6 flex-1">
          <ul
            className={`${
              collapsed ? "flex flex-col items-center gap-6" : "space-y-4 px-3"
            }`}
          >
            {menuItems.map((item, idx) => (
              <li
                key={item.key}
                className={`w-full ${
                  !collapsed && idx !== menuItems.length - 1
                    ? "border-b border-white/10 pb-2"
                    : ""
                }`}
              >
                {/* Parent item */}
                <button
                  onClick={() => item.children && toggleMenu(item.key)}
                  className={`flex items-center ${
                    collapsed ? "justify-center" : "justify-between"
                  } w-full px-3 py-3 rounded-lg hover:bg-cyan-500/20 transition group relative`}
                >
                  <motion.div
                    whileHover={{ scale: 1.08 }}
                    className={`flex ${
                      collapsed
                        ? "flex-col items-center gap-1"
                        : "flex-row items-center gap-3"
                    }`}
                  >
                    <item.icon size={collapsed ? 28 : 22} />
                    {!collapsed && (
                      <span className="text-[15px] font-medium">
                        {item.label}
                      </span>
                    )}
                  </motion.div>

                  {!collapsed &&
                    item.children &&
                    (openMenus[item.key] ? (
                      <ChevronUp size={18} />
                    ) : (
                      <ChevronDown size={18} />
                    ))}

                  {/* Tooltip khi collapsed */}
                  {collapsed && (
                    <span
                      className="absolute left-full ml-2 px-2 py-1 rounded bg-gray-800 text-xs 
              text-white opacity-0 group-hover:opacity-100 whitespace-nowrap"
                    >
                      {item.label}
                    </span>
                  )}
                </button>

                {/* Submenu */}
                {/* Submenu */}
                <AnimatePresence>
                  {item.children && openMenus[item.key] && !collapsed && (
                    <motion.ul
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.3, ease: "easeInOut" }}
                      className="ml-10 mt-2 space-y-1 text-[15px] text-gray-300 overflow-hidden"
                    >
                      {item.children.map((sub, idx) => (
                        <li key={idx}>
                          <a
                            href="#"
                            className="block px-3 py-2 rounded-md 
              hover:text-cyan-400 hover:bg-white/5 transition"
                          >
                            {sub}
                          </a>
                        </li>
                      ))}
                    </motion.ul>
                  )}
                </AnimatePresence>
              </li>
            ))}
          </ul>
        </nav>

        {/* Footer */}
        {!collapsed && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="p-4 text-center text-xs text-gray-400"
          >
            © 2025 FitX Gym
          </motion.div>
        )}
      </motion.aside>

      {/* Main Content */}
      <main className="flex-1 p-6">
        <PageTransition>
          {children || <h1 className="text-2xl font-semibold">Dashboard</h1>}
        </PageTransition>
      </main>
    </div>
  );
}
