// frontend/src/pages/SettingsPage.jsx
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { userApi } from '../services/userApi';
import { settingsApi } from '../services/settingsApi';
import { User, Lock, Shield, Save, Smartphone, Moon, Sun, ToggleLeft, ToggleRight, Loader2 } from 'lucide-react';
import Button from '../components/Button';
import useAuthStore from '../store/authStore';
import { useTheme } from '../context/ThemeContext';
import toast from 'react-hot-toast';

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState('profile');
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Settings</h1>
        <p className="text-sm text-slate-500 mt-1">Manage your account and preferences</p>
      </div>
      <div className="bg-white rounded-xl border border-slate-200">
        <div className="border-b border-slate-200">
          <nav className="flex space-x-4 px-6 overflow-x-auto">
            {[
              { id: 'profile', label: 'Profile', icon: User },
              { id: 'password', label: 'Password', icon: Lock },
              { id: 'security', label: 'Security', icon: Shield },
              { id: 'system', label: 'System', icon: Smartphone },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center space-x-2 py-4 px-2 border-b-2 text-sm font-medium transition-colors whitespace-nowrap ${
                  activeTab === tab.id
                    ? 'border-primary text-primary'
                    : 'border-transparent text-slate-500 hover:text-slate-700'
                }`}
              >
                <tab.icon className="w-4 h-4" />
                <span>{tab.label}</span>
              </button>
            ))}
          </nav>
        </div>
        <div className="p-6">
          {activeTab === 'profile' && <ProfileTab />}
          {activeTab === 'password' && <PasswordTab />}
          {activeTab === 'security' && <SecurityInfo />}
          {activeTab === 'system' && <SystemTab />}
        </div>
      </div>
    </div>
  );
}

function ProfileTab() {
  const { user } = useAuthStore();
  const [formData, setFormData] = useState({ fullName: user?.fullName || '', phone: '', address: '' });
  const updateMutation = useMutation({
    mutationFn: (data) => userApi.updateProfile(data),
    onSuccess: (res) => toast.success(res.data?.message || 'Profile updated successfully'),
    onError: (error) => toast.error(error.response?.data?.message || error.message || 'Failed to update profile'),
  });

  return (
    <form onSubmit={(e) => { e.preventDefault(); updateMutation.mutate(formData); }} className="space-y-4 max-w-2xl">
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">Full Name</label>
        <input type="text" value={formData.fullName} onChange={(e) => setFormData({ ...formData, fullName: e.target.value })} className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50" />
      </div>
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">Phone</label>
        <input type="text" value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50" placeholder="01XXXXXXXXX" />
      </div>
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">Address</label>
        <textarea value={formData.address} onChange={(e) => setFormData({ ...formData, address: e.target.value })} rows="3" className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50" />
      </div>
      <div className="flex items-center justify-between pt-4 border-t border-slate-200">
        <div className="text-sm text-slate-500">Username: <span className="font-medium text-slate-900">{user?.username}</span><span className="ml-2 px-2 py-0.5 bg-primary/10 text-primary rounded text-xs">{user?.role}</span></div>
        <Button type="submit" isLoading={updateMutation.isPending}><Save className="w-4 h-4" /><span>Save Changes</span></Button>
      </div>
    </form>
  );
}

function PasswordTab() {
  const [formData, setFormData] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const changeMutation = useMutation({
    mutationFn: (data) => userApi.changePassword(data),
    onSuccess: (res) => { toast.success(res.data?.message || 'Password changed successfully'); setFormData({ currentPassword: '', newPassword: '', confirmPassword: '' }); },
    onError: (error) => toast.error(error.response?.data?.message || error.message || 'Failed to change password'),
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (formData.newPassword !== formData.confirmPassword) { toast.error('Passwords do not match'); return; }
    if (formData.newPassword.length < 6) { toast.error('Password must be at least 6 characters'); return; }
    changeMutation.mutate({ currentPassword: formData.currentPassword, newPassword: formData.newPassword });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 max-w-2xl">
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">Current Password</label>
        <input type="password" value={formData.currentPassword} onChange={(e) => setFormData({ ...formData, currentPassword: e.target.value })} className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50" required />
      </div>
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">New Password</label>
        <input type="password" value={formData.newPassword} onChange={(e) => setFormData({ ...formData, newPassword: e.target.value })} className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50" required />
      </div>
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">Confirm New Password</label>
        <input type="password" value={formData.confirmPassword} onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })} className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50" required />
      </div>
      <div className="flex justify-end pt-4 border-t border-slate-200">
        <Button type="submit" isLoading={changeMutation.isPending}><Lock className="w-4 h-4" /><span>Change Password</span></Button>
      </div>
    </form>
  );
}

function SecurityInfo() {
  const { user } = useAuthStore();
  return (
    <div className="max-w-2xl space-y-4">
      <div className="bg-green-50 border border-green-200 rounded-lg p-4">
        <h3 className="font-semibold text-green-900 mb-2">Account Security Status</h3>
        <ul className="space-y-2 text-sm text-green-800">
          <li className="flex items-center space-x-2"><span className="text-green-600">✓</span><span>Password hashing: bcrypt (10 rounds)</span></li>
          <li className="flex items-center space-x-2"><span className="text-green-600">✓</span><span>JWT token authentication</span></li>
          <li className="flex items-center space-x-2"><span className="text-green-600">✓</span><span>Role-based access control</span></li>
          <li className="flex items-center space-x-2"><span className="text-green-600">✓</span><span>Audit logging enabled</span></li>
          <li className="flex items-center space-x-2"><span className="text-green-600">✓</span><span>Rate limiting active</span></li>
        </ul>
      </div>
      <div className="bg-slate-50 border border-slate-200 rounded-lg p-4">
        <h3 className="font-semibold text-slate-900 mb-2">Session Information</h3>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between"><span className="text-slate-500">User ID</span><span className="font-mono text-slate-900">{user?.id}</span></div>
          <div className="flex justify-between"><span className="text-slate-500">Role</span><span className="font-medium text-slate-900">{user?.role}</span></div>
          <div className="flex justify-between"><span className="text-slate-500">Token Storage</span><span className="font-medium text-slate-900">localStorage</span></div>
        </div>
      </div>
    </div>
  );
}

function SystemTab() {
  const queryClient = useQueryClient();
  const { theme, toggleTheme } = useTheme();

  // Fetch SMS mock mode
  const { data: smsMockData, isLoading: smsLoading } = useQuery({
    queryKey: ['smsMockMode'],
    queryFn: () => settingsApi.getSmsMockMode().then(res => res.data.data),
  });

  const toggleSmsMockMutation = useMutation({
    mutationFn: (enabled) => settingsApi.setSmsMockMode(enabled),
    onSuccess: (res) => {
      const newMode = res.data.data.mockMode;
      queryClient.setQueryData(['smsMockMode'], { mockMode: newMode });
      toast.success(newMode ? 'SMS Mock Mode enabled' : 'SMS Mock Mode disabled');
    },
    onError: (error) => toast.error(error.response?.data?.message || error.message || 'Failed to toggle SMS mock mode'),
  });

  const isSmsMock = smsMockData?.mockMode ?? true;

  const handleToggleSmsMock = () => {
    toggleSmsMockMutation.mutate(!isSmsMock);
  };

  return (
    <div className="max-w-2xl space-y-6">
      <h3 className="text-lg font-semibold text-slate-900">System Settings</h3>

      {/* Dark Mode Toggle */}
      <div className="flex items-center justify-between p-4 bg-slate-50 rounded-lg border border-slate-200">
        <div className="flex items-center space-x-3">
          {theme === 'light' ? <Sun className="w-5 h-5 text-amber-500" /> : <Moon className="w-5 h-5 text-indigo-400" />}
          <div>
            <p className="font-medium text-slate-900">Dark Mode</p>
            <p className="text-sm text-slate-500">Toggle between light and dark theme</p>
          </div>
        </div>
        <button
          onClick={toggleTheme}
          className="relative inline-flex h-6 w-11 items-center rounded-full bg-slate-300 dark:bg-slate-600 transition-colors focus:outline-none"
        >
          <span
            className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
              theme === 'dark' ? 'translate-x-6' : 'translate-x-1'
            }`}
          />
        </button>
      </div>

      {/* SMS Mock Mode Toggle */}
      <div className="flex items-center justify-between p-4 bg-slate-50 rounded-lg border border-slate-200">
        <div className="flex items-center space-x-3">
          <Smartphone className="w-5 h-5 text-primary" />
          <div>
            <p className="font-medium text-slate-900">SMS Mock Mode</p>
            <p className="text-sm text-slate-500">
              {isSmsMock
                ? 'Simulate SMS sending without real carrier'
                : 'Send real SMS messages (requires integration)'}
            </p>
          </div>
        </div>
        <button
          onClick={handleToggleSmsMock}
          disabled={toggleSmsMockMutation.isPending || smsLoading}
          className={`flex items-center space-x-2 px-4 py-2 rounded-lg font-medium transition-all ${
            isSmsMock
              ? 'bg-amber-600 hover:bg-amber-700 text-white'
              : 'bg-green-600 hover:bg-green-700 text-white'
          } disabled:opacity-50 disabled:cursor-not-allowed`}
        >
          {toggleSmsMockMutation.isPending ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : isSmsMock ? (
            <>
              <ToggleRight className="w-5 h-5" />
              <span>Mock Mode ON</span>
            </>
          ) : (
            <>
              <ToggleLeft className="w-5 h-5" />
              <span>Live Mode ON</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
}