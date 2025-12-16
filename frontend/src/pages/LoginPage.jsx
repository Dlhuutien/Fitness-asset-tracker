import { useState } from "react";
import { motion } from "framer-motion";
import BubbleBackground from "@/components/layouts/login/BubbleBackground";
import LoginLogo from "@/components/layouts/login/LoginLogo";
import LoginForm from "@/components/layouts/login/LoginForm";

export default function LoginPage() {
  const [darkMode] = useState(true);

  return (
    <div
      className={`${
        darkMode ? "login-bg-dark" : "login-bg-light"
      } min-h-screen flex items-center justify-center font-sans relative overflow-hidden px-4 sm:px-6`}
    >
      {/* Hiệu ứng bong bóng */}
      <BubbleBackground />

      {/* Khối chính */}
      <motion.div
        initial={{ opacity: 0, scale: 0.92, y: 40 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.9, ease: "easeOut" }}
        className="
          relative z-10
          flex flex-col lg:flex-row
          items-center justify-center
          gap-8 lg:gap-x-40
          w-full max-w-7xl
          rounded-3xl
          bg-white/30 dark:bg-black/30
          border border-white/30
          backdrop-blur-3xl
          shadow-[0_0_30px_rgba(0,255,200,0.15)]
          p-6 sm:p-8 lg:p-12
        "
      >
        {/* LOGO */}
        <div className="lg:pl-24 flex justify-center w-full lg:w-auto">
          <LoginLogo />
        </div>

        {/* FORM */}
        <div className="w-full flex justify-center">
          <LoginForm />
        </div>
      </motion.div>
    </div>
  );
}
