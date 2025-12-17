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
      {/* Aura blur */}
      <div className="absolute w-80 h-80 rounded-full bg-gradient-to-tr from-green-500/40 to-blue-500/30 blur-3xl animate-pulse"></div>

      {/* Extra concentric rings */}
      <motion.div
        className="absolute w-96 h-96 rounded-full border-2 border-green-400/30"
        animate={{ scale: [1, 1.15, 1], opacity: [0.6, 0.3, 0.6] }}
        transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        className="absolute w-[28rem] h-[28rem] rounded-full border-2 border-blue-400/20"
        animate={{ scale: [1, 1.1, 1], opacity: [0.5, 0.2, 0.5] }}
        transition={{ duration: 3, repeat: Infinity, ease: "easeInOut", delay: 0.5 }}
      />

      {/* Rotating small particles */}
      {[...Array(6)].map((_, i) => (
        <motion.div
          key={i}
          className="absolute w-3 h-3 rounded-full bg-green-400/70"
          style={{
            top: "50%",
            left: "50%",
            marginTop: -6,
            marginLeft: -6,
          }}
          animate={{
            rotate: 360,
          }}
          transition={{
            duration: 6 + i,
            repeat: Infinity,
            ease: "linear",
          }}
        />
      ))}

      {/* Logo */}
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