import { Outlet } from "react-router-dom";
import Header from "@/components/layouts/header/Header";
import Sidebar from "./Sidebar";

export default function DashboardLayout() {
  return (
    <div className="flex min-h-screen bg-bg-light dark:bg-bg-dark font-sans transition-colors relative">
      <Sidebar />
      <div className="flex-1 flex flex-col relative">
        <Header />
        <main className="flex-1 p-6 overflow-y-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
