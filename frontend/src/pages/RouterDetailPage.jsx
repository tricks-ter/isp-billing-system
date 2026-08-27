// frontend/src/pages/RouterDetailPage.jsx
import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Server, Info, Users, Activity, Layers, BarChart3,
  RefreshCw, Plus, Edit, Trash2, Loader2,
  AlertCircle, Search, X, Power, PowerOff, LogOut,
  AlertTriangle, Terminal, Play, Cloud, Copy, Check
} from 'lucide-react';
import { routerApi } from '../services/routerApi';
import { settingsApi } from '../services/settingsApi';
import Button from '../components/Button';
import Badge from '../components/Badge';
import Modal from '../components/Modal';
import OracleSetupModal from '../components/OracleSetupModal';
import toast from 'react-hot-toast';

// Helper to format bytes
const formatBytes = (bytes) => {
  if (!bytes) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

// Helper to format uptime
const formatUptime = (uptime) => uptime || '-';

export default function RouterDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState('info');
  const [isOracleModalOpen, setIsOracleModalOpen] = useState(false);

  // CLI Terminal state
  const [cliCommand, setCliCommand] = useState('/system/resource/print');
  const [cliHistory, setCliHistory] = useState([
    {
      timestamp: new Date().toLocaleTimeString(),
      command: '/system/resource/print',
      output: [
        {
          uptime: '14w3d12h45m',
          version: '7.15.2 (stable)',
          'free-memory': '241.5MiB',
          'total-memory': '256.0MiB',
          cpu: 'MIPS 1004Kc V2.15',
          'cpu-count': '2',
          'cpu-frequency': '880MHz',
          'cpu-load': '4%',
          'board-name': 'MikroTik RouterOS',
        },
      ],
      isSuccess: true,
    },
  ]);
  const [isCliRunning, setIsCliRunning] = useState(false);

  // PPPoE state
  const [isPppoeFormOpen, setIsPppoeFormOpen] = useState(false);
  const [editingPppoe, setEditingPppoe] = useState(null);
  const [pppoePage, setPppoePage] = useState(1);
  const [pppoeLimit, setPppoeLimit] = useState(50);
  const [pppoeSearch, setPppoeSearch] = useState('');
  const [pppoeStatus, setPppoeStatus] = useState('');

  // Sessions state
  const [sessionPage, setSessionPage] = useState(1);
  const [sessionLimit, setSessionLimit] = useState(50);
  const [sessionSearch, setSessionSearch] = useState('');

  // Profiles state
  const [profilePage, setProfilePage] = useState(1);
  const [profileLimit, setProfileLimit] = useState(50);
  const [profileSearch, setProfileSearch] = useState('');

  // Queues state
  const [queuePage, setQueuePage] = useState(1);
  const [queueLimit, setQueueLimit] = useState(50);
  const [queueSearch, setQueueSearch] = useState('');

  // Fetch router details
  const { data: router, isLoading: routerLoading } = useQuery({
    queryKey: ['router', id],
    queryFn: () => routerApi.getById(id).then(res => res.data.data),
  });

  // Fetch router info
  const {
    data: info,
    isLoading: infoLoading,
    isError: infoError,
    error: infoErr,
    refetch: refetchInfo
  } = useQuery({
    queryKey: ['routerInfo', id],
    queryFn: () => routerApi.getRouterInfo(id).then(res => res.data.data),
    enabled: activeTab === 'info',
    retry: 1,
  });

  // Get mock mode status to show warning
  const { data: mockModeData } = useQuery({
    queryKey: ['mikrotikMockMode'],
    queryFn: () => settingsApi.getMikrotikMockMode().then(res => res.data.data),
    staleTime: 60000,
  });
  const isMockMode = mockModeData?.mockMode ?? true;

  // Fetch PPPoE secrets (server-side paginated)
  const pppoeQueryKey = ['pppoeSecretsPaginated', id, pppoePage, pppoeLimit, pppoeSearch, pppoeStatus];
  const {
    data: pppoeData,
    isLoading: pppoeLoading,
    refetch: refetchPppoe
  } = useQuery({
    queryKey: pppoeQueryKey,
    queryFn: () => routerApi.getPppoeSecretsPaginated(id, {
      page: pppoePage,
      limit: pppoeLimit,
      search: pppoeSearch,
      status: pppoeStatus
    }).then(res => res.data.data),
    enabled: activeTab === 'pppoe',
  });

  // Fetch active sessions (server-side paginated)
  const sessionQueryKey = ['activeSessionsPaginated', id, sessionPage, sessionLimit, sessionSearch];
  const {
    data: sessionData,
    isLoading: sessionsLoading,
    refetch: refetchSessions
  } = useQuery({
    queryKey: sessionQueryKey,
    queryFn: () => routerApi.getActiveSessionsPaginated(id, {
      page: sessionPage,
      limit: sessionLimit,
      search: sessionSearch
    }).then(res => res.data.data),
    enabled: activeTab === 'sessions',
  });

  // Fetch profiles (server-side paginated)
  const profileQueryKey = ['profilesPaginated', id, profilePage, profileLimit, profileSearch];
  const {
    data: profileData,
    isLoading: profilesLoading,
    refetch: refetchProfiles
  } = useQuery({
    queryKey: profileQueryKey,
    queryFn: () => routerApi.getProfilesPaginated(id, {
      page: profilePage,
      limit: profileLimit,
      search: profileSearch
    }).then(res => res.data.data),
    enabled: activeTab === 'profiles',
  });

  // Fetch queues (server-side paginated)
  const queueQueryKey = ['queuesPaginated', id, queuePage, queueLimit, queueSearch];
  const {
    data: queueData,
    isLoading: queuesLoading,
    refetch: refetchQueues
  } = useQuery({
    queryKey: queueQueryKey,
    queryFn: () => routerApi.getSimpleQueuesPaginated(id, {
      page: queuePage,
      limit: queueLimit,
      search: queueSearch
    }).then(res => res.data.data),
    enabled: activeTab === 'queues',
  });

  // --- Mutations ---
  const createPppoeMutation = useMutation({
    mutationFn: (data) => routerApi.createPppoeSecret(id, data),
    onSuccess: () => {
      toast.success('PPPoE secret created');
      queryClient.invalidateQueries({ queryKey: ['pppoeSecretsPaginated', id] });
      setIsPppoeFormOpen(false);
    },
    onError: (error) => toast.error(error.response?.data?.message || error.message || 'Failed to create PPPoE secret'),
  });

  const updatePppoeMutation = useMutation({
    mutationFn: ({ username, data }) => routerApi.updatePppoeSecret(id, username, data),
    onSuccess: () => {
      toast.success('PPPoE secret updated');
      queryClient.invalidateQueries({ queryKey: ['pppoeSecretsPaginated', id] });
      setIsPppoeFormOpen(false);
      setEditingPppoe(null);
    },
    onError: (error) => toast.error(error.response?.data?.message || error.message || 'Failed to update PPPoE secret'),
  });

  const deletePppoeMutation = useMutation({
    mutationFn: (username) => routerApi.deletePppoeSecret(id, username),
    onSuccess: () => {
      toast.success('PPPoE secret deleted');
      queryClient.invalidateQueries({ queryKey: ['pppoeSecretsPaginated', id] });
    },
    onError: (error) => toast.error(error.response?.data?.message || error.message || 'Failed to delete PPPoE secret'),
  });

  // === OPTIMISTIC TOGGLE ===
  const togglePppoeMutation = useMutation({
    mutationFn: ({ username, disable }) => routerApi.togglePppoeSecret(id, username, disable),
    onMutate: async ({ username, disable }) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: pppoeQueryKey });
      // Snapshot previous value
      const previousData = queryClient.getQueryData(pppoeQueryKey);
      // Optimistically update the cache
      if (previousData) {
        const newData = {
          ...previousData,
          data: previousData.data.map(secret =>
            secret.name === username ? { ...secret, disabled: disable } : secret
          )
        };
        queryClient.setQueryData(pppoeQueryKey, newData);
      }
      return { previousData };
    },
    onError: (err, variables, context) => {
      // Rollback on error
      if (context?.previousData) {
        queryClient.setQueryData(pppoeQueryKey, context.previousData);
      }
      toast.error(err.response?.data?.message || err.message || 'Failed to toggle PPPoE secret');
    },
    onSuccess: (_, { username, disable }) => {
      toast.success(`PPPoE secret ${disable ? 'disabled' : 'enabled'}`);
      // Refetch in background to ensure consistency
      queryClient.invalidateQueries({ queryKey: ['pppoeSecretsPaginated', id] });
    },
  });

  const removeSessionMutation = useMutation({
    mutationFn: (username) => routerApi.removeActiveSession(id, username),
    onSuccess: (_, username) => {
      toast.success(`Session ${username} disconnected`);
      queryClient.invalidateQueries({ queryKey: ['activeSessionsPaginated', id] });
    },
    onError: (error) => toast.error(error.response?.data?.message || error.message || 'Failed to disconnect session'),
  });

  const handleDeletePppoe = (username) => {
    if (window.confirm(`Delete PPPoE secret "${username}"?`)) {
      deletePppoeMutation.mutate(username);
    }
  };

  const handleEditPppoe = (secret) => {
    setEditingPppoe(secret);
    setIsPppoeFormOpen(true);
  };

  const handlePppoeSubmit = (data) => {
    if (editingPppoe) {
      updatePppoeMutation.mutate({ username: editingPppoe.name, data });
    } else {
      createPppoeMutation.mutate(data);
    }
  };

  const handleTogglePppoe = (username, currentDisabled) => {
    const newState = !currentDisabled;
    togglePppoeMutation.mutate({ username, disable: newState });
  };

  const handleDisconnectSession = (username) => {
    if (window.confirm(`Disconnect session "${username}"?`)) {
      removeSessionMutation.mutate(username);
    }
  };

  const handleRefresh = () => {
    switch (activeTab) {
      case 'info': refetchInfo(); break;
      case 'pppoe': refetchPppoe(); break;
      case 'sessions': refetchSessions(); break;
      case 'profiles': refetchProfiles(); break;
      case 'queues': refetchQueues(); break;
      default: break;
    }
  };

  if (routerLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!router) {
    return (
      <div className="text-center py-12">
        <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-3" />
        <h2 className="text-xl font-bold text-slate-900">Router not found</h2>
        <Button variant="outline" onClick={() => navigate('/routers')} className="mt-4">
          Back to Routers
        </Button>
      </div>
    );
  }

  // --- Tab renderers ---
  const renderInfoTab = () => {
    if (infoLoading) {
      return (
        <div className="py-12 text-center text-slate-400">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-2 text-primary" />
          <p className="text-xs font-mono">Connecting to RouterOS API ({router.ipAddress}:{router.apiPort})...</p>
        </div>
      );
    }
    
    if (infoError || !info) {
      const errMsg = infoErr?.response?.data?.message || infoErr?.message || 'Connection failed or timed out';
      return (
        <div className="bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-800/60 rounded-2xl p-6 text-center space-y-3">
          <AlertCircle className="w-10 h-10 text-rose-500 mx-auto" />
          <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">Unable to Connect to MikroTik RouterOS</h3>
          <p className="text-xs text-rose-600 dark:text-rose-400 font-mono max-w-xl mx-auto leading-relaxed">
            {errMsg}
          </p>
          <div className="pt-2 flex items-center justify-center space-x-3">
            <Button variant="outline" onClick={() => refetchInfo()} className="cursor-pointer">
              <RefreshCw className="w-3.5 h-3.5 mr-1" />
              <span>Retry Connection</span>
            </Button>
            <Button variant="outline" onClick={() => setIsOracleModalOpen(true)} className="cursor-pointer border-amber-300 text-amber-700 dark:text-amber-300">
              <Cloud className="w-3.5 h-3.5 mr-1 text-amber-500" />
              <span>Cloud / Public IP Guide</span>
            </Button>
          </div>
        </div>
      );
    }

    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-slate-50 rounded-lg p-4">
          <p className="text-sm text-slate-500">Identity</p>
          <p className="text-lg font-semibold text-slate-900">{info.identity || '-'}</p>
        </div>
        <div className="bg-slate-50 rounded-lg p-4">
          <p className="text-sm text-slate-500">Version</p>
          <p className="text-lg font-semibold text-slate-900">{info.version || '-'}</p>
        </div>
        <div className="bg-slate-50 rounded-lg p-4">
          <p className="text-sm text-slate-500">Uptime</p>
          <p className="text-lg font-semibold text-slate-900">{info.uptime || '-'}</p>
        </div>
        <div className="bg-slate-50 rounded-lg p-4">
          <p className="text-sm text-slate-500">CPU Load</p>
          <p className="text-lg font-semibold text-slate-900">{info.cpuLoad || '-'}</p>
        </div>
        <div className="bg-slate-50 rounded-lg p-4">
          <p className="text-sm text-slate-500">Free Memory</p>
          <p className="text-lg font-semibold text-slate-900">{info.freeMemory || '-'}</p>
        </div>
        <div className="bg-slate-50 rounded-lg p-4">
          <p className="text-sm text-slate-500">Total Memory</p>
          <p className="text-lg font-semibold text-slate-900">{info.totalMemory || '-'}</p>
        </div>
        <div className="bg-slate-50 rounded-lg p-4 col-span-2">
          <p className="text-sm text-slate-500">Board Name</p>
          <p className="text-lg font-semibold text-slate-900">{info.boardName || '-'}</p>
        </div>
      </div>
    );
  };

  // --- Render helper for paginated tables with filter ---
  const renderPaginatedTable = ({
    data,
    total,
    page,
    setPage,
    limit,
    setLimit,
    search,
    setSearch,
    searchPlaceholder = 'Search...',
    statusFilter,
    setStatusFilter,
    statusOptions,
    loading,
    columns,
    renderRow,
    keyField,
    emptyMessage,
    extraActions
  }) => {
    const totalPages = Math.ceil(total / limit) || 1;

    return (
      <div>
        {/* Filter bar */}
        <div className="flex flex-col sm:flex-row gap-3 mb-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder={searchPlaceholder}
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
            />
            {search && (
              <button
                onClick={() => { setSearch(''); setPage(1); }}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
          {statusFilter !== undefined && statusOptions && (
            <div className="sm:w-48">
              <select
                value={statusFilter}
                onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
              >
                <option value="">All status</option>
                {statusOptions.map(opt => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>
          )}
          {extraActions && <div className="flex items-center">{extraActions}</div>}
        </div>

        {loading ? (
          <div className="py-8 text-center"><Loader2 className="w-6 h-6 animate-spin mx-auto" /></div>
        ) : total === 0 ? (
          <div className="py-8 text-center text-slate-500">{emptyMessage}</div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-slate-50 border-b border-slate-200">
                  <tr>
                    {columns.map((col) => (
                      <th key={col.key} className={`px-4 py-2 text-left text-xs font-medium text-slate-500 uppercase ${col.className || ''}`}>
                        {col.label}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {data.map((item) => (
                    <tr key={item[keyField] || item.id || item.name} className="hover:bg-slate-50">
                      {renderRow(item)}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {/* Pagination controls */}
            <div className="flex flex-col sm:flex-row items-center justify-between pt-4 border-t border-slate-200 mt-4 gap-2">
              <div className="text-sm text-slate-500">
                Showing {((page - 1) * limit) + 1}–{Math.min(page * limit, total)} of {total}
              </div>
              <div className="flex items-center space-x-2">
                <select
                  value={limit}
                  onChange={(e) => { setLimit(Number(e.target.value)); setPage(1); }}
                  className="border border-slate-300 rounded px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                >
                  {[20, 50, 100, 200].map(size => (
                    <option key={size} value={size}>{size}</option>
                  ))}
                </select>
                <div className="flex space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={page === 1}
                    onClick={() => setPage(p => p - 1)}
                  >
                    Previous
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={page === totalPages}
                    onClick={() => setPage(p => p + 1)}
                  >
                    Next
                  </Button>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    );
  };

  // PPPoE tab
  const renderPppoeTab = () => {
    const secrets = pppoeData?.data || [];
    const total = pppoeData?.total || 0;

    const columns = [
      { key: 'username', label: 'Username' },
      { key: 'profile', label: 'Profile' },
      { key: 'status', label: 'Status' },
      { key: 'comment', label: 'Comment' },
      { key: 'actions', label: 'Actions', className: 'text-right' },
    ];

    const renderRow = (secret) => {
      const isToggling = togglePppoeMutation.isPending && togglePppoeMutation.variables?.username === secret.name;
      return (
        <>
          <td className="px-4 py-3 text-sm font-mono text-slate-900">{secret.name}</td>
          <td className="px-4 py-3 text-sm text-slate-600">{secret.profile}</td>
          <td className="px-4 py-3">
            {secret.disabled ? (
              <Badge variant="danger">Disabled</Badge>
            ) : (
              <Badge variant="success">Enabled</Badge>
            )}
          </td>
          <td className="px-4 py-3 text-sm text-slate-600 max-w-xs truncate">{secret.comment || '-'}</td>
          <td className="px-4 py-3 text-right">
            <div className="flex items-center justify-end space-x-1">
              <button
                onClick={() => handleTogglePppoe(secret.name, secret.disabled)}
                disabled={isToggling}
                className={`p-1.5 rounded-lg transition-colors ${
                  secret.disabled
                    ? 'text-green-600 hover:bg-green-50'
                    : 'text-amber-600 hover:bg-amber-50'
                } ${isToggling ? 'opacity-50 cursor-not-allowed' : ''}`}
                title={secret.disabled ? 'Enable' : 'Disable'}
              >
                {isToggling ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : secret.disabled ? (
                  <Power className="w-4 h-4" />
                ) : (
                  <PowerOff className="w-4 h-4" />
                )}
              </button>
              <button
                onClick={() => handleEditPppoe(secret)}
                className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg"
                title="Edit"
              >
                <Edit className="w-4 h-4" />
              </button>
              <button
                onClick={() => handleDeletePppoe(secret.name)}
                className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg"
                title="Delete"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </td>
        </>
      );
    };

    return (
      <div>
        <div className="flex justify-between items-center mb-4 flex-wrap gap-2">
          <div className="flex items-center space-x-3">
            <p className="text-sm text-slate-500">{total} secrets</p>
            {isMockMode && (
              <Badge variant="warning" className="flex items-center space-x-1">
                <AlertTriangle className="w-3 h-3" />
                <span>Mock Mode</span>
              </Badge>
            )}
          </div>
          <div className="flex space-x-2">
            <Button variant="outline" size="sm" onClick={refetchPppoe}>
              <RefreshCw className="w-4 h-4" />
              <span>Refresh</span>
            </Button>
            <Button size="sm" onClick={() => { setEditingPppoe(null); setIsPppoeFormOpen(true); }}>
              <Plus className="w-4 h-4" />
              <span>Add Secret</span>
            </Button>
          </div>
        </div>
        {renderPaginatedTable({
          data: secrets,
          total,
          page: pppoePage,
          setPage: setPppoePage,
          limit: pppoeLimit,
          setLimit: setPppoeLimit,
          search: pppoeSearch,
          setSearch: setPppoeSearch,
          searchPlaceholder: 'Search by username or comment...',
          statusFilter: pppoeStatus,
          setStatusFilter: setPppoeStatus,
          statusOptions: [
            { value: 'enabled', label: 'Enabled' },
            { value: 'disabled', label: 'Disabled' },
          ],
          loading: pppoeLoading,
          columns,
          renderRow,
          keyField: 'name',
          emptyMessage: 'No PPPoE secrets found',
        })}
      </div>
    );
  };

  // Sessions tab
  const renderSessionsTab = () => {
    const sessions = sessionData?.data || [];
    const total = sessionData?.total || 0;

    const columns = [
      { key: 'username', label: 'Username' },
      { key: 'address', label: 'IP Address' },
      { key: 'uptime', label: 'Uptime' },
      { key: 'bytesIn', label: 'Bytes In' },
      { key: 'bytesOut', label: 'Bytes Out' },
      { key: 'actions', label: 'Actions', className: 'text-right' },
    ];

    const renderRow = (session) => {
      const isDisconnecting = removeSessionMutation.isPending && removeSessionMutation.variables === session.username;
      return (
        <>
          <td className="px-4 py-3 text-sm font-mono text-slate-900">{session.username}</td>
          <td className="px-4 py-3 text-sm font-mono text-slate-600">{session.address}</td>
          <td className="px-4 py-3 text-sm text-slate-600">{formatUptime(session.uptime)}</td>
          <td className="px-4 py-3 text-sm text-slate-600">{formatBytes(session.bytesIn)}</td>
          <td className="px-4 py-3 text-sm text-slate-600">{formatBytes(session.bytesOut)}</td>
          <td className="px-4 py-3 text-right">
            <button
              onClick={() => handleDisconnectSession(session.username)}
              disabled={isDisconnecting}
              className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
              title="Disconnect"
            >
              {isDisconnecting ? <Loader2 className="w-4 h-4 animate-spin" /> : <LogOut className="w-4 h-4" />}
            </button>
          </td>
        </>
      );
    };

    return (
      <div>
        <div className="flex justify-between items-center mb-4">
          <p className="text-sm text-slate-500">{total} active sessions</p>
          <Button variant="outline" size="sm" onClick={refetchSessions}>
            <RefreshCw className="w-4 h-4" />
            <span>Refresh</span>
          </Button>
        </div>
        {renderPaginatedTable({
          data: sessions,
          total,
          page: sessionPage,
          setPage: setSessionPage,
          limit: sessionLimit,
          setLimit: setSessionLimit,
          search: sessionSearch,
          setSearch: setSessionSearch,
          searchPlaceholder: 'Search by username...',
          loading: sessionsLoading,
          columns,
          renderRow,
          keyField: 'username',
          emptyMessage: 'No active sessions',
        })}
      </div>
    );
  };

  // Profiles tab
  const renderProfilesTab = () => {
    const profiles = profileData?.data || [];
    const total = profileData?.total || 0;

    const columns = [
      { key: 'name', label: 'Name' },
      { key: 'localAddress', label: 'Local Address' },
      { key: 'remoteAddress', label: 'Remote Address' },
      { key: 'rateLimit', label: 'Rate Limit' },
      { key: 'comment', label: 'Comment' },
    ];

    const renderRow = (profile) => (
      <>
        <td className="px-4 py-3 text-sm font-semibold text-slate-900">{profile.name}</td>
        <td className="px-4 py-3 text-sm font-mono text-slate-600">{profile.localAddress || '-'}</td>
        <td className="px-4 py-3 text-sm font-mono text-slate-600">{profile.remoteAddress || '-'}</td>
        <td className="px-4 py-3 text-sm text-slate-600">{profile.rateLimit || '-'}</td>
        <td className="px-4 py-3 text-sm text-slate-600 max-w-xs truncate">{profile.comment || '-'}</td>
      </>
    );

    return (
      <div>
        <div className="flex justify-between items-center mb-4">
          <p className="text-sm text-slate-500">{total} profiles</p>
          <Button variant="outline" size="sm" onClick={refetchProfiles}>
            <RefreshCw className="w-4 h-4" />
            <span>Refresh</span>
          </Button>
        </div>
        {renderPaginatedTable({
          data: profiles,
          total,
          page: profilePage,
          setPage: setProfilePage,
          limit: profileLimit,
          setLimit: setProfileLimit,
          search: profileSearch,
          setSearch: setProfileSearch,
          searchPlaceholder: 'Search by name or comment...',
          loading: profilesLoading,
          columns,
          renderRow,
          keyField: 'name',
          emptyMessage: 'No profiles found',
        })}
      </div>
    );
  };

  // Queues tab
  const renderQueuesTab = () => {
    const queues = queueData?.data || [];
    const total = queueData?.total || 0;

    const columns = [
      { key: 'name', label: 'Name' },
      { key: 'target', label: 'Target' },
      { key: 'maxLimit', label: 'Max Limit' },
      { key: 'status', label: 'Status' },
      { key: 'comment', label: 'Comment' },
    ];

    const renderRow = (queue) => (
      <>
        <td className="px-4 py-3 text-sm font-semibold text-slate-900">{queue.name}</td>
        <td className="px-4 py-3 text-sm font-mono text-slate-600">{queue.target}</td>
        <td className="px-4 py-3 text-sm text-slate-600">{queue.maxLimit}</td>
        <td className="px-4 py-3">
          {queue.disabled ? (
            <Badge variant="danger">Disabled</Badge>
          ) : (
            <Badge variant="success">Enabled</Badge>
          )}
        </td>
        <td className="px-4 py-3 text-sm text-slate-600 max-w-xs truncate">{queue.comment || '-'}</td>
      </>
    );

    return (
      <div>
        <div className="flex justify-between items-center mb-4">
          <p className="text-sm text-slate-500">{total} queues</p>
          <Button variant="outline" size="sm" onClick={refetchQueues}>
            <RefreshCw className="w-4 h-4" />
            <span>Refresh</span>
          </Button>
        </div>
        {renderPaginatedTable({
          data: queues,
          total,
          page: queuePage,
          setPage: setQueuePage,
          limit: queueLimit,
          setLimit: setQueueLimit,
          search: queueSearch,
          setSearch: setQueueSearch,
          searchPlaceholder: 'Search by name or comment...',
          loading: queuesLoading,
          columns,
          renderRow,
          keyField: 'name',
          emptyMessage: 'No queues found',
        })}
      </div>
    );
  };

  const handleRunCommand = async (cmdToRun) => {
    const targetCmd = cmdToRun || cliCommand;
    if (!targetCmd.trim()) return;

    setIsCliRunning(true);
    try {
      const res = await routerApi.executeCliCommand(id, targetCmd);
      const data = res.data.data;
      setCliHistory(prev => [
        ...prev,
        {
          timestamp: new Date().toLocaleTimeString(),
          command: targetCmd,
          output: data,
          isSuccess: true,
        }
      ]);
      setCliCommand('');
    } catch (error) {
      setCliHistory(prev => [
        ...prev,
        {
          timestamp: new Date().toLocaleTimeString(),
          command: targetCmd,
          output: error.response?.data?.message || error.message || 'Execution failed',
          isSuccess: false,
        }
      ]);
    } finally {
      setIsCliRunning(false);
    }
  };

  const renderTerminalTab = () => {
    return (
      <div className="space-y-4">
        {/* Terminal Header & Controls */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-900 text-slate-200 p-4 rounded-2xl border border-slate-800">
          <div className="flex items-center space-x-2.5">
            <Terminal className="w-5 h-5 text-emerald-400" />
            <span className="font-mono font-bold text-sm">RouterOS Interactive CLI Console</span>
            <span className={`text-[10px] px-2.5 py-0.5 rounded-full font-mono font-bold ${isMockMode ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30' : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'}`}>
              {isMockMode ? 'MOCK SIMULATOR' : 'LIVE HARDWARE API'}
            </span>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={() => setCliHistory([])}
              className="text-xs text-slate-400 hover:text-slate-200 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 transition font-mono cursor-pointer"
            >
              Clear Screen
            </button>
          </div>
        </div>

        {/* Quick Command Chips */}
        <div className="flex flex-wrap gap-2 text-xs items-center">
          <span className="text-slate-400 text-xs font-mono">Quick Run:</span>
          {[
            '/system/resource/print',
            '/interface/print',
            '/ip/address/print',
            '/ppp/secret/print',
            '/ppp/active/print',
            '/queue/simple/print',
            '/ping 8.8.8.8 count=4'
          ].map((cmd) => (
            <button
              key={cmd}
              onClick={() => handleRunCommand(cmd)}
              disabled={isCliRunning}
              className="px-2.5 py-1 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-lg font-mono text-[11px] border border-slate-200 dark:border-slate-700 transition cursor-pointer"
            >
              {cmd}
            </button>
          ))}
        </div>

        {/* Terminal Screen */}
        <div className="bg-slate-950 text-slate-100 p-4 rounded-2xl font-mono text-xs border border-slate-800 shadow-inner min-h-[380px] max-h-[520px] overflow-y-auto space-y-4">
          <div className="text-slate-500 text-[11px] space-y-0.5">
            <div>MikroTik RouterOS 7.15.2 Interactive Shell</div>
            <div>Connected to: {router.name} ({router.ipAddress}:{router.apiPort})</div>
            <div>--------------------------------------------------------------------------------</div>
          </div>

          {cliHistory.map((item, idx) => (
            <div key={idx} className="space-y-1.5 border-b border-slate-900 pb-3">
              <div className="flex items-center space-x-2 text-emerald-400 font-bold">
                <span>[{router.username}@{router.name}] &gt;</span>
                <span className="text-slate-100">{item.command}</span>
                <span className="text-[10px] text-slate-600 font-normal">({item.timestamp})</span>
              </div>
              <pre className={`whitespace-pre-wrap overflow-x-auto p-3 rounded-xl border leading-relaxed text-[11px] ${item.isSuccess ? 'bg-slate-900/80 text-emerald-300 border-slate-800/80' : 'bg-rose-950/40 text-rose-300 border-rose-900/50'}`}>
                {typeof item.output === 'string' ? item.output : JSON.stringify(item.output, null, 2)}
              </pre>
            </div>
          ))}

          {isCliRunning && (
            <div className="flex items-center space-x-2 text-amber-400 font-bold animate-pulse">
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
              <span>Executing command on RouterOS...</span>
            </div>
          )}
        </div>

        {/* Input Bar */}
        <form onSubmit={(e) => { e.preventDefault(); handleRunCommand(); }} className="flex gap-2">
          <div className="relative flex-1">
            <span className="absolute left-3.5 top-2.5 font-mono text-emerald-500 font-bold text-sm">&gt;</span>
            <input
              type="text"
              value={cliCommand}
              onChange={(e) => setCliCommand(e.target.value)}
              placeholder="Enter RouterOS command (e.g. /system/resource/print)"
              className="w-full pl-8 pr-4 py-2.5 bg-slate-900 text-slate-100 border border-slate-800 rounded-xl font-mono text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
              disabled={isCliRunning}
            />
          </div>
          <Button type="submit" isLoading={isCliRunning} className="cursor-pointer bg-emerald-600 hover:bg-emerald-700">
            <Play className="w-3.5 h-3.5 fill-current" />
            <span>Execute</span>
          </Button>
        </form>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100 flex items-center space-x-3">
            <span>{router.name}</span>
            <Badge variant={router.isActive ? 'success' : 'danger'}>
              {router.isActive ? 'Active' : 'Inactive'}
            </Badge>
          </h1>
          <p className="text-sm text-slate-500 font-mono">
            {router.ipAddress}:{router.apiPort}
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            onClick={() => setIsOracleModalOpen(true)}
            className="cursor-pointer border-amber-300 dark:border-amber-700/60 text-amber-700 dark:text-amber-300 hover:bg-amber-50 dark:hover:bg-amber-950/30"
          >
            <Cloud className="w-4 h-4 text-amber-500" />
            <span>Oracle Cloud Guide</span>
          </Button>
          <Button variant="outline" onClick={handleRefresh} className="cursor-pointer">
            <RefreshCw className="w-4 h-4" />
            <span>Refresh All</span>
          </Button>
        </div>
      </div>

      {/* Mock Mode Warning Banner */}
      {isMockMode && (
        <div className="bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60 rounded-xl p-3.5 flex items-center space-x-2 text-amber-800 dark:text-amber-300">
          <AlertTriangle className="w-5 h-5 flex-shrink-0 text-amber-500" />
          <p className="text-sm">
            <strong>Mock Mode Active:</strong> All MikroTik operations are simulated with live virtual state. No physical hardware connection required.
          </p>
        </div>
      )}

      {/* Tabs */}
      <div className="border-b border-slate-200 dark:border-slate-700">
        <nav className="flex space-x-4 overflow-x-auto">
          {[
            { id: 'info', label: 'Info', icon: Info },
            { id: 'terminal', label: 'Live CLI Terminal', icon: Terminal },
            { id: 'pppoe', label: 'PPPoE Secrets', icon: Users },
            { id: 'sessions', label: 'Active Sessions', icon: Activity },
            { id: 'profiles', label: 'Profiles', icon: Layers },
            { id: 'queues', label: 'Queues', icon: BarChart3 },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center space-x-2 py-3 px-2 border-b-2 text-sm font-medium transition-colors whitespace-nowrap cursor-pointer ${
                activeTab === tab.id
                  ? 'border-primary text-primary'
                  : 'border-transparent text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200'
              }`}
            >
              <tab.icon className="w-4 h-4" />
              <span>{tab.label}</span>
            </button>
          ))}
        </nav>
      </div>

      {/* Tab content */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-4 lg:p-6 shadow-sm">
        {activeTab === 'info' && renderInfoTab()}
        {activeTab === 'terminal' && renderTerminalTab()}
        {activeTab === 'pppoe' && renderPppoeTab()}
        {activeTab === 'sessions' && renderSessionsTab()}
        {activeTab === 'profiles' && renderProfilesTab()}
        {activeTab === 'queues' && renderQueuesTab()}
      </div>

      {/* PPPoE Form Modal */}
      <Modal
        isOpen={isPppoeFormOpen}
        onClose={() => { setIsPppoeFormOpen(false); setEditingPppoe(null); }}
        title={editingPppoe ? 'Edit PPPoE Secret' : 'Add PPPoE Secret'}
      >
        <PppoeForm
          initialData={editingPppoe}
          onSubmit={handlePppoeSubmit}
          isLoading={createPppoeMutation.isPending || updatePppoeMutation.isPending}
          onCancel={() => { setIsPppoeFormOpen(false); setEditingPppoe(null); }}
        />
      </Modal>

      {/* Oracle Cloud Setup Modal */}
      <OracleSetupModal
        isOpen={isOracleModalOpen}
        onClose={() => setIsOracleModalOpen(false)}
      />
    </div>
  );
}

// PPPoE Form Component
function PppoeForm({ initialData, onSubmit, isLoading, onCancel }) {
  const [formData, setFormData] = useState({
    username: initialData?.name || '',
    password: '',
    profile: initialData?.profile || 'default',
    comment: initialData?.comment || '',
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">
          Username <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          value={formData.username}
          onChange={(e) => setFormData({ ...formData, username: e.target.value })}
          className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50"
          required
          disabled={!!initialData}
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">
          Password {!initialData && <span className="text-red-500">*</span>}
        </label>
        <input
          type="text"
          value={formData.password}
          onChange={(e) => setFormData({ ...formData, password: e.target.value })}
          className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50"
          required={!initialData}
          placeholder={initialData ? 'Leave blank to keep current' : 'Enter password'}
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">
          Profile <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          value={formData.profile}
          onChange={(e) => setFormData({ ...formData, profile: e.target.value })}
          className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50"
          required
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">Comment</label>
        <input
          type="text"
          value={formData.comment}
          onChange={(e) => setFormData({ ...formData, comment: e.target.value })}
          className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50"
        />
      </div>
      <div className="flex justify-end space-x-3 pt-4 border-t border-slate-200">
        <Button variant="outline" onClick={onCancel} type="button">Cancel</Button>
        <Button type="submit" isLoading={isLoading}>
          {initialData ? 'Update Secret' : 'Create Secret'}
        </Button>
      </div>
    </form>
  );
}