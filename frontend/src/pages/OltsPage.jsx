// frontend/src/pages/OltsPage.jsx
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { oltApi } from '../services/oltApi';
import {
  Server, Plus, RefreshCw, Trash2, Edit, TestTube,
  Layers, Wifi, AlertTriangle, CheckCircle2, ChevronRight,
  Radio, HardDrive, Zap, Activity
} from 'lucide-react';
import Button from '../components/Button';
import Badge from '../components/Badge';
import Modal from '../components/Modal';
import OltForm from '../components/OltForm';
import toast from 'react-hot-toast';

export default function OltsPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingOlt, setEditingOlt] = useState(null);
  const [testingId, setTestingId] = useState(null);
  const [syncingId, setSyncingId] = useState(null);

  // Fetch all OLTs
  const { data: olts, isLoading, isFetching, refetch } = useQuery({
    queryKey: ['olts'],
    queryFn: () => oltApi.getAll().then((res) => res.data.data),
    staleTime: 30000,
  });

  // Fetch optical health summary
  const { data: summary } = useQuery({
    queryKey: ['opticalSummary'],
    queryFn: () => oltApi.getOpticalSummary().then((res) => res.data.data),
    refetchInterval: 60000,
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => oltApi.delete(id),
    onSuccess: (res) => {
      queryClient.invalidateQueries(['olts']);
      queryClient.invalidateQueries(['opticalSummary']);
      toast.success(res.data?.message || 'OLT device deleted successfully');
    },
    onError: (error) => toast.error(error.response?.data?.message || error.message || 'Failed to delete OLT device'),
  });

  const testMutation = useMutation({
    mutationFn: (id) => oltApi.testConnection(id),
    onSuccess: (res) => {
      const data = res.data.data;
      if (data?.success) {
        toast.success(`${data.message} (${data.latencyMs}ms)`);
      } else {
        toast.error(data?.message || 'Connection failed');
      }
    },
    onError: (error) => toast.error(error.response?.data?.message || error.message || 'OLT connection test failed'),
    onSettled: () => setTestingId(null),
  });

  const syncMutation = useMutation({
    mutationFn: (id) => oltApi.sync(id),
    onSuccess: (res) => {
      toast.success(res.data?.message || 'OLT synced successfully');
      queryClient.invalidateQueries(['olts']);
      queryClient.invalidateQueries(['opticalSummary']);
    },
    onError: (error) => toast.error(error.response?.data?.message || error.message || 'OLT sync failed'),
    onSettled: () => setSyncingId(null),
  });

  const handleTest = (id, e) => {
    e.stopPropagation();
    setTestingId(id);
    testMutation.mutate(id);
  };

  const handleSync = (id, e) => {
    e.stopPropagation();
    setSyncingId(id);
    syncMutation.mutate(id);
  };

  const handleDelete = (id, name, customerCount, e) => {
    e.stopPropagation();
    if (window.confirm(`Delete OLT "${name}"? This will unlink ${customerCount} customers and remove child PON ports.`)) {
      deleteMutation.mutate(id);
    }
  };

  const getBrandBadge = (brand) => {
    switch (brand) {
      case 'BDCOM':
        return <Badge variant="primary" className="bg-blue-600 text-white">BDCOM</Badge>;
      case 'ECOM':
        return <Badge variant="info" className="bg-purple-600 text-white">ECOM</Badge>;
      case 'VSOL':
        return <Badge variant="success">VSOL</Badge>;
      case 'HUAWEI':
        return <Badge variant="danger">Huawei</Badge>;
      default:
        return <Badge variant="default">{brand}</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2.5">
            <Layers className="w-7 h-7 text-primary" />
            OLT Management
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Manage BDCOM, ECOM & EPON/GPON Optical Line Terminals, PON ports, and ONUs
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={async () => {
              await refetch();
              toast.success('OLT devices refreshed');
            }}
            className="cursor-pointer"
          >
            <RefreshCw className={`w-4 h-4 mr-1.5 ${isFetching ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </Button>
          <Button onClick={() => { setEditingOlt(null); setIsFormOpen(true); }} className="cursor-pointer">
            <Plus className="w-4 h-4 mr-1.5" />
            <span>Add OLT</span>
          </Button>
        </div>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase">Total OLT Nodes</span>
            <div className="w-8 h-8 rounded-lg bg-blue-50 dark:bg-blue-950/60 flex items-center justify-center text-blue-600 dark:text-blue-400">
              <Server className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-slate-900 dark:text-slate-100">
              {summary?.totalOlts ?? olts?.length ?? 0}
            </span>
            <span className="text-xs text-emerald-600 dark:text-emerald-400 font-medium">
              {summary?.onlineOlts ?? olts?.filter((o) => o.status === 'ONLINE').length ?? 0} Online
            </span>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase">Active ONUs / Clients</span>
            <div className="w-8 h-8 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
              <Wifi className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-slate-900 dark:text-slate-100">
              {summary?.onlineOnus ?? 0}
            </span>
            <span className="text-xs text-slate-500 dark:text-slate-400">
              / {summary?.totalOnus ?? 0} Registered
            </span>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase">Optimal Optical Signal</span>
            <div className="w-8 h-8 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
              {summary?.opticalDistribution?.optimal ?? 0}
            </span>
            <span className="text-xs text-slate-500 dark:text-slate-400">
              &gt; -24 dBm
            </span>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase">Critical Signal / LOS</span>
            <div className="w-8 h-8 rounded-lg bg-red-50 dark:bg-red-950/60 flex items-center justify-center text-red-600 dark:text-red-400">
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-red-600 dark:text-red-400">
              {summary?.opticalDistribution?.critical ?? 0}
            </span>
            <span className="text-xs text-red-600 dark:text-red-400 font-medium">
              &lt; -27 dBm or Cut
            </span>
          </div>
        </div>
      </div>

      {/* OLT Cards Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[1, 2].map((i) => (
            <div key={i} className="h-56 bg-slate-100 dark:bg-slate-800 animate-pulse rounded-xl" />
          ))}
        </div>
      ) : olts?.length === 0 ? (
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-12 text-center">
          <Layers className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
          <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">No OLT Devices Configured</h3>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 max-w-sm mx-auto">
            Add your first BDCOM or ECOM OLT to start managing optical PON ports and customer ONUs.
          </p>
          <Button className="mt-4" onClick={() => { setEditingOlt(null); setIsFormOpen(true); }}>
            <Plus className="w-4 h-4 mr-1.5" />
            Add First OLT
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 lg:gap-6">
          {olts?.map((olt) => (
            <div
              key={olt.id}
              onClick={() => navigate(`/olts/${olt.id}`)}
              className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-5 shadow-sm hover:shadow-md hover:border-primary/50 transition-all cursor-pointer group flex flex-col justify-between"
            >
              <div>
                {/* Card Header */}
                <div className="flex items-start justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-primary/10 to-blue-500/10 dark:from-primary/20 dark:to-blue-500/20 border border-primary/20 flex items-center justify-center text-primary flex-shrink-0 group-hover:scale-105 transition-transform">
                      <Radio className="w-6 h-6" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 group-hover:text-primary transition-colors">
                          {olt.name}
                        </h3>
                        {getBrandBadge(olt.brand)}
                        <Badge variant="outline" className="text-[10px] uppercase font-mono">
                          {olt.ponType}
                        </Badge>
                      </div>
                      <p className="text-xs text-slate-500 dark:text-slate-400 font-mono mt-0.5">
                        {olt.ipAddress}:{olt.cliPort || 23} • {olt.location || 'Central POP'}
                      </p>
                    </div>
                  </div>

                  <span
                    className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold ${
                      olt.status === 'ONLINE'
                        ? 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300'
                        : 'bg-red-100 dark:bg-red-950/60 text-red-700 dark:text-red-300'
                    }`}
                  >
                    {olt.status === 'ONLINE' ? '● ONLINE' : '○ OFFLINE'}
                  </span>
                </div>

                {/* Device Specs & Stats */}
                <div className="grid grid-cols-3 gap-2 mt-4 p-3 bg-slate-50 dark:bg-slate-850/60 rounded-lg border border-slate-100 dark:border-slate-700/60 text-xs">
                  <div>
                    <span className="text-slate-400 block text-[10px] uppercase">PON Ports</span>
                    <span className="font-semibold text-slate-800 dark:text-slate-200">
                      {olt.ponPortCount}x {olt.ponType}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px] uppercase">Active ONUs</span>
                    <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                      {olt.onlineOnus || 0} / {(olt.onlineOnus || 0) + (olt.offlineOnus || 0) + (olt.losOnus || 0)}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px] uppercase">Assigned Cust.</span>
                    <span className="font-semibold text-blue-600 dark:text-blue-400">
                      {olt._count?.customers || 0}
                    </span>
                  </div>
                </div>

                {/* Port Pills */}
                <div className="mt-3 flex items-center gap-1.5 flex-wrap">
                  <span className="text-[11px] text-slate-400 mr-1">Ports:</span>
                  {olt.ponPorts?.map((port) => (
                    <span
                      key={port.portNumber}
                      title={`Port ${port.portNumber} (${port.portName}) - ${port.operStatus}`}
                      className={`px-1.5 py-0.5 rounded text-[10px] font-mono font-medium ${
                        port.operStatus === 'UP'
                          ? 'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-500'
                      }`}
                    >
                      P{port.portNumber}
                    </span>
                  ))}
                  {olt.isMock && (
                    <span className="ml-auto inline-flex items-center gap-1 text-[10px] font-medium text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40 px-2 py-0.5 rounded-full border border-amber-200 dark:border-amber-900/60">
                      <Zap className="w-3 h-3" />
                      Mock Mode
                    </span>
                  )}
                </div>
              </div>

              {/* Card Footer Actions */}
              <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-700/60 flex items-center justify-between">
                <div className="flex items-center space-x-1">
                  <button
                    onClick={(e) => handleTest(olt.id, e)}
                    disabled={testingId === olt.id}
                    className="p-1.5 text-slate-500 hover:text-primary hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg text-xs font-medium inline-flex items-center gap-1 transition-colors"
                    title="Test Telnet/SNMP connection"
                  >
                    <TestTube className="w-3.5 h-3.5" />
                    <span>{testingId === olt.id ? 'Testing...' : 'Test'}</span>
                  </button>

                  <button
                    onClick={(e) => handleSync(olt.id, e)}
                    disabled={syncingId === olt.id}
                    className="p-1.5 text-slate-500 hover:text-emerald-600 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg text-xs font-medium inline-flex items-center gap-1 transition-colors"
                    title="Sync ONUs from device"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${syncingId === olt.id ? 'animate-spin' : ''}`} />
                    <span>{syncingId === olt.id ? 'Syncing...' : 'Sync'}</span>
                  </button>

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setEditingOlt(olt);
                      setIsFormOpen(true);
                    }}
                    className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg text-xs transition-colors"
                    title="Edit OLT settings"
                  >
                    <Edit className="w-3.5 h-3.5" />
                  </button>

                  <button
                    onClick={(e) => handleDelete(olt.id, olt.name, olt._count?.customers || 0, e)}
                    className="p-1.5 text-slate-500 hover:text-red-600 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg text-xs transition-colors"
                    title="Delete OLT"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div className="flex items-center text-xs font-semibold text-primary group-hover:translate-x-1 transition-transform">
                  <span>Manage Cockpit</span>
                  <ChevronRight className="w-4 h-4 ml-0.5" />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add / Edit OLT Modal */}
      <Modal
        isOpen={isFormOpen}
        onClose={() => { setIsFormOpen(false); setEditingOlt(null); }}
        title={editingOlt ? `Edit OLT: ${editingOlt.name}` : 'Add New OLT Device (BDCOM / ECOM)'}
        size="lg"
      >
        <OltForm
          olt={editingOlt}
          onSuccess={() => {
            setIsFormOpen(false);
            setEditingOlt(null);
            queryClient.invalidateQueries(['olts']);
            queryClient.invalidateQueries(['opticalSummary']);
          }}
          onCancel={() => { setIsFormOpen(false); setEditingOlt(null); }}
        />
      </Modal>
    </div>
  );
}

