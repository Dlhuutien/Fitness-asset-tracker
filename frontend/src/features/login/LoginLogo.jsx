import { motion } from "framer-motion";
import logo from "@/assets/FitXGym.png";

export default function LoginLogo() {
  return (
    <motion.div
      initial={{ x: -60, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      transition={{ duration: 1, ease: "easeOut" }}
      className="relative flex items-center justify-center"
    >
      <div className="absolute w-80 h-80 rounded-full bg-gradient-to-tr from-green-500/40 to-blue-500/30 blur-3xl animate-pulse"></div>
      <motion.img
        src={logo}
        alt="Logo"
        className="relative w-72 h-72 object-contain drop-shadow-[0_0_25px_rgba(34,197,94,0.8)]"
        animate={{ y: [0, -12, 0], scale: [1, 1.04, 1] }}
        transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
      />
    </motion.div>
  );
}
