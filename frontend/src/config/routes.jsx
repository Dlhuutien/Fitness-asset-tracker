import { Navigate } from "react-router-dom";
import DashboardLayout from "@/components/layouts/DashboardLayout";

import DashboardPage from "@/pages/DashboardPage";
import LoginPage from "@/pages/LoginPage";
import StaffPage from "@/pages/staff/StaffPage";
import EquipmentPage from "@/pages/equipment/EquipmentPage";
import VendorPage from "@/pages/vendor/VendorPage";
import InvolvePage from "@/pages/involve/InvolvePage";

const routes = [
  {
    path: "/login",
    element: <LoginPage />,
  },
  {
    path: "/",
    element: <Navigate to="/login" replace />,
  },
  {
    element: <DashboardLayout />,
    children: [
      { path: "/app", element: <DashboardPage /> },
      { path: "/app/staff", element: <StaffPage /> },
      {
        path: "/app/equipment",
        element: <EquipmentPage />, // trang tổng
        children: [
          { path: "page", element: <div>Danh mục thiết bị</div> },
          { path: "list", element: <div>Danh sách thiết bị</div> },
          { path: "add", element: <div>Thêm thiết bị</div> },
        ],
      },
      { path: "/app/vendor", element: <VendorPage /> },
      { path: "/app/involve", element: <InvolvePage /> },
    ],
  },
];

export default routes;
