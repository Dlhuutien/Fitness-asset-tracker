import { Navigate } from "react-router-dom";
import DashboardLayout from "@/components/layouts/dashboard/DashboardLayout";
import PageTransition from "@/components/common/PageTransition";

// Pages
import DashboardPage from "@/pages/DashboardPage";
import LoginPage from "@/pages/LoginPage";

// Equipment
import EquipmentListPage from "@/pages/equipment/EquipmentListPage";
import EquipmentGroupPage from "@/pages/equipment/EquipmentGroupPage";
import EquipmentAddGroupPage from "@/pages/equipment/EquipmentGroupTypePage";
import EquipmentAddCardPage from "@/components/layouts/equipment/EquipmentAddCardPage";
import EquipmentImportPage from "@/pages/equipment/EquipmentImportPage";
import EquipmentProfilePage from "@/pages/equipment/EquipmentProfilePage";

// Staff
import StaffPage from "@/pages/staff/StaffPage";
import StaffProfile from "@/pages/staff/StaffProfile";
import AddStaffPage from "@/pages/staff/AddStaffPage";

// Vendor
import VendorPage from "@/pages/vendor/VendorPage";

// Invoice
import InvoicePage from "@/pages/invoice/InvoicePage";
import InvoiceAddPage from "@/pages/invoice/InvoiceAddPage";

// Maintenance
import MaintenancePage from "@/pages/maintenance/MaintenancePage";

// Profile user
import UserProfile from "@/pages/userProfile/UserProfile";

//Branch
import BranchPage from "@/pages/branch/branchListPage";

import NotificationScreen from "@/pages/NotificationScreen";

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
        path: "/app/equipment/list",
        element: (
          <PageTransition>
            <EquipmentListPage />
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
        path: "/app/equipment/page",
        element: (
          <PageTransition>
            <EquipmentGroupPage />
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
      {
        path: "/app/invoice/add",
        element: (
          <PageTransition>
            <InvoiceAddPage />
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
