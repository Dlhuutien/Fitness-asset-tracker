import { useEffect, useState } from "react";
import { BrowserRouter as Router, useRoutes } from "react-router-dom";
import routes from "@/config/routes";
import { Toaster } from "./components/ui/toaster";
import useEquipmentUnitStore from "@/store/equipmentUnitStore";
import useEquipmentStore from "@/store/equipmentStore";

function AppRoutes() {
  return useRoutes(routes);
}

export default function App() {
  const [theme, setTheme] = useState(localStorage.getItem("theme") || "light");

  const preloadEquipmentUnit = useEquipmentUnitStore((s) => s.preload);
  const preloadEquipment = useEquipmentStore((s) => s.preload);

  useEffect(() => {
    console.log("🚀 useEffect preload bắt đầu"); // <— thêm dòng này

    const loadAll = async () => {
      try {
        await Promise.all([preloadEquipmentUnit(), preloadEquipment()]);
        console.log("✅ Tất cả preload xong");
      } catch (err) {
        console.error("❌ Có lỗi khi preload:", err);
      }
    };
    loadAll();
  }, []);

  useEffect(() => {
    const root = document.documentElement;
    if (theme === "dark") {
      root.classList.add("dark");
    } else {
      root.classList.remove("dark");
    }
    localStorage.setItem("theme", theme);
  }, [theme]);

  return (
    <Router>
      <div className="min-h-screen bg-bg-light dark:bg-bg-dark transition-colors duration-300">
        <AppRoutes />
        <Toaster />
      </div>
    </Router>
  );
}
