export default function ThemeSwitch({ darkMode, setDarkMode }) {
  return (
    <button
      onClick={() => setDarkMode(!darkMode)}
      className="absolute top-6 right-6 z-20 bg-white/80 dark:bg-black/50 px-4 py-2 rounded-lg shadow-md hover:scale-105 transition flex items-center gap-2"
    >
      {darkMode ? "🌞 Light" : "🌙 Dark"}
    </button>
  )
}
