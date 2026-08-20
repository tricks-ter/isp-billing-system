import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { paymentApi } from '../services/paymentApi';
import { Receipt, Wallet, Smartphone, Building2, TrendingUp } from 'lucide-react';
import Badge from '../components/Badge';
import Button from '../components/Button';

export default function PaymentsPage() {
  const [methodFilter, setMethodFilter] = useState('');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [page, setPage] = useState(1);

  const { data, isLoading } = useQuery({
    queryKey: ['payments', { methodFilter, fromDate, toDate, page }],
    queryFn: () => paymentApi.getAll({
      method: methodFilter,
      fromDate,
      toDate,
      page,
      limit: 20,
    }).then(res => res.data.data),
  });

  const getMethodIcon = (method) => {
    const icons = {
      CASH: { icon: Wallet, color: 'bg-green-100 text-green-700' },
      BKASH: { icon: Smartphone, color: 'bg-pink-100 text-pink-700' },
      NAGAD: { icon: Smartphone, color: 'bg-orange-100 text-orange-700' },
      BANK: { icon: Building2, color: 'bg-blue-100 text-blue-700' },
    };
    return icons[method] || icons.CASH;
  };

  return (
    <div className="space-y-4 lg:space-y-6">
      {/* Filters */}
      <div className="bg-white rounded-xl border border-slate-200 p-3 lg:p-4">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div>
            <label className="text-xs text-slate-500 mb-1 block">Method</label>
            <select
              value={methodFilter}
              onChange={(e) => { setMethodFilter(e.target.value); setPage(1); }}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
            >
              <option value="">All Methods</option>
              <option value="CASH">Cash</option>
              <option value="BKASH">bKash</option>
              <option value="NAGAD">Nagad</option>
              <option value="BANK">Bank</option>
            </select>
          </div>
          <div>
            <label className="text-xs text-slate-500 mb-1 block">From Date</label>
            <input
              type="date"
              value={fromDate}
              onChange={(e) => { setFromDate(e.target.value); setPage(1); }}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
            />
          </div>
          <div>
            <label className="text-xs text-slate-500 mb-1 block">To Date</label>
            <input
              type="date"
              value={toDate}
              onChange={(e) => { setToDate(e.target.value); setPage(1); }}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
            />
          </div>
        </div>
      </div>

      {/* Payments List */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        {/* Desktop Table */}
        <div className="hidden lg:block overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Date</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Customer</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Amount</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Method</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Received By</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Notes</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {isLoading ? (
                <tr><td colSpan="6" className="px-6 py-12 text-center text-slate-500">Loading...</td></tr>
              ) : data?.payments?.length === 0 ? (
                <tr><td colSpan="6" className="px-6 py-12 text-center text-slate-500">No payments found</td></tr>
              ) : (
                data?.payments?.map((payment) => {
                  const methodInfo = getMethodIcon(payment.method);
                  return (
                    <tr key={payment.id} className="hover:bg-slate-50">
                      <td className="px-6 py-4 text-sm text-slate-600">
                        {new Date(payment.date).toLocaleString('en-GB', { dateStyle: 'medium', timeStyle: 'short' })}
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm font-medium text-slate-900">{payment.invoice.customer.name}</div>
                        <div className="text-xs text-slate-500">{payment.invoice.customer.phone}</div>
                      </td>
                      <td className="px-6 py-4 text-sm font-semibold text-green-600">৳{payment.amount}</td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center space-x-1 px-2 py-1 rounded-md text-xs font-medium ${methodInfo.color}`}>
                          <methodInfo.icon className="w-3 h-3" />
                          <span>{payment.method}</span>
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-600">{payment.receiver?.fullName || '-'}</td>
                      <td className="px-6 py-4 text-sm text-slate-500 max-w-xs truncate">{payment.notes || '-'}</td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Mobile Cards */}
        <div className="lg:hidden divide-y divide-slate-200">
          {isLoading ? (
            <div className="p-8 text-center text-slate-500">Loading...</div>
          ) : data?.payments?.length === 0 ? (
            <div className="p-8 text-center">
              <Receipt className="w-12 h-12 text-slate-300 mx-auto mb-2" />
              <p className="text-slate-500">No payments found</p>
            </div>
          ) : (
            data?.payments?.map((payment) => {
              const methodInfo = getMethodIcon(payment.method);
              return (
                <div key={payment.id} className="p-4">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <h3 className="font-semibold text-slate-900">{payment.invoice.customer.name}</h3>
                      <p className="text-xs text-slate-500">
                        {new Date(payment.date).toLocaleString('en-GB', { dateStyle: 'medium', timeStyle: 'short' })}
                      </p>
                    </div>
                    <p className="text-lg font-bold text-green-600">৳{payment.amount}</p>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className={`inline-flex items-center space-x-1 px-2 py-1 rounded-md text-xs font-medium ${methodInfo.color}`}>
                      <methodInfo.icon className="w-3 h-3" />
                      <span>{payment.method}</span>
                    </span>
                    <span className="text-xs text-slate-500">by {payment.receiver?.fullName || '-'}</span>
                  </div>
                  {payment.notes && (
                    <p className="text-xs text-slate-500 mt-2 italic">Note: {payment.notes}</p>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Pagination */}
      {data?.pagination?.totalPages > 1 && (
        <div className="bg-white rounded-xl border border-slate-200 px-4 py-3 flex items-center justify-between">
          <div className="text-xs sm:text-sm text-slate-500">
            Page {data.pagination.page} of {data.pagination.totalPages}
          </div>
          <div className="flex space-x-2">
            <Button variant="outline" size="sm" disabled={page === 1} onClick={() => setPage(page - 1)}>Prev</Button>
            <Button variant="outline" size="sm" disabled={page === data.pagination.totalPages} onClick={() => setPage(page + 1)}>Next</Button>
          </div>
        </div>
      )}
    </div>
  );
}

