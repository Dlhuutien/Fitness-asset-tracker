import { useState } from "react"
import { motion } from "framer-motion"
import BubbleBackground from "@/components/layouts/login/BubbleBackground"
import LoginLogo from "@/components/layouts/login/LoginLogo"
import LoginForm from "@/components/layouts/login/LoginForm"
import ThemeSwitch from "@/components/common/ThemeSwitch"

export default function LoginPage() {
  const [darkMode, setDarkMode] = useState(true)

  return (
    <div
      className={`${
        darkMode ? "login-bg-dark" : "login-bg-light"
      } h-screen flex items-center justify-center font-sans relative overflow-hidden`}
    >
      {/* Hiệu ứng bong bóng */}
      <BubbleBackground />

      {/* Nút đổi theme */}
      <ThemeSwitch darkMode={darkMode} setDarkMode={setDarkMode} />

      {/* Khối chính */}
      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: 40 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 1, ease: "easeOut" }}
        className="relative z-10 flex items-center justify-center gap-x-60 w-[95%] max-w-7xl bg-white/10 dark:bg-black/20 rounded-3xl shadow-2xl p-12 border border-white/20 backdrop-blur-2xl glass-card"
      >
        <LoginLogo />
        <LoginForm />
      </motion.div>
    </div>
  )
}
