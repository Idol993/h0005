import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ToastProvider } from '@/components/common/Toast/ToastContext';
import PrivateRoute from '@/routes/PrivateRoute';
import { UserRole } from '@/types';
import { useAuthStore } from '@/store/authStore';
import { useEffect } from 'react';

import LoginPage from '@/pages/login/LoginPage';
import NotFoundPage from '@/pages/NotFoundPage';

import DriverHomePage from '@/pages/driver/DriverHomePage';
import SearchPage from '@/pages/driver/SearchPage';
import ParkingDetailPage from '@/pages/driver/ParkingDetailPage';
import PaymentPage from '@/pages/driver/PaymentPage';
import ActiveOrderPage from '@/pages/driver/ActiveOrderPage';
import OrderHistoryPage from '@/pages/driver/OrderHistoryPage';
import DriverProfilePage from '@/pages/driver/DriverProfilePage';

import OwnerDashboardPage from '@/pages/owner/OwnerDashboardPage';
import OwnerParkingListPage from '@/pages/owner/OwnerParkingListPage';
import OwnerPublishPage from '@/pages/owner/OwnerPublishPage';
import OwnerOrdersPage from '@/pages/owner/OwnerOrdersPage';
import OwnerFinancePage from '@/pages/owner/OwnerFinancePage';

import AdminDashboardPage from '@/pages/admin/AdminDashboardPage';
import AdminAuditPage from '@/pages/admin/AdminAuditPage';
import AdminDisputesPage from '@/pages/admin/AdminDisputesPage';
import AdminViolationsPage from '@/pages/admin/AdminViolationsPage';
import AdminUsersPage from '@/pages/admin/AdminUsersPage';

function RoleRedirect() {
  const { user } = useAuthStore();
  if (!user) return <Navigate to="/login" replace />;
  const redirectMap: Record<UserRole, string> = {
    [UserRole.DRIVER]: '/',
    [UserRole.OWNER]: '/owner/dashboard',
    [UserRole.ADMIN]: '/admin/dashboard',
  };
  return <Navigate to={redirectMap[user.role]} replace />;
}

export default function App() {
  const { checkAuth } = useAuthStore();

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  return (
    <ToastProvider>
      <Router>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/redirect" element={<RoleRedirect />} />

          <Route
            path="/"
            element={
              <PrivateRoute allowedRoles={[UserRole.DRIVER]}>
                <DriverHomePage />
              </PrivateRoute>
            }
          />
          <Route
            path="/search"
            element={
              <PrivateRoute allowedRoles={[UserRole.DRIVER]}>
                <SearchPage />
              </PrivateRoute>
            }
          />
          <Route
            path="/parking/:id"
            element={
              <PrivateRoute allowedRoles={[UserRole.DRIVER]}>
                <ParkingDetailPage />
              </PrivateRoute>
            }
          />
          <Route
            path="/payment/:orderId"
            element={
              <PrivateRoute allowedRoles={[UserRole.DRIVER]}>
                <PaymentPage />
              </PrivateRoute>
            }
          />
          <Route
            path="/order/active"
            element={
              <PrivateRoute allowedRoles={[UserRole.DRIVER]}>
                <ActiveOrderPage />
              </PrivateRoute>
            }
          />
          <Route
            path="/orders"
            element={
              <PrivateRoute allowedRoles={[UserRole.DRIVER]}>
                <OrderHistoryPage />
              </PrivateRoute>
            }
          />
          <Route
            path="/driver/profile"
            element={
              <PrivateRoute allowedRoles={[UserRole.DRIVER]}>
                <DriverProfilePage />
              </PrivateRoute>
            }
          />

          <Route
            path="/owner/dashboard"
            element={
              <PrivateRoute allowedRoles={[UserRole.OWNER]}>
                <OwnerDashboardPage />
              </PrivateRoute>
            }
          />
          <Route
            path="/owner/parkings"
            element={
              <PrivateRoute allowedRoles={[UserRole.OWNER]}>
                <OwnerParkingListPage />
              </PrivateRoute>
            }
          />
          <Route
            path="/owner/parking/publish"
            element={
              <PrivateRoute allowedRoles={[UserRole.OWNER]}>
                <OwnerPublishPage />
              </PrivateRoute>
            }
          />
          <Route
            path="/owner/parking/edit/:id"
            element={
              <PrivateRoute allowedRoles={[UserRole.OWNER]}>
                <OwnerPublishPage />
              </PrivateRoute>
            }
          />
          <Route
            path="/owner/orders"
            element={
              <PrivateRoute allowedRoles={[UserRole.OWNER]}>
                <OwnerOrdersPage />
              </PrivateRoute>
            }
          />
          <Route
            path="/owner/finance"
            element={
              <PrivateRoute allowedRoles={[UserRole.OWNER]}>
                <OwnerFinancePage />
              </PrivateRoute>
            }
          />

          <Route
            path="/admin/dashboard"
            element={
              <PrivateRoute allowedRoles={[UserRole.ADMIN]}>
                <AdminDashboardPage />
              </PrivateRoute>
            }
          />
          <Route
            path="/admin/audit"
            element={
              <PrivateRoute allowedRoles={[UserRole.ADMIN]}>
                <AdminAuditPage />
              </PrivateRoute>
            }
          />
          <Route
            path="/admin/disputes"
            element={
              <PrivateRoute allowedRoles={[UserRole.ADMIN]}>
                <AdminDisputesPage />
              </PrivateRoute>
            }
          />
          <Route
            path="/admin/violations"
            element={
              <PrivateRoute allowedRoles={[UserRole.ADMIN]}>
                <AdminViolationsPage />
              </PrivateRoute>
            }
          />
          <Route
            path="/admin/users"
            element={
              <PrivateRoute allowedRoles={[UserRole.ADMIN]}>
                <AdminUsersPage />
              </PrivateRoute>
            }
          />

          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </Router>
    </ToastProvider>
  );
}
