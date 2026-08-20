import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { routerApi } from '../services/routerApi';
import { Plus, Edit, Trash2, TestTube, Server, Users, CheckCircle, XCircle, Loader2 } from 'lucide-react';
import Button from '../components/Button';
import Badge from '../components/Badge';
import Modal from '../components/Modal';
import RouterForm from '../components/RouterForm';
import toast from 'react-hot-toast';

export default function RoutersPage() {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingRouter, setEditingRouter] = useState(null);
  const [testingId, setTestingId] = useState(null);
  const queryClient = useQueryClient();

  const { data: routers, isLoading } = useQuery({
    queryKey: ['routers'],
    queryFn: () => routerApi.getAll().then(res => res.data.data),
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => routerApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries(['routers']);
      toast.success('Router deleted');
    },
    onError: (error) => toast.error(error.response?.data?.message || 'Failed to delete'),
  });

  const testMutation = useMutation({
    mutationFn: (id) => routerApi.testConnection(id),
    onSuccess: (res) => {
      const { success, data } = res.data;
      if (success) {
        toast.success(data.message);
      } else {
        toast.error(data.message);
      }
    },
    onError: () => toast.error('Connection test failed'),
    onSettled: () => setTestingId(null),
  });

  const handleTest = (id) => {
    setTestingId(id);
    testMutation.mutate(id);
  };

  const handleDelete = (id, name, customerCount) => {
    if (customerCount > 0) {
      toast.error(`Cannot delete: ${customerCount} customers assigned`);
      return;
    }
    if (window.confirm(`Delete router "${name}"?`)) {
      deleteMutation.mutate(id);
    }
  };

  return (
    <div className="space-y-4 lg:space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Routers</h1>
          <p className="text-sm text-slate-500 mt-1">Manage MikroTik router connections</p>
        </div>
        <Button onClick={() => { setEditingRouter(null); setIsFormOpen(true); }}>
          <Plus className="w-4 h-4" />
          <span>Add Router</span>
        </Button>
      </div>

      {/* Routers Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-6">
        {isLoading ? (
          <div className="col-span-full text-center py-12 text-slate-500">Loading...</div>
        ) : routers?.length === 0 ? (
          <div className="col-span-full text-center py-12">
            <Server className="w-12 h-12 text-slate-300 mx-auto mb-2" />
            <p className="text-slate-500">No routers configured</p>
          </div>
        ) : (
          routers?.map((router) => (
            <div key={router.id} className="bg-white rounded-xl border border-slate-200 p-5 hover:shadow-lg transition-shadow">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
                    <Server className="w-6 h-6 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-slate-900">{router.name}</h3>
                    <p className="text-xs text-slate-500 font-mono">{router.ipAddress}:{router.apiPort}</p>
                  </div>
                </div>
                <Badge variant={router.isActive ? 'success' : 'danger'}>
                  {router.isActive ? 'Active' : 'Inactive'}
                </Badge>
              </div>

              <div className="space-y-2 mb-4 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-slate-500">Username</span>
                  <span className="font-medium text-slate-900">{router.username}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-500">Customers</span>
                  <span className="font-medium text-slate-900 flex items-center space-x-1">
                    <Users className="w-4 h-4" />
                    <span>{router._count?.customers || 0}</span>
                  </span>
                </div>
              </div>

              <div className="flex space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleTest(router.id)}
                  disabled={testingId === router.id}
                  className="flex-1"
                >
                  {testingId === router.id ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <TestTube className="w-4 h-4" />
                  )}
                  <span>Test</span>
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => { setEditingRouter(router); setIsFormOpen(true); }}
                >
                  <Edit className="w-4 h-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleDelete(router.id, router.name, router._count?.customers || 0)}
                  className="text-red-600 border-red-200 hover:bg-red-50"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Form Modal */}
      <Modal
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        title={editingRouter ? 'Edit Router' : 'Add New Router'}
      >
        <RouterForm
          router={editingRouter}
          onSuccess={() => {
            setIsFormOpen(false);
            queryClient.invalidateQueries(['routers']);
          }}
          onCancel={() => setIsFormOpen(false)}
        />
      </Modal>
    </div>
  );
}