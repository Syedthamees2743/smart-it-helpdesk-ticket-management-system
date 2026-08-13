import { Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./context/AuthContext";
import ProtectedRoute from "./routes/ProtectedRoute";
import Login from "./pages/auth/Login";
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

import AdminDashboard from "./pages/admin/AdminDashboard";
import EmployeeDashboard from "./pages/employee/EmployeeDashboard";
import TechnicianDashboard from "./pages/technician/TechnicianDashboard";

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
      <Route path="/login" element={<Login />} />

      {/* Admin Routes */}
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
        <Route path="departments" element={<DepartmentManagement />} />
        <Route path="categories" element={<IssueCategoryManagement />} />
        <Route path="tickets" element={<TicketManagement />} />
        <Route path="tickets/:id" element={<TicketDetails />} />
        <Route path="assets" element={<AssetManagement />} />
        <Route path="asset-categories" element={<AssetCategoryManagement />} />
        <Route path="assets/:id" element={<AssetDetails />} />
        <Route path="feedbacks" element={<FeedbackManagement />} />
        {/* DAY 10: New routes */}
        <Route path="notifications" element={<NotificationCenter />} />
        <Route path="reports" element={<Reports />} />
        <Route path="technician-performance" element={<TechnicianPerformance />} />
        {/* End Day 10 */}
        <Route path="faqs" element={<FAQManagement />} />
        <Route path="profile" element={<Placeholder title="Admin Profile" />} />
      </Route>

      {/* Employee Routes */}
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
        {/* DAY 10: New route */}
        <Route path="notifications" element={<NotificationCenter />} />
        {/* End Day 10 */}
        <Route path="faqs" element={<KnowledgeBase />} />
        <Route path="feedbacks" element={<Placeholder title="Feedbacks" />} />
        <Route path="assets/new" element={<Placeholder title="Add Asset" />} />
        <Route path="profile" element={<Placeholder title="My Profile" />} />
      </Route>

      {/* Technician Routes */}
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
        {/* DAY 10: New route */}
        <Route path="notifications" element={<NotificationCenter />} />
        {/* End Day 10 */}
        <Route
          path="performance"
          element={<MyPerformance />}
        />
        <Route path="faqs" element={<KnowledgeBase />} />
        <Route path="profile" element={<Placeholder title="My Profile" />} />
      </Route>

      {/* Catch-all for wrong URLs */}
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
};

function App() {
  return (
    <AuthProvider>
      <AppRoutes />
    </AuthProvider>
  );
}

export default App;
