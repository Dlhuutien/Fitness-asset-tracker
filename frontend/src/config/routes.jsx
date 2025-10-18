import { Navigate } from "react-router-dom";
import DashboardLayout from "@/components/layouts/dashboard/DashboardLayout";
import PageTransition from "@/components/common/PageTransition";

// Pages
import DashboardPage from "@/pages/DashboardPage";
import LoginPage from "@/pages/LoginPage";

// Equipment
import EquipmentAddGroupPage from "@/pages/equipment/EquipmentAddCardPage";
import EquipmentAddCardPage from "@/pages/equipment/EquipmentAddCardPage";
import EquipmentImportPage from "@/pages/equipment/EquipmentImportPage";
import EquipmentProfilePage from "@/pages/equipment/EquipmentUnitProfilePage";
import EquipmentSpecsPage from "@/pages/equipment/EquipmentProfilePage";
import TransferEquipmentPage from "@/pages/transfer/TransferEquipmentPage";
// Staff
import StaffPage from "@/pages/staff/StaffPage";
import StaffProfile from "@/pages/staff/StaffProfile";
import AddStaffPage from "@/pages/staff/AddStaffPage";

// Vendor
import VendorPage from "@/pages/vendor/VendorPage";

// Invoice
import InvoicePage from "@/pages/invoice/InvoicePage";

// Maintenance
import MaintenancePage from "@/pages/maintenance/MaintenancePage";

// Profile user
import UserProfile from "@/pages/userProfile/UserProfile";

//Branch
import BranchPage from "@/pages/branch/branchListPage";

import NotificationScreen from "@/pages/NotificationScreen";
import EquipmentDirectoryPage from "@/pages/equipment/EquipmentDirectoryPage";

const routes = [
  // Auth
  {
    path: "/login",
    element: (
      <PageTransition>
        <LoginPage />
      </PageTransition>
    ),
  },
  {
    path: "/",
    element: <Navigate to="/login" replace />,
  },

  // Dashboard layout
  {
    element: <DashboardLayout />,
    children: [
      // Dashboard
      {
        path: "/app",
        element: (
          <PageTransition>
            <DashboardPage />
          </PageTransition>
        ),
      },

      // Equipment
      {
        path: "/app/equipment/directory",
        element: (
          <PageTransition>
            <EquipmentDirectoryPage />
          </PageTransition>
        ),
      },
      {
        path: "/app/equipment/:id",
        element: (
          <PageTransition>
            <EquipmentProfilePage />
          </PageTransition>
        ),
      },
      {
        path: "/app/equipment/specs/:id",
        element: (
          <PageTransition>
            <EquipmentSpecsPage />
          </PageTransition>
        ),
      },
      {
        path: "/app/equipment/add-group",
        element: (
          <PageTransition>
            <EquipmentAddGroupPage />
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
      // Staff
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
      // Vendor
      {
        path: "/app/vendor",
        element: (
          <PageTransition>
            <VendorPage />
          </PageTransition>
        ),
      },

      // Branch
      {
        path: "/app/branch",
        element: (
          <PageTransition>
            <BranchPage />
          </PageTransition>
        ),
      },

      // Invoice
      {
        path: "/app/invoice",
        element: (
          <PageTransition>
            <InvoicePage />
          </PageTransition>
        ),
      },

      // Maintenance
      {
        path: "/app/maintenance",
        element: (
          <PageTransition>
            <MaintenancePage />
          </PageTransition>
        ),
      },

      // User Profile
      {
        path: "/userProfile",
        element: <UserProfile />,
      },

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
