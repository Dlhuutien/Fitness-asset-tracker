import { Outlet } from "react-router-dom";
import Header from "@/components/layouts/header/Header";
import Sidebar from "./Sidebar";
import { useState, useEffect } from "react";

export default function DashboardLayout() {
  const [collapsed, setCollapsed] = useState(false);

  // Auto collapse sidebar trên mobile
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 768) {
        setCollapsed(true);
      }
    };

    handleResize(); // chạy ngay khi vào dashboard
    window.addEventListener("resize", handleResize);

    return () => window.removeEventListener("resize", handleResize);
  }, []);

  return (
    <div className="flex min-h-screen bg-bg-light dark:bg-bg-dark font-sans transition-colors">
      {/* Sidebar cố định */}
      <div className="fixed top-0 left-0 h-screen z-50">
        <Sidebar collapsed={collapsed} setCollapsed={setCollapsed} />
      </div>

      {/* Nội dung chính – kéo theo sidebar */}
      <div
        className={`
          flex-1 flex flex-col min-h-screen
          transition-all duration-300
          ${collapsed ? "ml-[80px]" : "ml-[260px]"}
        `}
      >
        <Header />
        <main className="flex-1 p-6 overflow-y-auto pt-20">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
