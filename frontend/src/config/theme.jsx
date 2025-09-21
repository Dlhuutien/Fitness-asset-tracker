/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./index.html", "./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      colors: {
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
        bg: {
          dark: "#0f172a", // nền tối
          light: "#f8fafc", // nền sáng
          card: "#1e293b", // nền card
        },
      },
      fontFamily: {
        sans: ["Inter", "sans-serif"],
        heading: ["Poppins", "sans-serif"],
      },
      boxShadow: {
        neon: "0 0 20px rgba(34, 197, 94, 0.6)",
        glow: "0 0 40px rgba(14, 165, 233, 0.5)",
      },
      animation: {
        "spin-slow": "spin 6s linear infinite",
        "pulse-slow": "pulse 4s ease-in-out infinite",
        float: "float 4s ease-in-out infinite",
      },
      keyframes: {
        float: {
          "0%, 100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-10px)" },
        },
      },
    },
  },
  plugins: [],
};
