import { useEffect, useState } from "react"
import { BrowserRouter as Router, useRoutes } from "react-router-dom"
import routes from "@/config/routes"
import { Toaster } from "./components/ui/toaster"
import useAuthRefresh from "@/hooks/useAuthRefresh";

function AppRoutes() {
  useAuthRefresh();
  return useRoutes(routes)
}

export default function App() {
  const [theme, setTheme] = useState(localStorage.getItem("theme") || "light")

  useEffect(() => {
    const root = document.documentElement
    if (theme === "dark") {
      root.classList.add("dark")
    } else {
      root.classList.remove("dark")
    }
    localStorage.setItem("theme", theme)
  }, [theme])

  return (
    <Router>
      <div className="min-h-screen bg-bg-light dark:bg-bg-dark transition-colors duration-300">
        <AppRoutes />
        <Toaster />
      </div>
    </Router>
  )
}
