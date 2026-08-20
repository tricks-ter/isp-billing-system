// frontend/src/pages/RouterDetailPage.jsx
import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Server, Info, Users, Activity, Layers, BarChart3,
  RefreshCw, Plus, Edit, Trash2, Loader2,
  AlertCircle, Eye
} from 'lucide-react';
import { routerApi } from '../services/routerApi';
import Button from '../components/Button';
import Badge from '../components/Badge';
import Modal from '../components/Modal';
import toast from 'react-hot-toast';

// Helper to format bytes
const formatBytes = (bytes) => {
  if (!bytes) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

// Helper to format uptime (HH:MM:SS)
const formatUptime = (uptime) => {
  if (!uptime) return '-';
  return uptime;
};

export default function RouterDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState('info');
  const [isPppoeFormOpen, setIsPppoeFormOpen] = useState(false);
  const [editingPppoe, setEditingPppoe] = useState(null);

  // Fetch router details
  const { data: router, isLoading: routerLoading } = useQuery({
    queryKey: ['router', id],
    queryFn: () => routerApi.getById(id).then(res => res.data.data),
  });

  // Fetch router info
  const { data: info, isLoading: infoLoading, refetch: refetchInfo } = useQuery({
    queryKey: ['routerInfo', id],
    queryFn: () => routerApi.getRouterInfo(id).then(res => res.data.data),
    enabled: activeTab === 'info',
  });

  // Fetch PPPoE secrets
  const { data: pppoeSecrets, isLoading: pppoeLoading, refetch: refetchPppoe } = useQuery({
    queryKey: ['pppoeSecrets', id],
    queryFn: () => routerApi.getPppoeSecrets(id).then(res => res.data.data),
    enabled: activeTab === 'pppoe',
  });

  // Fetch active sessions
  const { data: activeSessions, isLoading: sessionsLoading, refetch: refetchSessions } = useQuery({
    queryKey: ['activeSessions', id],
    queryFn: () => routerApi.getActiveSessions(id).then(res => res.data.data),
    enabled: activeTab === 'sessions',
  });

  // Fetch profiles
  const { data: profiles, isLoading: profilesLoading, refetch: refetchProfiles } = useQuery({
    queryKey: ['profiles', id],
    queryFn: () => routerApi.getProfiles(id).then(res => res.data.data),
    enabled: activeTab === 'profiles',
  });

  // Fetch queues
  const { data: queues, isLoading: queuesLoading, refetch: refetchQueues } = useQuery({
    queryKey: ['queues', id],
    queryFn: () => routerApi.getSimpleQueues(id).then(res => res.data.data),
    enabled: activeTab === 'queues',
  });

  // Mutations for PPPoE secrets
  const createPppoeMutation = useMutation({
    mutationFn: (data) => routerApi.createPppoeSecret(id, data),
    onSuccess: () => {
      toast.success('PPPoE secret created');
      queryClient.invalidateQueries(['pppoeSecrets', id]);
      setIsPppoeFormOpen(false);
    },
    onError: (error) => toast.error(error.response?.data?.message || 'Failed to create'),
  });

  const updatePppoeMutation = useMutation({
    mutationFn: ({ username, data }) => routerApi.updatePppoeSecret(id, username, data),
    onSuccess: () => {
      toast.success('PPPoE secret updated');
      queryClient.invalidateQueries(['pppoeSecrets', id]);
      setIsPppoeFormOpen(false);
      setEditingPppoe(null);
    },
    onError: (error) => toast.error(error.response?.data?.message || 'Failed to update'),
  });

  const deletePppoeMutation = useMutation({
    mutationFn: (username) => routerApi.deletePppoeSecret(id, username),
    onSuccess: () => {
      toast.success('PPPoE secret deleted');
      queryClient.invalidateQueries(['pppoeSecrets', id]);
    },
    onError: (error) => toast.error(error.response?.data?.message || 'Failed to delete'),
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

  // Refresh all data for current tab
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

  const renderInfoTab = () => {
    if (infoLoading) return <div className="py-8 text-center"><Loader2 className="w-6 h-6 animate-spin mx-auto" /></div>;
    if (!info) return <div className="py-8 text-center text-slate-500">No info available</div>;

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

  const renderPppoeTab = () => {
    if (pppoeLoading) return <div className="py-8 text-center"><Loader2 className="w-6 h-6 animate-spin mx-auto" /></div>;
    const secrets = pppoeSecrets || [];

    return (
      <div>
        <div className="flex justify-between items-center mb-4">
          <p className="text-sm text-slate-500">{secrets.length} secrets</p>
          <Button size="sm" onClick={() => { setEditingPppoe(null); setIsPppoeFormOpen(true); }}>
            <Plus className="w-4 h-4" />
            <span>Add Secret</span>
          </Button>
        </div>

        {secrets.length === 0 ? (
          <div className="text-center py-8 text-slate-500">No PPPoE secrets found</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="px-4 py-2 text-left text-xs font-medium text-slate-500 uppercase">Username</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-slate-500 uppercase">Profile</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-slate-500 uppercase">Status</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-slate-500 uppercase">Comment</th>
                  <th className="px-4 py-2 text-right text-xs font-medium text-slate-500 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {secrets.map((secret) => (
                  <tr key={secret.id || secret.name} className="hover:bg-slate-50">
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
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    );
  };

  const renderSessionsTab = () => {
    if (sessionsLoading) return <div className="py-8 text-center"><Loader2 className="w-6 h-6 animate-spin mx-auto" /></div>;
    const sessions = activeSessions || [];

    return (
      <div>
        <div className="flex justify-between items-center mb-4">
          <p className="text-sm text-slate-500">{sessions.length} active sessions</p>
        </div>

        {sessions.length === 0 ? (
          <div className="text-center py-8 text-slate-500">No active sessions</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="px-4 py-2 text-left text-xs font-medium text-slate-500 uppercase">Username</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-slate-500 uppercase">IP Address</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-slate-500 uppercase">Uptime</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-slate-500 uppercase">Bytes In</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-slate-500 uppercase">Bytes Out</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {sessions.map((session) => (
                  <tr key={session.id || session.username} className="hover:bg-slate-50">
                    <td className="px-4 py-3 text-sm font-mono text-slate-900">{session.username}</td>
                    <td className="px-4 py-3 text-sm font-mono text-slate-600">{session.address}</td>
                    <td className="px-4 py-3 text-sm text-slate-600">{formatUptime(session.uptime)}</td>
                    <td className="px-4 py-3 text-sm text-slate-600">{formatBytes(session.bytesIn)}</td>
                    <td className="px-4 py-3 text-sm text-slate-600">{formatBytes(session.bytesOut)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    );
  };

  const renderProfilesTab = () => {
    if (profilesLoading) return <div className="py-8 text-center"><Loader2 className="w-6 h-6 animate-spin mx-auto" /></div>;
    const profileList = profiles || [];

    return (
      <div>
        <p className="text-sm text-slate-500 mb-4">{profileList.length} profiles</p>
        {profileList.length === 0 ? (
          <div className="text-center py-8 text-slate-500">No profiles found</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="px-4 py-2 text-left text-xs font-medium text-slate-500 uppercase">Name</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-slate-500 uppercase">Local Address</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-slate-500 uppercase">Remote Address</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-slate-500 uppercase">Rate Limit</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-slate-500 uppercase">Comment</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {profileList.map((profile) => (
                  <tr key={profile.id || profile.name} className="hover:bg-slate-50">
                    <td className="px-4 py-3 text-sm font-semibold text-slate-900">{profile.name}</td>
                    <td className="px-4 py-3 text-sm font-mono text-slate-600">{profile.localAddress || '-'}</td>
                    <td className="px-4 py-3 text-sm font-mono text-slate-600">{profile.remoteAddress || '-'}</td>
                    <td className="px-4 py-3 text-sm text-slate-600">{profile.rateLimit || '-'}</td>
                    <td className="px-4 py-3 text-sm text-slate-600 max-w-xs truncate">{profile.comment || '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    );
  };

  const renderQueuesTab = () => {
    if (queuesLoading) return <div className="py-8 text-center"><Loader2 className="w-6 h-6 animate-spin mx-auto" /></div>;
    const queueList = queues || [];

    return (
      <div>
        <p className="text-sm text-slate-500 mb-4">{queueList.length} queues</p>
        {queueList.length === 0 ? (
          <div className="text-center py-8 text-slate-500">No queues found</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="px-4 py-2 text-left text-xs font-medium text-slate-500 uppercase">Name</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-slate-500 uppercase">Target</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-slate-500 uppercase">Max Limit</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-slate-500 uppercase">Status</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-slate-500 uppercase">Comment</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {queueList.map((queue) => (
                  <tr key={queue.id || queue.name} className="hover:bg-slate-50">
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
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header with back button and router info */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <button
            onClick={() => navigate('/routers')}
            className="text-sm text-primary hover:underline mb-1"
          >
            ← Back to Routers
          </button>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center space-x-3">
            <Server className="w-6 h-6 text-primary" />
            <span>{router.name}</span>
            <Badge variant={router.isActive ? 'success' : 'danger'}>
              {router.isActive ? 'Active' : 'Inactive'}
            </Badge>
          </h1>
          <p className="text-sm text-slate-500 font-mono">
            {router.ipAddress}:{router.apiPort}
          </p>
        </div>
        <Button variant="outline" onClick={handleRefresh}>
          <RefreshCw className="w-4 h-4" />
          <span>Refresh</span>
        </Button>
      </div>

      {/* Tabs */}
      <div className="border-b border-slate-200">
        <nav className="flex space-x-4 overflow-x-auto">
          {[
            { id: 'info', label: 'Info', icon: Info },
            { id: 'pppoe', label: 'PPPoE Secrets', icon: Users },
            { id: 'sessions', label: 'Active Sessions', icon: Activity },
            { id: 'profiles', label: 'Profiles', icon: Layers },
            { id: 'queues', label: 'Queues', icon: BarChart3 },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center space-x-2 py-3 px-2 border-b-2 text-sm font-medium transition-colors whitespace-nowrap ${
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

      {/* Tab content */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 lg:p-6">
        {activeTab === 'info' && renderInfoTab()}
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
          disabled={!!initialData} // Can't change username on edit
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