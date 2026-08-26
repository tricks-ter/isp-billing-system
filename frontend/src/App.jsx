// frontend/src/App.jsx
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'react-hot-toast';

// Admin / Staff components
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

// Public Payment Pages
import CustomerQuickPayPage from './pages/CustomerQuickPayPage';
import PaymentSuccessPage from './pages/PaymentSuccessPage';
import PaymentFailedPage from './pages/PaymentFailedPage';
import MockBkashPage from './pages/MockBkashPage';

// Customer Self-Care Portal Components
import CustomerProtectedRoute from './components/customer/CustomerProtectedRoute';
import CustomerLayout from './components/customer/CustomerLayout';
import CustomerDashboardPage from './pages/customer/CustomerDashboardPage';
import CustomerInvoicesPage from './pages/customer/CustomerInvoicesPage';
import CustomerPaymentsPage from './pages/customer/CustomerPaymentsPage';
import CustomerTicketsPage from './pages/customer/CustomerTicketsPage';
import CustomerPackagesPage from './pages/customer/CustomerPackagesPage';
import CustomerProfilePage from './pages/customer/CustomerProfilePage';

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
          {/* Unified Login & Public Customer Payment Routes */}
          <Route path="/login" element={<Login />} />
          <Route path="/portal/login" element={<Navigate to="/login?tab=customer" replace />} />
          <Route path="/pay/:token" element={<CustomerQuickPayPage />} />
          <Route path="/payment/success" element={<PaymentSuccessPage />} />
          <Route path="/payment/failed" element={<PaymentFailedPage />} />
          <Route path="/payment/mock-bkash" element={<MockBkashPage />} />

          {/* Protected Customer Self-Care Portal Routes */}
          <Route element={<CustomerProtectedRoute />}>
            <Route element={<CustomerLayout />}>
              <Route path="/portal/dashboard" element={<CustomerDashboardPage />} />
              <Route path="/portal/invoices" element={<CustomerInvoicesPage />} />
              <Route path="/portal/payments" element={<CustomerPaymentsPage />} />
              <Route path="/portal/tickets" element={<CustomerTicketsPage />} />
              <Route path="/portal/packages" element={<CustomerPackagesPage />} />
              <Route path="/portal/profile" element={<CustomerProfilePage />} />
            </Route>
          </Route>

          {/* Protected Admin & Staff Management Routes */}
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

          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </BrowserRouter>
    </QueryClientProvider>
  );
}

export default App;