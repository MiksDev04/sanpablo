import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './contexts/AuthContext';

// Layouts
import BusinessLayout from './layouts/BusinessLayout';
import AdminLayout from './layouts/AdminLayout';

// Public pages
import LoginPage from './pages/LoginPage';
import RegistrationRequestPage from './pages/RegistrationRequestPage';

// Business pages
import BusinessDashboard from './pages/business/BusinessDashboard';
import GuestDataEntry from './pages/business/GuestDataEntry.tsx';
import BusinessMessages from './pages/business/BusinessMessages';
import BusinessReports from './pages/business/BusinessReports';
import BusinessProfile from './pages/business/BusinessProfile';

// Admin pages
import AdminDashboard from './pages/admin/AdminDashboard';
import RegistrationApproval from './pages/admin/RegistrationApproval';
import AdminReports from './pages/admin/AdminReports';
import AdminMessages from './pages/admin/AdminMessages';

function ProtectedRoute({ children, role }: { children: React.ReactNode; role: 'business' | 'admin' }) {
  const { user, isAuthenticated } = useAuth();
  if (!isAuthenticated || !user) return <Navigate to="/login" replace />;
  if (user.role !== role) return <Navigate to={role === 'admin' ? '/admin' : '/business'} replace />;
  return <>{children}</>;
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegistrationRequestPage />} />

      <Route path="/business" element={
        <ProtectedRoute role="business">
          <BusinessLayout />
        </ProtectedRoute>
      }>
        <Route index element={<BusinessDashboard />} />
        <Route path="guest-entry" element={<GuestDataEntry />} />
        <Route path="reports" element={<BusinessReports />} />
        <Route path="messages" element={<BusinessMessages />} />
        <Route path="profile" element={<BusinessProfile />} />
      </Route>

      <Route path="/admin" element={
        <ProtectedRoute role="admin">
          <AdminLayout />
        </ProtectedRoute>
      }>
        <Route index element={<AdminDashboard />} />
        <Route path="registrations" element={<RegistrationApproval />} />
        <Route path="reports" element={<AdminReports />} />
        <Route path="messages" element={<AdminMessages />} />
      </Route>

      <Route path="/" element={<Navigate to="/login" replace />} />
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
}
