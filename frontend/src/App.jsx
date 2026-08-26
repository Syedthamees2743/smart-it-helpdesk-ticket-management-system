import { Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import ProtectedRoute from "./routes/ProtectedRoute";
import Login from "./pages/auth/Login";
import SettingsPage from "./components/settings/SettingsPage";
import UserManagement from "./pages/admin/UserManagement";
import DepartmentManagement from "./pages/admin/DepartmentManagement";
import IssueCategoryManagement from "./pages/admin/IssueCategoryManagement";
import RaiseComplaint from "./pages/employee/RaiseComplaint";
import MyTickets from "./pages/employee/MyTickets";
import TicketDetails from "./components/ticket/TicketDetails";
import TicketManagement from "./pages/admin/TicketManagement";
import AssignedTickets from "./pages/technician/AssignedTickets";
import TechnicianTicketDetails from "./pages/technician/TechnicianTicketDetails";
import AssetManagement from "./pages/admin/AssetManagement";
import AssetDetails from "./pages/admin/AssetDetails";
import AssetCategoryManagement from "./pages/admin/AssetCategoryManagement";
import MyAssets from "./pages/employee/MyAssets";
import DashboardLayout from "./components/layout/DashboardLayout";

// DAY 10: New imports
import FeedbackManagement from "./pages/admin/FeedbackManagement";
import NotificationCenter from "./pages/notifications/NotificationCenter";
import Reports from "./pages/admin/Reports";

import FAQManagement from "./pages/admin/FAQManagement";
import KnowledgeBase from "./pages/employee/KnowledgeBase";

import TechnicianPerformance from './pages/admin/TechnicianPerformance';
import MyPerformance from './pages/technician/MyPerformance';

import AdminProfile from "./pages/admin/AdminProfile";
import EmployeeProfile from "./pages/employee/EmployeeProfile";
import TechnicianProfile from "./pages/technician/TechnicianProfile";

import AdminDashboard from "./pages/admin/AdminDashboard";
import EmployeeDashboard from "./pages/employee/EmployeeDashboard";
import TechnicianDashboard from "./pages/technician/TechnicianDashboard";

// Help & Support
import HelpSupport from "./pages/support/HelpSupport";

// NEW: Signup & Activation Pages
import EmployeeSignup from "./pages/auth/EmployeeSignup";
import TechnicianSignup from "./pages/auth/TechnicianSignup";
import ActivateAccount from "./pages/auth/ActivateAccount";

// NEW: Admin Pending Requests
import PendingRequests from "./pages/admin/PendingRequests";

// Placeholder for future pages
const Placeholder = ({ title }) => (
  <div className="p-5 h4 text-muted">{title} - Coming Soon</div>
);

const AppRoutes = () => {
  const { loading } = useAuth();

  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center vh-100 bg-light">
        <div className="spinner-border text-primary" role="status"></div>
      </div>
    );
  }

  return (
    <Routes>
      {/* ==================== PUBLIC ROUTES ==================== */}
      <Route path="/login" element={<Login />} />
      
      {/* NEW: Signup Routes (Public) */}
      <Route path="/employee/signup" element={<EmployeeSignup />} />
      <Route path="/technician/signup" element={<TechnicianSignup />} />
      
      {/* NEW: Account Activation Route (Public) */}
      <Route path="/activate-account/:token" element={<ActivateAccount />} />

      {/* ==================== ADMIN ROUTES ==================== */}
      <Route
        path="/admin"
        element={
          <ProtectedRoute allowedRoles={["admin"]}>
            <DashboardLayout role="admin" />
          </ProtectedRoute>
        }
      >
        <Route index element={<AdminDashboard />} />
        <Route path="users" element={<UserManagement />} />
        <Route path="pending-requests" element={<PendingRequests />} />
        <Route path="departments" element={<DepartmentManagement />} />
        <Route path="categories" element={<IssueCategoryManagement />} />
        <Route path="tickets" element={<TicketManagement />} />
        <Route path="tickets/:id" element={<TicketDetails />} />
        <Route path="assets" element={<AssetManagement />} />
        <Route path="asset-categories" element={<AssetCategoryManagement />} />
        <Route path="assets/:id" element={<AssetDetails />} />
        <Route path="feedbacks" element={<FeedbackManagement />} />
        <Route path="notifications" element={<NotificationCenter />} />
        <Route path="reports" element={<Reports />} />
        <Route path="technician-performance" element={<TechnicianPerformance />} />
        <Route path="faqs" element={<FAQManagement />} />
        <Route path="settings" element={<SettingsPage />} />
        <Route path="profile" element={<AdminProfile />} />
        <Route path="help" element={<HelpSupport />} />
      </Route>

      {/* ==================== EMPLOYEE ROUTES ==================== */}
      <Route
        path="/employee"
        element={
          <ProtectedRoute allowedRoles={["employee"]}>
            <DashboardLayout role="employee" />
          </ProtectedRoute>
        }
      >
        <Route index element={<EmployeeDashboard />} />
        <Route path="tickets/new" element={<RaiseComplaint />} />
        <Route path="tickets" element={<MyTickets />} />
        <Route path="tickets/:id" element={<TicketDetails />} />
        <Route path="assets" element={<MyAssets />} />
        <Route path="assets/:id" element={<AssetDetails />} />
        <Route path="notifications" element={<NotificationCenter />} />
        <Route path="faqs" element={<KnowledgeBase />} />
        <Route path="settings" element={<SettingsPage />} />
        <Route path="profile" element={<EmployeeProfile />} />
        <Route path="help" element={<HelpSupport />} />
      </Route>

      {/* ==================== TECHNICIAN ROUTES ==================== */}
      <Route
        path="/technician"
        element={
          <ProtectedRoute allowedRoles={["technician"]}>
            <DashboardLayout role="technician" />
          </ProtectedRoute>
        }
      >
        <Route index element={<TechnicianDashboard />} />
        <Route path="tickets" element={<AssignedTickets />} />
        <Route path="tickets/:id" element={<TechnicianTicketDetails />} />
        <Route path="notifications" element={<NotificationCenter />} />
        <Route path="performance" element={<MyPerformance />} />
        <Route path="faqs" element={<KnowledgeBase />} />
        <Route path="settings" element={<SettingsPage />} />
        <Route path="profile" element={<TechnicianProfile />} />
        <Route path="help" element={<HelpSupport />} />
      </Route>

      {/* ==================== CATCH-ALL ==================== */}
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
};

function App() {
  return (
    <AuthProvider>
      <AppRoutes />
      <ToastContainer
        position="top-right"
        autoClose={4000}
        hideProgressBar={false}
        newestOnTop
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="colored"
      />
    </AuthProvider>
  );
}

export default App;