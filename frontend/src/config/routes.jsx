import { Navigate } from "react-router-dom";
import DashboardLayout from "@/components/layouts/dashboard/DashboardLayout";
import PageTransition from "@/components/common/PageTransition";

// 🧩 Auth
import LoginPage from "@/pages/LoginPage";

// 🏠 Dashboard
import DashboardPage from "@/pages/DashboardPage";

// 🏋️ Equipment
import EquipmentGroupPage from "@/pages/equipment/EquipmentGroupPage";
import EquipmentTypePage from "@/pages/equipment/EquipmentTypePage";
import EquipmentSectionPage from "@/pages/equipment/EquipmentSectionPage";
import EquipmentUnitListPage from "@/pages/equipment/EquipmentUnitListPage";
import EquipmentImportPage from "@/pages/equipment/EquipmentImportPage";
import EquipmentProfilePage from "@/pages/equipment/EquipmentProfilePage";
import EquipmentUnitProfilePage from "@/pages/equipment/EquipmentUnitDetailPage";
import EquipmentAddCardPage from "@/pages/equipment/EquipmentAddCardPage";
import EquipmentDisposalPage from "@/pages/disposal/EquipmentDisposalPage";
import TransferEquipmentPage from "@/pages/transfer/TransferEquipmentPage";

// 🧰 Maintenance
import MaintenancePage from "@/pages/maintenance/MaintenancePage";

// 🧾 Invoice
import InvoicePage from "@/pages/invoice/InvoicePage";

// 🏭 Vendor
import VendorPage from "@/pages/vendor/VendorPage";

// 👥 Staff
import StaffPage from "@/pages/staff/StaffPage";
import StaffProfile from "@/pages/staff/StaffProfile";
import AddStaffPage from "@/pages/staff/AddStaffPage";

// 🏢 Branch
import BranchPage from "@/pages/branch/branchListPage";

// 👤 User Profile
import UserProfile from "@/pages/userProfile/UserProfile";

// 🔔 Notification
import NotificationScreen from "@/pages/NotificationScreen";

const routes = [
  // 🔐 Auth
  {
    path: "/login",
    element: (
      <PageTransition>
        <LoginPage />
      </PageTransition>
    ),
  },
  { path: "/", element: <Navigate to="/login" replace /> },

  // 🧱 Dashboard Layout
  {
    element: <DashboardLayout />,
    children: [
      // 🏠 Dashboard
      {
        path: "/app",
        element: (
          <PageTransition>
            <DashboardPage />
          </PageTransition>
        ),
      },

      // 🏋️ Equipment Management
      {
        path: "/app/equipment/group",
        element: (
          <PageTransition>
            <EquipmentGroupPage />
          </PageTransition>
        ),
      },
      {
        path: "/app/equipment/type",
        element: (
          <PageTransition>
            <EquipmentTypePage />
          </PageTransition>
        ),
      },
      {
        path: "/app/equipment/list",
        element: (
          <PageTransition>
            <EquipmentSectionPage />
          </PageTransition>
        ),
      },
      {
        path: "/app/equipment/unit",
        element: (
          <PageTransition>
            <EquipmentUnitListPage />
          </PageTransition>
        ),
      },
      {
        path: "/app/equipment/import",
        element: (
          <PageTransition>
            <EquipmentImportPage />
          </PageTransition>
        ),
      },
      {
        path: "/app/equipment/transfer",
        element: (
          <PageTransition>
            <TransferEquipmentPage />
          </PageTransition>
        ),
      },
      {
        path: "/app/equipment/disposal",
        element: (
          <PageTransition>
            <EquipmentDisposalPage />
          </PageTransition>
        ),
      },
      {
        path: "/app/equipment/add-card",
        element: (
          <PageTransition>
            <EquipmentAddCardPage />
          </PageTransition>
        ),
      },
      {
        path: "/app/equipment/:id",
        element: (
          <PageTransition>
            <EquipmentUnitProfilePage />
          </PageTransition>
        ),
      },
      {
        path: "/app/equipment/specs/:id",
        element: (
          <PageTransition>
            <EquipmentProfilePage />
          </PageTransition>
        ),
      },

      // 🧰 Maintenance
      {
        path: "/app/maintenance",
        element: (
          <PageTransition>
            <MaintenancePage />
          </PageTransition>
        ),
      },

      // 🧾 Invoice
      {
        path: "/app/invoice",
        element: (
          <PageTransition>
            <InvoicePage />
          </PageTransition>
        ),
      },

      // 🏭 Vendor
      {
        path: "/app/vendor",
        element: (
          <PageTransition>
            <VendorPage />
          </PageTransition>
        ),
      },

      // 👥 Staff
      {
        path: "/app/staff",
        element: (
          <PageTransition>
            <StaffPage />
          </PageTransition>
        ),
      },
      {
        path: "/app/staff/add",
        element: (
          <PageTransition>
            <AddStaffPage />
          </PageTransition>
        ),
      },
      {
        path: "/app/staff/:id",
        element: (
          <PageTransition>
            <StaffProfile />
          </PageTransition>
        ),
      },

      // 🏢 Branch
      {
        path: "/app/branch",
        element: (
          <PageTransition>
            <BranchPage />
          </PageTransition>
        ),
      },

      // 👤 User Profile
      {
        path: "/userProfile",
        element: (
          <PageTransition>
            <UserProfile />
          </PageTransition>
        ),
      },

      // 🔔 Notification
      {
        path: "/notifications",
        element: (
          <PageTransition>
            <NotificationScreen />
          </PageTransition>
        ),
      },
    ],
  },
];

export default routes;
