import { useState } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, ChevronUp } from "lucide-react";
import SidebarSubmenu from "./SidebarSubmenu";

export default function SidebarItem({ item, collapsed, location, isLast }) {
  const [open, setOpen] = useState(false);

  const isActive = location.pathname === item.path;

  return (
    <li className="w-full">
      {item.path && !item.children ? (
        <Link
          to={item.path}
          className={`flex items-center w-full px-3 py-2.5 rounded-lg transition group relative
            ${collapsed ? "justify-center" : "justify-between"}
            ${
              isActive
                ? "bg-cyan-500/20 text-cyan-500 font-semibold"
                : "hover:bg-cyan-500/10 hover:text-cyan-600"
            }`}
        >
          <motion.div
            whileHover={{ scale: 1.06 }}
            className={`flex ${
              collapsed ? "flex-col items-center gap-1" : "flex-row items-center gap-2.5"
            }`}
          >
            <item.icon size={collapsed ? 22 : 18} />
            {!collapsed && <span className="text-[14px] font-medium">{item.label}</span>}
          </motion.div>
        </Link>
      ) : (
        <div
          onClick={() => setOpen(!open)}
          className={`flex items-center cursor-pointer ${
            collapsed ? "justify-center" : "justify-between"
          } w-full px-3 py-2.5 rounded-lg hover:bg-cyan-500/10 transition group relative`}
        >
          <motion.div
            whileHover={{ scale: 1.06 }}
            className={`flex ${
              collapsed ? "flex-col items-center gap-1" : "flex-row items-center gap-2.5"
            }`}
          >
            <item.icon size={collapsed ? 22 : 18} />
            {!collapsed && <span className="text-[14px] font-medium">{item.label}</span>}
          </motion.div>
          {!collapsed && item.children && (
            open ? <ChevronUp size={14} /> : <ChevronDown size={16} />
          )}
        </div>
      )}

      {/* Submenu */}
      <AnimatePresence>
        {item.children && open && !collapsed && (
          <SidebarSubmenu childrenItems={item.children} location={location} />
        )}
      </AnimatePresence>

      {!collapsed && !isLast && (
        <div className="border-b border-gray-200 dark:border-white/10 my-1.5"></div>
      )}
    </li>
  );
}
