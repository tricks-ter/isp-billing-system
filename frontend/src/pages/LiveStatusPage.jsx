// frontend/src/pages/LiveStatusPage.jsx
import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { routerApi } from '../services/routerApi';
import { Zap, Wifi, WifiOff, RefreshCw, CheckSquare, Square, Pause, Play } from 'lucide-react';
import Button from '../components/Button';
import Badge from '../components/Badge';
import toast from 'react-hot-toast';

export default function LiveStatusPage() {
  const [selectedCustomers, setSelectedCustomers] = useState([]);
  const [search, setSearch] = useState('');
  const [routerFilter, setRouterFilter] = useState('all');
  const queryClient = useQueryClient();

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['liveStatus'],
    queryFn: () => routerApi.getLiveStatus().then(res => res.data.data),
    refetchInterval: 30000,
  });

  const routersSummary = useMemo(() => {
    if (!data?.customers) return [];
    const map = {};
    data.customers.forEach(c => {
      const routerName = c.routerName || 'No Router';
      if (!map[routerName]) {
        map[routerName] = { total: 0, online: 0, offline: 0 };
      }
      map[routerName].total++;
      if (c.isOnline) map[routerName].online++;
      else map[routerName].offline++;
    });
    return Object.entries(map).map(([name, stats]) => ({ name, ...stats }));
  }, [data]);

  const filteredCustomers = useMemo(() => {
    if (!data?.customers) return [];
    if (routerFilter === 'all') return data.customers;
    return data.customers.filter(c => (c.routerName || 'No Router') === routerFilter);
  }, [data, routerFilter]);

  const searchedCustomers = useMemo(() => {
    return filteredCustomers.filter(c =>
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.pppoeUsername.toLowerCase().includes(search.toLowerCase())
    );
  }, [filteredCustomers, search]);

  const bulkSuspendMutation = useMutation({
    mutationFn: (ids) => routerApi.bulkSuspend(ids),
    onSuccess: (res) => {
      const { success, failed } = res.data.data;
      toast.success(`Suspended: ${success}, Failed: ${failed}`);
      queryClient.invalidateQueries(['liveStatus']);
      setSelectedCustomers([]);
    },
    onError: (error) => toast.error(error.response?.data?.message || 'Bulk suspend failed'),
  });

  const bulkRestoreMutation = useMutation({
    mutationFn: (ids) => routerApi.bulkRestore(ids),
    onSuccess: (res) => {
      const { success, failed } = res.data.data;
      toast.success(`Restored: ${success}, Failed: ${failed}`);
      queryClient.invalidateQueries(['liveStatus']);
      setSelectedCustomers([]);
    },
    onError: (error) => toast.error(error.response?.data?.message || 'Bulk restore failed'),
  });

  const toggleSelect = (id) => {
    setSelectedCustomers(prev =>
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const selectAll = () => {
    if (selectedCustomers.length === searchedCustomers?.length) {
      setSelectedCustomers([]);
    } else {
      setSelectedCustomers(searchedCustomers?.map(c => c.id) || []);
    }
  };

  const handleBulkSuspend = () => {
    if (selectedCustomers.length === 0) {
      toast.error('No customers selected');
      return;
    }
    if (window.confirm(`Suspend ${selectedCustomers.length} customers?`)) {
      bulkSuspendMutation.mutate(selectedCustomers);
    }
  };

  const handleBulkRestore = () => {
    if (selectedCustomers.length === 0) {
      toast.error('No customers selected');
      return;
    }
    if (window.confirm(`Restore ${selectedCustomers.length} customers?`)) {
      bulkRestoreMutation.mutate(selectedCustomers);
    }
  };

  return (
    <div className="space-y-4 lg:space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Live Status</h1>
          <p className="text-sm text-slate-500 mt-1">Real-time customer connection status</p>
        </div>
        <Button variant="outline" onClick={() => refetch()}>
          <RefreshCw className="w-4 h-4" />
          <span>Refresh</span>
        </Button>
      </div>

      {/* Stats */}
      {data && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-white rounded-xl border border-slate-200 p-4">
            <p className="text-sm text-slate-500 mb-1">Total Customers</p>
            <p className="text-2xl font-bold text-slate-900">{data.total}</p>
          </div>
          <div className="bg-green-50 border border-green-200 rounded-xl p-4">
            <p className="text-sm text-green-600 mb-1">Online</p>
            <p className="text-2xl font-bold text-green-700">{data.online}</p>
          </div>
          <div className="bg-red-50 border border-red-200 rounded-xl p-4">
            <p className="text-sm text-red-600 mb-1">Offline</p>
            <p className="text-2xl font-bold text-red-700">{data.offline}</p>
          </div>
        </div>
      )}

      {/* Router Summary Cards */}
      {routersSummary.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {routersSummary.map((router) => (
            <div key={router.name} className="bg-white rounded-xl border border-slate-200 p-4">
              <h4 className="font-medium text-slate-900 truncate">{router.name}</h4>
              <div className="flex items-center justify-between mt-2 text-sm">
                <span className="text-slate-500">Total: <strong>{router.total}</strong></span>
                <span className="text-green-600">Online: {router.online}</span>
                <span className="text-red-600">Offline: {router.offline}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Controls */}
      <div className="bg-white rounded-xl border border-slate-200 p-3 lg:p-4">
        <div className="flex flex-col sm:flex-row gap-3">
          <input
            type="text"
            placeholder="Search by name or PPPoE username..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="flex-1 px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
          />
          <div className="flex-1 sm:max-w-xs">
            <select
              value={routerFilter}
              onChange={(e) => setRouterFilter(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
            >
              <option value="all">All Routers</option>
              {routersSummary.map(r => (
                <option key={r.name} value={r.name}>{r.name}</option>
              ))}
            </select>
          </div>
          <div className="flex gap-2">
            <Button
              variant="danger"
              size="sm"
              onClick={handleBulkSuspend}
              disabled={selectedCustomers.length === 0}
            >
              <Pause className="w-4 h-4" />
              <span>Suspend ({selectedCustomers.length})</span>
            </Button>
            <Button
              variant="success"
              size="sm"
              onClick={handleBulkRestore}
              disabled={selectedCustomers.length === 0}
            >
              <Play className="w-4 h-4" />
              <span>Restore ({selectedCustomers.length})</span>
            </Button>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="px-6 py-3 text-left">
                  <button onClick={selectAll} className="text-slate-400 hover:text-slate-600">
                    {selectedCustomers.length === searchedCustomers?.length && searchedCustomers.length > 0
                      ? <CheckSquare className="w-5 h-5" />
                      : <Square className="w-5 h-5" />
                    }
                  </button>
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Customer</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">PPPoE</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Router</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">IP Address</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Uptime</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {isLoading ? (
                <tr><td colSpan="7" className="px-6 py-12 text-center text-slate-500">Loading...</td></tr>
              ) : searchedCustomers.length === 0 ? (
                <tr><td colSpan="7" className="px-6 py-12 text-center text-slate-500">No customers found</td></tr>
              ) : (
                searchedCustomers.map((customer) => (
                  <tr key={customer.id} className="hover:bg-slate-50">
                    <td className="px-6 py-4">
                      <button onClick={() => toggleSelect(customer.id)} className="text-slate-400 hover:text-slate-600">
                        {selectedCustomers.includes(customer.id)
                          ? <CheckSquare className="w-5 h-5 text-primary" />
                          : <Square className="w-5 h-5" />
                        }
                      </button>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm font-medium text-slate-900">{customer.name}</div>
                      <div className="text-xs text-slate-500">{customer.package?.name}</div>
                    </td>
                    <td className="px-6 py-4 text-sm font-mono text-slate-600">{customer.pppoeUsername}</td>
                    <td className="px-6 py-4 text-sm text-slate-600">{customer.routerName}</td>
                    <td className="px-6 py-4 text-sm font-mono text-slate-600">{customer.ipAddress}</td>
                    <td className="px-6 py-4">
                      {customer.isOnline ? (
                        <Badge variant="success">
                          <Wifi className="w-3 h-3 mr-1" />
                          Online
                        </Badge>
                      ) : (
                        <Badge variant="danger">
                          <WifiOff className="w-3 h-3 mr-1" />
                          Offline
                        </Badge>
                      )}
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-600">{customer.uptime}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}