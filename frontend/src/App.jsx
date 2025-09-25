import { BrowserRouter, Routes, Route } from "react-router-dom";
import LoginPage from "@/pages/LoginPage";
import DashboardLayout from "@/components/layouts/DashboardLayout";
import DashboardPage from "@/pages/DashboardPage";
import StaffPage from "@/pages/StaffPage";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Trang login */}
        <Route path="/" element={<LoginPage />} />

        {/* Layout chính */}
        <Route path="/app" element={<DashboardLayout />}>
          <Route index element={<DashboardPage />} />
          <Route path="staff" element={<StaffPage />} />
          <Route path="devices" element={<div>Danh sách thiết bị (để trống)</div>} />
          <Route path="vendors" element={<div>Danh sách NCC (để trống)</div>} />
          <Route path="involve" element={<div>Thống kê (để trống)</div>} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
