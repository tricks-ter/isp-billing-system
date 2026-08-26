// frontend/src/pages/RoutersPage.jsx
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

  const { data: routers, isLoading, isFetching, refetch } = useQuery({
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
    onError: (error) => toast.error(error.response?.data?.message || error.message || 'Failed to toggle router mock mode'),
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => routerApi.delete(id),
    onSuccess: (res) => {
      queryClient.invalidateQueries(['routers']);
      toast.success(res.data?.message || 'Router deleted successfully');
    },
    onError: (error) => toast.error(error.response?.data?.message || error.message || 'Failed to delete router'),
  });

  const handleRefresh = async () => {
    await refetch();
    toast.success('Router list refreshed');
  };

  const handleTestConnection = async (id, e) => {
    e.stopPropagation();
    setTestingId(id);
    try {
      const res = await routerApi.testConnection(id);
      const data = res.data.data;
      if (data?.success) {
        toast.success(`Connection successful (${data.latencyMs}ms)`);
      } else {
        toast.error(data?.message || 'Connection failed');
      }
    } catch (error) {
      toast.error(error.response?.data?.message || error.message || 'Connection test failed');
    } finally {
      setTestingId(null);
    }
  };

  const handleDelete = (id, name, e) => {
    e.stopPropagation();
    if (window.confirm(`Are you sure you want to delete router "${name}"?`)) {
      deleteMutation.mutate(id);
    }
  };

  const handleEdit = (router, e) => {
    e.stopPropagation();
    setEditingRouter(router);
    setIsFormOpen(true);
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
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-black text-slate-900 dark:text-slate-100">Routers &amp; BRAS</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Manage MikroTik RouterOS gateways and PPPoE sessions</p>
        </div>
        <div className="flex items-center space-x-3">
          <Button variant="outline" onClick={handleRefresh} className="cursor-pointer">
            <RefreshCw className={`w-4 h-4 ${isFetching ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </Button>
          <Button onClick={() => { setEditingRouter(null); setIsFormOpen(true); }} className="cursor-pointer">
            <Plus className="w-4 h-4" />
            <span>Add Router</span>
          </Button>
        </div>
      </div>

      {/* Mock Mode Banner */}
      <div className={`rounded-2xl border p-5 shadow-sm ${isMockMode ? 'bg-amber-500/10 border-amber-500/30' : 'bg-emerald-500/10 border-emerald-500/30'}`}>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start space-x-3.5">
            {isMockMode ? (
              <AlertTriangle className="w-6 h-6 text-amber-500 flex-shrink-0 mt-0.5" />
            ) : (
              <CheckCircle className="w-6 h-6 text-emerald-500 flex-shrink-0 mt-0.5" />
            )}
            <div>
              <h3 className="font-bold text-sm text-slate-900 dark:text-slate-100">
                MikroTik {isMockMode ? 'Mock Simulation Mode' : 'Live Gateway Mode'}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                {isMockMode
                  ? 'Simulating router operations for testing without connecting to real hardware'
                  : 'Connected to live MikroTik routers via RouterOS API'}
              </p>
            </div>
          </div>
          <button
            onClick={handleToggleMockMode}
            disabled={toggleMockModeMutation.isPending || mockModeLoading}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center space-x-2 ${
              isMockMode
                ? 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-md'
                : 'bg-amber-600 hover:bg-amber-700 text-white shadow-md'
            } disabled:opacity-50`}
          >
            {isMockMode ? <ToggleLeft className="w-4 h-4" /> : <ToggleRight className="w-4 h-4" />}
            <span>{isMockMode ? 'Enable Live Mode' : 'Switch to Mock'}</span>
          </button>
        </div>
      </div>

      {/* Routers Grid */}
      {isLoading ? (
        <div className="py-16 text-center text-slate-400">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-2 text-primary" />
          <span>Loading router configurations...</span>
        </div>
      ) : !routers || routers.length === 0 ? (
        <div className="bg-white dark:bg-slate-800 rounded-3xl border border-slate-200 dark:border-slate-700 p-12 text-center shadow-sm">
          <Server className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
          <h3 className="text-base font-bold text-slate-800 dark:text-slate-200">No Routers Configured</h3>
          <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">Add your first MikroTik router to manage PPPoE queues and automated provisioning.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {routers.map((router) => {
            const isTesting = testingId === router.id;

            return (
              <div
                key={router.id}
                onClick={() => navigate(`/routers/${router.id}`)}
                className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-6 shadow-sm hover:border-primary dark:hover:border-primary hover:shadow-md transition-all cursor-pointer group flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 rounded-xl bg-blue-500/10 text-primary flex items-center justify-center group-hover:scale-105 transition-transform">
                        <Server className="w-5 h-5" />
                      </div>
                      <div>
                        <h3 className="font-bold text-slate-900 dark:text-slate-100 text-base">{router.name}</h3>
                        <p className="text-xs font-mono text-slate-500">{router.host}:{router.port}</p>
                      </div>
                    </div>
                    <Badge variant={router.isActive ? 'success' : 'default'}>
                      {router.isActive ? 'Active' : 'Disabled'}
                    </Badge>
                  </div>

                  <div className="space-y-2 py-3 border-t border-slate-100 dark:border-slate-700/80 text-xs text-slate-600 dark:text-slate-300">
                    <div className="flex justify-between">
                      <span className="text-slate-400">Username:</span>
                      <span className="font-mono font-medium">{router.username}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Subscribers:</span>
                      <span className="font-bold text-slate-900 dark:text-slate-100 flex items-center space-x-1">
                        <Users className="w-3.5 h-3.5 text-slate-400" />
                        <span>{router._count?.customers || 0}</span>
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-4 border-t border-slate-100 dark:border-slate-700/80 mt-2">
                  <div className="flex items-center space-x-1">
                    <button
                      onClick={(e) => { e.stopPropagation(); navigate(`/routers/${router.id}`); }}
                      className="p-2 hover:bg-blue-50 dark:hover:bg-blue-950/40 text-blue-600 dark:text-blue-400 rounded-lg transition"
                      title="View Details"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                    <button
                      onClick={(e) => handleTestConnection(router.id, e)}
                      disabled={isTesting}
                      className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 rounded-lg transition"
                      title="Test Connection"
                    >
                      {isTesting ? <Loader2 className="w-4 h-4 animate-spin text-primary" /> : <TestTube className="w-4 h-4" />}
                    </button>
                    <button
                      onClick={(e) => handleEdit(router, e)}
                      className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 rounded-lg transition"
                      title="Edit Configuration"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    <button
                      onClick={(e) => handleDelete(router.id, router.name, e)}
                      className="p-2 hover:bg-rose-50 dark:hover:bg-rose-950/40 text-rose-600 rounded-lg transition"
                      title="Delete Router"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  <span className="text-xs text-primary font-bold group-hover:underline">
                    Manage &rarr;
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Router Form Modal */}
      <Modal
        isOpen={isFormOpen}
        onClose={() => { setIsFormOpen(false); setEditingRouter(null); }}
        title={editingRouter ? 'Edit MikroTik Router' : 'Add New MikroTik Router'}
      >
        <RouterForm
          router={editingRouter}
          onSuccess={() => {
            queryClient.invalidateQueries(['routers']);
            setIsFormOpen(false);
            setEditingRouter(null);
          }}
        />
      </Modal>
    </div>
  );
}