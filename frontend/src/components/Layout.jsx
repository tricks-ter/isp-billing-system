import { useState } from 'react';
import { Outlet, NavLink, useNavigate, useLocation } from 'react-router-dom';
import {
  LayoutDashboard, Users, CreditCard, Wifi, Receipt,
  BarChart3, Settings, LogOut, Menu, X, Bell, Server, Zap,
  Wallet, Shield, Activity
} from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { notificationApi } from '../services/notificationApi';
import useAuthStore from '../store/authStore';
import ThemeToggle from './ThemeToggle';
import toast from 'react-hot-toast';

const navItems = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/customers', icon: Users, label: 'Customers' },
  { to: '/packages', icon: Wifi, label: 'Packages' },
  { to: '/billing', icon: CreditCard, label: 'Billing' },
  { to: '/payments', icon: Receipt, label: 'Payments' },
  { to: '/routers', icon: Server, label: 'Routers' },
  { to: '/live-status', icon: Zap, label: 'Live Status' },
  { to: '/finance', icon: Wallet, label: 'Finance' },
  { to: '/reports', icon: BarChart3, label: 'Reports' },
  { to: '/users', icon: Shield, label: 'Users' },
  { to: '/audit-logs', icon: Activity, label: 'Audit Logs' },
  { to: '/settings', icon: Settings, label: 'Settings' },
];

export default function Layout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();
  const location = useLocation();

  const { data: notifData } = useQuery({
    queryKey: ['unreadNotifs'],
    queryFn: () => notificationApi.getUnreadCount().then(res => res.data.data),
    refetchInterval: 30000,
  });

  const handleLogout = () => {
    logout();
    toast.success('Logged out successfully');
    navigate('/login');
  };

  const currentPageTitle = navItems.find(item => item.to === location.pathname)?.label || 'Dashboard';

  return (
    <div className="min-h-screen bg-background flex">
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <aside className={`
        fixed lg:sticky inset-y-0 left-0 z-50 w-64 bg-white dark:bg-slate-800 border-r border-slate-200 dark:border-slate-700
        transform transition-transform duration-300 ease-in-out
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        flex flex-col h-screen
      `}>
        <div className="h-16 flex items-center justify-between px-6 border-b border-slate-200 dark:border-slate-700 flex-shrink-0">
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-primary to-blue-600 flex items-center justify-center shadow-sm">
              <Wifi className="w-5 h-5 text-white" />
            </div>
            <div>
              <span className="text-lg font-bold text-slate-900 dark:text-slate-100">ISP Billing</span>
              <p className="text-[10px] text-slate-500 dark:text-slate-400 -mt-1">Management System</p>
            </div>
          </div>
          <button onClick={() => setSidebarOpen(false)} className="lg:hidden text-slate-400 hover:text-slate-600 dark:hover:text-slate-300">
            <X className="w-5 h-5" />
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto p-3 space-y-1">
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider px-3 py-2">Main Menu</p>
          {navItems.slice(0, 6).map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              onClick={() => setSidebarOpen(false)}
              className={({ isActive }) =>
                `flex items-center space-x-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 group
                ${isActive
                  ? 'bg-primary text-white shadow-sm shadow-primary/20'
                  : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 hover:text-slate-900 dark:hover:text-slate-100'
                }`
              }
            >
              <item.icon className="w-5 h-5 flex-shrink-0" />
              <span>{item.label}</span>
            </NavLink>
          ))}

          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider px-3 py-2 mt-4">Network & Finance</p>
          {navItems.slice(6, 9).map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              onClick={() => setSidebarOpen(false)}
              className={({ isActive }) =>
                `flex items-center space-x-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200
                ${isActive
                  ? 'bg-primary text-white shadow-sm shadow-primary/20'
                  : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 hover:text-slate-900 dark:hover:text-slate-100'
                }`
              }
            >
              <item.icon className="w-5 h-5 flex-shrink-0" />
              <span>{item.label}</span>
            </NavLink>
          ))}

          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider px-3 py-2 mt-4">System</p>
          {navItems.slice(9).map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              onClick={() => setSidebarOpen(false)}
              className={({ isActive }) =>
                `flex items-center space-x-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200
                ${isActive
                  ? 'bg-primary text-white shadow-sm shadow-primary/20'
                  : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 hover:text-slate-900 dark:hover:text-slate-100'
                }`
              }
            >
              <item.icon className="w-5 h-5 flex-shrink-0" />
              <span>{item.label}</span>
            </NavLink>
          ))}
        </nav>

        <div className="p-4 border-t border-slate-200 dark:border-slate-700 flex-shrink-0">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-blue-600 text-white flex items-center justify-center font-bold text-sm flex-shrink-0 shadow-sm">
              {user?.fullName?.charAt(0) || 'A'}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-slate-900 dark:text-slate-100 truncate">{user?.fullName}</p>
              <p className="text-xs text-slate-500 dark:text-slate-400 capitalize">{user?.role?.toLowerCase()}</p>
            </div>
            <button
              onClick={handleLogout}
              className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
              title="Logout"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>

      <div className="flex-1 flex flex-col min-w-0">
        <header className="h-16 bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between px-4 lg:px-6 sticky top-0 z-30 flex-shrink-0">
          <div className="flex items-center space-x-3">
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden p-2 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg"
            >
              <Menu className="w-5 h-5" />
            </button>
            <div className="hidden sm:block">
              <h1 className="text-lg font-semibold text-slate-900 dark:text-slate-100">{currentPageTitle}</h1>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <ThemeToggle />
            <button 
              onClick={() => navigate('/notifications')} 
              className="relative p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
            >
              <Bell className="w-5 h-5" />
              {notifData?.count > 0 && (
                <span className="absolute top-1 right-1 min-w-[18px] h-[18px] px-1 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center ring-2 ring-white dark:ring-slate-800">
                  {notifData.count > 99 ? '99+' : notifData.count}
                </span>
              )}
            </button>
          </div>
        </header>

        <main className="flex-1 p-4 lg:p-6 overflow-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}