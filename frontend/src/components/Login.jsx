// frontend/src/components/Login.jsx
import { useState, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { User, Lock, Eye, EyeOff, Wifi, Loader2, Shield, Smartphone, ArrowRight, HelpCircle } from 'lucide-react';
import { z } from 'zod';
import { authApi } from '../services/authApi';
import { customerPortalApi } from '../services/customerPortalApi';
import useAuthStore from '../store/authStore';
import useCustomerAuthStore from '../store/customerAuthStore';
import toast from 'react-hot-toast';

const adminSchema = z.object({
  username: z.string().min(3, 'Username must be at least 3 characters'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

const customerSchema = z.object({
  username: z.string().min(2, 'Please enter your PPPoE username or phone number'),
  password: z.string().min(1, 'Please enter your PPPoE password'),
});

export default function Login() {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialTab = searchParams.get('tab') === 'admin' ? 'admin' : 'customer';
  const [activeTab, setActiveTab] = useState(initialTab); // 'customer' or 'admin'
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState({ username: '', password: '' });

  const usernameRef = useRef(null);
  const passwordRef = useRef(null);
  const navigate = useNavigate();

  const adminLogin = useAuthStore((state) => state.login);
  const customerLogin = useCustomerAuthStore((state) => state.login);

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    setSearchParams(tab === 'admin' ? { tab: 'admin' } : { tab: 'customer' });
    setErrors({ username: '', password: '' });
    if (usernameRef.current) usernameRef.current.value = '';
    if (passwordRef.current) passwordRef.current.value = '';
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const username = usernameRef.current?.value?.trim() || '';
    const password = passwordRef.current?.value?.trim() || '';
    const formData = { username, password };

    if (activeTab === 'customer') {
      // Validate customer inputs
      const result = customerSchema.safeParse(formData);
      if (!result.success) {
        const fieldErrors = {};
        result.error.errors.forEach((err) => {
          fieldErrors[err.path[0]] = err.message;
        });
        setErrors(fieldErrors);
        return;
      }

      setIsLoading(true);
      try {
        const res = await customerPortalApi.login(formData);
        const { token, customer } = res.data.data;
        customerLogin(customer, token);
        toast.success(`Welcome to Self-Care, ${customer.name}!`);
        navigate('/portal/dashboard');
      } catch (error) {
        const message = error.response?.data?.message || error.message || 'Customer login failed. Check your PPPoE username & password.';
        toast.error(message);
      } finally {
        setIsLoading(false);
      }
    } else {
      // Validate admin inputs
      const result = adminSchema.safeParse(formData);
      if (!result.success) {
        const fieldErrors = {};
        result.error.errors.forEach((err) => {
          fieldErrors[err.path[0]] = err.message;
        });
        setErrors(fieldErrors);
        return;
      }

      setIsLoading(true);
      try {
        const response = await authApi.login(formData);
        const { token, user } = response.data.data;
        adminLogin(user, token);
        toast.success(`Welcome back, ${user.fullName}!`);
        navigate('/dashboard');
      } catch (error) {
        const message = error.response?.data?.message || error.message || 'Login failed. Please verify your credentials.';
        toast.error(message);
      } finally {
        setIsLoading(false);
      }
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-indigo-950 p-4 sm:p-6 text-slate-800">
      <div className="w-full max-w-md bg-white/95 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/20 p-6 sm:p-8 space-y-6">
        {/* Header / Logo */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-tr from-primary to-blue-600 text-white shadow-lg shadow-primary/30 mb-1">
            <Wifi className="w-7 h-7" />
          </div>
          <h1 className="text-2xl font-black tracking-tight text-slate-900">
            ISP Broadband Portal
          </h1>
          <p className="text-xs text-slate-500 font-medium">
            Unified Self-Care &amp; Network Management System
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="flex p-1 bg-slate-100/90 rounded-2xl border border-slate-200">
          <button
            type="button"
            onClick={() => handleTabChange('customer')}
            className={`flex-1 py-2.5 px-3 rounded-xl text-xs sm:text-sm font-semibold transition-all duration-200 flex items-center justify-center space-x-1.5 cursor-pointer ${
              activeTab === 'customer'
                ? 'bg-white text-primary shadow-sm shadow-slate-200'
                : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            <Smartphone className="w-4 h-4 flex-shrink-0" />
            <span>Customer Portal</span>
          </button>
          <button
            type="button"
            onClick={() => handleTabChange('admin')}
            className={`flex-1 py-2.5 px-3 rounded-xl text-xs sm:text-sm font-semibold transition-all duration-200 flex items-center justify-center space-x-1.5 cursor-pointer ${
              activeTab === 'admin'
                ? 'bg-white text-slate-900 shadow-sm shadow-slate-200'
                : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            <Shield className="w-4 h-4 flex-shrink-0 text-indigo-600" />
            <span>Staff &amp; Admin</span>
          </button>
        </div>

        {/* Information Banner */}
        <div className={`p-3 rounded-xl text-xs flex items-start space-x-2 border ${
          activeTab === 'customer'
            ? 'bg-blue-50/80 border-blue-100 text-blue-800'
            : 'bg-indigo-50/80 border-indigo-100 text-indigo-800'
        }`}>
          <HelpCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
          <p>
            {activeTab === 'customer'
              ? 'Broadband subscribers: Sign in with your PPPoE username & password to view connection speed, due bills, and pay with bKash.'
              : 'ISP Administrators & Billing Staff: Sign in with your administrative account to manage network routers, OLTs, and customers.'}
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Username / PPPoE */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
              {activeTab === 'customer' ? 'PPPoE Username or Phone' : 'Admin Username'}
            </label>
            <div className="relative">
              <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                ref={usernameRef}
                type="text"
                autoComplete="username"
                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all text-slate-900"
                placeholder={activeTab === 'customer' ? 'e.g. user_uttara_01 or 017XXXXXXXX' : 'admin'}
                onChange={() => setErrors((prev) => ({ ...prev, username: '' }))}
              />
            </div>
            {errors.username && (
              <p className="text-xs text-red-500 font-medium">{errors.username}</p>
            )}
          </div>

          {/* Password */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
              {activeTab === 'customer' ? 'PPPoE Password' : 'Password'}
            </label>
            <div className="relative">
              <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                ref={passwordRef}
                type={showPassword ? 'text' : 'password'}
                autoComplete="current-password"
                className="w-full pl-10 pr-12 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all text-slate-900"
                placeholder="••••••••"
                onChange={() => setErrors((prev) => ({ ...prev, password: '' }))}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                tabIndex={-1}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            {errors.password && (
              <p className="text-xs text-red-500 font-medium">{errors.password}</p>
            )}
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={isLoading}
            className={`w-full text-white font-semibold py-3 rounded-xl shadow-lg transition-all duration-200 disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center space-x-2 cursor-pointer ${
              activeTab === 'customer'
                ? 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 shadow-blue-500/25'
                : 'bg-gradient-to-r from-slate-900 to-indigo-950 hover:from-slate-800 hover:to-indigo-900 shadow-slate-900/25'
            }`}
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Signing in...</span>
              </>
            ) : (
              <>
                <span>{activeTab === 'customer' ? 'Access Customer Self-Care' : 'Sign in to Admin Dashboard'}</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        {/* Footer Support Notice */}
        <div className="pt-2 border-t border-slate-100 text-center">
          <p className="text-xs text-slate-400">
            Need assistance or forgot PPPoE credentials?{' '}
            <span className="font-semibold text-slate-600">Contact ISP Support Desk</span>
          </p>
        </div>
      </div>
    </div>
  );
}