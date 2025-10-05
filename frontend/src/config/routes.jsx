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

// Vendor
import VendorPage from "@/pages/vendor/VendorPage";
import VendorAddPage from "@/pages/vendor/VendorAddPage";

// Invoice
import InvoicePage from "@/pages/invoice/InvoicePage";
import InvoiceAddPage from "@/pages/invoice/InvoiceAddPage";

// Maintenance
import MaintenanceUrgentPage from "@/pages/maintenance/MaintenanceUrgentPage";
import MaintenanceReadyPage from "@/pages/maintenance/MaintenanceReadyPage";

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
      {
        path: "/app/vendor/add",
        element: (
          <PageTransition>
            <VendorAddPage />
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
        element: <Navigate to="/app/maintenance/urgent" replace />,
      },
      {
        path: "/app/maintenance/urgent",
        element: (
          <PageTransition>
            <MaintenanceUrgentPage />
          </PageTransition>
        ),
      },
      {
        path: "/app/maintenance/ready",
        element: (
          <PageTransition>
            <MaintenanceReadyPage />
          </PageTransition>
        ),
      },
    ],
  },
];

export default routes;
