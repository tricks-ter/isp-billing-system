import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { auditApi } from '../services/auditApi';
import Button from '../components/Button';
import Badge from '../components/Badge';

export default function AuditLogsPage() {
  const [filters, setFilters] = useState({ action: '', fromDate: '', toDate: '' });
  const [page, setPage] = useState(1);

  const { data, isLoading } = useQuery({
    queryKey: ['auditLogs', { ...filters, page }],
    queryFn: () => auditApi.getLogs({ ...filters, page, limit: 50 }).then(res => res.data.data),
  });

  const getActionBadge = (action) => {
    const colors = { LOGIN: 'info', LOGOUT: 'default', CREATE_CUSTOMER: 'success', UPDATE_CUSTOMER: 'info', DELETE_CUSTOMER: 'danger', SUSPEND_CUSTOMER: 'warning', RESTORE_CUSTOMER: 'success', RECORD_PAYMENT: 'success', GENERATE_INVOICES: 'info', CREATE_USER: 'success', CHANGE_PASSWORD: 'warning' };
    return <Badge variant={colors[action] || 'default'}>{action}</Badge>;
  };

  return (
    <div className="space-y-4 lg:space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Audit Logs</h1>
        <p className="text-sm text-slate-500 mt-1">System activity history</p>
      </div>
      <div className="bg-white rounded-xl border border-slate-200 p-3 lg:p-4">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div>
            <label className="text-xs text-slate-500 mb-1 block">Action</label>
            <input type="text" placeholder="Search action..." value={filters.action} onChange={(e) => setFilters({ ...filters, action: e.target.value })} className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/50" />
          </div>
          <div>
            <label className="text-xs text-slate-500 mb-1 block">From Date</label>
            <input type="date" value={filters.fromDate} onChange={(e) => setFilters({ ...filters, fromDate: e.target.value })} className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/50" />
          </div>
          <div>
            <label className="text-xs text-slate-500 mb-1 block">To Date</label>
            <input type="date" value={filters.toDate} onChange={(e) => setFilters({ ...filters, toDate: e.target.value })} className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/50" />
          </div>
        </div>
      </div>
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Timestamp</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">User</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Action</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {isLoading ? (
                <tr><td colSpan="4" className="px-6 py-12 text-center text-slate-500">Loading...</td></tr>
              ) : data?.logs?.length === 0 ? (
                <tr><td colSpan="4" className="px-6 py-12 text-center text-slate-500">No logs found</td></tr>
              ) : (
                data?.logs?.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50">
                    <td className="px-6 py-4 text-sm text-slate-600 whitespace-nowrap">{new Date(log.createdAt).toLocaleString('en-GB', { dateStyle: 'medium', timeStyle: 'short' })}</td>
                    <td className="px-6 py-4">
                      <div className="text-sm font-medium text-slate-900">{log.user?.fullName}</div>
                      <div className="text-xs text-slate-500">{log.user?.username}</div>
                    </td>
                    <td className="px-6 py-4">{getActionBadge(log.action)}</td>
                    <td className="px-6 py-4">
                      <code className="text-xs bg-slate-100 px-2 py-1 rounded font-mono text-slate-700 max-w-md block truncate">{log.details}</code>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        {data?.pagination?.totalPages > 1 && (
          <div className="px-6 py-4 border-t border-slate-200 flex items-center justify-between">
            <div className="text-sm text-slate-500">Page {data.pagination.page} of {data.pagination.totalPages} ({data.pagination.total} total)</div>
            <div className="flex space-x-2">
              <Button variant="outline" size="sm" disabled={page === 1} onClick={() => setPage(page - 1)}>Prev</Button>
              <Button variant="outline" size="sm" disabled={page === data.pagination.totalPages} onClick={() => setPage(page + 1)}>Next</Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}