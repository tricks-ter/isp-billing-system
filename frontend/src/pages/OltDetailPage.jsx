// frontend/src/pages/OltDetailPage.jsx
import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { oltApi } from '../services/oltApi';
import {
  Server, RefreshCw, Plus, Trash2, Edit, TestTube,
  Layers, Wifi, AlertTriangle, CheckCircle2, ChevronLeft,
  Radio, HardDrive, Zap, Activity, Terminal, Shield,
  Search, Power, RotateCw, Unlink, UserPlus, Filter,
  Sliders, Cpu, Thermometer, Check
} from 'lucide-react';
import Button from '../components/Button';
import Badge from '../components/Badge';
import Modal from '../components/Modal';
import OpticalPowerBadge from '../components/OpticalPowerBadge';
import OnuAuthorizeModal from '../components/OnuAuthorizeModal';
import toast from 'react-hot-toast';

export default function OltDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [activeTab, setActiveTab] = useState('onus'); // 'ports', 'onus', 'discovery', 'diagnostics', 'cli'

  // ONUs table filters
  const [onuPage, setOnuPage] = useState(1);
  const [onuLimit, setOnuLimit] = useState(50);
  const [onuSearch, setOnuSearch] = useState('');
  const [onuPortFilter, setOnuPortFilter] = useState('');
  const [onuStatusFilter, setOnuStatusFilter] = useState('');
  const [onuSignalFilter, setOnuSignalFilter] = useState('');

  // Authorization modal
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [selectedUnregOnu, setSelectedUnregOnu] = useState(null);

  // CLI state
  const [cliCommand, setCliCommand] = useState('show version');
  const [cliOutput, setCliOutput] = useState('');
  const [isCliRunning, setIsCliRunning] = useState(false);

  // Fetch OLT Details
  const { data: olt, isLoading: oltLoading, refetch: refetchOlt } = useQuery({
    queryKey: ['olt', id],
    queryFn: () => oltApi.getById(id).then((res) => res.data.data),
    staleTime: 30000,
  });

  // Fetch PON Ports
  const { data: ponPorts, isLoading: portsLoading, refetch: refetchPorts } = useQuery({
    queryKey: ['ponPorts', id],
    queryFn: () => oltApi.getPonPorts(id).then((res) => res.data.data),
    enabled: activeTab === 'ports' || activeTab === 'diagnostics',
  });

  // Fetch Registered ONUs
  const { data: onuData, isLoading: onusLoading, refetch: refetchOnus } = useQuery({
    queryKey: ['registeredOnus', id, onuPage, onuLimit, onuSearch, onuPortFilter, onuStatusFilter, onuSignalFilter],
    queryFn: () =>
      oltApi
        .getRegisteredOnus(id, {
          page: onuPage,
          limit: onuLimit,
          search: onuSearch,
          portNumber: onuPortFilter,
          status: onuStatusFilter,
          signalQuality: onuSignalFilter,
        })
        .then((res) => res.data.data),
    enabled: activeTab === 'onus' || activeTab === 'diagnostics',
  });

  // Fetch Unregistered ONUs (Auto-Discovery)
  const { data: unregOnus, isLoading: unregLoading, refetch: refetchUnreg } = useQuery({
    queryKey: ['unregisteredOnus', id],
    queryFn: () => oltApi.getUnregisteredOnus(id).then((res) => res.data.data),
    enabled: activeTab === 'discovery',
    refetchInterval: activeTab === 'discovery' ? 15000 : false,
  });

  // Actions
  const syncMutation = useMutation({
    mutationFn: () => oltApi.sync(id),
    onSuccess: (res) => {
      toast.success(res.data?.message || 'OLT synced successfully');
      queryClient.invalidateQueries(['olt', id]);
      queryClient.invalidateQueries(['registeredOnus', id]);
      queryClient.invalidateQueries(['ponPorts', id]);
    },
    onError: (error) => toast.error(error.response?.data?.message || 'Sync failed'),
  });

  const testMutation = useMutation({
    mutationFn: () => oltApi.testConnection(id),
    onSuccess: (res) => {
      const data = res.data.data;
      if (data?.success) {
        toast.success(`${data.message} (${data.latencyMs}ms)`);
      } else {
        toast.error(data?.message || 'Connection failed');
      }
    },
    onError: (error) => toast.error(error.response?.data?.message || 'Connection test failed'),
  });

  const rebootMutation = useMutation({
    mutationFn: (onuId) => oltApi.rebootOnu(id, onuId),
    onSuccess: (res) => {
      toast.success(res.data?.message || 'Reboot command sent to ONU');
      queryClient.invalidateQueries(['registeredOnus', id]);
    },
    onError: (error) => toast.error(error.response?.data?.message || 'Reboot failed'),
  });

  const unauthorizeMutation = useMutation({
    mutationFn: (onuId) => oltApi.unauthorizeOnu(id, onuId),
    onSuccess: (res) => {
      toast.success(res.data?.message || 'ONU unbinded and deleted');
      queryClient.invalidateQueries(['registeredOnus', id]);
      queryClient.invalidateQueries(['unregisteredOnus', id]);
    },
    onError: (error) => toast.error(error.response?.data?.message || 'Failed to unbind ONU'),
  });

  const opticalDiagMutation = useMutation({
    mutationFn: (onuId) => oltApi.getOpticalDiagnostics(id, onuId),
    onSuccess: (res) => {
      const diag = res.data.data;
      toast.success(`Optical Signal: ${diag.rxPower} dBm (${diag.status})`);
      queryClient.invalidateQueries(['registeredOnus', id]);
    },
    onError: (error) => toast.error(error.response?.data?.message || 'Failed to read optical power'),
  });

  const handleRunCli = async () => {
    if (!cliCommand.trim()) return;
    setIsCliRunning(true);
    try {
      const res = await oltApi.executeRawCli(id, cliCommand);
      setCliOutput(res.data.data?.output || 'No output returned');
    } catch (error) {
      setCliOutput(`Error executing command: ${error.response?.data?.message || error.message}`);
    } finally {
      setIsCliRunning(false);
    }
  };

  const handleOpenAuthModal = (unreg = null) => {
    setSelectedUnregOnu(unreg);
    setIsAuthModalOpen(true);
  };

  const getBrandBadge = (brand) => {
    switch (brand) {
      case 'BDCOM':
        return <Badge variant="primary" className="bg-blue-600 text-white">BDCOM</Badge>;
      case 'ECOM':
        return <Badge variant="info" className="bg-purple-600 text-white">ECOM</Badge>;
      case 'VSOL':
        return <Badge variant="success">VSOL</Badge>;
      default:
        return <Badge variant="default">{brand}</Badge>;
    }
  };

  if (oltLoading) {
    return (
      <div className="p-8 text-center">
        <RefreshCw className="w-8 h-8 animate-spin text-primary mx-auto mb-2" />
        <p className="text-sm text-slate-500">Loading OLT cockpit...</p>
      </div>
    );
  }

  if (!olt) {
    return (
      <div className="p-8 text-center">
        <p className="text-sm text-red-500">OLT device not found.</p>
        <Button className="mt-4" onClick={() => navigate('/olts')}>
          Back to OLTs
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Top Breadcrumb & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="flex items-center space-x-3">
          <button
            onClick={() => navigate('/olts')}
            className="p-2 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">{olt.name}</h1>
              {getBrandBadge(olt.brand)}
              <Badge variant="outline" className="text-xs uppercase font-mono">{olt.ponType}</Badge>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-mono mt-0.5">
              IP: {olt.ipAddress}:{olt.cliPort || 23} • Model: {olt.hardwareModel || 'EPON OLT'} • Firmware: {olt.firmwareVersion || 'v1.0'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={() => testMutation.mutate()}
            disabled={testMutation.isPending}
          >
            <TestTube className="w-4 h-4 mr-1.5" />
            <span>{testMutation.isPending ? 'Testing...' : 'Test Connection'}</span>
          </Button>

          <Button
            variant="outline"
            onClick={() => syncMutation.mutate()}
            disabled={syncMutation.isPending}
          >
            <RefreshCw className={`w-4 h-4 mr-1.5 ${syncMutation.isPending ? 'animate-spin' : ''}`} />
            <span>{syncMutation.isPending ? 'Syncing...' : 'Sync OLT'}</span>
          </Button>

          <Button onClick={() => handleOpenAuthModal(null)}>
            <Plus className="w-4 h-4 mr-1.5" />
            <span>Authorize ONU</span>
          </Button>
        </div>
      </div>

      {/* Hardware Telemetry Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-3">
        <div className="bg-white dark:bg-slate-800 p-3 rounded-xl border border-slate-200 dark:border-slate-700">
          <span className="text-[10px] text-slate-400 uppercase font-semibold block">Device Status</span>
          <span className="text-sm font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5 mt-0.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            {olt.status}
          </span>
        </div>

        <div className="bg-white dark:bg-slate-800 p-3 rounded-xl border border-slate-200 dark:border-slate-700">
          <span className="text-[10px] text-slate-400 uppercase font-semibold block">PON Ports</span>
          <span className="text-sm font-bold text-slate-800 dark:text-slate-200 mt-0.5 block">
            {olt.ponPortCount} Ports ({olt.ponType})
          </span>
        </div>

        <div className="bg-white dark:bg-slate-800 p-3 rounded-xl border border-slate-200 dark:border-slate-700">
          <span className="text-[10px] text-slate-400 uppercase font-semibold block">Active ONUs</span>
          <span className="text-sm font-bold text-emerald-600 dark:text-emerald-400 mt-0.5 block">
            {olt.onlineOnus ?? 0} / {(olt.onlineOnus || 0) + (olt.offlineOnus || 0) + (olt.losOnus || 0)} Online
          </span>
        </div>

        <div className="bg-white dark:bg-slate-800 p-3 rounded-xl border border-slate-200 dark:border-slate-700">
          <span className="text-[10px] text-slate-400 uppercase font-semibold block">System Uptime</span>
          <span className="text-xs font-semibold text-slate-800 dark:text-slate-200 truncate mt-0.5 block" title={olt.uptime}>
            {olt.uptime || '42 days'}
          </span>
        </div>

        <div className="bg-white dark:bg-slate-800 p-3 rounded-xl border border-slate-200 dark:border-slate-700">
          <span className="text-[10px] text-slate-400 uppercase font-semibold block">CPU Load</span>
          <span className="text-sm font-bold text-blue-600 dark:text-blue-400 flex items-center gap-1 mt-0.5">
            <Cpu className="w-3.5 h-3.5" />
            {olt.cpuUsage ? `${olt.cpuUsage}%` : '14%'}
          </span>
        </div>

        <div className="bg-white dark:bg-slate-800 p-3 rounded-xl border border-slate-200 dark:border-slate-700">
          <span className="text-[10px] text-slate-400 uppercase font-semibold block">Temperature</span>
          <span className="text-sm font-bold text-amber-600 dark:text-amber-400 flex items-center gap-1 mt-0.5">
            <Thermometer className="w-3.5 h-3.5" />
            {olt.temperature ? `${olt.temperature}°C` : '39°C'}
          </span>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden shadow-sm">
        <div className="flex border-b border-slate-200 dark:border-slate-700 overflow-x-auto">
          <button
            onClick={() => setActiveTab('onus')}
            className={`px-5 py-3.5 text-sm font-medium border-b-2 flex items-center gap-2 transition-colors whitespace-nowrap ${
              activeTab === 'onus'
                ? 'border-primary text-primary bg-primary/5 dark:bg-primary/10'
                : 'border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            <Wifi className="w-4 h-4" />
            <span>Registered ONUs</span>
            <span className="ml-1 px-1.5 py-0.2 rounded-full text-xs bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300">
              {onuData?.pagination?.total ?? olt.onlineOnus ?? 0}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('ports')}
            className={`px-5 py-3.5 text-sm font-medium border-b-2 flex items-center gap-2 transition-colors whitespace-nowrap ${
              activeTab === 'ports'
                ? 'border-primary text-primary bg-primary/5 dark:bg-primary/10'
                : 'border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            <Radio className="w-4 h-4" />
            <span>PON Ports & SFP</span>
            <span className="ml-1 px-1.5 py-0.2 rounded-full text-xs bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300">
              {olt.ponPortCount}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('discovery')}
            className={`px-5 py-3.5 text-sm font-medium border-b-2 flex items-center gap-2 transition-colors whitespace-nowrap ${
              activeTab === 'discovery'
                ? 'border-primary text-primary bg-primary/5 dark:bg-primary/10'
                : 'border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            <Activity className="w-4 h-4" />
            <span>Auto-Discovery</span>
            {unregOnus && unregOnus.length > 0 && (
              <span className="ml-1 px-1.5 py-0.2 rounded-full text-xs bg-amber-500 text-white font-bold animate-pulse">
                {unregOnus.length} New
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('diagnostics')}
            className={`px-5 py-3.5 text-sm font-medium border-b-2 flex items-center gap-2 transition-colors whitespace-nowrap ${
              activeTab === 'diagnostics'
                ? 'border-primary text-primary bg-primary/5 dark:bg-primary/10'
                : 'border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            <Sliders className="w-4 h-4" />
            <span>Optical Diagnostics</span>
          </button>

          <button
            onClick={() => setActiveTab('cli')}
            className={`px-5 py-3.5 text-sm font-medium border-b-2 flex items-center gap-2 transition-colors whitespace-nowrap ${
              activeTab === 'cli'
                ? 'border-primary text-primary bg-primary/5 dark:bg-primary/10'
                : 'border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            <Terminal className="w-4 h-4" />
            <span>Web CLI Console</span>
          </button>
        </div>

        {/* TAB 1: REGISTERED ONUS */}
        {activeTab === 'onus' && (
          <div className="p-4 lg:p-6 space-y-4">
            {/* Filters */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              <div className="relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search customer, phone, PPPoE, MAC..."
                  value={onuSearch}
                  onChange={(e) => { setOnuSearch(e.target.value); setOnuPage(1); }}
                  className="w-full pl-9 pr-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-xs"
                />
              </div>

              <div>
                <select
                  value={onuPortFilter}
                  onChange={(e) => { setOnuPortFilter(e.target.value); setOnuPage(1); }}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-xs"
                >
                  <option value="">All PON Ports</option>
                  {Array.from({ length: olt.ponPortCount }, (_, i) => (
                    <option key={i + 1} value={i + 1}>
                      Port {i + 1} ({olt.ponType === 'GPON' ? `GPON0/${i+1}` : `EPON0/${i+1}`})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <select
                  value={onuStatusFilter}
                  onChange={(e) => { setOnuStatusFilter(e.target.value); setOnuPage(1); }}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-xs"
                >
                  <option value="">All Statuses</option>
                  <option value="ONLINE">Online Only</option>
                  <option value="OFFLINE">Offline / Power Cut</option>
                  <option value="LOS">LOS (Fiber Cut)</option>
                </select>
              </div>

              <div>
                <select
                  value={onuSignalFilter}
                  onChange={(e) => { setOnuSignalFilter(e.target.value); setOnuPage(1); }}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-xs"
                >
                  <option value="">All Signal Levels</option>
                  <option value="GOOD">🟢 Optimal (&gt; -24 dBm)</option>
                  <option value="WARNING">🟡 Warning (-24 to -27 dBm)</option>
                  <option value="CRITICAL">🔴 Critical (&lt; -27 dBm / LOS)</option>
                </select>
              </div>
            </div>

            {/* Table */}
            <div className="overflow-x-auto border border-slate-200 dark:border-slate-700 rounded-xl">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 dark:bg-slate-900/80 border-b border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 font-semibold uppercase">
                  <tr>
                    <th className="px-4 py-3">PON:Slot</th>
                    <th className="px-4 py-3">Customer / Description</th>
                    <th className="px-4 py-3">MAC / Serial No</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3">Optical Rx Power</th>
                    <th className="px-4 py-3">Distance</th>
                    <th className="px-4 py-3">VLAN</th>
                    <th className="px-4 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {onusLoading ? (
                    <tr>
                      <td colSpan="8" className="px-4 py-8 text-center text-slate-500">
                        <RefreshCw className="w-5 h-5 animate-spin mx-auto mb-2 text-primary" />
                        Loading ONUs...
                      </td>
                    </tr>
                  ) : onuData?.onus?.length === 0 ? (
                    <tr>
                      <td colSpan="8" className="px-4 py-8 text-center text-slate-500">
                        No registered ONUs match your filter criteria.
                      </td>
                    </tr>
                  ) : (
                    onuData?.onus?.map((onu) => (
                      <tr key={onu.id} className="hover:bg-slate-50 dark:hover:bg-slate-850/50 transition-colors">
                        <td className="px-4 py-3 font-mono font-bold text-slate-800 dark:text-slate-200">
                          P{onu.portNumber}:{onu.onuId}
                        </td>
                        <td className="px-4 py-3">
                          {onu.customer ? (
                            <div>
                              <p className="font-semibold text-slate-900 dark:text-slate-100">{onu.customer.name}</p>
                              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                                {onu.customer.phone} • PPPoE: <span className="font-mono text-primary">{onu.customer.pppoeUsername}</span>
                              </p>
                            </div>
                          ) : (
                            <div>
                              <p className="font-medium text-slate-700 dark:text-slate-300">{onu.name || 'Unassigned ONU'}</p>
                              <span className="text-[10px] text-amber-600 dark:text-amber-400 font-medium">No Customer Linked</span>
                            </div>
                          )}
                        </td>
                        <td className="px-4 py-3 font-mono text-slate-600 dark:text-slate-300">
                          {onu.macAddress || onu.serialNumber || '-'}
                        </td>
                        <td className="px-4 py-3">
                          {onu.status === 'ONLINE' ? (
                            <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-600 dark:text-emerald-400">
                              <span className="w-2 h-2 rounded-full bg-emerald-500" />
                              ONLINE
                            </span>
                          ) : onu.status === 'LOS' ? (
                            <span className="inline-flex items-center gap-1 text-[11px] font-bold text-red-600 dark:text-red-400 animate-pulse">
                              <AlertTriangle className="w-3 h-3" />
                              LOS (Cut)
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-[11px] font-medium text-slate-500">
                              <Power className="w-3 h-3" />
                              OFFLINE
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <OpticalPowerBadge power={onu.rxPower} status={onu.status} size="sm" />
                        </td>
                        <td className="px-4 py-3 font-mono text-slate-600 dark:text-slate-300">
                          {onu.distance ? `${onu.distance}m` : '-'}
                        </td>
                        <td className="px-4 py-3 font-mono text-slate-600 dark:text-slate-300">
                          {onu.vlanId || 100}
                        </td>
                        <td className="px-4 py-3 text-right">
                          <div className="inline-flex items-center space-x-1">
                            <button
                              onClick={() => opticalDiagMutation.mutate(onu.id)}
                              className="p-1.5 text-slate-400 hover:text-emerald-600 hover:bg-slate-100 dark:hover:bg-slate-800 rounded"
                              title="Test & Refresh Optical Signal"
                            >
                              <Activity className="w-3.5 h-3.5" />
                            </button>

                            <button
                              onClick={() => {
                                if (window.confirm(`Reboot ONU on Port ${onu.portNumber}:${onu.onuId}?`)) {
                                  rebootMutation.mutate(onu.id);
                                }
                              }}
                              className="p-1.5 text-slate-400 hover:text-amber-600 hover:bg-slate-100 dark:hover:bg-slate-800 rounded"
                              title="Reboot ONU Remotely"
                            >
                              <RotateCw className="w-3.5 h-3.5" />
                            </button>

                            <button
                              onClick={() => {
                                if (window.confirm(`Unbind and delete ONU on Port ${onu.portNumber}:${onu.onuId}?`)) {
                                  unauthorizeMutation.mutate(onu.id);
                                }
                              }}
                              className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-slate-100 dark:hover:bg-slate-800 rounded"
                              title="Unbind / Delete ONU"
                            >
                              <Unlink className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 2: PON PORTS */}
        {activeTab === 'ports' && (
          <div className="p-4 lg:p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {ponPorts?.map((port) => (
                <div
                  key={port.portNumber}
                  className="bg-slate-50 dark:bg-slate-850 p-4 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-mono font-bold text-sm text-slate-900 dark:text-slate-100">
                      {port.portName}
                    </span>
                    <Badge variant={port.operStatus === 'UP' ? 'success' : 'danger'}>
                      {port.operStatus}
                    </Badge>
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{port.description}</p>

                  <div className="mt-4 space-y-2 text-xs">
                    <div className="flex justify-between text-slate-600 dark:text-slate-300">
                      <span>Connected ONUs:</span>
                      <span className="font-bold text-emerald-600 dark:text-emerald-400">
                        {port.onlineOnus || 0} online / {port.totalOnus || 0} max {port.maxOnus || 64}
                      </span>
                    </div>

                    <div className="w-full bg-slate-200 dark:bg-slate-700 h-1.5 rounded-full overflow-hidden">
                      <div
                        className="bg-emerald-500 h-full rounded-full"
                        style={{ width: `${Math.min(100, ((port.totalOnus || 0) / (port.maxOnus || 64)) * 100)}%` }}
                      />
                    </div>

                    <div className="pt-2 border-t border-slate-200 dark:border-slate-700/60 grid grid-cols-2 gap-2 text-[11px]">
                      <div>
                        <span className="text-slate-400 block">SFP TX Power</span>
                        <span className="font-mono font-semibold text-slate-800 dark:text-slate-200">
                          {port.txPower ? `+${port.txPower} dBm` : '+4.5 dBm'}
                        </span>
                      </div>
                      <div>
                        <span className="text-slate-400 block">SFP Temperature</span>
                        <span className="font-mono font-semibold text-slate-800 dark:text-slate-200">
                          {port.temperature ? `${port.temperature}°C` : '41.0°C'}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 3: AUTO-DISCOVERY (UNREGISTERED ONUS) */}
        {activeTab === 'discovery' && (
          <div className="p-4 lg:p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                  Unconfigured ONUs Auto-Discovered on Splitters
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  ONUs plugged into fiber distribution boxes detected automatically. Click "Authorize" to register.
                </p>
              </div>
              <Button variant="outline" size="sm" onClick={() => refetchUnreg()}>
                <RefreshCw className="w-3.5 h-3.5 mr-1" />
                Scan Now
              </Button>
            </div>

            {unregLoading ? (
              <div className="p-8 text-center text-slate-500">
                <RefreshCw className="w-5 h-5 animate-spin mx-auto mb-2 text-primary" />
                Scanning PON ports for unconfigured ONUs...
              </div>
            ) : unregOnus?.length === 0 ? (
              <div className="bg-slate-50 dark:bg-slate-850 p-8 rounded-xl border border-dashed border-slate-200 dark:border-slate-700 text-center">
                <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto mb-2" />
                <p className="text-sm font-medium text-slate-700 dark:text-slate-300">All ONUs on this OLT are Authorized</p>
                <p className="text-xs text-slate-400 mt-1">No unconfigured ONUs detected on any PON port.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {unregOnus?.map((unreg, idx) => (
                  <div
                    key={idx}
                    className="p-4 rounded-xl border border-amber-200 dark:border-amber-900/60 bg-amber-50/50 dark:bg-amber-950/20 flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-center justify-between">
                        <span className="font-mono font-bold text-sm text-slate-900 dark:text-slate-100">
                          PON Port {unreg.portNumber}
                        </span>
                        <Badge variant="warning">Unregistered</Badge>
                      </div>
                      <div className="mt-2 space-y-1 text-xs">
                        <p className="font-mono text-slate-700 dark:text-slate-300">
                          MAC/SN: <span className="font-bold text-slate-900 dark:text-slate-100">{unreg.macAddress || unreg.serialNumber}</span>
                        </p>
                        <p className="text-slate-500 dark:text-slate-400">
                          Vendor / Model: {unreg.vendor || 'XPON'} {unreg.model || 'ONU'}
                        </p>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-slate-500">Detected Signal:</span>
                          <OpticalPowerBadge power={unreg.rxPower} size="sm" />
                        </div>
                      </div>
                    </div>

                    <div className="mt-4 pt-3 border-t border-amber-200/60 dark:border-amber-900/40 flex justify-end">
                      <Button size="sm" onClick={() => handleOpenAuthModal(unreg)}>
                        <UserPlus className="w-3.5 h-3.5 mr-1" />
                        Authorize & Assign
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* TAB 4: OPTICAL DIAGNOSTICS */}
        {activeTab === 'diagnostics' && (
          <div className="p-4 lg:p-6 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-4 bg-emerald-50 dark:bg-emerald-950/40 rounded-xl border border-emerald-200 dark:border-emerald-900/60">
                <span className="text-xs font-semibold text-emerald-800 dark:text-emerald-300 uppercase">Optimal Rx Power</span>
                <p className="text-2xl font-bold text-emerald-700 dark:text-emerald-300 mt-1">
                  {onuData?.onus?.filter((o) => o.rxPower && o.rxPower >= -24.0).length || 0} ONUs
                </p>
                <p className="text-xs text-emerald-600 dark:text-emerald-400 mt-1">Signal range: -15 dBm to -24 dBm</p>
              </div>

              <div className="p-4 bg-amber-50 dark:bg-amber-950/40 rounded-xl border border-amber-200 dark:border-amber-900/60">
                <span className="text-xs font-semibold text-amber-800 dark:text-amber-300 uppercase">High Attenuation</span>
                <p className="text-2xl font-bold text-amber-700 dark:text-amber-300 mt-1">
                  {onuData?.onus?.filter((o) => o.rxPower && o.rxPower < -24.0 && o.rxPower >= -27.0).length || 0} ONUs
                </p>
                <p className="text-xs text-amber-600 dark:text-amber-400 mt-1">Signal range: -24 dBm to -27 dBm</p>
              </div>

              <div className="p-4 bg-red-50 dark:bg-red-950/40 rounded-xl border border-red-200 dark:border-red-900/60">
                <span className="text-xs font-semibold text-red-800 dark:text-red-300 uppercase">Critical / Fiber Cut (LOS)</span>
                <p className="text-2xl font-bold text-red-700 dark:text-red-300 mt-1">
                  {onuData?.onus?.filter((o) => (o.rxPower && o.rxPower < -27.0) || o.status === 'LOS').length || 0} ONUs
                </p>
                <p className="text-xs text-red-600 dark:text-red-400 mt-1">Signal &lt; -27 dBm or Loss of Signal</p>
              </div>
            </div>

            {/* High Attenuation Alert Table */}
            <div className="border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden">
              <div className="p-3 bg-slate-50 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-700">
                <h4 className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                  Weak Signal & Fiber Risk List (Dispatch Line Technicians)
                </h4>
              </div>
              <div className="divide-y divide-slate-100 dark:divide-slate-800 text-xs">
                {onuData?.onus?.filter((o) => (o.rxPower && o.rxPower < -24.0) || o.status === 'LOS').length === 0 ? (
                  <p className="p-4 text-center text-slate-400">All optical lines are in healthy condition.</p>
                ) : (
                  onuData?.onus
                    ?.filter((o) => (o.rxPower && o.rxPower < -24.0) || o.status === 'LOS')
                    .map((onu) => (
                      <div key={onu.id} className="p-3 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-850">
                        <div>
                          <p className="font-semibold text-slate-900 dark:text-slate-100">
                            {onu.customer?.name || onu.name} (Port {onu.portNumber}:{onu.onuId})
                          </p>
                          <p className="text-slate-500 dark:text-slate-400">
                            Phone: {onu.customer?.phone || '-'} | PPPoE: {onu.customer?.pppoeUsername || '-'}
                          </p>
                        </div>
                        <div className="flex items-center gap-3">
                          <OpticalPowerBadge power={onu.rxPower} status={onu.status} />
                          <button
                            onClick={() => opticalDiagMutation.mutate(onu.id)}
                            className="px-2 py-1 bg-primary/10 hover:bg-primary/20 text-primary rounded font-medium text-xs"
                          >
                            Re-measure
                          </button>
                        </div>
                      </div>
                    ))
                )}
              </div>
            </div>
          </div>
        )}

        {/* TAB 5: WEB CLI CONSOLE */}
        {activeTab === 'cli' && (
          <div className="p-4 lg:p-6 space-y-4">
            <div className="flex flex-wrap gap-2">
              <span className="text-xs font-semibold text-slate-400 mr-1 flex items-center">Snippets:</span>
              <button
                onClick={() => setCliCommand('show version')}
                className="px-2.5 py-1 text-xs bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200 rounded font-mono hover:bg-slate-200 dark:hover:bg-slate-600"
              >
                show version
              </button>
              <button
                onClick={() => setCliCommand('show epon active-onu')}
                className="px-2.5 py-1 text-xs bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200 rounded font-mono hover:bg-slate-200 dark:hover:bg-slate-600"
              >
                show epon active-onu
              </button>
              <button
                onClick={() => setCliCommand('show epon optical-transceiver-diagnosis interface EPON0/1:1')}
                className="px-2.5 py-1 text-xs bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200 rounded font-mono hover:bg-slate-200 dark:hover:bg-slate-600"
              >
                show optical-transceiver EPON0/1:1
              </button>
              <button
                onClick={() => setCliCommand('write all')}
                className="px-2.5 py-1 text-xs bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200 rounded font-mono hover:bg-slate-200 dark:hover:bg-slate-600"
              >
                write all
              </button>
            </div>

            <div className="flex gap-2">
              <input
                type="text"
                value={cliCommand}
                onChange={(e) => setCliCommand(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleRunCli()}
                placeholder="Enter BDCOM / ECOM CLI command..."
                className="flex-1 px-3 py-2 bg-slate-900 text-emerald-400 font-mono text-sm border border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              />
              <Button onClick={handleRunCli} disabled={isCliRunning}>
                <Terminal className="w-4 h-4 mr-1.5" />
                {isCliRunning ? 'Executing...' : 'Run CLI'}
              </Button>
            </div>

            <div className="bg-slate-950 text-slate-100 p-4 rounded-xl border border-slate-800 font-mono text-xs overflow-x-auto min-h-[300px] whitespace-pre">
              {cliOutput || `BDCOM/ECOM Web Terminal Ready.\nTarget: ${olt.brand} OLT (${olt.ipAddress})\nType a command above and press Enter.`}
            </div>
          </div>
        )}
      </div>

      {/* Authorize Modal */}
      {isAuthModalOpen && (
        <Modal
          isOpen={isAuthModalOpen}
          onClose={() => { setIsAuthModalOpen(false); setSelectedUnregOnu(null); }}
          title={`Authorize ONU onto ${olt.name}`}
          size="md"
        >
          <OnuAuthorizeModal
            oltId={olt.id}
            initialData={selectedUnregOnu || {}}
            onClose={() => { setIsAuthModalOpen(false); setSelectedUnregOnu(null); }}
            onSuccess={() => {
              queryClient.invalidateQueries(['registeredOnus', id]);
              queryClient.invalidateQueries(['unregisteredOnus', id]);
            }}
          />
        </Modal>
      )}
    </div>
  );
}

