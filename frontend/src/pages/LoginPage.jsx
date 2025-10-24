import { useState } from "react";
import { motion } from "framer-motion";
import BubbleBackground from "@/components/layouts/login/BubbleBackground";
import LoginLogo from "@/components/layouts/login/LoginLogo";
import LoginForm from "@/components/layouts/login/LoginForm";
// import AuthService from "@/services/AuthService"

export default function LoginPage() {
  const [darkMode, setDarkMode] = useState(true);

  return (
    <div
      className={`${
        darkMode ? "login-bg-dark" : "login-bg-light"
      } h-screen flex items-center justify-center font-sans relative overflow-hidden`}
    >
      {/* Hiệu ứng bong bóng */}
      <BubbleBackground />

      {/* Khối chính */}
      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: 40 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 1, ease: "easeOut" }}
        className="relative z-10 flex items-center justify-center gap-x-40
             w-[95%] max-w-7xl 
             rounded-[2rem] 
             bg-white/20 dark:bg-black/30 
             border border-white/30 
             backdrop-blur-3xl 
             shadow-[0_0_30px_rgba(0,255,200,0.15)] 
             p-12"
      >
        <div className="pl-24">
          {" "}
          {/* ✅ dịch logo qua phải 3rem (~48px) */}
          <LoginLogo />
        </div>
        <LoginForm />
      </motion.div>
    </div>
  );
}
