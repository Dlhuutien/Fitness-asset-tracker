/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: "class", // ✅ Bật dark mode theo class
  content: ["./index.html", "./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      colors: {
        // ✅ Màu chính
        primary: {
          DEFAULT: "#2563eb", // xanh dương
          foreground: "#ffffff",
        },
        secondary: {
          DEFAULT: "#f97316", // cam
          foreground: "#ffffff",
        },

        // ✅ Màu riêng cho thương hiệu
        brand: {
          DEFAULT: "#22c55e", // xanh lá chính
          dark: "#15803d",
          light: "#4ade80",
        },
        accent: {
          DEFAULT: "#0ea5e9", // xanh dương nhấn
          dark: "#0369a1",
          light: "#38bdf8",
        },

        // ✅ Nền sáng/tối
        bg: {
          light: "#f8fafc", // nền sáng
          dark: "#0f172a", // nền tối
          card: "#1e293b", // nền card
          vibrant: "#ffdde1",
        },
      },

      // ✅ Font dùng chung
      fontFamily: {
        sans: ["Inter", "Poppins", "sans-serif"],
        montserrat: ["Montserrat", "sans-serif"],
        jakarta: ["Plus Jakarta Sans", "sans-serif"],
      },

      // ✅ Hiệu ứng
      boxShadow: {
        neon: "0 0 20px rgba(34, 197, 94, 0.6)",
        glow: "0 0 40px rgba(14, 165, 233, 0.5)",
      },
      animation: {
        "spin-slow": "spin 6s linear infinite",
        "pulse-slow": "pulse 4s ease-in-out infinite",
        float: "float 4s ease-in-out infinite",
        "gradient-x": "gradient-x 6s ease infinite",
      },
      keyframes: {
        float: {
          "0%, 100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-10px)" },
        },
        "gradient-x": {
          "0%, 100%": { backgroundPosition: "0% 50%" },
          "50%": { backgroundPosition: "100% 50%" },
        },
      },
      keyframes: {
        rowPulse: {
          "0%,100%": { backgroundColor: "rgba(16,185,129,0.08)" },
          "50%": { backgroundColor: "rgba(16,185,129,0.22)" },
        },
      },
      animation: {
        rowPulse: "rowPulse 1.6s ease-in-out infinite",
      },
    },
  },
  plugins: [],
};
