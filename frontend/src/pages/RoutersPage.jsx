import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { routerApi } from '../services/routerApi';
import { settingsApi } from '../services/settingsApi';
import {
  Plus, Edit, Trash2, TestTube, Server, Users,
  CheckCircle, XCircle, Loader2, ToggleLeft, ToggleRight,
  AlertTriangle, Eye, RefreshCw
} from 'lucide-react';
import Button from '../components/Button';
import Badge from '../components/Badge';
import Modal from '../components/Modal';
import RouterForm from '../components/RouterForm';
import toast from 'react-hot-toast';

export default function RoutersPage() {
  const navigate = useNavigate();
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingRouter, setEditingRouter] = useState(null);
  const [testingId, setTestingId] = useState(null);
  const queryClient = useQueryClient();

  const { data: routers, isLoading, refetch } = useQuery({
    queryKey: ['routers'],
    queryFn: () => routerApi.getAll().then(res => res.data.data),
    staleTime: 60000,
  });

  const { data: mockModeData, isLoading: mockModeLoading } = useQuery({
    queryKey: ['mikrotikMockMode'],
    queryFn: () => settingsApi.getMikrotikMockMode().then(res => res.data.data),
  });

  const toggleMockModeMutation = useMutation({
    mutationFn: (enabled) => settingsApi.setMikrotikMockMode(enabled),
    onSuccess: (res) => {
      const newMode = res.data.data.mockMode;
      queryClient.setQueryData(['mikrotikMockMode'], { mockMode: newMode });
      toast.success(newMode ? 'Mock Mode enabled' : 'Mock Mode disabled - connecting to real routers');
    },
    onError: (error) => toast.error(error.response?.data?.message || 'Failed to toggle mock mode'),
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
        toast.success(data.message || 'Connection successful');
      } else {
        toast.error(data.message || 'Connection failed');
      }
    },
    onError: (error) => {
      const message = error.response?.data?.message || 'Connection test failed';
      toast.error(message);
    },
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

  const handleToggleMockMode = () => {
    const currentMode = mockModeData?.mockMode ?? true;
    const newMode = !currentMode;
    if (!newMode) {
      if (!window.confirm('Disable Mock Mode? This will connect to REAL MikroTik routers. Ensure your routers are configured correctly.')) {
        return;
      }
    }
    toggleMockModeMutation.mutate(newMode);
  };

  const isMockMode = mockModeData?.mockMode ?? true;

  return (
    <div className="space-y-4 lg:space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Routers</h1>
          <p className="text-sm text-slate-500 mt-1">Manage MikroTik router connections</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => refetch()}>
            <RefreshCw className="w-4 h-4" />
            <span>Refresh</span>
          </Button>
          <Button onClick={() => { setEditingRouter(null); setIsFormOpen(true); }}>
            <Plus className="w-4 h-4" />
            <span>Add Router</span>
          </Button>
        </div>
      </div>

      <div className={`rounded-xl border p-4 ${isMockMode ? 'bg-amber-50 border-amber-200' : 'bg-green-50 border-green-200'}`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            {isMockMode ? (
              <AlertTriangle className="w-6 h-6 text-amber-600" />
            ) : (
              <CheckCircle className="w-6 h-6 text-green-600" />
            )}
            <div>
              <h3 className={`font-semibold ${isMockMode ? 'text-amber-900' : 'text-green-900'}`}>
                MikroTik {isMockMode ? 'Mock Mode' : 'Live Mode'}
              </h3>
              <p className={`text-sm ${isMockMode ? 'text-amber-700' : 'text-green-700'}`}>
                {isMockMode
                  ? 'Simulating router operations without connecting to real hardware'
                  : 'Connected to real MikroTik routers via RouterOS API'}
              </p>
            </div>
          </div>
          <button
            onClick={handleToggleMockMode}
            disabled={toggleMockModeMutation.isPending || mockModeLoading}
            className={`flex items-center space-x-2 px-4 py-2 rounded-lg font-medium transition-all ${
              isMockMode
                ? 'bg-green-600 hover:bg-green-700 text-white'
                : 'bg-amber-600 hover:bg-amber-700 text-white'
            } disabled:opacity-50 disabled:cursor-not-allowed`}
          >
            {toggleMockModeMutation.isPending ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : isMockMode ? (
              <>
                <ToggleRight className="w-5 h-5" />
                <span>Enable Live Mode</span>
              </>
            ) : (
              <>
                <ToggleLeft className="w-5 h-5" />
                <span>Enable Mock Mode</span>
              </>
            )}
          </button>
        </div>
      </div>

      {isMockMode && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h3 className="font-semibold text-blue-900 mb-2">💡 Important Note</h3>
          <p className="text-sm text-blue-800">
            Your backend is deployed on Render (cloud) and cannot reach local network routers (10.120.6.1). 
            For production use, you need to either:
          </p>
          <ul className="text-sm text-blue-800 mt-2 ml-4 list-disc">
            <li>Deploy the backend on a server that can access your local network</li>
            <li>Set up a VPN tunnel between Render and your local network</li>
            <li>Use a public IP or domain for your MikroTik router</li>
          </ul>
        </div>
      )}

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
                  onClick={() => navigate(`/routers/${router.id}`)}
                  className="flex-1"
                >
                  <Eye className="w-4 h-4" />
                  <span>Details</span>
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleTest(router.id)}
                  disabled={testingId === router.id}
                >
                  {testingId === router.id ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <TestTube className="w-4 h-4" />
                  )}
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