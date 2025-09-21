import React, { useEffect, useRef, useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import logo from "@/assets/FitXGym.png";
import { motion } from "framer-motion";
import "@/index.css";

export default function Login() {
  const bubbleLayerRef = useRef(null);
  const rafRef = useRef(null);
  const [darkMode, setDarkMode] = useState(true);
  const [showPassword, setShowPassword] = useState(false);

  // Bubble background effect
  useEffect(() => {
    const container = bubbleLayerRef.current;
    if (!container) return;

    let W = container.clientWidth;
    let H = container.clientHeight;
    const NUM = window.innerWidth < 640 ? 18 : 35;

    const rand = (a, b) => a + Math.random() * (b - a);
    const bubbles = [];

    for (let i = 0; i < NUM; i++) {
      const el = document.createElement("div");
      el.className = "bubble";
      const size = rand(40, 160);
      el.style.width = `${size}px`;
      el.style.height = `${size}px`;
      el.style.borderRadius = "50%";
      el.style.position = "absolute";
      el.style.background = `rgba(34,197,94,${rand(0.08, 0.25)})`;
      el.style.opacity = 0;
      el.style.transform = "scale(0)";

      const x = rand(0, W - size);
      const y = rand(0, H - size);

      container.appendChild(el);

      setTimeout(() => {
        el.style.transition = "opacity 1s ease, transform 1s ease";
        el.style.opacity = 1;
        el.style.transform = `translate3d(${x}px, ${y}px, 0) scale(1)`;
      }, rand(0, 2) * 1000);

      bubbles.push({
        el,
        x,
        y,
        vx: rand(-0.6, 0.6),
        vy: rand(-0.5, 0.5),
        radius: size / 2,
      });
    }

    const onResize = () => {
      W = container.clientWidth;
      H = container.clientHeight;
    };
    window.addEventListener("resize", onResize);

    function step() {
      for (let b of bubbles) {
        b.x += b.vx;
        b.y += b.vy;

        if (b.x < 0 || b.x + b.radius * 2 > W) b.vx *= -0.7;
        if (b.y < 0 || b.y + b.radius * 2 > H) b.vy *= -0.7;

        b.x = Math.max(0, Math.min(b.x, W - b.radius * 2));
        b.y = Math.max(0, Math.min(b.y, H - b.radius * 2));

        const scale = 0.95 + Math.random() * 0.08;
        b.el.style.transform = `translate3d(${b.x}px, ${b.y}px, 0) scale(${scale})`;
      }

      rafRef.current = requestAnimationFrame(step);
    }

    rafRef.current = requestAnimationFrame(step);

    return () => {
      cancelAnimationFrame(rafRef.current);
      window.removeEventListener("resize", onResize);
      bubbles.forEach((b) => b.el.remove());
    };
  }, []);

  return (
    <div
      className={`${
        darkMode ? "login-bg-dark" : "login-bg-light"
      } h-screen flex items-center justify-center font-sans relative overflow-hidden`}
    >
      {/* Bubble layer */}
      <div ref={bubbleLayerRef} className="absolute inset-0 z-0"></div>

      {/* Switch mode */}
      <button
        onClick={() => setDarkMode(!darkMode)}
        className="absolute top-6 right-6 z-20 bg-white/80 dark:bg-black/50 px-4 py-2 rounded-lg shadow-md hover:scale-105 transition flex items-center gap-2"
      >
        {darkMode ? "🌞 Light" : "🌙 Dark"}
      </button>

      {/* Main Card */}
      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: 40 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 1, ease: "easeOut" }}
        className="relative z-10 flex items-center justify-center gap-x-14 w-[95%] max-w-7xl 
                   bg-white/10 dark:bg-black/20 rounded-3xl shadow-2xl p-12 border border-white/20 
                   backdrop-blur-2xl glass-card"
      >
        {/* Logo */}
        <motion.div
          initial={{ x: -50, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ duration: 1, ease: "easeOut" }}
        >
          <motion.img
            src={logo}
            alt="Logo"
            className="w-72 h-72 object-contain animate-glow"
            animate={{
              scale: [1, 1.05, 1],
              opacity: [1, 0.95, 1],
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          />
        </motion.div>

        {/* Form */}
        <motion.div
          initial={{ x: 60, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ duration: 1, delay: 0.3, ease: "easeOut" }}
          className="w-full max-w-lg"
        >
          <Card
            className="p-10 rounded-3xl bg-gradient-to-br from-gray-900/70 via-gray-800/50 to-gray-900/70 
                          border border-white/10 backdrop-blur-2xl shadow-[0_0_30px_rgba(0,255,180,0.15)]"
          >
            <CardHeader>
              <CardTitle
                className="text-center text-4xl font-extrabold 
                                    bg-gradient-to-r from-green-400 via-emerald-300 to-teal-400 
                                    bg-clip-text text-transparent drop-shadow-md"
              >
                Welcome to <span className="text-green-400">FITX</span>
              </CardTitle>
            </CardHeader>

            <CardContent className="space-y-6">
              {/* Username */}
              <div className="relative group">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-green-400">
                  📧
                </span>
                <Input
                  placeholder="Email hoặc Username"
                  className="form-input pl-16"
                />
              </div>

              {/* Password */}
              <div className="relative group">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-green-400">
                  🔒
                </span>
                <Input
                  type={showPassword ? "text" : "password"}
                  placeholder="Password"
                  className="form-input pl-16 pr-14"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 hover:text-green-400 transition"
                >
                  {showPassword ? "🙈" : "👁️"}
                </button>
              </div>

              {/* Login Button */}
              <Button className="form-btn">Log in</Button>
            </CardContent>

            <CardFooter className="flex justify-between text-sm text-gray-400 mt-2">
              <label className="flex items-center gap-2">
                <input type="checkbox" className="accent-green-500" /> Remember
                me
              </label>
              <a href="#" className="hover:text-green-300 transition-colors">
                Forget password?
              </a>
            </CardFooter>
          </Card>
        </motion.div>
      </motion.div>
    </div>
  );
}
