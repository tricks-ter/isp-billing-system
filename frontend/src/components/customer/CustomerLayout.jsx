// frontend/src/components/customer/CustomerLayout.jsx
import { useState } from 'react';
import { Outlet, NavLink, useNavigate, Link } from 'react-router-dom';
import {
  LayoutDashboard, CreditCard, Receipt, LifeBuoy, Wifi,
  User, LogOut, Menu, X, ShieldCheck, Activity, Smartphone
} from 'lucide-react';
import useCustomerAuthStore from '../../store/customerAuthStore';
import toast from 'react-hot-toast';

const customerNavItems = [
  { to: '/portal/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/portal/invoices', icon: CreditCard, label: 'Bills & Pay' },
  { to: '/portal/payments', icon: Receipt, label: 'History' },
  { to: '/portal/tickets', icon: LifeBuoy, label: 'Support' },
  { to: '/portal/packages', icon: Wifi, label: 'Packages' },
  { to: '/portal/profile', icon: User, label: 'Profile' },
];

export default function CustomerLayout() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { customer, logout } = useCustomerAuthStore();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    toast.success('Signed out from Self-Care Portal');
    navigate('/login?tab=customer');
  };

  const isSuspended = customer?.status === 'SUSPENDED';

  return (
    <div className="min-h-screen bg-[#090D16] text-slate-100 flex flex-col font-sans antialiased selection:bg-[#E2136E] selection:text-white w-full max-w-full overflow-x-hidden">
      {/* Top Navigation Bar */}
      <header className="sticky top-0 z-40 bg-[#0F172A]/90 backdrop-blur-xl border-b border-slate-800/80 shadow-md w-full">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 sm:h-18 gap-2">
            {/* Brand Logo */}
            <Link to="/portal/dashboard" className="flex items-center space-x-2.5 group flex-shrink-0">
              <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-violet-600 flex items-center justify-center text-white shadow-lg shadow-indigo-600/30 group-hover:scale-105 transition-transform">
                <Wifi className="w-4 h-4 sm:w-5 sm:h-5" />
              </div>
              <div className="flex flex-col">
                <div className="flex items-center space-x-1.5">
                  <span className="font-black text-white text-sm sm:text-base tracking-tight">ISP Self-Care</span>
                  <span className="px-1.5 py-0.5 text-[8px] sm:text-[9px] font-black uppercase tracking-wider bg-blue-500/20 text-blue-400 border border-blue-500/30 rounded-md">
                    Portal
                  </span>
                </div>
                <span className="text-[10px] sm:text-[11px] text-slate-400 font-medium">Broadband Subscriber</span>
              </div>
            </Link>

            {/* Desktop Navigation Links */}
            <nav className="hidden xl:flex items-center space-x-1">
              {customerNavItems.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  className={({ isActive }) =>
                    `flex items-center space-x-1.5 px-3 py-2 rounded-xl text-xs font-bold transition-all duration-150 ${
                      isActive
                        ? 'bg-blue-600 text-white shadow-md shadow-blue-600/25'
                        : 'text-slate-300 hover:text-white hover:bg-slate-800/70'
                    }`
                  }
                >
                  <item.icon className="w-4 h-4 flex-shrink-0" />
                  <span>{item.label}</span>
                </NavLink>
              ))}
            </nav>

            {/* User Profile Info & Actions */}
            <div className="hidden sm:flex items-center space-x-2.5 flex-shrink-0">
              <div className="flex items-center space-x-2 bg-slate-800/60 border border-slate-700/60 py-1.5 px-2.5 rounded-xl">
                <div className="w-6 h-6 rounded-lg bg-blue-500/20 text-blue-400 flex items-center justify-center font-bold text-xs">
                  {customer?.name?.charAt(0) || 'U'}
                </div>
                <div className="text-left">
                  <div className="flex items-center space-x-1">
                    <span className="text-xs font-bold text-white max-w-[100px] truncate">
                      {customer?.name || 'Subscriber'}
                    </span>
                    <span className={`w-1.5 h-1.5 rounded-full ${isSuspended ? 'bg-amber-400 animate-pulse' : 'bg-emerald-400'}`} />
                  </div>
                  <p className="text-[9px] text-slate-400 font-mono leading-none">@{customer?.pppoeUsername}</p>
                </div>
              </div>

              <button
                onClick={handleLogout}
                className="p-2 rounded-xl bg-slate-800/80 hover:bg-rose-500/20 hover:text-rose-400 text-slate-400 border border-slate-700/50 transition-all cursor-pointer"
                title="Sign Out"
              >
                <LogOut className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Mobile Menu Button */}
            <div className="flex xl:hidden items-center space-x-2">
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="p-2 rounded-xl bg-slate-800/90 text-slate-300 hover:text-white border border-slate-700"
              >
                {mobileMenuOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Navigation Drawer */}
        {mobileMenuOpen && (
          <div className="lg:hidden px-4 pt-2 pb-4 border-t border-slate-800 bg-[#0F172A] space-y-1.5 animate-in slide-in-from-top-2 duration-200">
            <div className="p-3 bg-slate-800/70 border border-slate-700/50 rounded-xl mb-3 flex items-center justify-between">
              <div className="flex items-center space-x-2.5">
                <div className="w-8 h-8 rounded-lg bg-blue-600/20 text-blue-400 flex items-center justify-center font-bold text-xs">
                  {customer?.name?.charAt(0) || 'U'}
                </div>
                <div>
                  <p className="text-xs font-bold text-white">{customer?.name}</p>
                  <p className="text-[10px] text-slate-400 font-mono">@{customer?.pppoeUsername}</p>
                </div>
              </div>
              <span className={`px-2.5 py-0.5 text-[10px] font-bold rounded-full ${
                isSuspended ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30' : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
              }`}>
                {customer?.status || 'ACTIVE'}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2">
              {customerNavItems.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  onClick={() => setMobileMenuOpen(false)}
                  className={({ isActive }) =>
                    `flex items-center space-x-2 px-3 py-2.5 rounded-xl text-xs font-semibold ${
                      isActive
                        ? 'bg-blue-600 text-white shadow-sm'
                        : 'text-slate-300 hover:text-white bg-slate-800/40 hover:bg-slate-800'
                    }`
                  }
                >
                  <item.icon className="w-4 h-4" />
                  <span>{item.label}</span>
                </NavLink>
              ))}
            </div>

            <button
              onClick={handleLogout}
              className="w-full mt-3 flex items-center justify-center space-x-2 px-3 py-2.5 rounded-xl text-xs font-bold text-rose-400 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/20 cursor-pointer"
            >
              <LogOut className="w-4 h-4" />
              <span>Log Out of Self-Care</span>
            </button>
          </div>
        )}
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8">
        <Outlet />
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-800/80 bg-[#0B1120] py-6 text-center text-xs text-slate-400">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p>© {new Date().getFullYear()} ISP Broadband Network • Self-Care Portal</p>
          <div className="flex items-center space-x-4 text-slate-400">
            <span>24/7 Helpline Support</span>
            <span>•</span>
            <span className="text-emerald-400 font-medium flex items-center space-x-1">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>bKash Secured PGW</span>
            </span>
          </div>
        </div>
      </footer>
    </div>
  );
}
