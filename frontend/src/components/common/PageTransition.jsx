import { motion } from "framer-motion";

export default function PageTransition({ children }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}      // lúc bắt đầu
      animate={{ opacity: 1, y: 0 }}       // khi hiện
      exit={{ opacity: 0, y: -20 }}        // khi rời đi
      transition={{ duration: 0.4, ease: "easeInOut" }}
      className="h-full w-full"
    >
      {children}
    </motion.div>
  );
}
