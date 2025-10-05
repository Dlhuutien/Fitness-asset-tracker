import { useState } from "react";
import { LogOut, User, ChevronDown } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";

export default function UserMenu({ username, onLogoutClick }) {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();

  const goToProfile = () => {
    setOpen(false);
    navigate("/userProfile");
  };

  return (
    <div className="relative">
      <motion.button
        whileHover={{ scale: 1.1 }}
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 p-2 rounded-lg bg-gray-100 dark:bg-gray-800 hover:shadow-md transition"
      >
        <User className="w-6 h-6 text-gray-600 dark:text-gray-300" />
        <span className="hidden sm:inline font-medium">{username}</span>
        <ChevronDown size={16} />
      </motion.button>

      <AnimatePresence>
        {open && (
          <motion.ul
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2 }}
            className="absolute right-0 mt-2 w-44 bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 overflow-hidden"
          >
            <li className="px-4 py-2 text-gray-500 dark:text-gray-300 text-sm border-b border-gray-200 dark:border-gray-700">
              Xin chào, <span className="font-semibold">{username}</span>
            </li>

            {/* 🧩 Profile */}
            <li
              onClick={goToProfile}
              className="flex items-center gap-2 px-4 py-2 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700"
            >
              <User size={18} /> Profile
            </li>

            <li
              onClick={onLogoutClick}
              className="flex items-center gap-2 px-4 py-2 cursor-pointer hover:bg-red-100 dark:hover:bg-red-600/30 text-red-600 dark:text-red-400"
            >
              <LogOut size={18} /> Đăng xuất
            </li>
          </motion.ul>
        )}
      </AnimatePresence>
    </div>
  );
}
