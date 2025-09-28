import { motion } from "framer-motion";
import { Link } from "react-router-dom";

export default function SidebarSubmenu({ childrenItems, location }) {
  return (
    <motion.ul
      initial={{ opacity: 0, y: -5, height: 0 }}
      animate={{ opacity: 1, y: 0, height: "auto" }}
      exit={{ opacity: 0, y: -5, height: 0 }}
      transition={{ duration: 0.25, ease: "easeInOut" }}
      className="ml-6 mt-3 mb-1 space-y-1 text-[13px] text-gray-600 dark:text-gray-300 overflow-hidden"
    >
      {childrenItems.map((sub, idx) => (
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
  );
}
