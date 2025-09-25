import { Outlet, Link, useLocation } from "react-router-dom";

export default function DashboardLayout() {
  const location = useLocation();

  const menuItems = [
    { path: "/app", label: "Dashboard" },
    { path: "/app/staff", label: "Quản lý nhân viên" },
    { path: "/app/devices", label: "Quản lý thiết bị" },
    { path: "/app/vendors", label: "Quản lý NCC" },
    { path: "/app/involve", label: "Thống kê" },
  ];

  return (
    <div className="flex min-h-screen">
      {/* Sidebar */}
      <aside className="w-64 bg-white shadow-md p-4">
        <h2 className="text-2xl font-bold text-green-600 mb-6">FitX Gym</h2>
        <nav className="space-y-2">
          {menuItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={`block px-4 py-2 rounded-lg transition ${
                location.pathname === item.path
                  ? "bg-green-500 text-white"
                  : "hover:bg-gray-100"
              }`}
            >
              {item.label}
            </Link>
          ))}
        </nav>
      </aside>

      {/* Main content */}
      <main className="flex-1 bg-gray-50 p-6">
        <Outlet />
      </main>
    </div>
  );
}
