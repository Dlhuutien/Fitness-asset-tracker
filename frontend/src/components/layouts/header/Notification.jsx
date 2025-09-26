import { motion } from "framer-motion";
import { Bell } from "lucide-react";

export default function Notification() {
  return (
    <motion.button
      whileHover={{ scale: 1.15 }}
      className="relative p-2 rounded-full bg-gray-100 dark:bg-gray-800 hover:shadow-md transition"
    >
      <Bell className="w-6 h-6 text-gray-600 dark:text-gray-300" />
      <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-red-500 rounded-full"></span>
    </motion.button>
  );
}
