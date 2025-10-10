import { motion } from "framer-motion";
import { Bell } from "lucide-react";
import { useNavigate } from "react-router-dom";

export default function Notification() {
  const navigate = useNavigate();

  return (
    <motion.button
      whileHover={{ scale: 1.15 }}
      whileTap={{ scale: 0.9 }}
      onClick={() => navigate("/notifications")}
      className="relative p-2 rounded-full bg-gray-100 dark:bg-gray-800 hover:shadow-md transition"
    >
      <Bell className="w-6 h-6 text-gray-600 dark:text-gray-300" />
      <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-red-500 rounded-full"></span>
    </motion.button>
  );
}
