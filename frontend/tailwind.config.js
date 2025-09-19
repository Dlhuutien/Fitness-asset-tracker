/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: ["class"],
  content: [
    "./index.html",
    "./src/**/*.{js,jsx,ts,tsx}"
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: "#2563eb", // xanh dương
          foreground: "#ffffff",
        },
        secondary: {
          DEFAULT: "#f97316", // cam
          foreground: "#ffffff",
        },
      },
    },
  },
  plugins: [],
}
