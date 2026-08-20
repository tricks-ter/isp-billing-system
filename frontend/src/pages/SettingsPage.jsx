import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { userApi } from '../services/userApi';
import { User, Lock, Save, Shield } from 'lucide-react';
import Button from '../components/Button';
import useAuthStore from '../store/authStore';
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
          <nav className="flex space-x-4 px-6">
            {[{ id: 'profile', label: 'Profile', icon: User }, { id: 'password', label: 'Password', icon: Lock }, { id: 'security', label: 'Security', icon: Shield }].map((tab) => (
              <button key={tab.id} onClick={() => setActiveTab(tab.id)} className={`flex items-center space-x-2 py-4 px-2 border-b-2 text-sm font-medium transition-colors ${activeTab === tab.id ? 'border-primary text-primary' : 'border-transparent text-slate-500 hover:text-slate-700'}`}>
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
    onSuccess: () => toast.success('Profile updated'),
    onError: (error) => toast.error(error.response?.data?.message || 'Failed to update'),
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
    onSuccess: () => { toast.success('Password changed successfully'); setFormData({ currentPassword: '', newPassword: '', confirmPassword: '' }); },
    onError: (error) => toast.error(error.response?.data?.message || 'Failed to change password'),
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