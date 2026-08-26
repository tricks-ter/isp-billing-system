// frontend/src/App.jsx
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'react-hot-toast';
import Login from './components/Login';
import Layout from './components/Layout';
import ProtectedRoute from './components/ProtectedRoute';
import DashboardPage from './pages/DashboardPage';
import CustomersPage from './pages/CustomersPage';
import PackagesPage from './pages/PackagesPage';
import BillingPage from './pages/BillingPage';
import PaymentsPage from './pages/PaymentsPage';
import ReportsPage from './pages/ReportsPage';
import RoutersPage from './pages/RoutersPage';
import RouterDetailPage from './pages/RouterDetailPage';
import OltsPage from './pages/OltsPage';
import OltDetailPage from './pages/OltDetailPage';
import LiveStatusPage from './pages/LiveStatusPage';
import FinancePage from './pages/FinancePage';
import UsersPage from './pages/UsersPage';
import AuditLogsPage from './pages/AuditLogsPage';
import SettingsPage from './pages/SettingsPage';
import NotificationsPage from './pages/NotificationsPage';
import CustomerQuickPayPage from './pages/CustomerQuickPayPage';
import PaymentSuccessPage from './pages/PaymentSuccessPage';
import PaymentFailedPage from './pages/PaymentFailedPage';
import MockBkashPage from './pages/MockBkashPage';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000,
      retry: 1,
    },
  },
});

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 4000,
            style: { background: '#1e293b', color: '#fff', borderRadius: '8px' },
          }}
        />
        <Routes>
          {/* Public Customer Payment & Auth Routes */}
          <Route path="/login" element={<Login />} />
          <Route path="/pay/:token" element={<CustomerQuickPayPage />} />
          <Route path="/payment/success" element={<PaymentSuccessPage />} />
          <Route path="/payment/failed" element={<PaymentFailedPage />} />
          <Route path="/payment/mock-bkash" element={<MockBkashPage />} />

          {/* Protected Admin / Staff Management Routes */}
          <Route element={<ProtectedRoute />}>
            <Route element={<Layout />}>
              <Route path="/dashboard" element={<DashboardPage />} />
              <Route path="/customers" element={<CustomersPage />} />
              <Route path="/packages" element={<PackagesPage />} />
              <Route path="/billing" element={<BillingPage />} />
              <Route path="/payments" element={<PaymentsPage />} />
              <Route path="/routers" element={<RoutersPage />} />
              <Route path="/routers/:id" element={<RouterDetailPage />} />
              <Route path="/olts" element={<OltsPage />} />
              <Route path="/olts/:id" element={<OltDetailPage />} />
              <Route path="/live-status" element={<LiveStatusPage />} />
              <Route path="/finance" element={<FinancePage />} />
              <Route path="/reports" element={<ReportsPage />} />
              <Route path="/users" element={<UsersPage />} />
              <Route path="/audit-logs" element={<AuditLogsPage />} />
              <Route path="/settings" element={<SettingsPage />} />
              <Route path="/notifications" element={<NotificationsPage />} />
            </Route>
          </Route>
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </BrowserRouter>
    </QueryClientProvider>
  );
}

export default App;