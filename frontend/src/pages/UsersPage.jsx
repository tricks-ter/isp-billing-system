import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { userApi } from '../services/userApi';
import { Plus, Edit, Trash2, Shield } from 'lucide-react';
import Button from '../components/Button';
import Badge from '../components/Badge';
import Modal from '../components/Modal';
import toast from 'react-hot-toast';

export default function UsersPage() {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const queryClient = useQueryClient();

  const { data: users, isLoading } = useQuery({
    queryKey: ['users'],
    queryFn: () => userApi.getAll().then(res => res.data.data),
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => userApi.delete(id),
    onSuccess: () => { queryClient.invalidateQueries(['users']); toast.success('User deleted'); },
    onError: (error) => toast.error(error.response?.data?.message || 'Failed'),
  });

  const handleDelete = (id, username) => {
    if (window.confirm(`Delete user "${username}"?`)) {
      deleteMutation.mutate(id);
    }
  };

  const getRoleBadge = (role) => {
    const variants = { ADMIN: 'danger', MANAGER: 'warning', STAFF: 'info' };
    return <Badge variant={variants[role] || 'default'}>{role}</Badge>;
  };

  return (
    <div className="space-y-4 lg:space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">User Management</h1>
          <p className="text-sm text-slate-500 mt-1">Manage system users and roles</p>
        </div>
        <Button onClick={() => { setEditingUser(null); setIsFormOpen(true); }}><Plus className="w-4 h-4" /><span>Add User</span></Button>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">User</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Role</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Created</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-slate-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {isLoading ? (
                <tr><td colSpan="5" className="px-6 py-12 text-center text-slate-500">Loading...</td></tr>
              ) : users?.length === 0 ? (
                <tr><td colSpan="5" className="px-6 py-12 text-center text-slate-500">No users found</td></tr>
              ) : (
                users?.map((u) => (
                  <tr key={u.id} className="hover:bg-slate-50">
                    <td className="px-6 py-4">
                      <div className="flex items-center space-x-3">
                        <div className="w-9 h-9 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-sm">{u.fullName?.charAt(0) || 'U'}</div>
                        <div>
                          <p className="text-sm font-medium text-slate-900">{u.fullName}</p>
                          <p className="text-xs text-slate-500">@{u.username}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">{getRoleBadge(u.role)}</td>
                    <td className="px-6 py-4">
                      <Badge variant={u.isActive ? 'success' : 'danger'}>{u.isActive ? 'Active' : 'Disabled'}</Badge>
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-600">{new Date(u.createdAt).toLocaleDateString('en-GB')}</td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-end space-x-1">
                        <button onClick={() => { setEditingUser(u); setIsFormOpen(true); }} className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg" title="Edit"><Edit className="w-4 h-4" /></button>
                        <button onClick={() => handleDelete(u.id, u.username)} className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg" title="Delete"><Trash2 className="w-4 h-4" /></button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <Modal isOpen={isFormOpen} onClose={() => setIsFormOpen(false)} title={editingUser ? 'Edit User' : 'Add New User'}>
        <UserForm user={editingUser} onSuccess={() => { setIsFormOpen(false); queryClient.invalidateQueries(['users']); }} onCancel={() => setIsFormOpen(false)} />
      </Modal>
    </div>
  );
}

function UserForm({ user, onSuccess, onCancel }) {
  const isEditing = !!user;
  const [formData, setFormData] = useState(user || { username: '', password: '', fullName: '', role: 'STAFF', phone: '', address: '', salary: '' });

  const createMutation = useMutation({
    mutationFn: (data) => userApi.create(data),
    onSuccess: () => { toast.success('User created'); onSuccess(); },
    onError: (error) => toast.error(error.response?.data?.message || 'Failed'),
  });

  const updateMutation = useMutation({
    mutationFn: (data) => userApi.update(user.id, data),
    onSuccess: () => { toast.success('User updated'); onSuccess(); },
    onError: (error) => toast.error(error.response?.data?.message || 'Failed'),
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    const payload = { ...formData };
    if (isEditing && !payload.password) delete payload.password;
    if (payload.salary) payload.salary = parseFloat(payload.salary);

    if (isEditing) {
      updateMutation.mutate(payload);
    } else {
      createMutation.mutate(payload);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Username *</label>
          <input type="text" value={formData.username} onChange={(e) => setFormData({ ...formData, username: e.target.value })} className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50" required disabled={isEditing} />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">{isEditing ? 'New Password (leave blank to keep)' : 'Password *'}</label>
          <input type="password" value={formData.password} onChange={(e) => setFormData({ ...formData, password: e.target.value })} className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50" required={!isEditing} />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Full Name *</label>
          <input type="text" value={formData.fullName} onChange={(e) => setFormData({ ...formData, fullName: e.target.value })} className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50" required />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Role *</label>
          <select value={formData.role} onChange={(e) => setFormData({ ...formData, role: e.target.value })} className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50" required>
            <option value="ADMIN">Admin</option>
            <option value="MANAGER">Manager</option>
            <option value="STAFF">Staff</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Phone</label>
          <input type="text" value={formData.phone || ''} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50" />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Salary (৳)</label>
          <input type="number" step="0.01" value={formData.salary || ''} onChange={(e) => setFormData({ ...formData, salary: e.target.value })} className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50" />
        </div>
      </div>
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">Address</label>
        <textarea value={formData.address || ''} onChange={(e) => setFormData({ ...formData, address: e.target.value })} rows="2" className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50" />
      </div>
      <div className="flex justify-end space-x-3 pt-4 border-t border-slate-200">
        <Button variant="outline" onClick={onCancel} type="button">Cancel</Button>
        <Button type="submit" isLoading={createMutation.isPending || updateMutation.isPending}>{isEditing ? 'Update User' : 'Create User'}</Button>
      </div>
    </form>
  );
}