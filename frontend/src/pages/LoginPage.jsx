import React, { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import BubbleBackground from "@/features/login/BubbleBackground";
import LoginLogo from "@/features/login/LoginLogo";
import LoginForm from "@/features/login/LoginForm";
import "@/index.css";

export default function LoginPage() {
  const [darkMode, setDarkMode] = useState(true);
  const bubbleLayerRef = useRef(null);

  return (
    <div
      className={`${
        darkMode ? "login-bg-dark" : "login-bg-light"
      } h-screen flex items-center justify-center font-sans relative overflow-hidden`}
    >
      {/* Bubble Background */}
      <BubbleBackground ref={bubbleLayerRef} />

      {/* Gradient Overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-green-600/20 via-emerald-700/20 to-blue-700/30 animate-gradient"></div>

      {/* Dark/Light Switch */}
      <button
        onClick={() => setDarkMode(!darkMode)}
        className="absolute top-6 right-6 z-20 bg-white/80 dark:bg-black/50 
                   px-5 py-1 rounded-lg shadow-md hover:scale-105 transition"
      >
        {darkMode ? "🌞 Light" : "🌙 Dark"}
      </button>

      {/* Card Content */}
      <AnimatePresence>
        <motion.div
          key="card"
          className="relative z-10 grid grid-cols-[1fr_1.3fr] place-items-center 
                     w-[95%] max-w-[1600px] p-14 gap-10
                     bg-white/10 dark:bg-black/20 rounded-3xl shadow-2xl 
                     border border-white/10 backdrop-blur-2xl"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 1.2, ease: "easeOut" }}
        >
          {/* Logo */}
          <LoginLogo />

          {/* Form */}
          <motion.div
            initial={{ x: 60, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ duration: 1, delay: 0.3, ease: "easeOut" }}
            className="w-full max-w-lg translate-x-4" // dịch form qua phải
          >
            <LoginForm />
          </motion.div>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
