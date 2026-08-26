// frontend/src/components/customer/CustomerProtectedRoute.jsx
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import useCustomerAuthStore from '../../store/customerAuthStore';

export default function CustomerProtectedRoute() {
  const isAuthenticated = useCustomerAuthStore((state) => state.isAuthenticated);
  const location = useLocation();

  if (!isAuthenticated) {
    return <Navigate to="/login?tab=customer" state={{ from: location }} replace />;
  }

  return <Outlet />;
}

